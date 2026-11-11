/**
 * PlusVpnAPI — REST-клиент под бэкенд tg-vpn-bot (mini-app-openapi.json v0.2.0).
 * ------------------------------------------------------------------
 * Авторизация: POST /auth/login-tg {init_data} → JWT → Authorization: Bearer.
 * Токен живёт только в памяти, при 401 перелогинивается и повторяет запрос один раз.
 * Все остальные эндпоинты адресуются ВНУТРЕННИМ id пользователя (ApiUser.id),
 * а не telegram id — его определяет resolveUser().
 */

function decodeJwt(token) {
  try {
    const b64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const bin = atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4));
    return JSON.parse(new TextDecoder().decode(Uint8Array.from(bin, c => c.charCodeAt(0))));
  } catch { return {}; }
}

/** Бэкенд отдаёт ISO без часового пояса → считаем UTC, иначе Date распарсит как локальное. */
function parseDate(s) {
  if (!s) return null;
  const str = String(s);
  const t = Date.parse(/(Z|[+-]\d{2}:?\d{2})$/.test(str) ? str : str + 'Z');
  return Number.isNaN(t) ? null : t;
}

class PlusVpnAPI {
  constructor({ baseUrl, initData = '' } = {}) {
    this.baseUrl = String(baseUrl || '').replace(/\/+$/, '');
    this.initData = initData;
    this.token = null;
    this.tokenExp = 0;
    this.claims = {};
    this.userId = null;        // внутренний id (ApiUser.id)
    this._login = null;
  }

  _url(path) { return `${this.baseUrl}/${String(path).replace(/^\/+/, '')}`; }

  async _send(path, { method = 'GET', body = null, auth = true } = {}) {
    const headers = { Accept: 'application/json' };
    if (auth && this.token) headers.Authorization = `Bearer ${this.token}`;
    const opts = { method, headers };
    if (body != null) { headers['Content-Type'] = 'application/json'; opts.body = JSON.stringify(body); }

    let res;
    try { res = await fetch(this._url(path), opts); }
    catch (err) {
      const e = new Error(`Network error: ${err.message}`);
      e.status = 0; throw e;
    }
    const text = await res.text();
    let data = null;
    if (text) { try { data = JSON.parse(text); } catch { data = { raw: text }; } }

    if (!res.ok) {
      // FastAPI: {"detail": "..."} или {"detail": [{msg, loc}, ...]} для 422
      let msg = data && data.detail;
      if (Array.isArray(msg)) msg = msg.map(d => `${(d.loc || []).slice(1).join('.')}: ${d.msg}`).join('; ');
      const e = new Error(msg || `HTTP ${res.status}`);
      e.status = res.status; e.body = data; throw e;
    }
    return data;
  }

  // ── авторизация ────────────────────────────────────────────────
  async login() {
    const r = await this._send('/auth/login-tg', { method: 'POST', body: { init_data: this.initData }, auth: false });
    this.token = r.access_token;
    this.claims = decodeJwt(r.access_token);
    this.tokenExp = this.claims.exp ? this.claims.exp * 1000 : Date.now() + (r.expires_in || 3600) * 1000;
  }

  async ensureToken() {
    if (this.token && Date.now() < this.tokenExp - 30000) return;
    if (!this._login) this._login = this.login().finally(() => { this._login = null; });
    return this._login;
  }

  async request(path, opts = {}) {
    await this.ensureToken();
    try { return await this._send(path, opts); }
    catch (e) {
      if (e.status !== 401) throw e;
      this.token = null;                 // токен отозван/протух — один перелогин и повтор
      await this.ensureToken();
      return this._send(path, opts);
    }
  }

  /**
   * Логин не возвращает user_id, поэтому берём кандидатов из claims JWT и проверяем
   * каждого запросом /users/{id}: нужный — тот, у кого tg_id совпал с telegram id.
   */
  async resolveUser(tgId) {
    await this.ensureToken();
    const cands = [];
    for (const k of ['user_id', 'uid', 'id', 'sub']) {
      const v = this.claims[k];
      if (v != null && /^\d+$/.test(String(v)) && !cands.includes(String(v))) cands.push(String(v));
    }
    if (!cands.length) {
      throw new Error('В JWT нет числового id пользователя. Claims: ' + JSON.stringify(this.claims));
    }
    for (const id of cands) {
      try {
        const u = await this.getUser(id);
        if (!tgId || String(u.tg_id) === String(tgId)) { this.userId = u.id; return u; }
      } catch (e) { if (e.status !== 403 && e.status !== 404) throw e; }
    }
    throw new Error('Не удалось сопоставить JWT с пользователем. Claims: ' + JSON.stringify(this.claims));
  }

  // ── эндпоинты ──────────────────────────────────────────────────
  getUser(id)                 { return this.request(`/users/${encodeURIComponent(id)}`); }
  getWallet(id)               { return this.request(`/wallets/${encodeURIComponent(id)}`); }
  prices()                    { return this.request('/prices'); }
  appLinks()                  { return this.request('/app-links'); }

  listSubscriptions(id, { page = 1, per_page = 50 } = {}) {
    return this.request(`/subscriptions/user/${encodeURIComponent(id)}?page=${page}&per_page=${per_page}`);
  }
  /** body: {user_id, type: 'default'|'test_period', period_type, custom_period?, cost?} */
  createSubscription(body)    { return this.request('/subscriptions', { method: 'POST', body }); }
  activateSubscription(subId) { return this.request(`/subscriptions/${encodeURIComponent(subId)}/activate`, { method: 'POST' }); }
  setAutoDebit(subId, on)     { return this.request(`/subscriptions/${encodeURIComponent(subId)}/auto-debit`, { method: 'PUT', body: { auto_debit: !!on } }); }

  /** body: {user_id, pay_amount, wallet_amount, pay_method: 'stars'|'yoomoney'|..., billing_details?} */
  createInvoice(body)         { return this.request('/invoices', { method: 'POST', body }); }
  getInvoice(invId)           { return this.request(`/invoices/${encodeURIComponent(invId)}`); }
  starsLink(invId)            { return this.request(`/invoices/${encodeURIComponent(invId)}/stars-link`, { method: 'POST' }); }

  trialPeriod(id)             { return this.request(`/bonuses/${encodeURIComponent(id)}/trial-period`); }
  redeemPromocode(id, code, subscription_id = null) {
    return this.request(`/bonuses/${encodeURIComponent(id)}/promocode`, { method: 'POST', body: { code, subscription_id } });
  }
}

if (typeof window !== 'undefined') { window.PlusVpnAPI = PlusVpnAPI; window.parseDate = parseDate; }
if (typeof module !== 'undefined' && module.exports) module.exports = { PlusVpnAPI, parseDate, decodeJwt };
