// --- Configuration & State ---
let tg = null, telegramId = null, userId = null;
let currentLang = localStorage.getItem('lang') || 'ru';
let isProcessing = false; // Anti-spam lock

const YOOMONEY_RECIPIENT_ID = '4100119271147598';
const BOT_USERNAME = 'ShinobuProxyBot';
const TRIAL_DAYS = 3;
let API_BASE = localStorage.getItem('shinobu_api_base') || 'http://127.0.0.1:5000/api';

// --- Translations ---
const TRANSLATIONS = {
    ru: {
        tagline: "Ваша приватность — наш приоритет",
        nav_profile: "Профиль", nav_billing: "Оплата", nav_setup: "Настройка", nav_referral: "Рефералка",
        title_status: "Ваш Статус и Ключ", balance_label: "Ваш Баланс:", status_label: "Текущий статус:",
        expiry_label: "Дата истечения:", loading: "Загрузка", loading_key: "Загрузка ключа...", copy_btn: "Копировать",
        title_trial: "Пробный Период", title_tariffs: "Тарифы и Оплата",
        payment_warning: "ВНИМАНИЕ: После оплаты вернитесь в чат с ботом. Активация — до 5 минут.",
        title_referral: "Реферальная Программа", invited_text: "Приглашено:",
        // Updated Referral Text
        referral_desc: "Приглашайте друзей — +10 дней подписки тебе и другу!",
        title_setup: "Подключение", subtitle_download: "Скачать приложение", subtitle_instructions: "Инструкции",
        modal_title: "Оплата подписки", modal_warning: "ВНИМАНИЕ! После оплаты ОБЯЗАТЕЛЬНО вернитесь в чат с ботом.",
        modal_pay_btn: "Перейти к оплате", modal_close_btn: "Закрыть",
        status_active: "Активна", status_inactive: "Неактивна", status_expired: "Истекла",
        trial_btn: "Активировать 3 дня бесплатно", trial_used: "Пробный период использован",
        month_1: "месяц", month_few: "месяца", month_many: "месяцев",
        key_active: "КЛЮЧ:", key_inactive: "Ключ появится после активации",
        // New Translations
        renew_btn: "Продлить подписку",
        processing: "Обработка...",
        copied: "Скопировано!",
        link_copied: "Ссылка скопирована!",
        trial_success: "Пробный период активирован!",
        qr_btn: "QR-код", // NEW
        qr_title: "Сканируйте ключ", // NEW
        qr_note: "Используйте этот код в приложении для настройки." // NEW
    },
    en: {
        tagline: "Your privacy is our priority",
        nav_profile: "Profile", nav_billing: "Billing", nav_setup: "Setup", nav_referral: "Referral",
        title_status: "Your Status & Key", balance_label: "Your Balance:", status_label: "Current Status:",
        expiry_label: "Expiry Date:", loading: "Loading", loading_key: "Loading key...", copy_btn: "Copy",
        title_trial: "Trial Period", title_tariffs: "Tariffs & Payment",
        payment_warning: "ATTENTION: Return to the bot chat after payment. Activation takes up to 5 mins.",
        title_referral: "Referral Program", invited_text: "Invited:",
        referral_desc: "Invite friends — +10 days subscription for you and your friend!",
        title_setup: "Connection", subtitle_download: "Download App", subtitle_instructions: "Instructions",
        modal_title: "Subscription Payment", modal_warning: "ATTENTION! You MUST return to the bot chat after payment.",
        modal_pay_btn: "Proceed to Payment", modal_close_btn: "Close",
        status_active: "Active", status_inactive: "Inactive", status_expired: "Expired",
        trial_btn: "Activate 3 days for free", trial_used: "Trial period used",
        month_1: "month", month_few: "months", month_many: "months",
        key_active: "KEY:", key_inactive: "Key appears after activation",
        renew_btn: "Renew Subscription",
        processing: "Processing...",
        copied: "Copied!",
        link_copied: "Link copied!",
        trial_success: "Trial activated!",
        qr_btn: "QR Code", // NEW
        qr_title: "Scan the Key", // NEW
        qr_note: "Use this code in the app for setup." // NEW
    },
    de: {
        tagline: "Ihre Privatsphäre ist unsere Priorität",
        nav_profile: "Profil", nav_billing: "Zahlung", nav_setup: "Setup", nav_referral: "Empfehlung",
        title_status: "Ihr Status & Schlüssel", balance_label: "Ihr Guthaben:", status_label: "Aktueller Status:",
        expiry_label: "Ablaufdatum:", loading: "Laden", loading_key: "Lade Schlüssel...", copy_btn: "Kopieren",
        title_trial: "Probezeit", title_tariffs: "Tarife & Zahlung",
        payment_warning: "ACHTUNG: Kehren Sie nach der Zahlung zum Bot-Chat zurück. Aktivierung bis zu 5 Min.",
        title_referral: "Empfehlungsprogramm", invited_text: "Eingeladen:",
        referral_desc: "Lade Freunde ein – +10 Tage für dich und deinen Freund!",
        title_setup: "Verbindung", subtitle_download: "App herunterladen", subtitle_instructions: "Anleitungen",
        modal_title: "Abonnementzahlung", modal_warning: "ACHTUNG! Nach der Zahlung MÜSSEN Sie zum Bot zurückkehren.",
        modal_pay_btn: "Zur Zahlung", modal_close_btn: "Schließen",
        status_active: "Aktiv", status_inactive: "Abgelaufen", status_expired: "Abgelaufen",
        trial_btn: "3 Tage kostenlos aktivieren", trial_used: "Probezeit genutzt",
        month_1: "Monat", month_few: "Monate", month_many: "Monate",
        key_active: "SCHLÜSSEL:", key_inactive: "Schlüssel erscheint nach Aktivierung",
        renew_btn: "Abonnement verlängern",
        processing: "Verarbeitung...",
        copied: "Kopiert!",
        link_copied: "Link kopiert!",
        trial_success: "Probezeit aktiviert!",
        qr_btn: "QR-Code", // NEW
        qr_title: "Schlüssel scannen", // NEW
        qr_note: "Verwenden Sie diesen Code in der App zur Einrichtung." // NEW
    },
    fr: {
        tagline: "Votre vie privée est notre priorité",
        nav_profile: "Profil", nav_billing: "Paiement", nav_setup: "Config", nav_referral: "Parrainage",
        title_status: "Votre Statut & Clé", balance_label: "Votre Solde:", status_label: "Statut Actuel:",
        expiry_label: "Date d'expiration:", loading: "Chargement", loading_key: "Clé en chargement...", copy_btn: "Copier",
        title_trial: "Période d'essai", title_tariffs: "Tarifs et Paiement",
        payment_warning: "ATTENTION : Retournez au chat bot après paiement. Activation sous 5 min.",
        title_referral: "Programme de Parrainage", invited_text: "Invité:",
        referral_desc: "Invitez des amis — +10 jours pour vous et votre ami !",
        title_setup: "Connexion", subtitle_download: "Télécharger l'app", subtitle_instructions: "Instructions",
        modal_title: "Paiement de l'abonnement", modal_warning: "ATTENTION ! Retournez IMPÉRATIVEMENT au bot après paiement.",
        modal_pay_btn: "Procéder au paiement", modal_close_btn: "Fermer",
        status_active: "Actif", status_inactive: "Inactif", status_expired: "Expiré",
        trial_btn: "Activer 3 jours gratuits", trial_used: "Essai déjà utilisé",
        month_1: "mois", month_few: "mois", month_many: "mois",
        key_active: "CLÉ:", key_inactive: "La clé apparaît après activation",
        renew_btn: "Renouveler l'abonnement",
        processing: "Traitement...",
        copied: "Copié!",
        link_copied: "Lien copié !",
        trial_success: "Essai activé!",
        qr_btn: "Code QR", // NEW
        qr_title: "Scanner la clé", // NEW
        qr_note: "Utilisez ce code dans l'application pour la configuration." // NEW
    }
};

const DOWNLOAD_LINKS = {
    android: { name: 'Android', icon: 'fab fa-android', url: 'https://github.com/2dust/v2rayNG/releases/download/1.10.28/v2rayNG_1.10.28-fdroid_universal.apk' },
    ios: { name: 'iOS (V2RayTun)', icon: 'fab fa-apple', url: 'https://apps.apple.com/us/app/v2raytun/id6476628951' },
    windows: { name: 'Windows', icon: 'fab fa-windows', url: 'https://github.com/hiddify/hiddify-app/releases/download/v2.5.7/Hiddify-Windows-Setup-x64.exe' },
    androidtv: { name: 'Android TV', icon: 'fas fa-tv', url: 'https://github.com/2dust/v2rayNG/releases/download/1.10.28/v2rayNG_1.10.28-fdroid_universal.apk' }
};

// !!! ЗДЕСЬ НАСТРОЕНЫ 5 ФОТО ДЛЯ КАЖДОЙ ИНСТРУКЦИИ !!!
const INSTRUCTION_LINKS = {
    android: {
        name: 'Android',
        icon: 'fab fa-android',
        html: `
                    <h4>Настройка для Android (v2rayNG)</h4>
                    <ol>
                        <li>Скопируйте ваш ключ доступа на вкладке "Профиль".</li>
                        <li>Скачайте приложение нажатием на кнопку <b>Android</b> (кнопка выше).</li>
                        
                        <li>Откройте приложение и нажмите <b>+</b> (или иконку меню).</li>
                        
                        <img src="https://shinobubest.github.io/web/resources/android/3.png" class="instruction-img" alt="Шаг 2">
                        
                        <li>Выберите "Импорт из буфера обмена".</li>
                        
                        <img src="https://shinobubest.github.io/web/resources/android/4.png" class="instruction-img" alt="Шаг 3">
                        
                        <li>Нажмите кнопку <b>►</b> (подключиться) внизу.</li>
                        
                        <img src="https://shinobubest.github.io/web/resources/android/5.png" class="instruction-img" alt="Шаг 5">
                    </ol>`
    },
    ios: {
        name: 'iOS',
        icon: 'fab fa-apple',
        html: `
                    <h4>Настройка для iPhone (V2RayTun)</h4>
                    <ol>
                        <li>Скопируйте ваш ключ доступа на вкладке "Профиль".</li>
                        
                        <li>Скачайте приложение нажатием на кнопку <b>IOS(V2RayTun)</b>.</li>
                        
                        <li>В правом верхнем углу приложения нажмите <b>+</b> .</li>
                        
                        <img src="https://shinobubest.github.io/web/resources/iphone/3.png" class="instruction-img" alt="Шаг 3">

                        <li>Выберите "Добавить из буфера".</li>
                        
                        <img src="https://shinobubest.github.io/web/resources/iphone/4.png" class="instruction-img" alt="Шаг 4">

                        <li>В центре нажмите на кнопку.</li>
                        
                        <img src="https://shinobubest.github.io/web/resources/iphone/5.png" class="instruction-img" alt="Шаг 5">
                    </ol>`
    },
    windows: {
        name: 'Windows',
        icon: 'fab fa-windows',
        html: `
                    <h4>Настройка для Windows (Hiddify)</h4>
                    <ol>
						<li>Скопируйте ваш ключ доступа на вкладке "Профиль".</li>
                        
						<li>Скачайте приложение нажатием на кнопку и установите (кнопка выше) <b>Windows</b>.</li>
                        
                        <li>Откройте программу, нажмите "Новый профиль" или "+".</li>
                        
                        <img src="https://shinobubest.github.io/web/resources/win/3.png" class="instruction-img" alt="Шаг 3">

                        <li>Выберите "Добавить из буфера обмена".</li>
                        
                        <img src="https://shinobubest.github.io/web/resources/win/4.png" class="instruction-img" alt="Шаг 4">

                        <li>Нажмите большую кнопку подключения по центру.</li>
                    </ol>`
    },
    androidtv: {
        name: 'Android TV',
        icon: 'fas fa-tv',
        html: `
                    <h4>Android TV</h4>
                    <ol>
                        <li>Скачайте приложение на Android(кнопка выше) и еще установите Send Files to TV из Google Play .</li>
                        <li>Откройте на андроид смартфоне "Проводник" или Файловый менеджер и найдите скачанный файл v2rayNG.apk и "скриншот QR-кода" и нажмите кнопку поделиться и из предложенного списка приложений найдите иконку приложения Send files to TV.</li>
                        <img src="https://shinobubest.github.io/web/resources/atv/2.png" class="instruction-img">
                        <li>На телевизоре запустите приложение Send Files to TV (приложение запросит разрешение на доступ к фото и видео - нажмите Разрешить).</li>
						<li>На андроид смартфоне выберите вашу приставку, на телевизоре подтвердите скачивание и приложение отправится на Android TV.</li>
                        <img src="https://shinobubest.github.io/web/resources/atv/3.png" class="instruction-img">
                        <li>Теперь вы можете открыть Файловый менеджер (File Manager+) и в загрузках найдите приложение v2rayNG.apk, установите его и зайдите в приложение.</li>
						<li>В правом верхнем углу приложения нажмите «+» → выберите пункт «Импорт из QR-кода».</li>
                        <img src="https://shinobubest.github.io/web/resources/atv/4.png" class="instruction-img">
						<img src="https://shinobubest.github.io/web/resources/atv/5.png" class="instruction-img">
						<li>Теперь вы должны нажать на иконку "Изображение" в правом верхнем углу.</li>
						<img src="https://shinobubest.github.io/web/resources/atv/6.png" class="instruction-img">
						<li>Внизу приложения нажмите «Запуск» и подтвердите разрешение на использование VPN-подключения.</li>
						<img src="https://shinobubest.github.io/web/resources/atv/7.png" class="instruction-img">
                    </ol>`
    },
    faq: {
        name: 'FAQ',
        icon: 'fas fa-lightbulb',
        html: `
                    <h4>Частые вопросы</h4>
                    <p><b>В: Низкая скорость?</b><br>О: Попробуйте переподключиться (выкл/вкл).</p>
                    <p><b>В: Не подключается?</b><br>О: Проверьте, не истекла ли подписка в боте.</p>
                `
    }
};

const TARIFFS = [
    { months: 1, price: 103.10 },
    { months: 2, price: 206.19 },
    { months: 3, price: 309.28 },
    { months: 6, price: 618.56 }
];

// --- Firebase Mock ---
window.firestore = {
    doc: () => ({}),
    getDoc: async () => {
        try {
            const res = await fetch(`${API_BASE}/user/${userId}`);
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            const data = await res.json();
            return { exists: () => !!data.vless_key || !!data.subscription_expiry, data: () => data };
        } catch (error) {
            console.error("API Error:", error);
            return { exists: () => false, data: () => ({}) };
        }
    },
    setDoc: async (ref, data, { merge } = {}) => {
        try {
            if (data.action === 'activate_trial' && isProcessing) return;
            const payload = data.trial_used && data.status === 'active' ? { action: 'activate_trial' } : { ...data, telegramId };
            const res = await fetch(`${API_BASE}/user/${userId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            window.dispatchEvent(new Event('db-update'));
        } catch (error) {
            console.error("API Push Error:", error);
            showToast('Network error.', 'error');
            throw error;
        }
    },
    onSnapshot: (ref, callback) => {
        let isCancelled = false;
        const poll = async () => {
            if (isCancelled) return;
            const docSnap = await window.firestore.getDoc();
            callback(docSnap);
            if (!isCancelled) setTimeout(poll, 5000);
        };
        poll();
        const updateListener = () => { if (!isCancelled) poll(); };
        window.addEventListener('db-update', updateListener);
        return () => { isCancelled = true; window.removeEventListener('db-update', updateListener); };
    }
};

// --- Initialization ---
window.addEventListener('load', () => {
    if (window.Telegram?.WebApp) {
        tg = window.Telegram.WebApp;
        tg.ready();
        tg.expand();
    }

    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light' || (!savedTheme && window.matchMedia('(prefers-color-scheme: light)').matches)) {
        document.body.classList.add('light-theme');
        document.querySelector('.theme-icon').innerHTML = '<i class="fas fa-sun"></i>';
    }

    updateLanguage(currentLang);

    userId = localStorage.getItem('shinobu_user_id') || 'local_' + Math.random().toString(36).substr(2, 9);
    telegramId = tg?.initDataUnsafe?.user?.id || 'DEV_USER';
    if (telegramId === 'DEV_USER') localStorage.setItem('shinobu_user_id', userId);
    else userId = String(telegramId);

    let userFirstName = 'User';
    let userLastName = '';
    let userUsername = 'None';

    if (tg?.initDataUnsafe?.user) {
        const user = tg.initDataUnsafe.user;
        userFirstName = user.first_name || 'User';
        userLastName = user.last_name || '';
        userUsername = user.username ? `@${user.username}` : 'None';

        const initials = (userFirstName[0] + (userLastName ? userLastName[0] : '')).toUpperCase().trim();
        const avatarPlaceholder = document.getElementById('user-avatar-placeholder');
        if (initials) avatarPlaceholder.textContent = initials;
    }

    document.getElementById('telegram-id-display').textContent = telegramId;
    document.getElementById('user-full-name').textContent = `${userFirstName} ${userLastName}`.trim();
    document.getElementById('username-display').textContent = userUsername;

    renderTariffs();
    renderDownloadButtons();
    renderInstructionButtons();
    generateReferralLink();
    window.startSubscriptionListener();
    switchTab('profile');
});

// --- Event Delegation (Anti-Spam & Logic) ---
window.addEventListener('click', (e) => {
    const btn = e.target.closest("button, a");
    if (!btn) return;

    e.stopPropagation();
    if (btn.disabled || btn.classList.contains('disabled')) return;

    // 1. Navigation
    if (btn.classList.contains('nav-btn')) {
        switchTab(btn.dataset.target);
        return;
    }

    // 2. Special Navigation (Renew Button)
    if (btn.classList.contains('nav-btn-proxy')) {
        switchTab(btn.dataset.targetTab);
        return;
    }

    // 3. Controls
    if (btn.id === 'lang-toggle-btn') {
        const langs = ['ru', 'en', 'de', 'fr'];
        let idx = langs.indexOf(currentLang);
        currentLang = langs[(idx + 1) % langs.length];
        updateLanguage(currentLang);
        return;
    }
    if (btn.id === 'theme-toggle-btn') {
        toggleTheme();
        return;
    }
    if (btn.id === 'close-modal-btn') {
        document.getElementById('payment-modal').style.display = 'none';
        return;
    }
    if (btn.classList.contains('open-link-delegate')) {
        openLink(btn.dataset.url);
        return;
    }
    if (btn.id === 'go-to-yoomoney-btn') {
        openLink(btn.dataset.url);
        document.getElementById('payment-modal').style.display = 'none';
        return;
    }

    // 4. Инструкции (Аккордеон)
    if (btn.classList.contains('accordion-btn')) {
        const contentId = btn.dataset.target;
        const content = document.getElementById(contentId);

        btn.classList.toggle('active');
        content.classList.toggle('open');
        return;
    }

    // --- CRITICAL ACTIONS WITH LOADING STATE ---

    if (isProcessing) {
        showToast(TRANSLATIONS[currentLang].processing, 'info');
        return;
    }

    // Helper for async actions with spinner
    const lockAction = async (actionFn, loadingTextKey = 'processing') => {
        isProcessing = true;
        btn.classList.add('disabled');
        const originalContent = btn.innerHTML;

        // Set spinner and localized text
        const loadingText = TRANSLATIONS[currentLang][loadingTextKey] || 'Processing...';
        btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${loadingText}`;

        try {
            await actionFn();
        } catch (err) {
            console.error(err);
        } finally {
            setTimeout(() => {
                isProcessing = false;
                btn.classList.remove('disabled');
                btn.innerHTML = originalContent;
            }, 1000);
        }
    };

    if (btn.classList.contains('tariff-btn-delegate')) {
        const months = parseInt(btn.dataset.months);
        const price = parseFloat(btn.dataset.price);
        showPaymentModal(months, price);
    } else if (btn.id === 'start-trial-btn') {
        lockAction(startTrial, 'processing');
    } else if (btn.id === 'copy-vless-btn') {
        lockAction(copyVlessLink, 'processing');
    } else if (btn.id === 'toggle-qr-btn') { // NEW: Handle QR toggle button
        toggleQrCode();
    } else if (btn.id === 'copy-referral-btn') {
        lockAction(async () => {
            const link = document.getElementById('referral-link-display').textContent;
            await copyText(link, TRANSLATIONS[currentLang].link_copied);
        }, 'processing');
    } else if (btn.id === 'reset-data-btn') {
        lockAction(resetUserData);
    }
});

// --- Core Functions ---

function updateLanguage(lang) {
    localStorage.setItem('lang', lang);
    currentLang = lang;
    document.documentElement.lang = lang;
    document.querySelector('#lang-toggle-btn .lang-text').textContent = lang.toUpperCase();

    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (TRANSLATIONS[lang][key]) {
            el.textContent = TRANSLATIONS[lang][key];
        }
    });

    renderTariffs();
    window.dispatchEvent(new Event('db-update'));
}

function switchTab(targetId) {
    document.querySelectorAll('main section').forEach(s => s.classList.remove('active'));
    document.getElementById(targetId)?.classList.add('active');
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.querySelector(`.nav-btn[data-target="${targetId}"]`)?.classList.add('active');
}

function toggleTheme() {
    document.body.classList.toggle('light-theme');
    const isLight = document.body.classList.contains('light-theme');
    document.querySelector('.theme-icon').innerHTML = isLight ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
}

window.showPaymentModal = (months, price) => {
    if (telegramId === 'DEV_USER') return showToast('Run in Telegram to pay', 'error');

    const comment = `Pay_${months}m_${telegramId}`;
    const yoomoneyUrl = `https://yoomoney.ru/quickpay/confirm.xml?receiver=${YOOMONEY_RECIPIENT_ID}&quickpay-form=shop&targets=Shinobu+${months}m&sum=${price.toFixed(2)}&comment=${encodeURIComponent(comment)}&paymentType=AC`;

    const t = TRANSLATIONS[currentLang];
    const monthLabel = months === 1 ? t.month_1 : (months < 5 ? t.month_few : t.month_many);

    document.getElementById('modal-tariff-info').innerHTML = `
                <p><strong>${t.month_1 === 'месяц' ? 'Срок' : 'Period'}:</strong> ${months} ${monthLabel}</p>
                <p><strong>${t.balance_label}</strong> <span style="font-size: 1.2em; font-weight: bold;">${price.toFixed(2)} ₽</span></p>
                <p><strong>ID:</strong> ${telegramId}</p>
            `;

    document.getElementById('go-to-yoomoney-btn').dataset.url = yoomoneyUrl;
    document.getElementById('payment-modal').style.display = 'flex';
}

window.startTrial = async () => {
    await window.firestore.setDoc(null, { status: 'active', trial_used: true }, { merge: true });
    showToast(TRANSLATIONS[currentLang].trial_success, 'success');
};

window.openLink = (url) => {
    tg?.openLink ? tg.openLink(url) : window.open(url, '_blank');
};

window.resetUserData = async () => {
    if (telegramId !== 'DEV_USER') return showToast('DEV ONLY', 'error');
    await fetch(`${API_BASE}/user/${userId}`, { method: 'DELETE' });
    showToast('Data reset', 'info');
    window.dispatchEvent(new Event('db-update'));
};

async function copyText(text, msg) {
    if (!text || text.includes('...')) return;
    try {
        await navigator.clipboard.writeText(text);
        showToast(msg, 'success');
    } catch (err) {
        const el = document.createElement('textarea');
        el.value = text;
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
        showToast(msg, 'success');
    }
}

window.copyVlessLink = async () => {
    const text = document.getElementById('vless-link-display').textContent.replace(/.*: /, '').trim();
    const t = TRANSLATIONS[currentLang];
    if (text.includes('...')) return showToast(t.loading, 'error');
    await copyText(text, t.copied);
};

// NEW: QR Code generation function
window.toggleQrCode = () => {
    const vlessLink = document.getElementById('vless-link-display').textContent.replace(/.*: /, '').trim();
    const qrDisplay = document.getElementById('qr-code-display');
    const qrPlaceholder = document.getElementById('qr-code-placeholder');
    const qrBtn = document.getElementById('toggle-qr-btn');
    const t = TRANSLATIONS[currentLang];

    // Hide if already visible
    if (qrDisplay.style.display === 'block') {
        qrDisplay.style.display = 'none';
        qrBtn.classList.remove('btn-primary');
        return;
    }

    // Check if key is loaded
    if (vlessLink.includes('...')) {
        showToast(t.key_inactive, 'error');
        return;
    }

    // Generate QR Code URL using Google Charts API (200x200)
    const qrCodeUrl = `https://chart.googleapis.com/chart?chs=200x200&cht=qr&chl=${encodeURIComponent(vlessLink)}`;

    qrPlaceholder.innerHTML = `<img src="${qrCodeUrl}" alt="QR Code" style="width: 200px; height: 200px; border-radius: 8px; border: 4px solid #7b2cbf; display: block; margin: 0 auto; box-shadow: 0 0 10px rgba(0, 212, 255, 0.5);">`;

    // Show the QR code block
    qrDisplay.style.display = 'block';
    qrBtn.classList.add('btn-primary');
};

window.generateReferralLink = () => {
    const link = `https://t.me/${BOT_USERNAME}?start=ref_${telegramId}`;
    document.getElementById('referral-link-display').textContent = link;
};

function renderTariffs() {
    const t = TRANSLATIONS[currentLang];
    const grid = document.getElementById('tariff-grid');
    grid.innerHTML = TARIFFS.map((tariff) => {
        const mLabel = tariff.months === 1 ? t.month_1 : (tariff.months < 5 ? t.month_few : t.month_many);
        return `
                <div class="tariff-card">
                    <button class="btn tariff-btn tariff-btn-delegate" data-months="${tariff.months}" data-price="${tariff.price}">
                        <i class="fas fa-calendar"></i>
                        ${tariff.months} ${mLabel}
                        <span style="font-weight: bold; font-size: 1.1em; margin-left:auto;">${tariff.price.toFixed(0)} ₽</span>
                    </button>
                </div>`;
    }).join('');
}

function renderDownloadButtons() {
    document.getElementById('download-grid').innerHTML = Object.values(DOWNLOAD_LINKS).map(i => `
                <button class="btn download-btn open-link-delegate" data-url="${i.url}">
                    <i class="${i.icon}"></i> ${i.name}
                </button>`).join('');
}

function renderInstructionButtons() {
    const container = document.getElementById('instructions-grid');
    container.className = '';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = '15px';

    container.innerHTML = Object.keys(INSTRUCTION_LINKS).map(key => {
        const i = INSTRUCTION_LINKS[key];
        return `
                <div class="instruction-wrapper">
                    <button class="btn accordion-btn" style="width: 100%; justify-content: space-between;" data-target="inst-${key}">
                        <span><i class="${i.icon}"></i> ${i.name}</span>
                        <i class="fas fa-chevron-down accordion-icon"></i>
                    </button>
                    <div id="inst-${key}" class="instruction-content">
                        ${i.html}
                    </div>
                </div>`;
    }).join('');
}

// --- Live Updates & Subscription Logic ---
window.startSubscriptionListener = async function () {
    const indicator = document.getElementById('status-indicator');
    const info = document.getElementById('status-info');
    const vlessDisplay = document.getElementById('vless-link-display');
    const trialCard = document.getElementById('trial-card-status');
    const renewContainer = document.getElementById('renew-container');
    const qrBtn = document.getElementById('toggle-qr-btn');

    const handleSnapshot = (docSnap) => {
        const data = docSnap.data();
        const t = TRANSLATIONS[currentLang];

        const balance = data.balance ? parseFloat(data.balance).toFixed(2) : '0.00';
        document.getElementById('user-balance-display').textContent = `${balance} ₽`;

        const expiryTime = Number(data.subscription_expiry) * 1000;
        const now = Date.now();
        const isActive = data.vless_key && data.subscription_expiry && expiryTime > now;

        const daysLeft = isActive ? Math.ceil((expiryTime - now) / (1000 * 60 * 60 * 24)) : 0;

        if (!isActive || daysLeft < 5) {
            renewContainer.style.display = 'block';
        } else {
            renewContainer.style.display = 'none';
        }

        if (!data.vless_key) {
            indicator.textContent = t.status_inactive; indicator.className = 'status-indicator status-inactive';
            info.innerHTML = `<p>${t.expiry_label} -</p>`;
            vlessDisplay.innerHTML = `<span style="color: #7b2cbf;">${t.key_inactive}</span>`;
            if (qrBtn) qrBtn.disabled = true; // NEW: Disable QR button
        } else if (isActive) {
            const date = new Date(expiryTime);
            const formatted = date.toLocaleDateString(currentLang, { year: 'numeric', month: 'long', day: 'numeric' });

            if (daysLeft < 5) {
                indicator.textContent = `${t.status_active} (< 5 days)`;
                indicator.className = 'status-indicator status-warning';
            } else {
                indicator.textContent = t.status_active;
                indicator.className = 'status-indicator status-active';
            }

            info.innerHTML = `<p>${t.expiry_label} <span id="expiry-date">${formatted}</span></p>`;
            vlessDisplay.innerHTML = `<strong>${t.key_active}</strong> ${data.vless_key}`;
            if (qrBtn) qrBtn.disabled = false; // NEW: Enable QR button
        } else {
            indicator.textContent = t.status_expired; indicator.className = 'status-indicator status-inactive';
            info.innerHTML = `<p>${t.expiry_label} ${t.status_expired}</p>`;
            vlessDisplay.innerHTML = `<strong>${t.key_active}</strong> ${data.vless_key}`;
            if (qrBtn) qrBtn.disabled = false; // NEW: Enable QR button
        }

        if (data.trial_used) {
            trialCard.innerHTML = `
                        <p style="color: #38a169; font-weight: bold; margin-bottom: 15px;"><i class="fas fa-check-circle"></i> ${t.trial_used}.</p>
                        ${telegramId === 'DEV_USER' ? `<button class="btn" id="reset-data-btn" style="background:#9b2c32;margin-top:10px;">RESET (DEV)</button>` : ''}
                    `;
        } else {
            trialCard.innerHTML = `<button class="btn btn-primary" id="start-trial-btn"><i class="fas fa-gift"></i> ${t.trial_btn}</button>`;
        }

        window.updateReferralUI(data.invited_count || 0);
    };
    window.firestore.onSnapshot(null, handleSnapshot);
};

window.updateReferralUI = (count) => {
    const t = TRANSLATIONS[currentLang];
    document.getElementById('invited-count-display').innerHTML = `${t.invited_text} <strong>${count}</strong>`;
};

// --- Enhanced Toast ---
window.showToast = (msg, type = 'info', dur = 3000) => {
    const container = document.getElementById('toast-container-box');
    const toast = document.createElement('div');

    let icon = '<i class="fas fa-info-circle"></i>';
    let className = 'toast-info';

    if (type === 'success') {
        icon = '<i class="fas fa-check-circle"></i>';
        className = 'toast-success';
    } else if (type === 'error') {
        icon = '<i class="fas fa-exclamation-circle"></i>';
        className = 'toast-error';
    }

    toast.className = `toast ${className}`;
    toast.innerHTML = `${icon} <span>${msg}</span>`;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(20px)';
        toast.style.transition = 'all 0.3s ease';
        toast.addEventListener('transitionend', () => toast.remove());
    }, dur);
};