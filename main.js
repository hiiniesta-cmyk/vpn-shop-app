// ═══════════════════════════════════════════════════════════════
//  PLUSVPN Mini App — фронт под бэкенд tg-vpn-bot (JWT + кошелёк + инвойсы)
//
//  Модель оплаты бэкенда:  инвойс = ПОПОЛНЕНИЕ КОШЕЛЬКА (Stars / ЮMoney);
//  подписка покупается с кошелька: POST /subscriptions → POST /subscriptions/{id}/activate.
//  Поэтому «Купить»: хватает баланса → покупаем сразу; не хватает → пополняем на разницу,
//  ждём статус инвойса «paid» и докупаем автоматически.
// ═══════════════════════════════════════════════════════════════

// ── Настройки (всё, что может понадобиться подправить, — здесь) ─────
const BOT_USERNAME   = 'PlusVpnBot';
const API_BASE_DEF   = '/api';                 // nginx отрезает /api и проксирует на бэкенд
const POLL_MS        = 8000;
const TRIAL_DAYS_FALLBACK = 3;
const TRIAL_PERIOD_TYPE   = 'custom';          // период тестовой подписки (см. startTrial)
const PAID_STATUSES = ['paid'];                                   // кошелёк пополнен
const DEAD_STATUSES = ['rejected', 'cancelled', 'expired', 'refunded'];
const DEFAULT_FEATURES = ['feat_unlimited', 'feat_vless', 'feat_support'];

// ── Состояние ───────────────────────────────────────────────────
let tg = null, tgUser = null, tgInitData = '';
let currentLang  = localStorage.getItem('lang') || 'ru';
let currentTheme = localStorage.getItem('plusvpn_theme') || 'light';
let API_BASE     = localStorage.getItem('plusvpn_api_base') || API_BASE_DEF;;
let api = new PlusVpnAPI({ baseUrl: API_BASE });

let isProcessing = false;       // антиспам обычных кнопок
let payBusy = false;            // идёт создание инвойса / покупка
let currentVlessKey = '';       // ссылка подписки (имя оставлено для совместимости)
let currentModalTariff = null;

const S = {
    user: null, wallet: 0, subs: [], sub: null,
    trial: 'unknown',           // 'available' | 'used' | 'unknown'
    trialBonus: null,
    prices: null, appLinks: null,
    authOk: false,
};

const DEBUG = /[?&]debug=1/.test(location.search) || localStorage.getItem('plusvpn_debug') === '1';
const dbg = (e) => (DEBUG && e ? `\n[${e.status ?? '?'}] ${e.message}` : '');

const t = () => TRANSLATIONS[currentLang];
const money = (n) => `${Number(n || 0).toFixed(2)} ₽`;
const round2 = (n) => Math.round(n * 100) / 100;

// ── Инициализация ───────────────────────────────────────────────
window.addEventListener('load', async () => {
    if (window.Telegram?.WebApp) {
        tg = window.Telegram.WebApp;
        tg.ready();
        tg.expand();
        tgInitData = tg.initData || '';
        tgUser = tg.initDataUnsafe?.user || null;
    }

    applyTheme(currentTheme);
    updateLanguage(currentLang);

    api = new PlusVpnAPI({ baseUrl: API_BASE, initData: tgInitData });

    const first = tgUser?.first_name || 'User', last = tgUser?.last_name || '';
    if (tgUser) {
        const initials = (first[0] + (last ? last[0] : '')).toUpperCase().trim();
        if (initials) document.getElementById('user-avatar-placeholder').textContent = initials;
    }
    document.getElementById('telegram-id-display').textContent = tgUser?.id || '—';
    document.getElementById('user-full-name').textContent = `${first} ${last}`.trim();
    document.getElementById('username-display').textContent = tgUser?.username || 'None';
    document.querySelector('.ref-stats')?.style.setProperty('display', 'none'); // у API нет статистики рефералов

    renderTariffs();
    renderDownloadButtons();
    renderInstructionButtons();
    switchTab('profile');
    document.querySelector('.container').classList.add('loaded');

    if (!tgInitData) {
        showToast(currentLang === 'ru' ? 'Откройте приложение через Telegram' : 'Please open the app in Telegram', 'error', 6000);
        return;
    }
    await bootstrap();
});

async function bootstrap() {
    try {
        S.user = await api.resolveUser(tgUser?.id);
        S.authOk = true;
    } catch (e) {
        console.error('Auth failed:', e);
        showToast((currentLang === 'ru'
            ? 'Ошибка авторизации. Откройте приложение через бота.'
            : 'Auth error. Please open the app via the bot.') + dbg(e), 'error', DEBUG ? 20000 : 7000);
        return;
    }
    generateReferralLink();
    loadPrices();
    loadAppLinks();
    startPolling();
}

// ── Загрузка данных ─────────────────────────────────────────────
async function loadPrices() {
    try { S.prices = await api.prices(); renderTariffs(); }
    catch (e) { console.error('prices', e); }
}

async function loadAppLinks() {
    try { S.appLinks = await api.appLinks(); renderDownloadButtons(); }
    catch (e) { console.error('app-links', e); }   // останутся статические DOWNLOAD_LINKS
}

async function loadState() {
    const uid = api.userId;
    const [wallet, subsPage] = await Promise.all([
        api.getWallet(uid).catch(() => null),
        api.listSubscriptions(uid, { per_page: 50 }).catch(() => null),
    ]);
    if (wallet) S.wallet = Number(wallet.rub) || 0;
    if (subsPage) {
        S.subs = (subsPage.items || []).filter(s => s.status !== 'deleted');
        S.sub = pickSubscription(S.subs);
    }

    // триал имеет смысл проверять, пока нет ни одной подписки
    if (subsPage) {
        if (S.subs.some(s => s.type === 'test_period')) S.trial = 'used';
        else if (S.subs.length) S.trial = 'used';
        else {
            try { S.trialBonus = await api.trialPeriod(uid); S.trial = 'available'; }
            catch (e) { S.trial = (e.status === 403 || e.status === 404) ? 'used' : 'unknown'; }
        }
    }
    if (!S.prices) loadPrices();
    if (!S.prices) renderTariffs();
}

function pickSubscription(items) {
    if (!items.length) return null;
    const byExpiry = (a, b) => (parseDate(b.expires_at) || 0) - (parseDate(a.expires_at) || 0);
    const active = items.filter(s => s.is_active).sort(byExpiry);
    return active[0] || [...items].sort(byExpiry)[0];
}

// ── Опрос ───────────────────────────────────────────────────────
let pollTimer = null, polling = false, pollAgain = false;
function schedule() {
    pollTimer = setTimeout(() => { if (document.hidden) schedule(); else refresh(); }, POLL_MS);
}
function startPolling() {
    window.addEventListener('db-update', () => refresh());
    document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });
    refresh();
}
async function refresh() {
    if (!S.authOk) return;
    if (polling) { pollAgain = true; return; }
    polling = true; clearTimeout(pollTimer);
    try {
        await loadState();
        renderProfile();
        await checkPending();
    } catch (e) { console.error('refresh', e); }
    finally {
        polling = false;
        if (pollAgain) { pollAgain = false; refresh(); } else schedule();
    }
}

// ── Рендер профиля ──────────────────────────────────────────────
function setKeyDisplay(el, label, key) {
    el.textContent = '';
    const span = document.createElement('span');
    span.className = 'key-label';
    span.textContent = label;
    el.append(span, ' ', key);
}

function renderProfile() {
    const tr = t();
    const indicator = document.getElementById('status-indicator');
    const vlessDisplay = document.getElementById('vless-link-display');
    const trialCard = document.getElementById('trial-card-status');
    const renewContainer = document.getElementById('renew-container');
    const qrBtn = document.getElementById('toggle-qr-btn');
    const statusBadge = document.getElementById('user-status-badge');
    const progressWrap = document.getElementById('days-progress-wrap');
    const daysBarFill = document.getElementById('days-bar-fill');
    const daysLeftLabel = document.getElementById('days-left-label');
    const expiryEl = document.getElementById('expiry-date');
    const autoRow = document.getElementById('autorenew-row');
    const autoToggle = document.getElementById('autodebit-toggle');

    document.getElementById('user-balance-display').textContent = money(S.wallet);

    const sub = S.sub;
    currentVlessKey = sub?.subscription_url || '';
    const expiryTime = sub ? parseDate(sub.expires_at) : null;
    const isActive = !!(sub && sub.is_active && expiryTime && expiryTime > Date.now());
    const daysLeft = isActive ? Math.ceil((expiryTime - Date.now()) / 864e5) : 0;

    renewContainer.style.display = (!isActive || daysLeft < 5) ? 'block' : 'none';

    if (!sub) {
        indicator.textContent = tr.status_inactive;
        indicator.className = 'status-pill status-inactive';
        statusBadge.textContent = '🔴';
        vlessDisplay.innerHTML = `<span class="key-placeholder">${tr.key_inactive}</span>`;
        expiryEl.textContent = '—';
        progressWrap.style.display = 'none';
        if (qrBtn) qrBtn.disabled = true;
    } else if (isActive) {
        const warn = daysLeft < 5 || sub.status === 'expiring';
        indicator.textContent = `${warn ? '⚠️' : '✓'} ${tr.status_active}`;
        indicator.className = `status-pill ${warn ? 'status-warning' : 'status-active'}`;
        statusBadge.textContent = warn ? '⚠️' : '🟢';
        expiryEl.textContent = new Date(expiryTime).toLocaleDateString(currentLang, { year: 'numeric', month: 'long', day: 'numeric' });
        setKeyDisplay(vlessDisplay, tr.key_active, currentVlessKey);

        const pct = Math.min(100, Math.round((daysLeft / 30) * 100));
        progressWrap.style.display = 'block';
        daysBarFill.style.width = `${pct}%`;
        daysBarFill.style.background = daysLeft < 5
            ? 'linear-gradient(90deg, #c25541, #ddb863)'
            : 'linear-gradient(90deg, #ddb863, #c7a24c)';
        daysLeftLabel.textContent = `${tr.days_left} ${daysLeft}`;
        if (qrBtn) qrBtn.disabled = false;
    } else {
        indicator.textContent = tr.status_expired;
        indicator.className = 'status-pill status-inactive';
        statusBadge.textContent = '🔴';
        expiryEl.textContent = tr.status_expired;
        progressWrap.style.display = 'none';
        if (currentVlessKey) setKeyDisplay(vlessDisplay, tr.key_active, currentVlessKey);
        else vlessDisplay.innerHTML = `<span class="key-placeholder">${tr.key_inactive}</span>`;
        if (qrBtn) qrBtn.disabled = !currentVlessKey;
    }

    // автопродление — только для активной подписки
    if (autoRow) {
        autoRow.style.display = isActive ? 'flex' : 'none';
        if (isActive && autoToggle && document.activeElement !== autoToggle) autoToggle.checked = !!sub.auto_debit;
    }

    // Триал
    if (S.trial === 'available') {
        const days = Math.round(Number(S.trialBonus?.amount)) || TRIAL_DAYS_FALLBACK;
        trialCard.style.display = '';
        if (!document.getElementById('start-trial-btn')) {
            trialCard.innerHTML = `
                <p class="trial-desc">${tr.title_trial}</p>
                <button class="btn btn-primary" id="start-trial-btn">
                    <i class="fas fa-gift"></i> ${tr.trial_btn.replace(/\d+/, days)}
                </button>`;
        }
    } else if (S.trial === 'used') {
        trialCard.style.display = '';
        trialCard.innerHTML = `<div class="trial-used-msg"><i class="fas fa-check-circle"></i> ${tr.trial_used}</div>`;
    } else {
        trialCard.style.display = 'none';
    }
}

// ── Тариф-карточки ──────────────────────────────────────────────
function tiers() { return (S.prices?.key_prices || []).slice().sort((a, b) => a.months - b.months); }

function renderTariffs() {
    const tr = t();
    const grid = document.getElementById('tariff-grid');
    const list = tiers();
    if (!list.length) {
        grid.innerHTML = `<div class="warning-card"><i class="fas fa-spinner fa-spin"></i><span>${tr.tariffs_loading}</span></div>`;
        return;
    }
    const base = list.find(x => x.months === 1);

    grid.innerHTML = list.map((tier) => {
        const meta = TARIFFS.find(x => x.months === tier.months) || {};
        const mLabel = tier.months === 1 ? tr.month_1 : tr.month_many;
        const perMonth = (tier.price / tier.months).toFixed(0);
        const full = base ? base.price * tier.months : 0;
        const discountPct = (base && tier.months > 1 && full > tier.price) ? Math.round((1 - tier.price / full) * 100) : 0;
        const badgeHtml = meta.badge
            ? `<span class="tariff-badge tariff-badge-${meta.badge}">${meta.badge === 'save' ? tr.save : tr.best}</span>` : '';
        const discountHtml = discountPct > 0 ? `<span class="tariff-discount">−${discountPct}%</span>` : '';
        const oldPrice = discountPct > 0 ? `<span class="tariff-old-price">${full.toFixed(0)} ₽</span>` : '';
        const features = [...(meta.features || DEFAULT_FEATURES).map(k => tr[k] || k),
                          ...(discountPct > 0 ? [`${discountPct}% ${tr.off}`] : [])];

        return `
        <div class="tariff-card ${meta.badge ? 'tariff-card-featured' : ''}">
            ${badgeHtml}
            <div class="tariff-period">
                <span class="tariff-months">${tier.months}</span>
                <span class="tariff-month-label">${mLabel}</span>
            </div>
            <div class="tariff-price-block">
                <div class="tariff-oldprice-row">${oldPrice}${discountHtml}</div>
                <div class="tariff-price">${tier.price.toFixed(0)} <span class="tariff-currency">₽</span></div>
                <div class="tariff-per-month">${perMonth} ${tr.per_month}</div>
            </div>
            <ul class="tariff-features">
                ${features.map(f => `<li><i class="fas fa-check"></i> ${f}</li>`).join('')}
            </ul>
            <button class="btn btn-tariff tariff-btn-delegate" data-months="${tier.months}">
                <i class="fas fa-bolt"></i> ${tr.select_btn}
            </button>
        </div>`;
    }).join('');
}

// ── Скачивание / инструкции ─────────────────────────────────────
function iconForName(name) {
    const n = String(name).toLowerCase();
    if (n.includes('android')) return 'fab fa-android';
    if (n.includes('ios') || n.includes('iphone') || n.includes('mac') || n.includes('apple')) return 'fab fa-apple';
    if (n.includes('win')) return 'fab fa-windows';
    if (n.includes('linux')) return 'fab fa-linux';
    return 'fas fa-download';
}

function renderDownloadButtons() {
    const items = (S.appLinks && S.appLinks.length)
        ? S.appLinks.map(l => ({ name: l.name, url: l.url, icon: iconForName(l.name) }))
        : Object.values(DOWNLOAD_LINKS);
    document.getElementById('download-grid').innerHTML = items.map(i => `
        <button class="btn download-btn open-link-delegate" data-url="${encodeURI(i.url)}">
            <i class="${i.icon}"></i> ${i.name}
        </button>`).join('');
}

function renderInstructionButtons() {
    const container = document.getElementById('instructions-grid');
    container.innerHTML = Object.keys(INSTRUCTION_LINKS).map(key => {
        const i = INSTRUCTION_LINKS[key];
        return `
        <div class="instruction-wrapper">
            <button class="btn accordion-btn" data-target="inst-${key}">
                <span><i class="${i.icon}"></i> ${i.name}</span>
                <i class="fas fa-chevron-down accordion-icon"></i>
            </button>
            <div id="inst-${key}" class="instruction-content">
                ${(i.html && i.html[currentLang]) || (i.html && i.html.ru) || i.html}
            </div>
        </div>`;
    }).join('');
}

// ── Оплата ──────────────────────────────────────────────────────
function tierByMonths(months) { return tiers().find(x => x.months === Number(months)); }

/** Stars-пакеты пополнения: stars_prices = { "<сумма в ₽>": <Stars> }. Берём минимальный пакет ≥ нужной суммы. */
function starsOption(need) {
    const opts = Object.entries(S.prices?.stars_prices || {})
        .map(([rub, stars]) => ({ rub: Number(rub), stars: Number(stars) }))
        .filter(o => o.rub > 0 && o.stars > 0)
        .sort((a, b) => a.rub - b.rub);
    return opts.find(o => o.rub >= need) || null;
}

/** ЮMoney: сумма пополнения в границах [topup_min, topup_max], кратная topup_step. */
function yooAmount(need) {
    const p = S.prices || {};
    const step = Number(p.topup_step) || 1, min = Number(p.topup_min) || 1, max = Number(p.topup_max) || Infinity;
    const amt = Math.max(min, Math.ceil(round2(need / step)) * step);
    return amt <= max ? amt : null;
}

window.showPaymentModal = (months) => {
    const tier = tierByMonths(months);
    if (!tier) return;
    const tr = t();
    const need = Math.max(0, round2(tier.price - S.wallet));
    const stars = need > 0 ? starsOption(need) : null;
    const yoo = need > 0 ? yooAmount(need) : null;
    currentModalTariff = { tier, need, stars, yoo };

    const mLabel = tier.months === 1 ? tr.month_1 : tr.month_many;
    const fee = S.prices?.yoomoney_fee_percent;
    document.getElementById('modal-tariff-info').innerHTML = `
        <div class="modal-info-row"><span>${tr.row_term}</span><strong>${tier.months} ${mLabel}</strong></div>
        <div class="modal-info-row"><span>${tr.row_price}</span><strong>${tier.price.toFixed(0)} ₽</strong></div>
        <div class="modal-info-row"><span>${tr.row_balance}</span><strong>${money(S.wallet)}</strong></div>
        ${need > 0 ? `<div class="modal-info-row"><span>${tr.row_topup}</span><strong>${money(need)}</strong></div>` : ''}
        ${need > 0 && fee && Number(fee) > 0 ? `<div class="modal-info-row"><span>${tr.row_fee}</span><strong>${Number(fee)}%</strong></div>` : ''}
    `;

    const starsBtn = document.getElementById('pay-stars-btn');
    const yooBtn = document.getElementById('go-to-yoomoney-btn');
    const walletBtn = document.getElementById('buy-wallet-btn');
    const payBlock = document.getElementById('modal-pay-methods');
    const warn = document.getElementById('modal-warning-card');

    if (need === 0) {                                  // хватает баланса
        payBlock.style.display = 'none'; warn.style.display = 'none';
        walletBtn.style.display = '';
    } else {
        walletBtn.style.display = 'none'; payBlock.style.display = ''; warn.style.display = '';
        starsBtn.style.display = stars ? '' : 'none';
        document.getElementById('stars-badge-amount').textContent = stars ? `${stars.stars} ⭐` : '';
        yooBtn.style.display = yoo ? '' : 'none';
        yooBtn.querySelector('span[data-i18n]').textContent = `${tr.modal_pay_btn} · ${yoo ?? ''} ₽`;
        if (!stars && !yoo) showToast(tr.topup_too_big, 'error', 5000);
    }

    const modal = document.getElementById('payment-modal');
    modal.style.display = 'flex';
    requestAnimationFrame(() => modal.classList.add('open'));
};

function closeModal() {
    const modal = document.getElementById('payment-modal');
    modal.classList.remove('open');
    setTimeout(() => { modal.style.display = 'none'; }, 300);
}

async function withPayLock(btn, fn) {
    if (payBusy) return;
    payBusy = true;
    const orig = btn.innerHTML;
    btn.classList.add('disabled');
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    try { await fn(); }
    catch (err) {
        console.error(err);
        showToast((err.message || t().stars_paid_error) + dbg(err), 'error', DEBUG ? 15000 : 5000);
    } finally {
        payBusy = false;
        btn.classList.remove('disabled');
        btn.innerHTML = orig;
    }
}

// pending: покупка, ждущая зачисления денег. Переживает закрытие приложения (ЮMoney уводит в браузер).
const PENDING_KEY = 'plusvpn_pending';
const readPending = () => { try { return JSON.parse(localStorage.getItem(PENDING_KEY)); } catch { return null; } };
const writePending = (p) => localStorage.setItem(PENDING_KEY, JSON.stringify(p));
const clearPending = () => localStorage.removeItem(PENDING_KEY);

let pendingBusy = false;
async function checkPending() {
    const p = readPending();
    if (!p || pendingBusy) return;
    if (Date.now() - p.ts > 24 * 3600e3) { clearPending(); return; }
    pendingBusy = true;
    try {
        const inv = await api.getInvoice(p.invoiceId);
        if (PAID_STATUSES.includes(inv.status)) {
            clearPending();                                   // до покупки: повтор невозможен
            showToast(t().topup_ok, 'success');
            await purchase(p.months, { quiet: false });
        } else if (DEAD_STATUSES.includes(inv.status)) {
            clearPending();
        }
    } catch (e) { console.error('pending', e); }
    finally { pendingBusy = false; }
}

/** После оплаты Stars статус обновляется не мгновенно — несколько быстрых проверок подряд. */
function burstCheckPending(times = 15, every = 2000) {
    let n = 0;
    const tick = async () => { await checkPending(); if (++n < times && readPending()) setTimeout(tick, every); };
    tick();
}

/** Покупка подписки с кошелька: create → activate. */
async function purchase(months) {
    const tier = tierByMonths(months);
    if (!tier) return;
    try {
        const sub = await api.createSubscription({ user_id: api.userId, type: 'default', period_type: tier.period_type });
        try { await api.activateSubscription(sub.id); }
        catch (e) { if (e.status !== 409) throw e; }          // 409 — уже активна, это нормально
        showToast(t().bought_ok, 'success');
    } catch (e) {
        if (e.status === 402) showToast(t().insufficient, 'error', 5000);
        else showToast((e.message || t().stars_paid_error) + dbg(e), 'error', 5000);
    }
    window.dispatchEvent(new Event('db-update'));
}

async function handleWalletBuy(btn) {
    if (!currentModalTariff) return;
    const { tier } = currentModalTariff;
    await withPayLock(btn, async () => {
        closeModal();
        await purchase(tier.months);
    });
}

async function handleStarsPayment(btn) {
    const m = currentModalTariff;
    if (!m?.stars) return;
    await withPayLock(btn, async () => {
        const inv = await api.createInvoice({
            user_id: api.userId, pay_amount: m.stars.rub, wallet_amount: 0, pay_method: 'stars',
        });
        const { invoice_link } = await api.starsLink(inv.id);
        writePending({ invoiceId: inv.id, months: m.tier.months, ts: Date.now() });

        if (!tg?.openInvoice) { openLink(invoice_link); closeModal(); return; }
        tg.openInvoice(invoice_link, (status) => {
            if (status === 'paid') {
                showToast(t().stars_paid_success, 'success');
                closeModal();
                burstCheckPending();
            } else if (status === 'cancelled') {
                clearPending();
                showToast(currentLang === 'ru' ? 'Оплата отменена' : 'Payment cancelled', 'info');
            } else {
                clearPending();
                showToast(t().stars_paid_error, 'error');
            }
        });
    });
}

async function handleYooMoneyPayment(btn) {
    const m = currentModalTariff;
    if (!m?.yoo) return;
    await withPayLock(btn, async () => {
        let inv = await api.createInvoice({
            user_id: api.userId, pay_amount: m.yoo, wallet_amount: 0, pay_method: 'yoomoney',
        });
        let url = inv.billing_details?.payment_url;
        if (!url) { inv = await api.getInvoice(inv.id); url = inv.billing_details?.payment_url; }
        if (!url) throw new Error(currentLang === 'ru' ? 'Ссылка на оплату не получена' : 'Payment link not received');

        writePending({ invoiceId: inv.id, months: m.tier.months, ts: Date.now() });
        openLink(url);
        closeModal();
        showToast(t().yoo_wait, 'info', 6000);
    });
}

// ── Триал ───────────────────────────────────────────────────────
window.startTrial = async () => {
    const days = Math.round(Number(S.trialBonus?.amount)) || TRIAL_DAYS_FALLBACK;
    try {
        const sub = await api.createSubscription({
            user_id: api.userId, type: 'test_period', period_type: TRIAL_PERIOD_TYPE, custom_period: days,
        });
        try { await api.activateSubscription(sub.id); }
        catch (e) { if (e.status !== 409) throw e; }
        showToast(t().trial_success, 'success');
    } catch (e) {
        showToast(e.status === 412 ? t().trial_na : ((e.message || t().stars_paid_error) + dbg(e)), 'error', DEBUG ? 15000 : 5000);
        throw e;
    } finally {
        window.dispatchEvent(new Event('db-update'));
    }
};

// ── Промокод ────────────────────────────────────────────────────
async function redeemPromo() {
    const input = document.getElementById('promo-input');
    const code = input.value.trim();
    const tr = t();
    if (code.length < 4) return showToast(tr.promo_short, 'error');
    try {
        // с несколькими активными подписками бэкенд требует явный выбор → всегда передаём текущую
        const target = S.sub?.is_active ? S.sub.id : null;
        const r = await api.redeemPromocode(api.userId, code, target);
        input.value = '';
        let msg;
        if (r.deferred) msg = tr.promo_deferred;
        else if (r.amount_type === 'money') msg = `${tr.promo_ok} +${r.amount} ₽`;
        else if (r.amount_type === 'period') msg = `${tr.promo_ok} +${r.amount} ${tr.days_short}`;
        else msg = tr.promo_ok;
        showToast(msg, 'success', 4500);
        window.dispatchEvent(new Event('db-update'));
    } catch (e) {
        const map = { 404: tr.promo_na, 409: tr.promo_choose, 503: tr.promo_retry, 403: tr.promo_na };
        showToast(map[e.status] || e.message, 'error', 4500);
    }
}

// ── Клики (делегирование) ───────────────────────────────────────
window.addEventListener('click', (e) => {
    const btn = e.target.closest('button, a');
    if (!btn) return;
    e.stopPropagation();
    if (btn.disabled || btn.classList.contains('disabled')) return;

    if (btn.classList.contains('nav-btn')) { switchTab(btn.dataset.target); return; }
    if (btn.classList.contains('nav-btn-proxy')) { switchTab(btn.dataset.targetTab); return; }

    if (btn.id === 'theme-toggle-btn') { applyTheme(currentTheme === 'light' ? 'dark' : 'light'); return; }
    if (btn.id === 'lang-toggle-btn') {
        const langs = ['ru', 'en'];
        currentLang = langs[(langs.indexOf(currentLang) + 1) % langs.length];
        updateLanguage(currentLang);
        return;
    }
    if (btn.id === 'close-modal-btn') { closeModal(); return; }
    if (btn.classList.contains('open-link-delegate')) { openLink(decodeURI(btn.dataset.url)); return; }

    if (btn.id === 'pay-stars-btn')       { handleStarsPayment(btn); return; }
    if (btn.id === 'go-to-yoomoney-btn')  { handleYooMoneyPayment(btn); return; }
    if (btn.id === 'buy-wallet-btn')      { handleWalletBuy(btn); return; }

    if (btn.classList.contains('accordion-btn')) {
        btn.classList.toggle('active');
        document.getElementById(btn.dataset.target)?.classList.toggle('open');
        return;
    }

    if (isProcessing) { showToast(t().processing, 'info'); return; }

    const lockAction = async (actionFn) => {
        isProcessing = true;
        btn.classList.add('disabled');
        const orig = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        try { await actionFn(); }
        catch (err) { console.error(err); }
        finally {
            setTimeout(() => {
                isProcessing = false;
                btn.classList.remove('disabled');
                if (btn.isConnected) btn.innerHTML = orig;
            }, 1200);
        }
    };

    if (btn.classList.contains('tariff-btn-delegate')) {
        if (!S.authOk) return showToast(t().auth_needed, 'error');
        showPaymentModal(parseInt(btn.dataset.months));
    } else if (btn.id === 'start-trial-btn')   lockAction(startTrial);
    else if (btn.id === 'promo-btn')           lockAction(redeemPromo);
    else if (btn.id === 'copy-vless-btn')      lockAction(copyVlessLink);
    else if (btn.id === 'toggle-qr-btn')       toggleQrCode();
    else if (btn.id === 'copy-referral-btn') {
        lockAction(async () => {
            const link = document.getElementById('referral-link-display').textContent;
            if (tg?.openTelegramLink) {
                tg.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent('Попробуй PLUSVPN! 🔥')}`);
            } else {
                await copyText(link, t().link_copied);
            }
        });
    }
});

document.addEventListener('click', (e) => { if (e.target.id === 'payment-modal') closeModal(); });

document.addEventListener('change', async (e) => {
    if (e.target.id !== 'autodebit-toggle' || !S.sub) return;
    const el = e.target, want = el.checked;
    try {
        const upd = await api.setAutoDebit(S.sub.id, want);
        S.sub = { ...S.sub, ...upd };
        showToast(want ? t().autorenew_on : t().autorenew_off, 'success');
    } catch (err) {
        el.checked = !want;
        showToast(err.message, 'error');
    }
});

// ── Тема / язык / вкладки ───────────────────────────────────────
function applyTheme(theme) {
    currentTheme = theme;
    localStorage.setItem('plusvpn_theme', theme);
    if (theme === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
    else document.documentElement.removeAttribute('data-theme');
    const icon = document.querySelector('#theme-toggle-btn i');
    if (icon) icon.className = theme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
    const bg = theme === 'light' ? '#e9e1d6' : '#171512';
    try { tg?.setHeaderColor?.(bg); tg?.setBackgroundColor?.(bg); } catch (e) {}
}

function updateLanguage(lang) {
    localStorage.setItem('lang', lang);
    currentLang = lang;
    document.documentElement.lang = lang;
    document.querySelector('#lang-toggle-btn .lang-text').textContent = lang.toUpperCase();
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (TRANSLATIONS[lang]?.[key]) el.textContent = TRANSLATIONS[lang][key];
    });
    const promo = document.getElementById('promo-input');
    if (promo) promo.placeholder = TRANSLATIONS[lang].promo_ph || '';
    renderTariffs();
    renderInstructionButtons();
    if (S.authOk) { document.getElementById('start-trial-btn')?.closest('.trial-card')?.replaceChildren(); renderProfile(); }
}

function switchTab(targetId) {
    document.querySelectorAll('main section').forEach(s => s.classList.remove('active'));
    document.getElementById(targetId)?.classList.add('active');
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.querySelector(`.nav-btn[data-target="${targetId}"]`)?.classList.add('active');
}

// ── Утилиты ─────────────────────────────────────────────────────
window.openLink = (url) => { tg?.openLink ? tg.openLink(url) : window.open(url, '_blank'); };

async function copyText(text, msg) {
    if (!text || text.includes('...')) return;
    try {
        await navigator.clipboard.writeText(text);
    } catch {
        const el = document.createElement('textarea');
        el.value = text;
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
    }
    showToast(msg, 'success');
}

const LINK_RE = /^(https?|vless):\/\//i;      // теперь это ссылка подписки (https://…), реже — vless://

window.copyVlessLink = async () => {
    const text = (currentVlessKey || '').trim();
    if (!LINK_RE.test(text)) return showToast(t().key_inactive, 'error');
    await copyText(text, t().copied);
};

window.toggleQrCode = () => {
    const link = (currentVlessKey || '').trim();
    const qrDisplay = document.getElementById('qr-code-display');
    const qrPlaceholder = document.getElementById('qr-code-placeholder');
    const qrBtn = document.getElementById('toggle-qr-btn');

    if (qrDisplay.style.display === 'block') {
        qrDisplay.style.display = 'none';
        qrBtn.classList.remove('active-icon-btn');
        return;
    }
    if (!LINK_RE.test(link)) return showToast(t().key_inactive, 'error');
    if (!window.QRCode) return showToast('QR library not loaded', 'error');

    qrPlaceholder.innerHTML = '';
    new QRCode(qrPlaceholder, {
        text: link, width: 200, height: 200,
        colorDark: '#0b0f10', colorLight: '#ffffff', correctLevel: QRCode.CorrectLevel.M,
    });
    qrDisplay.style.display = 'block';
    qrBtn.classList.add('active-icon-btn');
};

window.generateReferralLink = () => {
    // Параметр /start — invite_code пользователя из API (ApiUser.invite_code)
    const code = S.user?.invite_code || (tgUser?.id ? `ref_${tgUser.id}` : '');
    document.getElementById('referral-link-display').textContent = `https://t.me/${BOT_USERNAME}?start=${code}`;
};

window.showToast = (msg, type = 'info', dur = 3000) => {
    const container = document.getElementById('toast-container-box');
    const toast = document.createElement('div');
    const icons = { success: 'fa-check-circle', error: 'fa-exclamation-circle', info: 'fa-info-circle' };
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<i class="fas ${icons[type] || icons.info}"></i> <span></span>`;
    toast.querySelector('span').textContent = msg;          // текст ошибок с сервера — не как HTML
    container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('toast-show'));
    setTimeout(() => {
        toast.classList.remove('toast-show');
        toast.addEventListener('transitionend', () => toast.remove(), { once: true });
    }, dur);
};
