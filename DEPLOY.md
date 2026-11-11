# Запуск PLUSVPN Mini App (фронт → бэкенд tg-vpn-bot)

Бэкенд (FastAPI из `tg-vpn-bot`) уже у тебя работает. Здесь — только статика мини-приложения и nginx,
который отдаёт её и проксирует `/api/*` на бэкенд. Всё по HTTPS (Telegram не откроет Mini App по http).

`app.example.com` → твой домен, `127.0.0.1:8000` → адрес твоего бэкенда.

## 1. Файлы

```bash
sudo mkdir -p /var/www/plusvpn
# залей содержимое webapp/: index.html main.js api.js static.js styles.css
sudo chown -R www-data:www-data /var/www/plusvpn
```

## 2. nginx — `/etc/nginx/sites-available/plusvpn`

```nginx
server {
    listen 80;
    server_name app.example.com;
    root /var/www/plusvpn;
    index index.html;

    # ВАЖНО: слэш в конце proxy_pass → nginx отрезает /api,
    # бэкенд получает /auth/login-tg, /users/7, /prices ... как в OpenAPI.
    location /api/ {
        proxy_pass http://127.0.0.1:8000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        try_files $uri /index.html;
        add_header Cache-Control "no-cache";
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/plusvpn /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d app.example.com
curl -i https://app.example.com/api/prices      # 401 Unauthorized = проксирование работает (токена нет)
```

Если вместо 401 приходит 404 — проверь слэш в конце `proxy_pass` и префикс роутера в бэкенде
(если там уже есть `/api`, убери слэш или поменяй `API_BASE_DEF` в `main.js`).

## 3. Кнопка Mini App в боте

@BotFather → `/mybots` → бот → **Bot Settings → Menu Button → Configure** → `https://app.example.com/`.

## 4. Проверка на реальном бэкенде

Открой приложение с `?debug=1`: в BotFather укажи URL `https://app.example.com/?debug=1`
(или в консоли `localStorage.plusvpn_debug='1'`). В этом режиме тосты ошибок показывают
технический текст ответа сервера — консоль в Telegram на телефоне недоступна.

Порядок проверки (каждый шаг — отдельная гипотеза, см. ниже в чате):
1. Профиль загрузился, имя/баланс/статус видны → логин и определение `user_id` работают.
2. «Активировать пробный период» → ключ (ссылка подписки) появился.
3. Тариф при достаточном балансе → «Купить с баланса» → подписка активна, баланс уменьшился ровно на цену тарифа
   (если списалось ДВАЖДЫ — напиши, это значит create уже списывает деньги).
4. Тариф при нехватке → Stars → после оплаты подписка активируется сама.
5. ЮMoney → оплата в браузере → возврат в приложение → подписка активируется сама.
6. Промокод, переключатель автопродления.

## Локальная отладка

```bash
cd webapp && python3 -m http.server 8080
# в браузере API работать не будет (нет initData) — только вёрстка.
# Для настоящей проверки используй тестового пользователя в Telegram.
```
