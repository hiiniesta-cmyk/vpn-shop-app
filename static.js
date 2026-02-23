// --- Translations ---
const TRANSLATIONS = {
    ru: {
        tagline: "Ваша приватность — наш приоритет",
        nav_profile: "Профиль", nav_billing: "Тарифы", nav_setup: "Настройка", nav_referral: "Рефералка",
        title_status: "Ваш Статус", balance_label: "Баланс:", status_label: "Статус:",
        expiry_label: "Истекает:", loading: "Загрузка", loading_key: "Ключ появится после активации", copy_btn: "Копировать",
        title_trial: "Пробный Период", title_tariffs: "Тарифы",
        billing_subtitle: "Выберите план — оплата через Telegram Stars ⭐ или ЮMoney",
        pm_title: "Способы оплаты",
        payment_warning: "Stars: мгновенная выдача ключа. ЮMoney: активация до 5 минут через бота.",
        title_referral: "Реферальная Программа", invited_text: "Приглашено", bonus_days_label: "Бонус дней",
        referral_desc: "Отправь ссылку другу. Когда он купит подписку — вы ОБА получите +10 дней бонусом!",
        share_ref_btn: "Поделиться ссылкой",
        title_setup: "Подключение", subtitle_download: "Скачать приложение", subtitle_instructions: "Инструкции",
        modal_title: "Оплата подписки",
        modal_warning: "Stars — мгновенная выдача ключа автоматически. ЮMoney — до 5 минут через бота.",
        modal_pay_btn: "Оплатить ЮMoney", pay_stars_btn: "Оплатить Stars", modal_close_btn: "Закрыть",
        status_active: "Активна", status_inactive: "Неактивна", status_expired: "Истекла",
        trial_btn: "Активировать 3 дня бесплатно", trial_used: "Пробный период уже использован",
        month_1: "мес.", month_few: "мес.", month_many: "мес.",
        key_label: "Ваш ключ", key_active: "КЛЮЧ:", key_inactive: "Ключ появится после активации",
        renew_btn: "Продлить подписку",
        processing: "Обработка...",
        copied: "Скопировано!", link_copied: "Ссылка скопирована!",
        trial_success: "Пробный период активирован!",
        qr_btn: "QR-код", qr_title: "Сканируйте ключ", qr_note: "Используйте этот код в приложении.",
        save: "Популярный", best: "Лучшая цена", discount: "Скидка",
        days_left: "Осталось дней:",
        stars_paid_success: "Оплата Stars прошла! Ключ выдаётся...",
        stars_paid_error: "Ошибка оплаты Stars. Попробуйте снова."
    },
    en: {
        tagline: "Your privacy is our priority",
        nav_profile: "Profile", nav_billing: "Plans", nav_setup: "Setup", nav_referral: "Referral",
        title_status: "Your Status", balance_label: "Balance:", status_label: "Status:",
        expiry_label: "Expires:", loading: "Loading", loading_key: "Key appears after activation", copy_btn: "Copy",
        title_trial: "Trial Period", title_tariffs: "Plans",
        billing_subtitle: "Choose a plan — pay via Telegram Stars ⭐ or YooMoney",
        pm_title: "Payment methods",
        payment_warning: "Stars: instant key delivery. YooMoney: activation up to 5 minutes via bot.",
        title_referral: "Referral Program", invited_text: "Invited", bonus_days_label: "Bonus days",
        referral_desc: "Invite a friend. When they subscribe — you BOTH get +10 bonus days!",
        share_ref_btn: "Share link",
        title_setup: "Connection", subtitle_download: "Download App", subtitle_instructions: "Instructions",
        modal_title: "Subscription Payment",
        modal_warning: "Stars — instant key. YooMoney — up to 5 minutes via bot.",
        modal_pay_btn: "Pay via YooMoney", pay_stars_btn: "Pay with Stars", modal_close_btn: "Close",
        status_active: "Active", status_inactive: "Inactive", status_expired: "Expired",
        trial_btn: "Activate 3 free days", trial_used: "Trial already used",
        month_1: "mo.", month_few: "mo.", month_many: "mo.",
        key_label: "Your key", key_active: "KEY:", key_inactive: "Key appears after activation",
        renew_btn: "Renew Subscription",
        processing: "Processing...",
        copied: "Copied!", link_copied: "Link copied!",
        trial_success: "Trial activated!",
        qr_btn: "QR Code", qr_title: "Scan the Key", qr_note: "Use this code in the app for setup.",
        save: "Popular", best: "Best price", discount: "Discount",
        days_left: "Days left:",
        stars_paid_success: "Stars payment successful! Getting your key...",
        stars_paid_error: "Stars payment failed. Please try again."
    }
};

// --- Tariffs with Stars pricing ---
// 1 Star ≈ 0.013 USD ≈ ~1.3 RUB (approximate)
// Adjust STARS_PER_MONTH to your real rate
const TARIFFS = [
    {
        id: 'month_1',
        months: 1,
        price: 103.10,
        stars: 80,
        badge: null,
        discountPct: 0,
        features: ['Безлимитный трафик', 'VLESS протокол', 'Поддержка 24/7']
    },
    {
        id: 'month_3',
        months: 3,
        price: 279.00,
        stars: 215,
        badge: 'save',        // Popular
        discountPct: 10,
        features: ['Безлимитный трафик', 'VLESS протокол', 'Поддержка 24/7', '10% скидка']
    },
    {
        id: 'month_6',
        months: 6,
        price: 495.00,
        stars: 380,
        badge: null,
        discountPct: 20,
        features: ['Безлимитный трафик', 'VLESS протокол', 'Поддержка 24/7', '20% скидка']
    },
    {
        id: 'month_12',
        months: 12,
        price: 825.00,
        stars: 635,
        badge: 'best',        // Best price
        discountPct: 33,
        features: ['Безлимитный трафик', 'VLESS протокол', 'Поддержка 24/7', 'Приоритетная поддержка', '33% скидка']
    }
];

const DOWNLOAD_LINKS = {
    android: { name: 'Android', icon: 'fab fa-android', url: 'https://github.com/v2fly/v2rayNG/releases' },
    ios:     { name: 'iOS (V2RayTun)', icon: 'fab fa-apple', url: 'https://apps.apple.com/app/v2raytun/id6444857502' },
    windows: { name: 'Windows (Hiddify)', icon: 'fab fa-windows', url: 'https://hiddify.com/download' },
    mac:     { name: 'macOS', icon: 'fab fa-apple', url: 'https://github.com/v2rayA/v2rayA/releases' },
};

const INSTRUCTION_LINKS = {
    android: {
        name: 'Android',
        icon: 'fab fa-android',
        html: `
            <h4>Настройка для Android (v2rayNG)</h4>
            <ol>
                <li>Скопируйте ваш ключ на вкладке «Профиль».</li>
                <li>Скачайте и установите <b>v2rayNG</b>.</li>
                <li>Нажмите <b>+</b> → «Импорт из буфера обмена».</li>
                <img src="https://shinobubest.github.io/web/resources/android/3.png" class="instruction-img" alt="Шаг 3">
                <img src="https://shinobubest.github.io/web/resources/android/4.png" class="instruction-img" alt="Шаг 4">
                <li>Нажмите кнопку <b>►</b> внизу для подключения.</li>
                <img src="https://shinobubest.github.io/web/resources/android/5.png" class="instruction-img" alt="Шаг 5">
            </ol>`
    },
    ios: {
        name: 'iOS (V2RayTun)',
        icon: 'fab fa-apple',
        html: `
            <h4>Настройка для iPhone (V2RayTun)</h4>
            <ol>
                <li>Скопируйте ваш ключ на вкладке «Профиль».</li>
                <li>Скачайте <b>V2RayTun</b> из App Store.</li>
                <li>Нажмите <b>+</b> в правом верхнем углу → «Добавить из буфера».</li>
                <img src="https://shinobubest.github.io/web/resources/iphone/3.png" class="instruction-img" alt="Шаг 3">
                <img src="https://shinobubest.github.io/web/resources/iphone/4.png" class="instruction-img" alt="Шаг 4">
                <li>Нажмите кнопку подключения в центре.</li>
                <img src="https://shinobubest.github.io/web/resources/iphone/5.png" class="instruction-img" alt="Шаг 5">
            </ol>`
    },
    windows: {
        name: 'Windows (Hiddify)',
        icon: 'fab fa-windows',
        html: `
            <h4>Настройка для Windows (Hiddify)</h4>
            <ol>
                <li>Скопируйте ваш ключ на вкладке «Профиль».</li>
                <li>Скачайте и установите <b>Hiddify</b>.</li>
                <li>Нажмите «Новый профиль» или «+».</li>
                <img src="https://shinobubest.github.io/web/resources/win/3.png" class="instruction-img" alt="Шаг 3">
                <li>«Добавить из буфера обмена».</li>
                <img src="https://shinobubest.github.io/web/resources/win/4.png" class="instruction-img" alt="Шаг 4">
                <li>Нажмите большую кнопку подключения по центру.</li>
            </ol>`
    },
    androidtv: {
        name: 'Android TV',
        icon: 'fas fa-tv',
        html: `
            <h4>Настройка для Android TV</h4>
            <ol>
                <li>Скачайте <b>v2rayNG</b> на смартфон и <b>Send Files to TV</b> из Google Play (на TV и смартфон).</li>
                <li>На смартфоне откройте файловый менеджер, найдите <b>v2rayNG.apk</b> и «Поделиться» → Send Files to TV.</li>
                <img src="https://shinobubest.github.io/web/resources/atv/2.png" class="instruction-img">
                <li>На TV откройте Send Files to TV, подтвердите получение файла.</li>
                <img src="https://shinobubest.github.io/web/resources/atv/3.png" class="instruction-img">
                <li>Установите APK через файловый менеджер. Откройте v2rayNG.</li>
                <li>Нажмите «+» → «Импорт из QR-кода» → иконка «Изображение».</li>
                <img src="https://shinobubest.github.io/web/resources/atv/4.png" class="instruction-img">
                <img src="https://shinobubest.github.io/web/resources/atv/5.png" class="instruction-img">
                <img src="https://shinobubest.github.io/web/resources/atv/6.png" class="instruction-img">
                <li>Выберите QR-код, нажмите «Запуск».</li>
                <img src="https://shinobubest.github.io/web/resources/atv/7.png" class="instruction-img">
            </ol>`
    },
    faq: {
        name: 'FAQ',
        icon: 'fas fa-circle-question',
        html: `
            <h4>Частые вопросы</h4>

            <div class="faq-item">
                <div class="faq-q"><i class="fas fa-chevron-right"></i> Что такое VLESS?</div>
                <div class="faq-a">VLESS — современный протокол VPN с минимальной нагрузкой и высокой скоростью. Устойчив к блокировкам и определению DPI.</div>
            </div>

            <div class="faq-item">
                <div class="faq-q"><i class="fas fa-chevron-right"></i> Я оплатил — когда появится ключ?</div>
                <div class="faq-a"><b>Stars:</b> ключ выдаётся мгновенно и автоматически.<br><b>ЮMoney:</b> в течение 1–5 минут бот пришлёт ключ в чат. Если прошло больше — напишите в поддержку.</div>
            </div>

            <div class="faq-item">
                <div class="faq-q"><i class="fas fa-chevron-right"></i> Можно ли использовать на нескольких устройствах?</div>
                <div class="faq-a">Да, ключ работает на нескольких устройствах одновременно. Ограничений нет.</div>
            </div>

            <div class="faq-item">
                <div class="faq-q"><i class="fas fa-chevron-right"></i> Какая скорость соединения?</div>
                <div class="faq-a">Скорость зависит от вашего интернет-провайдера. Наши серверы не ограничивают трафик — ограничением является ваш тариф у провайдера.</div>
            </div>

            <div class="faq-item">
                <div class="faq-q"><i class="fas fa-chevron-right"></i> Где расположены серверы?</div>
                <div class="faq-a">Сервера расположены в странах ЕС. Маршрутизация оптимизирована для пользователей из России.</div>
            </div>

            <div class="faq-item">
                <div class="faq-q"><i class="fas fa-chevron-right"></i> Что такое Telegram Stars?</div>
                <div class="faq-a">Telegram Stars — внутренняя валюта Telegram. Купить можно прямо в Telegram через настройки (Telegram Premium → Stars). Оплата мгновенная без карты.</div>
            </div>

            <div class="faq-item">
                <div class="faq-q"><i class="fas fa-chevron-right"></i> Как работает реферальная программа?</div>
                <div class="faq-a">Скопируй свою реферальную ссылку и отправь другу. Когда он оплатит любой тариф — вы ОБА получите +10 дней к подписке автоматически.</div>
            </div>

            <div class="faq-item">
                <div class="faq-q"><i class="fas fa-chevron-right"></i> Что делать если VPN не подключается?</div>
                <div class="faq-a">1. Убедитесь что подписка активна.<br>2. Проверьте что ключ скопирован полностью.<br>3. Попробуйте переподключиться или пересоздать конфиг.<br>4. Напишите в поддержку боту.</div>
            </div>

            <div class="faq-item">
                <div class="faq-q"><i class="fas fa-chevron-right"></i> Можно ли получить возврат?</div>
                <div class="faq-a">Возвраты рассматриваются индивидуально в течение 24 часов с момента покупки. Напишите в поддержку через бота.</div>
            </div>
        `
    }
};
