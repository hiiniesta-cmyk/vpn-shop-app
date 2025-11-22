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
        // ОБНОВЛЕННЫЙ ТЕКСТ РЕФЕРАЛКИ (Пункт 5)
        referral_desc: "Отправь ссылку другу. Когда он купит подписку — вы ОБА получите +10 дней бонусом!",
        title_setup: "Подключение", subtitle_download: "Скачать приложение", subtitle_instructions: "Инструкции",
        modal_title: "Оплата подписки", modal_warning: "ВНИМАНИЕ! После оплаты ОБЯЗАТЕЛЬНО вернитесь в чат с ботом.",
        modal_pay_btn: "Перейти к оплате", modal_close_btn: "Закрыть",
        status_active: "Активна", status_inactive: "Неактивна", status_expired: "Истекла",
        trial_btn: "Активировать 3 дня бесплатно", trial_used: "Пробный период использован",
        month_1: "Мес.", month_few: "Мес.", month_many: "Мес.",
        key_active: "КЛЮЧ:", key_inactive: "Ключ появится после активации",
        renew_btn: "Продлить подписку",
        processing: "Обработка...",
        copied: "Скопировано!",
        link_copied: "Ссылка скопирована!",
        trial_success: "Пробный период активирован!",
        qr_btn: "QR-код", qr_title: "Сканируйте ключ", qr_note: "Используйте этот код в приложении для настройки."
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
        qr_btn: "QR Code", qr_title: "Scan the Key", qr_note: "Use this code in the app for setup."
    },
    // Можно добавить другие языки (de, fr) по аналогии
};

const DOWNLOAD_LINKS = {
    android: { name: 'Android', icon: 'fab fa-android', url: 'https://github.com/2dust/v2rayNG/releases/download/1.10.28/v2rayNG_1.10.28-fdroid_universal.apk' },
    ios: { name: 'iOS (V2RayTun)', icon: 'fab fa-apple', url: 'https://apps.apple.com/us/app/v2raytun/id6476628951' },
    windows: { name: 'Windows', icon: 'fab fa-windows', url: 'https://github.com/hiddify/hiddify-app/releases/download/v2.5.7/Hiddify-Windows-Setup-x64.exe' },
    androidtv: { name: 'Android TV', icon: 'fas fa-tv', url: 'https://github.com/2dust/v2rayNG/releases/download/1.10.28/v2rayNG_1.10.28-fdroid_universal.apk' }
};

// ОБНОВЛЕННЫЙ FAQ (Пункт 3)
const INSTRUCTION_LINKS = {
    android: {
        name: 'Android', icon: 'fab fa-android',
        html: `<h4>Настройка для Android</h4><ol><li>Скопируйте ваш ключ доступа на вкладке "Профиль".</li><li>Скачайте v2rayNG (кнопка выше).</li><li>Нажмите <b>+</b> -> "Импорт из буфера".</li><img src="https://shinobubest.github.io/web/resources/android/4.png" class="instruction-img"><li>Нажмите кнопку подключения (V) внизу.</li></ol>`
    },
    ios: {
        name: 'iOS', icon: 'fab fa-apple',
        html: `<h4>Настройка для iPhone</h4><ol><li>Скопируйте ключ.</li><li>Скачайте V2RayTun.</li><li>В приложении оно само предложит добавить ключ из буфера.</li><img src="https://shinobubest.github.io/web/resources/iphone/4.png" class="instruction-img"><li>Нажмите кнопку подключения.</li></ol>`
    },
    windows: {
        name: 'Windows', icon: 'fab fa-windows',
        html: `<h4>Настройка для Windows</h4><ol><li>Скопируйте ключ.</li><li>Установите Hiddify.</li><li>Нажмите "+ Новый профиль".</li><li>"Добавить из буфера".</li><img src="https://shinobubest.github.io/web/resources/win/4.png" class="instruction-img"><li>Нажмите большую кнопку "Connect".</li></ol>`
    },
    androidtv: {
        name: 'Android TV', icon: 'fas fa-tv',
        html: `<h4>Android TV</h4><ol><li>Передайте файл .apk на телевизор (через флешку или Send Files to TV).</li><li>Установите v2rayNG.</li><li>Используйте QR-код в профиле для сканирования камерой телефона (если приложение поддерживает) или импортируйте ключ вручную.</li></ol>`
    },
    faq: {
        name: 'Помощь (FAQ)', icon: 'fas fa-question-circle',
        html: `
            <h4>Частые вопросы</h4>
            <p><b>В: Низкая скорость?</b><br>О: Попробуйте отключить и включить VPN заново в приложении.</p>
            <p><b>В: Статус "Неактивна" после оплаты?</b><br>О: Подождите 5 минут. Если не помогло — напишите команду /start в боте.</p>
            <p><b>В: Можно на нескольких устройствах?</b><br>О: Да, один ключ можно использовать на 3-х устройствах.</p>
        `
    }
};
