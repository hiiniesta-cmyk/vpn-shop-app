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
        greeting: "Привет,", profile_sub: "Ваш VPN сегодня", renew_hint: "Подписка скоро закончится",
        tile_copy: "Копировать", tile_qr: "QR-код", tile_renew: "Продлить", tile_invite: "Пригласить",
        setup_sub: "Установка за пару минут", ref_sub: "Приглашай — получай дни", tariffs_sub: "Оплата через Telegram Stars ⭐",
        select_btn: "Выбрать", per_month: "₽/мес", off: "скидка",
        feat_unlimited: "Безлимитный трафик", feat_vless: "VLESS протокол", feat_support: "Поддержка 24/7", feat_priority: "Приоритетная поддержка",
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
        greeting: "Hi,", profile_sub: "Your VPN today", renew_hint: "Subscription ending soon",
        tile_copy: "Copy", tile_qr: "QR code", tile_renew: "Renew", tile_invite: "Invite",
        setup_sub: "Set up in a couple minutes", ref_sub: "Invite — earn days", tariffs_sub: "Pay via Telegram Stars ⭐",
        select_btn: "Choose", per_month: "₽/mo", off: "off",
        feat_unlimited: "Unlimited traffic", feat_vless: "VLESS protocol", feat_support: "24/7 support", feat_priority: "Priority support",
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
        features: ['feat_unlimited', 'feat_vless', 'feat_support']
    },
    {
        id: 'month_3',
        months: 3,
        price: 279.00,
        stars: 215,
        badge: 'save',        // Popular
        discountPct: 10,
        features: ['feat_unlimited', 'feat_vless', 'feat_support']
    },
    {
        id: 'month_6',
        months: 6,
        price: 495.00,
        stars: 380,
        badge: null,
        discountPct: 20,
        features: ['feat_unlimited', 'feat_vless', 'feat_support']
    },
    {
        id: 'month_12',
        months: 12,
        price: 825.00,
        stars: 635,
        badge: 'best',        // Best price
        discountPct: 33,
        features: ['feat_unlimited', 'feat_vless', 'feat_support', 'feat_priority']
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
        html: {
            ru: `
            <h4>Настройка для Android (v2rayNG)</h4>
            <ol>
                <li>Скопируйте ваш ключ на вкладке «Профиль».</li>
                <li>Скачайте и установите <b>v2rayNG</b>.</li>
                <li>Нажмите <b>+</b> → «Импорт из буфера обмена».</li>
                <img src="https://shinobubest.github.io/web/resources/android/3.png" class="instruction-img" alt="Шаг 3">
                <img src="https://shinobubest.github.io/web/resources/android/4.png" class="instruction-img" alt="Шаг 4">
                <li>Нажмите кнопку <b>►</b> внизу для подключения.</li>
                <img src="https://shinobubest.github.io/web/resources/android/5.png" class="instruction-img" alt="Шаг 5">
            </ol>`,
            en: `
            <h4>Setup for Android (v2rayNG)</h4>
            <ol>
                <li>Copy your key on the “Profile” tab.</li>
                <li>Download and install <b>v2rayNG</b>.</li>
                <li>Tap <b>+</b> → “Import config from clipboard”.</li>
                <img src="https://shinobubest.github.io/web/resources/android/3.png" class="instruction-img" alt="Step 3">
                <img src="https://shinobubest.github.io/web/resources/android/4.png" class="instruction-img" alt="Step 4">
                <li>Tap the <b>►</b> button at the bottom to connect.</li>
                <img src="https://shinobubest.github.io/web/resources/android/5.png" class="instruction-img" alt="Step 5">
            </ol>`
        }
    },
    ios: {
        name: 'iOS (V2RayTun)',
        icon: 'fab fa-apple',
        html: {
            ru: `
            <h4>Настройка для iPhone (V2RayTun)</h4>
            <ol>
                <li>Скопируйте ваш ключ на вкладке «Профиль».</li>
                <li>Скачайте <b>V2RayTun</b> из App Store.</li>
                <li>Нажмите <b>+</b> в правом верхнем углу → «Добавить из буфера».</li>
                <img src="https://shinobubest.github.io/web/resources/iphone/3.png" class="instruction-img" alt="Шаг 3">
                <img src="https://shinobubest.github.io/web/resources/iphone/4.png" class="instruction-img" alt="Шаг 4">
                <li>Нажмите кнопку подключения в центре.</li>
                <img src="https://shinobubest.github.io/web/resources/iphone/5.png" class="instruction-img" alt="Шаг 5">
            </ol>`,
            en: `
            <h4>Setup for iPhone (V2RayTun)</h4>
            <ol>
                <li>Copy your key on the “Profile” tab.</li>
                <li>Download <b>V2RayTun</b> from the App Store.</li>
                <li>Tap <b>+</b> in the top-right corner → “Add from clipboard”.</li>
                <img src="https://shinobubest.github.io/web/resources/iphone/3.png" class="instruction-img" alt="Step 3">
                <img src="https://shinobubest.github.io/web/resources/iphone/4.png" class="instruction-img" alt="Step 4">
                <li>Tap the connect button in the center.</li>
                <img src="https://shinobubest.github.io/web/resources/iphone/5.png" class="instruction-img" alt="Step 5">
            </ol>`
        }
    },
    windows: {
        name: 'Windows (Hiddify)',
        icon: 'fab fa-windows',
        html: {
            ru: `
            <h4>Настройка для Windows (Hiddify)</h4>
            <ol>
                <li>Скопируйте ваш ключ на вкладке «Профиль».</li>
                <li>Скачайте и установите <b>Hiddify</b>.</li>
                <li>Нажмите «Новый профиль» или «+».</li>
                <img src="https://shinobubest.github.io/web/resources/win/3.png" class="instruction-img" alt="Шаг 3">
                <li>«Добавить из буфера обмена».</li>
                <img src="https://shinobubest.github.io/web/resources/win/4.png" class="instruction-img" alt="Шаг 4">
                <li>Нажмите большую кнопку подключения по центру.</li>
            </ol>`,
            en: `
            <h4>Setup for Windows (Hiddify)</h4>
            <ol>
                <li>Copy your key on the “Profile” tab.</li>
                <li>Download and install <b>Hiddify</b>.</li>
                <li>Click “New profile” or “+”.</li>
                <img src="https://shinobubest.github.io/web/resources/win/3.png" class="instruction-img" alt="Step 3">
                <li>“Add from clipboard”.</li>
                <img src="https://shinobubest.github.io/web/resources/win/4.png" class="instruction-img" alt="Step 4">
                <li>Click the big connect button in the center.</li>
            </ol>`
        }
    },
    androidtv: {
        name: 'Android TV',
        icon: 'fas fa-tv',
        html: {
            ru: `
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
            </ol>`,
            en: `
            <h4>Setup for Android TV</h4>
            <ol>
                <li>Install <b>v2rayNG</b> on your phone and <b>Send Files to TV</b> from Google Play (on both the TV and the phone).</li>
                <li>On your phone open a file manager, find <b>v2rayNG.apk</b> and tap “Share” → Send Files to TV.</li>
                <img src="https://shinobubest.github.io/web/resources/atv/2.png" class="instruction-img">
                <li>On the TV open Send Files to TV and confirm receiving the file.</li>
                <img src="https://shinobubest.github.io/web/resources/atv/3.png" class="instruction-img">
                <li>Install the APK via the file manager. Open v2rayNG.</li>
                <li>Tap “+” → “Import config from QR code” → the “Image” icon.</li>
                <img src="https://shinobubest.github.io/web/resources/atv/4.png" class="instruction-img">
                <img src="https://shinobubest.github.io/web/resources/atv/5.png" class="instruction-img">
                <img src="https://shinobubest.github.io/web/resources/atv/6.png" class="instruction-img">
                <li>Select the QR code and tap “Run”.</li>
                <img src="https://shinobubest.github.io/web/resources/atv/7.png" class="instruction-img">
            </ol>`
        }
    },
    faq: {
        name: 'FAQ',
        icon: 'fas fa-circle-question',
        html: {
            ru: `
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
        `,
            en: `
            <h4>Frequently asked questions</h4>

            <div class="faq-item">
                <div class="faq-q"><i class="fas fa-chevron-right"></i> What is VLESS?</div>
                <div class="faq-a">VLESS is a modern VPN protocol with minimal overhead and high speed. It resists blocking and DPI detection.</div>
            </div>

            <div class="faq-item">
                <div class="faq-q"><i class="fas fa-chevron-right"></i> I’ve paid — when will I get the key?</div>
                <div class="faq-a"><b>Stars:</b> the key is issued instantly and automatically.<br><b>YooMoney:</b> the bot sends the key to the chat within 1–5 minutes. If it takes longer — contact support.</div>
            </div>

            <div class="faq-item">
                <div class="faq-q"><i class="fas fa-chevron-right"></i> Can I use it on several devices?</div>
                <div class="faq-a">Yes, the key works on several devices at the same time. There are no limits.</div>
            </div>

            <div class="faq-item">
                <div class="faq-q"><i class="fas fa-chevron-right"></i> What connection speed can I expect?</div>
                <div class="faq-a">Speed depends on your internet provider. Our servers don’t throttle traffic — the limit is your provider’s plan.</div>
            </div>

            <div class="faq-item">
                <div class="faq-q"><i class="fas fa-chevron-right"></i> Where are the servers located?</div>
                <div class="faq-a">The servers are located in EU countries. Routing is optimized for users from Russia.</div>
            </div>

            <div class="faq-item">
                <div class="faq-q"><i class="fas fa-chevron-right"></i> What are Telegram Stars?</div>
                <div class="faq-a">Telegram Stars are Telegram’s in-app currency. You can buy them right in Telegram via settings (Telegram Premium → Stars). Payment is instant, no card needed.</div>
            </div>

            <div class="faq-item">
                <div class="faq-q"><i class="fas fa-chevron-right"></i> How does the referral program work?</div>
                <div class="faq-a">Copy your referral link and send it to a friend. When they pay for any plan — you BOTH automatically get +10 days added to your subscription.</div>
            </div>

            <div class="faq-item">
                <div class="faq-q"><i class="fas fa-chevron-right"></i> What if the VPN won’t connect?</div>
                <div class="faq-a">1. Make sure your subscription is active.<br>2. Check that the key was copied in full.<br>3. Try reconnecting or recreating the config.<br>4. Contact the support bot.</div>
            </div>

            <div class="faq-item">
                <div class="faq-q"><i class="fas fa-chevron-right"></i> Can I get a refund?</div>
                <div class="faq-a">Refunds are reviewed individually within 24 hours of purchase. Contact support via the bot.</div>
            </div>
        `
        }
    }
};
