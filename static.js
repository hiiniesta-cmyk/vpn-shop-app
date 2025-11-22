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