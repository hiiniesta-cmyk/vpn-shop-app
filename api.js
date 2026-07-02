/**
 * PlusVpnAPI — единый REST-клиент для общения с бэкендом.
 * ------------------------------------------------------------------
 * Вся сетевая логика собрана здесь. main.js и test-client.html
 * НЕ должны вызывать fetch() напрямую — только через этот класс.
 *
 * Чтобы адаптировать под другую схему API — меняешь тела методов
 * (путь, тело запроса, разбор ответа). Транспорт (request/_url/auth)
 * трогать не нужно.
 */

class PlusVpnAPI {
  /**
   * @param {object} opts
   * @param {string} opts.baseUrl   — базовый URL API, напр. "https://domain/api"
   * @param {string} [opts.initData] — Telegram WebApp.initData (raw query-string)
   * @param {string} [opts.adminSecret] — для админских вызовов (НЕ использовать на клиенте в проде)
   */
  constructor({ baseUrl, initData = '', adminSecret = '' } = {}) {
    // нормализуем: убираем хвостовой слэш
    this.baseUrl = String(baseUrl || '').replace(/\/+$/, '');
    this.initData = initData;
    this.adminSecret = adminSecret;
  }

  // ── низкоуровневый транспорт ───────────────────────────────────
  _url(path) {
    // path может приходить как "/user/123" или "user/123"
    return `${this.baseUrl}/${String(path).replace(/^\/+/, '')}`;
  }

  /**
   * Базовый запрос. Возвращает распарсенный JSON.
   * Бросает Error с полями .status и .body при не-2xx ответе.
   */
  async request(path, { method = 'GET', body = null, admin = false, signal } = {}) {
    const headers = { 'Accept': 'application/json' };

    // авторизация Telegram Mini App: подпись initData едет в заголовке
    if (this.initData) headers['X-Telegram-Init-Data'] = this.initData;

    // админские эндпоинты
    if (admin && this.adminSecret) headers['X-Admin-Secret'] = this.adminSecret;

    const opts = { method, headers, signal };
    if (body != null) {
      headers['Content-Type'] = 'application/json';
      opts.body = JSON.stringify(body);
    }

    let res;
    try {
      res = await fetch(this._url(path), opts);
    } catch (networkErr) {
      // fetch падает только на сетевых ошибках (нет соединения, CORS, и т.п.)
      const e = new Error(`Network error: ${networkErr.message}`);
      e.status = 0;
      e.cause = networkErr;
      throw e;
    }

    // пытаемся разобрать тело как JSON (даже на ошибках — там {error: "..."})
    const text = await res.text();
    let data = null;
    if (text) {
      try { data = JSON.parse(text); }
      catch { data = { raw: text }; }
    }

    if (!res.ok) {
      const e = new Error((data && data.error) || `HTTP ${res.status}`);
      e.status = res.status;
      e.body = data;
      throw e;
    }
    return data;
  }

  // ── публичные эндпоинты (фронт → бэк) ──────────────────────────

  /** GET /api/user/<id> — получить (или создать) пользователя */
  getUser(userId) {
    return this.request(`/user/${encodeURIComponent(userId)}`);
  }

  /** POST /api/user/<id> — обновить профиль (username/first_name/balance) */
  updateUser(userId, fields = {}) {
    return this.request(`/user/${encodeURIComponent(userId)}`, {
      method: 'POST',
      body: fields,
    });
  }

  /** POST /api/user/<id> {action:'activate_trial'} — активировать триал */
  activateTrial(userId, telegramId) {
    return this.request(`/user/${encodeURIComponent(userId)}`, {
      method: 'POST',
      body: { action: 'activate_trial', telegramId },
    });
  }

  /** POST /api/create_stars_invoice — создать инвойс Telegram Stars */
  createStarsInvoice({ userId, telegramId, months, stars }) {
    return this.request('/create_stars_invoice', {
      method: 'POST',
      body: { userId, telegramId, months, stars },
    });
  }

  /** GET /api/health — проверка живости сервера */
  health() {
    return this.request('/health');
  }

  // ── админские эндпоинты (требуют adminSecret) ──────────────────

  adminUsers() {
    return this.request('/admin/users', { admin: true });
  }
  adminPayments() {
    return this.request('/admin/payments', { admin: true });
  }
  adminStats() {
    return this.request('/admin/stats', { admin: true });
  }
  adminSetKey({ user_id, vless_key = null, months = 1 }) {
    return this.request('/admin/set_key', {
      method: 'POST', admin: true,
      body: { user_id, vless_key, months },
    });
  }
  adminAddKeysToPool(keys) {
    return this.request('/admin/add_key_to_pool', {
      method: 'POST', admin: true,
      body: { keys: Array.isArray(keys) ? keys : [keys] },
    });
  }
}

// доступно и как глобал (для <script> без модулей), и как ES-модуль
if (typeof window !== 'undefined') window.PlusVpnAPI = PlusVpnAPI;
if (typeof module !== 'undefined' && module.exports) module.exports = PlusVpnAPI;
