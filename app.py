"""
Shinobu Proxy — Flask + SQLite Backend
Endpoints:
  GET  /api/user/<user_id>                — получить данные пользователя (профиль/баланс)
  POST /api/user/<user_id>                — обновить данные / активировать trial
  GET  /api/user/<user_id>/subscriptions  — список всех подписок пользователя (несколько параллельных)
  GET  /api/tariffs                       — тарифы и цены (единственный источник правды)
  POST /api/subscribe_balance             — оплатить тариф с внутреннего баланса
  POST /api/create_stars_invoice          — создать Telegram Stars инвойс (по tariff_id)
  POST /api/webhook                       — вебхук от Telegram-бота
  POST /api/admin/set_key                 — (admin) выдать подписку вручную (для YooMoney)
  GET  /api/admin/users                   — (admin) список всех пользователей
"""

import os
import sqlite3
import hashlib
import hmac
import json
import time
import logging
from datetime import datetime, timedelta
from functools import wraps
from urllib.parse import parse_qsl

import requests
from flask import Flask, request, jsonify, g
from flask_cors import CORS

# ─── Config ────────────────────────────────────────────────────────────────────
BOT_TOKEN      = os.getenv("BOT_TOKEN", "YOUR_BOT_TOKEN_HERE")
ADMIN_SECRET   = os.getenv("ADMIN_SECRET", "changeme_admin_secret")
DATABASE       = os.getenv("DATABASE", "shinobu.db")
TRIAL_DAYS     = int(os.getenv("TRIAL_DAYS", 3))
REFERRAL_BONUS = int(os.getenv("REFERRAL_BONUS", 10))  # дней за реферала

# Значения по умолчанию — только для ПЕРВОГО запуска (заполнить пустую таблицу
# tariff_settings). После этого единственный источник правды — таблица в БД,
# её можно менять через POST /api/admin/tariffs без деплоя.
DEFAULT_TARIFFS = {
    "month_1":  {"title": "1 месяц",   "months": 1,  "price": 103.10, "stars": 80,  "discount_pct": 0,  "badge": None},
    "month_3":  {"title": "3 месяца",  "months": 3,  "price": 279.00, "stars": 215, "discount_pct": 10, "badge": "save"},
    "month_6":  {"title": "6 месяцев", "months": 6,  "price": 495.00, "stars": 380, "discount_pct": 20, "badge": None},
    "month_12": {"title": "12 месяцев","months": 12, "price": 825.00, "stars": 635, "discount_pct": 33, "badge": "best"},
}
TRIAL_TARIFF_ID = "trial"

app = Flask(__name__)
CORS(app, origins="*")

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger(__name__)

# ─── Database ──────────────────────────────────────────────────────────────────
def get_db():
    if "db" not in g:
        g.db = sqlite3.connect(DATABASE)
        g.db.row_factory = sqlite3.Row
        g.db.execute("PRAGMA journal_mode=WAL")
        g.db.execute("PRAGMA foreign_keys=ON")
    return g.db

@app.teardown_appcontext
def close_db(exc):
    db = g.pop("db", None)
    if db:
        db.close()

def init_db():
    with app.app_context():
        db = get_db()
        db.executescript("""
            CREATE TABLE IF NOT EXISTS users (
                user_id             TEXT PRIMARY KEY,
                telegram_id         TEXT UNIQUE,
                username            TEXT,
                first_name          TEXT,
                vless_key           TEXT,
                subscription_expiry INTEGER DEFAULT 0,
                balance             REAL    DEFAULT 0.0,
                trial_used          INTEGER DEFAULT 0,
                referred_by         TEXT,
                invited_count       INTEGER DEFAULT 0,
                created_at          INTEGER DEFAULT (strftime('%s','now')),
                updated_at          INTEGER DEFAULT (strftime('%s','now'))
            );

            CREATE TABLE IF NOT EXISTS payments (
                id              INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id         TEXT    NOT NULL,
                telegram_id     TEXT,
                amount_rub      REAL,
                amount_stars    INTEGER,
                method          TEXT    NOT NULL,   -- 'yoomoney' | 'stars' | 'balance' | 'yoomoney_manual'
                months          INTEGER NOT NULL,
                tariff_id       TEXT,               -- ссылка на TariffSetting.id, NULL для старых записей
                charge_id       TEXT,                -- telegram_payment_charge_id — от Telegram, не от нас
                status          TEXT    DEFAULT 'pending',  -- pending|completed|failed
                payload         TEXT,
                created_at      INTEGER DEFAULT (strftime('%s','now')),
                FOREIGN KEY(user_id) REFERENCES users(user_id)
            );

            -- Тарифы теперь в БД, а не в коде — можно менять цены без деплоя
            -- (через POST /api/admin/tariffs). id совпадает с прежними ключами
            -- ('month_1' и т.д.), чтобы старые платежи/подписки не потеряли ссылку.
            CREATE TABLE IF NOT EXISTS tariff_settings (
                id           TEXT    PRIMARY KEY,
                title        TEXT    NOT NULL,
                months       INTEGER NOT NULL,
                price        REAL    NOT NULL,
                stars        INTEGER NOT NULL,
                discount_pct INTEGER DEFAULT 0,
                badge        TEXT,
                visible      INTEGER DEFAULT 1,
                updated_at   INTEGER DEFAULT (strftime('%s','now'))
            );

            CREATE TABLE IF NOT EXISTS keys_pool (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                vless_key   TEXT    NOT NULL UNIQUE,
                assigned_to INTEGER,   -- id строки в subscriptions (не user_id!)
                created_at  INTEGER DEFAULT (strftime('%s','now'))
            );

            -- Несколько параллельных подписок на одного пользователя.
            -- users.vless_key / users.subscription_expiry остаются в схеме
            -- только для обратной совместимости со старыми записями и НЕ
            -- используются новым кодом ниже.
            CREATE TABLE IF NOT EXISTS subscriptions (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id     TEXT    NOT NULL,
                tariff_id   TEXT    NOT NULL,        -- 'month_1' | 'trial' | 'legacy' | ...
                vless_key   TEXT,
                status      TEXT    DEFAULT 'active', -- active | expired | cancelled
                expires_at  INTEGER NOT NULL,
                payment_id  INTEGER,
                created_at  INTEGER DEFAULT (strftime('%s','now')),
                updated_at  INTEGER DEFAULT (strftime('%s','now')),
                FOREIGN KEY(user_id) REFERENCES users(user_id),
                FOREIGN KEY(payment_id) REFERENCES payments(id)
            );

            CREATE INDEX IF NOT EXISTS idx_users_telegram ON users(telegram_id);
            CREATE INDEX IF NOT EXISTS idx_payments_user  ON payments(user_id);
            CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_charge_id
                ON payments(charge_id) WHERE charge_id IS NOT NULL;
            CREATE INDEX IF NOT EXISTS idx_subs_user       ON subscriptions(user_id);
            CREATE INDEX IF NOT EXISTS idx_subs_user_status ON subscriptions(user_id, status);
        """)
        db.commit()
        seed_default_tariffs(db)
    log.info("Database initialised: %s", DATABASE)

# ─── Helpers ───────────────────────────────────────────────────────────────────
def user_to_dict(row):
    if row is None:
        return {}
    d = dict(row)
    d["trial_used"] = bool(d["trial_used"])
    return d


def seed_default_tariffs(db):
    """INSERT OR IGNORE — безопасно звать при каждом старте, не перетирает
    то, что админ уже поправил через /api/admin/tariffs."""
    for tid, t in DEFAULT_TARIFFS.items():
        db.execute(
            """INSERT OR IGNORE INTO tariff_settings
               (id, title, months, price, stars, discount_pct, badge, visible)
               VALUES (?,?,?,?,?,?,?,1)""",
            (tid, t["title"], t["months"], t["price"], t["stars"], t["discount_pct"], t["badge"])
        )
    db.commit()


def tariff_row_to_dict(row) -> dict:
    d = dict(row)
    d["visible"] = bool(d["visible"])
    return d


def get_tariff(db, tariff_id: str, require_visible: bool = True) -> dict | None:
    """Прочитать один тариф из БД. require_visible=True — как при покупке
    (нельзя купить то, что скрыто из выдачи); False — для админки."""
    row = db.execute("SELECT * FROM tariff_settings WHERE id=?", (tariff_id,)).fetchone()
    if not row:
        return None
    d = tariff_row_to_dict(row)
    if require_visible and not d["visible"]:
        return None
    return d


def get_visible_tariffs(db) -> list[dict]:
    rows = db.execute(
        "SELECT * FROM tariff_settings WHERE visible=1 ORDER BY months"
    ).fetchall()
    return [tariff_row_to_dict(r) for r in rows]

def assign_key_from_pool(db, subscription_id: int) -> str | None:
    """Взять свободный ключ из пула и привязать к конкретной подписке (не к юзеру)."""
    row = db.execute(
        "SELECT id, vless_key FROM keys_pool WHERE assigned_to IS NULL LIMIT 1"
    ).fetchone()
    if not row:
        return None
    now = int(time.time())
    db.execute(
        "UPDATE keys_pool SET assigned_to=? WHERE id=?",
        (subscription_id, row["id"])
    )
    db.execute(
        "UPDATE subscriptions SET vless_key=?, updated_at=? WHERE id=?",
        (row["vless_key"], now, subscription_id)
    )
    return row["vless_key"]


def create_subscription(db, user_id: str, tariff_id: str, months: int, days_override: int = None,
                         payment_id: int = None) -> dict:
    """
    Создать НОВУЮ подписку (отдельная строка + отдельный ключ из пула).
    days_override нужен для триала (там не месяцы, а TRIAL_DAYS).
    """
    now = int(time.time())
    days = days_override if days_override is not None else months * 30
    expires_at = now + days * 86400

    cur = db.execute(
        """INSERT INTO subscriptions (user_id, tariff_id, status, expires_at, payment_id)
           VALUES (?,?,?,?,?)""",
        (user_id, tariff_id, "active", expires_at, payment_id)
    )
    subscription_id = cur.lastrowid
    vless_key = assign_key_from_pool(db, subscription_id)

    return {
        "id": subscription_id,
        "tariff_id": tariff_id,
        "vless_key": vless_key,
        "expires_at": expires_at,
        "status": "active",
    }


def extend_or_stack_bonus(db, user_id: str, days: int):
    """
    Реферальный бонус: продлить ближайшую по дате истечения активную подписку
    пользователя на N дней. Если активных подписок нет — бонус не начисляется
    (нечего продлевать; в этом случае лучше не создавать пустую подписку "из
    воздуха", а просто залогировать и пропустить).
    """
    now = int(time.time())
    sub = db.execute(
        """SELECT id, expires_at FROM subscriptions
           WHERE user_id=? AND status='active' AND expires_at>?
           ORDER BY expires_at DESC LIMIT 1""",
        (user_id, now)
    ).fetchone()
    if not sub:
        log.info("Referral bonus skipped for %s: no active subscription", user_id)
        return
    db.execute(
        "UPDATE subscriptions SET expires_at=expires_at+?, updated_at=? WHERE id=?",
        (days * 86400, now, sub["id"])
    )

def send_telegram_message(chat_id, text: str):
    """Отправить сообщение через бота."""
    try:
        url = f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage"
        requests.post(url, json={"chat_id": chat_id, "text": text, "parse_mode": "HTML"}, timeout=5)
    except Exception as e:
        log.warning("Telegram send failed: %s", e)

# Максимальный возраст initData (сек). Защита от повторного использования
# украденной строки. 0 = не проверять возраст.
INITDATA_MAX_AGE = int(os.getenv("INITDATA_MAX_AGE", 86400))  # сутки

def parse_and_verify_init_data(init_data: str):
    """
    Проверить подпись initData от Telegram WebApp.

    Возвращает dict с разобранными полями (включая распарсенный 'user'),
    если подпись валидна и данные не протухли. Иначе — None.

    Алгоритм (по докам Telegram):
      1. Разобрать query-string в пары ключ=значение.
      2. Вынуть 'hash'.
      3. Собрать data_check_string: отсортированные "key=value", склеенные \\n.
      4. secret_key = HMAC_SHA256("WebAppData", bot_token).
      5. Сверить HMAC_SHA256(secret_key, data_check_string) с hash.
    """
    if not init_data:
        return None
    try:
        # parse_qsl корректно декодирует %XX и не ломается на '=' внутри значений
        pairs = dict(parse_qsl(init_data, strict_parsing=True))
    except Exception:
        return None

    received_hash = pairs.pop("hash", None)
    if not received_hash:
        return None

    check_string = "\n".join(f"{k}={pairs[k]}" for k in sorted(pairs))
    secret = hmac.new(b"WebAppData", BOT_TOKEN.encode(), hashlib.sha256).digest()
    computed = hmac.new(secret, check_string.encode(), hashlib.sha256).hexdigest()

    if not hmac.compare_digest(computed, received_hash):
        return None

    # Проверка свежести
    if INITDATA_MAX_AGE > 0:
        try:
            auth_date = int(pairs.get("auth_date", "0"))
            if time.time() - auth_date > INITDATA_MAX_AGE:
                return None
        except ValueError:
            return None

    # Распарсить вложенный JSON пользователя
    if "user" in pairs:
        try:
            pairs["user"] = json.loads(pairs["user"])
        except Exception:
            pairs["user"] = {}

    return pairs


def require_telegram_auth(f):
    """
    Декоратор: требует валидный X-Telegram-Init-Data.
    Кладёт g.tg_user (dict) и g.tg_user_id (str) для использования в обработчике.

    В DEV-режиме (BOT_TOKEN не настроен или AUTH_DISABLED=1) пропускает
    запрос без проверки — удобно для локальной отладки тест-клиентом.
    """
    @wraps(f)
    def wrapper(*args, **kwargs):
        dev_mode = (
            os.getenv("AUTH_DISABLED", "0") == "1"
            or BOT_TOKEN == "YOUR_BOT_TOKEN_HERE"
        )
        init_data = request.headers.get("X-Telegram-Init-Data", "")

        verified = parse_and_verify_init_data(init_data) if init_data else None

        if verified:
            g.tg_user = verified.get("user", {})
            g.tg_user_id = str(g.tg_user.get("id", ""))
        elif dev_mode:
            # без подписи, но в деве — доверяем заявленному id
            g.tg_user = {}
            g.tg_user_id = ""
            log.warning("AUTH bypassed (dev mode) for %s", request.path)
        else:
            return jsonify({"error": "Invalid or missing Telegram auth"}), 401

        return f(*args, **kwargs)
    return wrapper

def require_admin(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        token = request.headers.get("X-Admin-Secret", "")
        if token != ADMIN_SECRET:
            return jsonify({"error": "Unauthorized"}), 403
        return f(*args, **kwargs)
    return wrapper


# ─── Rate limiting ────────────────────────────────────────────────────────────
# Простой in-memory sliding window. Для одного процесса (как сейчас у нас)
# этого достаточно; если когда-нибудь будет несколько воркеров/реплик —
# нужно вынести счётчики в Redis (как в проектах покрупнее), иначе лимиты
# не будут общими между процессами.
_RATE_BUCKETS: dict[str, list] = {}

def rate_limit(key_fn, limit: int, window_seconds: int):
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            key = key_fn()
            now = time.time()
            bucket = _RATE_BUCKETS.setdefault(key, [])
            cutoff = now - window_seconds
            while bucket and bucket[0] < cutoff:
                bucket.pop(0)
            if len(bucket) >= limit:
                retry_after = max(1, int(window_seconds - (now - bucket[0])))
                return jsonify({"error": f"Слишком много запросов, попробуй через {retry_after} сек."}), 429
            bucket.append(now)
            return f(*args, **kwargs)
        return wrapper
    return decorator

# ─── API Routes ────────────────────────────────────────────────────────────────

@app.route("/api/user/<user_id>", methods=["GET"])
@require_telegram_auth
def get_user(user_id):
    # Защита: нельзя читать чужой профиль. В dev-режиме g.tg_user_id пуст — пропускаем.
    if g.tg_user_id and g.tg_user_id != str(user_id):
        return jsonify({"error": "Forbidden"}), 403

    db = get_db()
    row = db.execute("SELECT * FROM users WHERE user_id=?", (user_id,)).fetchone()
    if not row:
        # Создать нового пользователя при первом запросе
        db.execute(
            "INSERT OR IGNORE INTO users (user_id, telegram_id) VALUES (?,?)",
            (user_id, user_id)
        )
        db.commit()
        row = db.execute("SELECT * FROM users WHERE user_id=?", (user_id,)).fetchone()
    return jsonify(user_to_dict(row))


@app.route("/api/user/<user_id>", methods=["POST"])
@require_telegram_auth
def update_user(user_id):
    if g.tg_user_id and g.tg_user_id != str(user_id):
        return jsonify({"error": "Forbidden"}), 403

    db   = get_db()
    data = request.get_json(force=True) or {}
    now  = int(time.time())

    # Убедиться что пользователь существует
    db.execute(
        "INSERT OR IGNORE INTO users (user_id, telegram_id) VALUES (?,?)",
        (user_id, data.get("telegramId", user_id))
    )

    # ── Активация триала ───────────────────────────────────────────
    if data.get("action") == "activate_trial":
        user = db.execute("SELECT * FROM users WHERE user_id=?", (user_id,)).fetchone()
        if not user:
            return jsonify({"error": "User not found"}), 404
        if user["trial_used"]:
            return jsonify({"error": "Trial already used"}), 400

        sub = create_subscription(db, user_id, TRIAL_TARIFF_ID, months=0, days_override=TRIAL_DAYS)
        if not sub["vless_key"]:
            db.rollback()
            return jsonify({"error": "No keys available, try later"}), 503

        db.execute(
            "UPDATE users SET trial_used=1, updated_at=? WHERE user_id=?",
            (now, user_id)
        )
        db.commit()

        # Уведомить пользователя
        tg_id = user["telegram_id"]
        if tg_id and BOT_TOKEN != "YOUR_BOT_TOKEN_HERE":
            send_telegram_message(
                tg_id,
                f"🎁 <b>Пробный период активирован!</b>\n"
                f"Срок: {TRIAL_DAYS} дней\n\n"
                f"🔑 Ваш ключ:\n<code>{sub['vless_key']}</code>"
            )

        return jsonify({"ok": True, "action": "trial_activated", "subscription": sub})

    # ── Сохранить профиль (базовые поля) ──────────────────────────
    allowed = {"username", "first_name", "balance"}
    updates = {k: v for k, v in data.items() if k in allowed}
    if updates:
        sets   = ", ".join(f"{k}=?" for k in updates)
        values = list(updates.values()) + [now, user_id]
        db.execute(f"UPDATE users SET {sets}, updated_at=? WHERE user_id=?", values)

    db.commit()
    row = db.execute("SELECT * FROM users WHERE user_id=?", (user_id,)).fetchone()
    return jsonify(user_to_dict(row))


@app.route("/api/tariffs", methods=["GET"])
def get_tariffs():
    """Публичный источник цен — фронт рендерит тарифы отсюда, не из static.js."""
    db = get_db()
    return jsonify(get_visible_tariffs(db))


@app.route("/api/user/<user_id>/subscriptions", methods=["GET"])
@require_telegram_auth
def get_subscriptions(user_id):
    if g.tg_user_id and g.tg_user_id != str(user_id):
        return jsonify({"error": "Forbidden"}), 403

    db  = get_db()
    now = int(time.time())
    # Актуализировать статус истёкших подписок перед выдачей списка
    db.execute(
        "UPDATE subscriptions SET status='expired', updated_at=? WHERE user_id=? AND status='active' AND expires_at<?",
        (now, user_id, now)
    )
    db.commit()

    rows = db.execute(
        "SELECT * FROM subscriptions WHERE user_id=? ORDER BY created_at DESC", (user_id,)
    ).fetchall()
    return jsonify([dict(r) for r in rows])


@app.route("/api/subscribe_balance", methods=["POST"])
@require_telegram_auth
@rate_limit(lambda: f"balance:{(request.get_json(silent=True) or {}).get('userId', request.remote_addr)}",
            limit=5, window_seconds=60)
def subscribe_balance():
    """Оплата тарифа с внутреннего баланса пользователя."""
    data      = request.get_json(force=True) or {}
    user_id   = data.get("userId")
    tariff_id = data.get("tariff_id")

    if g.tg_user_id and g.tg_user_id != str(user_id):
        return jsonify({"error": "Forbidden"}), 403

    db     = get_db()
    tariff = get_tariff(db, tariff_id)
    if not tariff:
        return jsonify({"error": "Unknown tariff_id"}), 400

    user = db.execute("SELECT * FROM users WHERE user_id=?", (user_id,)).fetchone()
    if not user:
        return jsonify({"error": "User not found"}), 404
    if (user["balance"] or 0) < tariff["price"]:
        return jsonify({"error": "Insufficient balance"}), 402

    now = int(time.time())
    db.execute(
        "UPDATE users SET balance=balance-?, updated_at=? WHERE user_id=?",
        (tariff["price"], now, user_id)
    )
    pay_cur = db.execute(
        "INSERT INTO payments (user_id, telegram_id, amount_rub, method, months, tariff_id, status)"
        " VALUES (?,?,?,?,?,?,?)",
        (user_id, user["telegram_id"], tariff["price"], "balance", tariff["months"], tariff_id, "completed")
    )
    sub = create_subscription(db, user_id, tariff_id, tariff["months"], payment_id=pay_cur.lastrowid)
    if not sub["vless_key"]:
        db.rollback()
        return jsonify({"error": "No keys available, try later"}), 503
    db.commit()

    return jsonify({"ok": True, "subscription": sub})


@app.route("/api/create_stars_invoice", methods=["POST"])
@require_telegram_auth
@rate_limit(lambda: f"invoice:{(request.get_json(silent=True) or {}).get('userId', request.remote_addr)}",
            limit=5, window_seconds=60)
def create_stars_invoice():
    """
    Создать Telegram Stars Invoice через Bot API.
    Бот должен быть настроен как платёжный провайдер Stars.
    """
    data        = request.get_json(force=True) or {}
    user_id     = data.get("userId")
    telegram_id = data.get("telegramId")
    tariff_id   = data.get("tariff_id")

    db     = get_db()
    tariff = get_tariff(db, tariff_id)
    if not tariff:
        return jsonify({"error": "Unknown tariff_id"}), 400
    if not telegram_id or telegram_id == "DEV_USER":
        return jsonify({"error": "Invalid telegram_id"}), 400

    months = tariff["months"]
    stars  = tariff["stars"]
    payload = f"sub_{tariff_id}_{user_id}_{int(time.time())}"

    try:
        resp = requests.post(
            f"https://api.telegram.org/bot{BOT_TOKEN}/createInvoiceLink",
            json={
                "title":          f"Shinobu Proxy — {months} мес.",
                "description":    f"Подписка на VPN на {months} месяц(а). VLESS протокол.",
                "payload":        payload,
                "currency":       "XTR",          # Telegram Stars
                "prices":         [{"label": f"{months} мес.", "amount": stars}],
                "provider_token": "",              # пустой для Stars
            },
            timeout=10
        ).json()

        if not resp.get("ok"):
            log.error("Telegram invoice error: %s", resp)
            return jsonify({"error": resp.get("description", "Invoice failed")}), 500

        invoice_link = resp["result"]

        # Записать ожидающий платёж
        db.execute(
            "INSERT INTO payments (user_id, telegram_id, amount_stars, method, months, tariff_id, status, payload)"
            " VALUES (?,?,?,?,?,?,?,?)",
            (user_id, telegram_id, stars, "stars", months, tariff_id, "pending", payload)
        )
        db.commit()

        return jsonify({"invoice_link": invoice_link, "payload": payload})

    except Exception as e:
        log.exception("create_stars_invoice error")
        return jsonify({"error": str(e)}), 500


@app.route("/api/webhook", methods=["POST"])
def telegram_webhook():
    """
    Обработчик вебхука от Telegram.
    Обрабатывает successful_payment и pre_checkout_query.
    """
    update = request.get_json(force=True) or {}
    log.info("Webhook: %s", json.dumps(update)[:500])

    # ── pre_checkout_query: подтвердить заказ ─────────────────────
    # Раньше здесь всегда отвечали ok=True без проверки — значит, если
    # тариф исчез/цена изменилась между созданием инвойса и оплатой,
    # деньги всё равно бы списались по устаревшей цене. Теперь сверяем
    # с текущим состоянием тарифа в БД прямо в момент оплаты.
    if "pre_checkout_query" in update:
        pcq = update["pre_checkout_query"]
        db = get_db()
        ok = False
        error_message = "Тариф больше недоступен. Создай новый счёт."

        pay_row = db.execute(
            "SELECT * FROM payments WHERE payload=? AND status='pending'",
            (pcq.get("invoice_payload", ""),)
        ).fetchone()
        if pay_row:
            tariff = get_tariff(db, pay_row["tariff_id"])
            if tariff and pcq.get("currency") == "XTR" and pcq.get("total_amount") == tariff["stars"]:
                ok = True
            elif tariff:
                error_message = "Цена счёта устарела. Создай новый счёт."

        requests.post(
            f"https://api.telegram.org/bot{BOT_TOKEN}/answerPreCheckoutQuery",
            json={"pre_checkout_query_id": pcq["id"], "ok": ok, **({} if ok else {"error_message": error_message})},
            timeout=5
        )
        return jsonify({"ok": True})

    # ── successful_payment: выдать ключ ───────────────────────────
    message = update.get("message", {})
    payment = message.get("successful_payment")
    if payment:
        payload     = payment.get("invoice_payload", "")
        charge_id   = payment.get("telegram_payment_charge_id", "")
        telegram_id = str(message["from"]["id"])

        db = get_db()

        # Атомарный "захват" платежа: UPDATE с WHERE status='pending' —
        # если Telegram продублирует вебхук (бывает) или два запроса придут
        # почти одновременно, второй получит rowcount=0 и просто выйдет,
        # не выдавая подписку дважды. UNIQUE-индекс на charge_id — вторая
        # линия защиты на уровне БД, на случай гонки мимо этого UPDATE.
        cur = db.execute(
            "UPDATE payments SET status='completed', charge_id=? WHERE payload=? AND status='pending'",
            (charge_id, payload)
        )
        if cur.rowcount == 0:
            db.rollback()
            log.info("Payment already processed or unknown payload: %s", payload)
            return jsonify({"ok": True})

        pay_row = db.execute("SELECT * FROM payments WHERE payload=?", (payload,)).fetchone()

        user_id   = pay_row["user_id"]
        months    = pay_row["months"]
        tariff_id = pay_row["tariff_id"] or "legacy"

        # Создать НОВУЮ подписку (не трогаем прочие активные подписки юзера)
        sub = create_subscription(db, user_id, tariff_id, months, payment_id=pay_row["id"])
        vless_key = sub["vless_key"]

        # Реферальный бонус — продлевает существующую активную подписку
        user = db.execute("SELECT * FROM users WHERE user_id=?", (user_id,)).fetchone()
        if user and user["referred_by"]:
            ref_id = user["referred_by"]
            extend_or_stack_bonus(db, ref_id, REFERRAL_BONUS)
            extend_or_stack_bonus(db, user_id, REFERRAL_BONUS)
            db.execute(
                "UPDATE users SET invited_count=invited_count+1 WHERE user_id=?", (ref_id,)
            )

        db.execute("UPDATE users SET updated_at=? WHERE user_id=?", (int(time.time()), user_id))
        db.commit()

        expiry_str = datetime.fromtimestamp(sub["expires_at"]).strftime("%d.%m.%Y")

        send_telegram_message(
            telegram_id,
            f"✅ <b>Оплата прошла успешно!</b>\n\n"
            f"📅 Подписка до: <b>{expiry_str}</b>\n\n"
            f"🔑 Ваш ключ:\n<code>{vless_key or 'выдаётся...'}</code>\n\n"
            f"Настройка: /start → Настройка"
        )

        log.info("Payment completed: user=%s tariff=%s key=%s", user_id, tariff_id, vless_key)
        return jsonify({"ok": True})

    # ── /start с рефералом ────────────────────────────────────────
    text = message.get("text", "")
    if text.startswith("/start"):
        parts = text.split()
        from_user = message.get("from", {})
        tg_id     = str(from_user.get("id", ""))
        username  = from_user.get("username", "")
        firstname = from_user.get("first_name", "")

        db = get_db()
        db.execute(
            """INSERT OR IGNORE INTO users (user_id, telegram_id, username, first_name)
               VALUES (?,?,?,?)""",
            (tg_id, tg_id, username, firstname)
        )

        # Записать реферала
        if len(parts) > 1 and parts[1].startswith("ref_"):
            ref_id = parts[1][4:]
            if ref_id != tg_id:
                existing = db.execute(
                    "SELECT referred_by FROM users WHERE user_id=?", (tg_id,)
                ).fetchone()
                if existing and not existing["referred_by"]:
                    db.execute(
                        "UPDATE users SET referred_by=? WHERE user_id=?", (ref_id, tg_id)
                    )

        db.commit()

    return jsonify({"ok": True})


# ─── Admin Routes ──────────────────────────────────────────────────────────────

@app.route("/api/admin/set_key", methods=["POST"])
@require_admin
def admin_set_key():
    """Вручную выдать подписку пользователю (для YooMoney-оплат)."""
    data      = request.get_json(force=True) or {}
    user_id   = data.get("user_id")
    tariff_id = data.get("tariff_id")               # предпочтительно
    months    = data.get("months")                  # запасной вариант для ручных корректировок

    if not user_id:
        return jsonify({"error": "user_id required"}), 400
    if not tariff_id and not months:
        return jsonify({"error": "tariff_id or months required"}), 400

    db = get_db()
    user = db.execute("SELECT * FROM users WHERE user_id=?", (user_id,)).fetchone()
    if not user:
        return jsonify({"error": "User not found"}), 404

    tariff = get_tariff(db, tariff_id, require_visible=False) if tariff_id else None
    if tariff:
        months = tariff["months"]
    else:
        tariff_id = "manual"
        months = int(months)

    pay_cur = db.execute(
        "INSERT INTO payments (user_id, telegram_id, method, months, tariff_id, status)"
        " VALUES (?,?,?,?,?,?)",
        (user_id, user["telegram_id"], "yoomoney_manual", months, tariff_id, "completed")
    )
    sub = create_subscription(db, user_id, tariff_id, months, payment_id=pay_cur.lastrowid)
    if not sub["vless_key"]:
        db.rollback()
        return jsonify({"error": "No keys in pool"}), 503
    db.commit()

    expiry_str = datetime.fromtimestamp(sub["expires_at"]).strftime("%d.%m.%Y")

    if user["telegram_id"] and BOT_TOKEN != "YOUR_BOT_TOKEN_HERE":
        send_telegram_message(
            user["telegram_id"],
            f"✅ <b>Подписка активирована!</b>\n\n"
            f"📅 Действует до: <b>{expiry_str}</b>\n\n"
            f"🔑 Ваш ключ:\n<code>{sub['vless_key']}</code>"
        )

    return jsonify({"ok": True, "subscription": sub, "expiry": expiry_str})


@app.route("/api/admin/tariffs", methods=["GET"])
@require_admin
def admin_get_tariffs():
    """Все тарифы, включая скрытые (visible=0) — для админки."""
    db = get_db()
    rows = db.execute("SELECT * FROM tariff_settings ORDER BY months").fetchall()
    return jsonify([tariff_row_to_dict(r) for r in rows])


@app.route("/api/admin/tariffs", methods=["POST"])
@require_admin
def admin_upsert_tariff():
    """
    Создать/поменять тариф без деплоя. Пример тела:
    {"id":"month_1","title":"1 месяц","months":1,"price":103.10,
     "stars":80,"discount_pct":0,"badge":null,"visible":true}
    id обязателен и совпадает с тем, что уже лежит в payments/subscriptions —
    если тариф уже существует, просто обновится, старые платежи не потеряют ссылку.
    """
    data = request.get_json(force=True) or {}
    tariff_id = data.get("id")
    required = {"title", "months", "price", "stars"}
    if not tariff_id or not required.issubset(data):
        return jsonify({"error": f"id and {sorted(required)} are required"}), 400

    db = get_db()
    now = int(time.time())
    db.execute(
        """INSERT INTO tariff_settings (id, title, months, price, stars, discount_pct, badge, visible, updated_at)
           VALUES (?,?,?,?,?,?,?,?,?)
           ON CONFLICT(id) DO UPDATE SET
             title=excluded.title, months=excluded.months, price=excluded.price,
             stars=excluded.stars, discount_pct=excluded.discount_pct,
             badge=excluded.badge, visible=excluded.visible, updated_at=excluded.updated_at""",
        (tariff_id, data["title"], int(data["months"]), float(data["price"]), int(data["stars"]),
         int(data.get("discount_pct", 0)), data.get("badge"), int(bool(data.get("visible", True))), now)
    )
    db.commit()
    return jsonify(get_tariff(db, tariff_id, require_visible=False))


@app.route("/api/admin/add_key_to_pool", methods=["POST"])
@require_admin
def admin_add_key():
    """Добавить VLESS ключ в пул."""
    data = request.get_json(force=True) or {}
    keys = data.get("keys", [])
    if isinstance(keys, str):
        keys = [keys]

    db = get_db()
    added = 0
    for k in keys:
        k = k.strip()
        if k:
            try:
                db.execute("INSERT OR IGNORE INTO keys_pool (vless_key) VALUES (?)", (k,))
                added += 1
            except Exception:
                pass
    db.commit()
    return jsonify({"ok": True, "added": added})


@app.route("/api/admin/users", methods=["GET"])
@require_admin
def admin_users():
    db   = get_db()
    rows = db.execute("SELECT * FROM users ORDER BY created_at DESC").fetchall()
    return jsonify([user_to_dict(r) for r in rows])


@app.route("/api/admin/payments", methods=["GET"])
@require_admin
def admin_payments():
    db   = get_db()
    rows = db.execute("SELECT * FROM payments ORDER BY created_at DESC LIMIT 200").fetchall()
    return jsonify([dict(r) for r in rows])


@app.route("/api/admin/stats", methods=["GET"])
@require_admin
def admin_stats():
    db  = get_db()
    now = int(time.time())
    stats = {
        "total_users":   db.execute("SELECT COUNT(*) FROM users").fetchone()[0],
        "active_users":  db.execute(
            "SELECT COUNT(DISTINCT user_id) FROM subscriptions WHERE status='active' AND expires_at > ?", (now,)
        ).fetchone()[0],
        "active_subscriptions": db.execute(
            "SELECT COUNT(*) FROM subscriptions WHERE status='active' AND expires_at > ?", (now,)
        ).fetchone()[0],
        "total_payments": db.execute(
            "SELECT COUNT(*) FROM payments WHERE status='completed'"
        ).fetchone()[0],
        "keys_in_pool":  db.execute(
            "SELECT COUNT(*) FROM keys_pool WHERE assigned_to IS NULL"
        ).fetchone()[0],
    }
    return jsonify(stats)


@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "time": int(time.time())})


# ─── Run ───────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    init_db()
    port = int(os.getenv("PORT", 5000))
    debug = os.getenv("FLASK_DEBUG", "0") == "1"
    log.info("Starting Shinobu API on port %d", port)
    app.run(host="0.0.0.0", port=port, debug=debug)
