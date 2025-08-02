# Telegram Catalog

Логин: admin 
Пароль: admin123

Современный каталог Telegram-каналов с поиском, отзывами и админ-панелью для модерации.

## 🚀 Особенности

- **Поиск каналов** по названию и тегам
- **Система отзывов** с возможностью анонимных отзывов
- **Админ-панель** для модерации каналов и отзывов
- **Управление тегами** для категоризации каналов
- **Современный дизайн** с тёмной темой
- **Mobile-first** интерфейс
- **Простой деплой** на VPS

## 🛠 Технологии

- **Backend**: Node.js, Express.js, SQLite
- **Frontend**: React, Vite, Tailwind CSS
- **Аутентификация**: JWT
- **Иконки**: Lucide React

## 📱 Скриншоты

### Главная страница
- Большая строка поиска
- Кнопка добавления канала
- Список каналов с тегами

### Детали канала
- Информация о канале
- Список отзывов
- Форма добавления отзыва (анонимно/с никнеймом)

### Админ-панель
- Модерация каналов
- Модерация отзывов
- Управление тегами

## 🚀 Быстрый старт

### Локальная разработка

1. **Клонируйте репозиторий**
```bash
git clone <repository-url>
cd telegram-catalog
```

2. **Установите зависимости**
```bash
# Backend dependencies
npm install

# Frontend dependencies
cd frontend
npm install
cd ..
```

3. **Запустите сервер разработки**
```bash
# Backend (в одном терминале)
npm run dev

# Frontend (в другом терминале)
cd frontend
npm run dev
```

4. **Откройте приложение**
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000

### Деплой на VPS

1. **Подготовьте сервер**
```bash
# Установите Node.js (если не установлен)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Установите Git
sudo apt-get install git
```

2. **Клонируйте и настройте проект**
```bash
git clone <repository-url>
cd telegram-catalog
chmod +x deploy.sh
./deploy.sh
```

3. **Настройте веб-сервер (опционально)**
```bash
# Установите nginx
sudo apt-get install nginx

# Создайте конфигурацию
sudo nano /etc/nginx/sites-available/telegram-catalog
```

Пример конфигурации nginx:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Активируйте сайт
sudo ln -s /etc/nginx/sites-available/telegram-catalog /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## 🔐 Админ-панель

### Доступ
- URL: `/admin`
- Логин: `admin`
- Пароль: `admin123`

### Функции
- **Модерация каналов**: одобрение/отклонение новых каналов
- **Модерация отзывов**: одобрение/отклонение отзывов
- **Управление тегами**: создание новых тегов для категоризации

## 📊 API Endpoints

### Публичные endpoints
- `GET /api/channels` - Получить список каналов
- `GET /api/channels/:id` - Получить канал по ID
- `POST /api/channels` - Добавить новый канал
- `GET /api/channels/:id/reviews` - Получить отзывы канала
- `POST /api/channels/:id/reviews` - Добавить отзыв
- `GET /api/tags` - Получить список тегов

### Админ endpoints (требуют JWT)
- `POST /api/admin/login` - Вход в админ-панель
- `GET /api/admin/channels` - Получить каналы для модерации
- `PUT /api/admin/channels/:id` - Одобрить/отклонить канал
- `GET /api/admin/reviews` - Получить отзывы для модерации
- `PUT /api/admin/reviews/:id` - Одобрить/отклонить отзыв
- `POST /api/admin/tags` - Создать новый тег

## 🔧 Конфигурация

### Переменные окружения
```bash
PORT=3000                    # Порт сервера
JWT_SECRET=your-secret-key   # Секретный ключ для JWT
NODE_ENV=production          # Окружение
```

### База данных
Приложение использует SQLite для простоты деплоя. База данных создается автоматически в файле `telegram_catalog.db`.

## 📱 Mobile-only дизайн

Приложение оптимизировано для мобильных устройств и показывает предупреждение на десктопе о необходимости использования мобильного устройства.

## 🔒 Безопасность

- Все новые каналы и отзывы требуют модерации
- JWT аутентификация для админ-панели
- Валидация входных данных
- Защита от SQL-инъекций

## 🚀 Команды управления

```bash
# Запуск в продакшене
npm start

# Запуск в режиме разработки
npm run dev

# Сборка frontend
npm run build

# Управление сервисом (после деплоя)
sudo systemctl status telegram-catalog
sudo systemctl restart telegram-catalog
sudo systemctl stop telegram-catalog
```

## 📝 Лицензия

ISC License

## 🤝 Вклад в проект

1. Форкните репозиторий
2. Создайте ветку для новой функции
3. Внесите изменения
4. Создайте Pull Request

## 📞 Поддержка

Если у вас есть вопросы или проблемы, создайте Issue в репозитории. 
