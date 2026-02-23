"""
Shinobu Proxy — Flask + SQLite Backend
Endpoints:
  GET  /api/user/<user_id>                — получить данные пользователя
  POST /api/user/<user_id>                — обновить данные / активировать trial
  POST /api/create_stars_invoice          — создать Telegram Stars инвойс
  POST /api/webhook                       — вебхук от Telegram-бота
  POST /api/admin/set_key                 — (admin) выдать ключ пользователю
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

import requests
from flask import Flask, request, jsonify, g
from flask_cors import CORS

# ─── Config ────────────────────────────────────────────────────────────────────
BOT_TOKEN      = os.getenv("BOT_TOKEN", "YOUR_BOT_TOKEN_HERE")
ADMIN_SECRET   = os.getenv("ADMIN_SECRET", "changeme_admin_secret")
DATABASE       = os.getenv("DATABASE", "shinobu.db")
TRIAL_DAYS     = int(os.getenv("TRIAL_DAYS", 3))
REFERRAL_BONUS = int(os.getenv("REFERRAL_BONUS", 10))  # дней за реферала

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
                method          TEXT    NOT NULL,   -- 'yoomoney' | 'stars'
                months          INTEGER NOT NULL,
                status          TEXT    DEFAULT 'pending',  -- pending|completed|failed
                payload         TEXT,
                created_at      INTEGER DEFAULT (strftime('%s','now')),
                FOREIGN KEY(user_id) REFERENCES users(user_id)
            );

            CREATE TABLE IF NOT EXISTS keys_pool (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                vless_key   TEXT    NOT NULL UNIQUE,
                assigned_to TEXT,
                created_at  INTEGER DEFAULT (strftime('%s','now'))
            );

            CREATE INDEX IF NOT EXISTS idx_users_telegram ON users(telegram_id);
            CREATE INDEX IF NOT EXISTS idx_payments_user  ON payments(user_id);
        """)
        db.commit()
    log.info("Database initialised: %s", DATABASE)

# ─── Helpers ───────────────────────────────────────────────────────────────────
def user_to_dict(row):
    if row is None:
        return {}
    d = dict(row)
    d["trial_used"] = bool(d["trial_used"])
    return d

def extend_subscription(db, user_id: str, days: int):
    """Продлить подписку пользователя на N дней."""
    now = int(time.time())
    user = db.execute("SELECT subscription_expiry FROM users WHERE user_id=?", (user_id,)).fetchone()
    if not user:
        return
    current = max(user["subscription_expiry"] or 0, now)
    new_expiry = current + days * 86400
    db.execute(
        "UPDATE users SET subscription_expiry=?, updated_at=? WHERE user_id=?",
        (new_expiry, now, user_id)
    )

def assign_key_from_pool(db, user_id: str) -> str | None:
    """Взять свободный ключ из пула и привязать к пользователю."""
    row = db.execute(
        "SELECT id, vless_key FROM keys_pool WHERE assigned_to IS NULL LIMIT 1"
    ).fetchone()
    if not row:
        return None
    db.execute(
        "UPDATE keys_pool SET assigned_to=? WHERE id=?",
        (user_id, row["id"])
    )
    db.execute(
        "UPDATE users SET vless_key=?, updated_at=? WHERE user_id=?",
        (row["vless_key"], int(time.time()), user_id)
    )
    return row["vless_key"]

def send_telegram_message(chat_id, text: str):
    """Отправить сообщение через бота."""
    try:
        url = f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage"
        requests.post(url, json={"chat_id": chat_id, "text": text, "parse_mode": "HTML"}, timeout=5)
    except Exception as e:
        log.warning("Telegram send failed: %s", e)

def verify_telegram_init_data(init_data: str) -> bool:
    """Проверить подпись initData от Telegram WebApp."""
    try:
        data = dict(x.split("=", 1) for x in init_data.split("&"))
        received_hash = data.pop("hash", "")
        check_string = "\n".join(f"{k}={v}" for k, v in sorted(data.items()))
        secret = hmac.new(b"WebAppData", BOT_TOKEN.encode(), hashlib.sha256).digest()
        computed = hmac.new(secret, check_string.encode(), hashlib.sha256).hexdigest()
        return hmac.compare_digest(computed, received_hash)
    except Exception:
        return False

def require_admin(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        token = request.headers.get("X-Admin-Secret", "")
        if token != ADMIN_SECRET:
            return jsonify({"error": "Unauthorized"}), 403
        return f(*args, **kwargs)
    return wrapper

# ─── API Routes ────────────────────────────────────────────────────────────────

@app.route("/api/user/<user_id>", methods=["GET"])
def get_user(user_id):
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
def update_user(user_id):
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

        # Выдать ключ из пула если его ещё нет
        vless_key = user["vless_key"]
        if not vless_key:
            vless_key = assign_key_from_pool(db, user_id)

        new_expiry = now + TRIAL_DAYS * 86400
        db.execute(
            """UPDATE users SET trial_used=1, subscription_expiry=?,
               vless_key=COALESCE(vless_key, ?), updated_at=? WHERE user_id=?""",
            (new_expiry, vless_key, now, user_id)
        )
        db.commit()

        # Уведомить пользователя
        tg_id = user["telegram_id"]
        if tg_id and BOT_TOKEN != "YOUR_BOT_TOKEN_HERE":
            send_telegram_message(
                tg_id,
                f"🎁 <b>Пробный период активирован!</b>\n"
                f"Срок: {TRIAL_DAYS} дней\n\n"
                f"🔑 Ваш ключ:\n<code>{vless_key or 'скоро будет выдан'}</code>"
            )

        return jsonify({"ok": True, "action": "trial_activated"})

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


@app.route("/api/create_stars_invoice", methods=["POST"])
def create_stars_invoice():
    """
    Создать Telegram Stars Invoice через Bot API.
    Бот должен быть настроен как платёжный провайдер Stars.
    """
    data       = request.get_json(force=True) or {}
    user_id    = data.get("userId")
    telegram_id= data.get("telegramId")
    months     = int(data.get("months", 1))
    stars      = int(data.get("stars", 80))

    if not telegram_id or telegram_id == "DEV_USER":
        return jsonify({"error": "Invalid telegram_id"}), 400

    payload = f"sub_{months}m_{user_id}_{int(time.time())}"

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
        db = get_db()
        db.execute(
            "INSERT INTO payments (user_id, telegram_id, amount_stars, method, months, status, payload)"
            " VALUES (?,?,?,?,?,?,?)",
            (user_id, telegram_id, stars, "stars", months, "pending", payload)
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
    if "pre_checkout_query" in update:
        pcq = update["pre_checkout_query"]
        requests.post(
            f"https://api.telegram.org/bot{BOT_TOKEN}/answerPreCheckoutQuery",
            json={"pre_checkout_query_id": pcq["id"], "ok": True},
            timeout=5
        )
        return jsonify({"ok": True})

    # ── successful_payment: выдать ключ ───────────────────────────
    message = update.get("message", {})
    payment = message.get("successful_payment")
    if payment:
        payload     = payment.get("invoice_payload", "")
        telegram_id = str(message["from"]["id"])

        db = get_db()

        # Найти платёж по payload
        pay_row = db.execute(
            "SELECT * FROM payments WHERE payload=? AND status='pending'", (payload,)
        ).fetchone()

        if not pay_row:
            log.warning("Unknown payload: %s", payload)
            return jsonify({"ok": True})

        user_id = pay_row["user_id"]
        months  = pay_row["months"]

        # Обновить статус платежа
        db.execute(
            "UPDATE payments SET status='completed' WHERE payload=?", (payload,)
        )

        # Выдать ключ из пула если нет
        user = db.execute("SELECT * FROM users WHERE user_id=?", (user_id,)).fetchone()
        vless_key = user["vless_key"] if user else None
        if not vless_key:
            vless_key = assign_key_from_pool(db, user_id)

        # Продлить подписку
        extend_subscription(db, user_id, months * 30)

        # Реферальный бонус
        if user and user["referred_by"]:
            ref_id = user["referred_by"]
            extend_subscription(db, ref_id, REFERRAL_BONUS)
            extend_subscription(db, user_id, REFERRAL_BONUS)
            # Обновить счётчик рефералов
            db.execute(
                "UPDATE users SET invited_count=invited_count+1 WHERE user_id=?", (ref_id,)
            )

        db.execute("UPDATE users SET updated_at=? WHERE user_id=?", (int(time.time()), user_id))
        db.commit()

        expiry = db.execute(
            "SELECT subscription_expiry FROM users WHERE user_id=?", (user_id,)
        ).fetchone()["subscription_expiry"]
        expiry_str = datetime.fromtimestamp(expiry).strftime("%d.%m.%Y")

        send_telegram_message(
            telegram_id,
            f"✅ <b>Оплата прошла успешно!</b>\n\n"
            f"📅 Подписка до: <b>{expiry_str}</b>\n\n"
            f"🔑 Ваш ключ:\n<code>{vless_key or 'выдаётся...'}</code>\n\n"
            f"Настройка: /start → Настройка"
        )

        log.info("Payment completed: user=%s months=%d key=%s", user_id, months, vless_key)
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
    """Вручную выдать ключ пользователю (для YooMoney-оплат)."""
    data      = request.get_json(force=True) or {}
    user_id   = data.get("user_id")
    vless_key = data.get("vless_key")
    months    = int(data.get("months", 1))

    if not user_id:
        return jsonify({"error": "user_id required"}), 400

    db = get_db()
    user = db.execute("SELECT * FROM users WHERE user_id=?", (user_id,)).fetchone()
    if not user:
        return jsonify({"error": "User not found"}), 404

    # Если ключ не передан — взять из пула
    if not vless_key:
        vless_key = assign_key_from_pool(db, user_id)
        if not vless_key:
            return jsonify({"error": "No keys in pool"}), 503
    else:
        db.execute(
            "UPDATE users SET vless_key=?, updated_at=? WHERE user_id=?",
            (vless_key, int(time.time()), user_id)
        )

    extend_subscription(db, user_id, months * 30)
    db.execute(
        "INSERT INTO payments (user_id, telegram_id, method, months, status)"
        " VALUES (?,?,?,?,?)",
        (user_id, user["telegram_id"], "yoomoney_manual", months, "completed")
    )
    db.commit()

    expiry = db.execute(
        "SELECT subscription_expiry FROM users WHERE user_id=?", (user_id,)
    ).fetchone()["subscription_expiry"]
    expiry_str = datetime.fromtimestamp(expiry).strftime("%d.%m.%Y")

    if user["telegram_id"] and BOT_TOKEN != "YOUR_BOT_TOKEN_HERE":
        send_telegram_message(
            user["telegram_id"],
            f"✅ <b>Подписка активирована!</b>\n\n"
            f"📅 Действует до: <b>{expiry_str}</b>\n\n"
            f"🔑 Ваш ключ:\n<code>{vless_key}</code>"
        )

    return jsonify({"ok": True, "vless_key": vless_key, "expiry": expiry_str})


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
            "SELECT COUNT(*) FROM users WHERE subscription_expiry > ?", (now,)
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
