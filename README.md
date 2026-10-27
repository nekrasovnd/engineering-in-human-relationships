# Engineering In Human Relationships

Психологический профайлер для команд. Помогает оценить совместимость людей, найти зоны трения и получить рекомендации по управлению взаимодействием.

## Технологии

| | |
|---|---|
| UI | React 18 |
| Сборка | Vite 5 |
| Стили | Tailwind CSS |
| База данных | Firebase Firestore (real-time subscriptions) |
| Auth | Firebase Authentication |
| Графики | Chart.js + react-chartjs-2 |

## Быстрый старт

```bash
# Установка зависимостей
npm install

# Запуск в режиме разработки
npm run dev

# Продакшн-сборка
npm run build
```

## Переменные окружения

Создайте файл `.env` в корне проекта:

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

## Разделы приложения

| Маршрут | Страница | Описание |
|---|---|---|
| `/auth` | AuthPage | Вход, регистрация, сброс пароля |
| `/questionnaire` | QuestionnairePage | Прохождение психологического опросника (8 факторов) |
| `/profile` | ProfilePage | Просмотр профиля, редактирование, радар-диаграмма |
| `/discover` | DiscoverPage | Лента знакомств со свайпами, взаимные совпадения |
| `/compare` | ComparePage | Сравнение двух профилей |
| `/teams` | TeamsPage | Создание команд, приглашения, анализ |
| `/knowledge` | KnowledgeBasePage | База знаний ТРИЗ с полнотекстовым поиском |

## Архитектура

Подробное описание: [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md)

Кратко:
- **Страницы** не обращаются к Firebase напрямую — только через `services/`
- **Хуки** изолируют состояние каждого раздела
- **utils/** содержат чистые функции без сайд-эффектов
- **AuthContext** управляет глобальным состоянием пользователя и профиля

## Документация по слоям

- [`src/hooks/README.md`](./src/hooks/README.md)
- [`src/services/README.md`](./src/services/README.md)
- [`src/utils/README.md`](./src/utils/README.md)
- [`src/data/README.md`](./src/data/README.md)
