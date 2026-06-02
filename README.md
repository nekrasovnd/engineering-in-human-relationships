# Engineering In Human Relationships

Полноценное React/Vite/Tailwind/Firebase приложение для психологического профилирования, расчёта совместимости, прогноза конфликтов, командообразования и TRIZ-подсказок.

## Структура проекта

```text
engineering-in-human-relationships/
├─ firebase/
│  └─ firestore.rules
├─ public/
│  └─ _redirects
├─ src/
│  ├─ components/
│  ├─ context/
│  ├─ data/
│  ├─ hooks/
│  ├─ lib/
│  ├─ pages/
│  ├─ services/
│  ├─ utils/
│  ├─ App.jsx
│  ├─ index.css
│  └─ main.jsx
├─ .env.example
├─ index.html
├─ netlify.toml
├─ package.json
├─ postcss.config.cjs
├─ tailwind.config.cjs
├─ vercel.json
└─ vite.config.js
```

## Локальный запуск

1. Создайте Firebase-проект.
2. Скопируйте `.env.example` в `.env` и заполните значения.
3. Выполните:

```bash
npm install
npm run dev
```

## Настройка Firebase

1. В Firebase Console нажмите `Create project`.
2. В `Authentication -> Sign-in method` включите `Email/Password`.
3. В `Firestore Database` создайте базу в `Production mode`.
4. В `Project settings -> General -> Your apps` добавьте веб-приложение.
5. Скопируйте web config в `.env`.
6. Вкладка `Firestore Database -> Rules`:
   используйте правила из [firebase/firestore.rules](/D:/Nikita/Work/engineering-in-human-relationships/firebase/firestore.rules:1).

## Развёртывание на Vercel

1. Залейте проект в GitHub.
2. Создайте проект на [Vercel](https://vercel.com/).
3. Импортируйте репозиторий.
4. Framework preset: `Vite`.
5. В `Environment Variables` добавьте все переменные из `.env.example`.
6. Нажмите `Deploy`.
7. После первого деплоя откройте проект и проверьте авторизацию, создание профиля и Firestore.

`vercel.json` уже содержит rewrite для React Router.

## Развёртывание на Netlify

1. Создайте сайт через `Add new site -> Import an existing project`.
2. Build command: `npm run build`.
3. Publish directory: `dist`.
4. Добавьте переменные окружения из `.env.example`.
5. Нажмите `Deploy site`.

`public/_redirects` и `netlify.toml` уже настроены для SPA-маршрутов.

## Что делает приложение

- Принудительно отправляет нового пользователя в опросник.
- Считает 8 психологических факторов и производный `egoState`.
- Сохраняет `psychologicalVector50`.
- Строит радарную диаграмму.
- Сравнивает пользователей по весовому евклидову расстоянию.
- Ищет конфликтные пары в командах.
- Подбирает роли в команде.
- Работает как mini-matchmaking режим.
- Вшивает базу знаний по ТРИЗ без внешних файлов.

## Коллекции Firestore

- `profiles/{uid}`: профиль, ответы, 8 факторов, `egoState`, `psychologicalVector50`
- `teams/{teamId}`: команда, цель, участники, кэш анализа
- `matchActions/{fromUid_toUid}`: решение `like/pass` для режима знакомств
