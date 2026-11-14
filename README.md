# MentorAI

**MentorAI** — веб-приложение с AI-наставником для подготовки к поступлению, первой работе и адаптации в команде. Пользователь тренируется на сценариях и заданиях, получает оценку и рекомендации, ведёт диалоги с наставником и отслеживает прогресс.

Проект подготовлен для конкурса **SK Kids Challenge / Softline**.

---

## Возможности

- **Аккаунты:** регистрация, вход, выход, смена пароля, удаление аккаунта.
- **Подтверждение почты:** 6-значный код на email, срок действия, лимиты повторной отправки и попыток.
- **AI-наставник:** диалоги (сохраняются в истории), по одному на сессию.
- **Тренажёр:** обучающие сценарии и задания, автоматическая оценка ответа и рекомендации.
- **Прогресс:** статистика, средний результат, навыки, слабые места, история активности.
- **База знаний:** статьи по категориям с поиском и фильтрами.
- **Профиль и настройки:** личные данные, учебный профиль, уведомления, темы оформления.
- **Темы:** тёмная / светлая / системная, выбор акцентного цвета.
- **Уведомления:** предпочтения с серверным гейтом (email-уведомления недоступны без подтверждённой почты).

---

## Технологии

**Backend**
- ASP.NET Core (`.NET 10`), C#
- Entity Framework Core + SQLite
- ASP.NET Core Identity (JWT bearer, `useCookies=false`)
- MailKit (SMTP-отправка писем)
- Problem Details (RFC 9457) для унифицированных ошибок API

**Frontend**
- React 19 + Vite
- React Router
- Lucide React (иконки)
- Vanilla CSS (темы через `data-theme`, адаптивная вёрстка)

---

## Структура репозитория

```
MentorAi/
├─ MentorAI.API/            # backend (ASP.NET Core)
│  ├─ Controllers/          # API-контроллеры
│  ├─ Services/             # Chat, EmailVerification, SmtpEmailSender, Notification
│  ├─ Models/               # сущности и DTO
│  ├─ Data/                 # ApplicationDbContext
│  ├─ Migrations/           # EF Core миграции
│  └─ Program.cs            # конфигурация и маршруты
├─ frontend/                # frontend (React + Vite)
│  └─ src/
│     ├─ api/               # клиент API
│     ├─ components/        # компоненты по разделам
│     ├─ pages/             # страницы и маршруты
│     ├─ data/              # контент базы знаний
│     └─ styles/            # темы и стили
└─ README.md
```

---

## Требования

- [.NET SDK 10](https://dotnet.microsoft.com/) (для сборки backend)
- [Node.js 18+](https://nodejs.org/) и npm (для frontend)
- SMTP-доступ для реальной отправки писем (см. ниже)

---

## Запуск

### 1. Backend

```bash
cd MentorAI.API
dotnet restore
dotnet run --launch-profile http
```

Backend будет доступен на **http://localhost:5056**.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend будет доступен на **http://localhost:5173**.

---

## База данных (SQLite)

- Используется SQLite, файл `mentorai.db` создаётся в `MentorAI.API/`.
- Файл БД **не хранится в Git** (см. `.gitignore`).

Применить миграции к пустой базе:

```bash
cd MentorAI.API
dotnet ef database update
```

> Автоматическое применение миграций при старте намеренно не включено — это осознанное решение для контролируемого развёртывания.

---

## Настройка SMTP (секреты)

SMTP-реквизиты и pepper хранятся **только в .NET User Secrets** или переменных окружения — **никогда** в `appsettings.json`, исходном коде или Git.

Настройка через User Secrets (для локальной разработки):

```bash
cd MentorAI.API

dotnet user-secrets set "Smtp:Host"     "smtp.example.com"
dotnet user-secrets set "Smtp:Port"     "465"
dotnet user-secrets set "Smtp:User"     "no-reply@example.com"
dotnet user-secrets set "Smtp:Password" "<пароль приложения>"
dotnet user-secrets set "Smtp:From"     "no-reply@example.com"

# pepper для хеширования кодов подтверждения
dotnet user-secrets set "EmailVerification:Pepper" "<случайная длинная строка>"
```

Пояснения:
- `Smtp:Port` `465` — implicit SSL, `587` — STARTTLS (выбирается автоматически).
- `Smtp:Password` — **пароль приложения** почтового провайдера, а не основной пароль.
- Используйте `dotnet user-secrets list` для проверки ключей (значения не публикуйте).

Для серверного развёртывания используйте переменные окружения с двойным подчёркиванием:

```
Smtp__Host=smtp.example.com
Smtp__Port=465
Smtp__User=no-reply@example.com
Smtp__Password=<пароль приложения>
Smtp__From=no-reply@example.com
EmailVerification__Pepper=<случайная длинная строка>
```

### Режим разработки без SMTP

Если SMTP не настроен, в окружении `Development` можно включить вывод письма в консоль сервера (только для локальной отладки):

```
Smtp__DevEcho=true
```

В `Production` этот режим игнорируется, письма не печатаются.

---

## Переменные окружения frontend

Адрес backend API задаётся в `frontend/src/api/`. Для развёртывания подготовлен шаблон `frontend/.env.example` (переменная `VITE_API_URL`). Реальные значения `.env` в Git не коммитятся.

---

## Сборка

```bash
# backend
cd MentorAI.API
dotnet build

# frontend
cd frontend
npm run build
```

---

## Безопасность

- Пароли хешируются ASP.NET Identity.
- Токены доступа (JWT) хранятся в `sessionStorage` и передаются в заголовке `Authorization`.
- Коды подтверждения почты хранятся только как SHA-256 хеш с pepper, одноразовые, с ограничением срока и попыток.
- Приватные endpoint-ы защищены `[Authorize]`; данные фильтруются по пользователю.
- Секреты (SMTP, pepper) — только в User Secrets или переменных окружения.
- Ошибки API возвращаются в формате Problem Details без stack trace и деталей сервера.

---

## Лицензия

Учебный проект. Использование — по согласованию с автором.
