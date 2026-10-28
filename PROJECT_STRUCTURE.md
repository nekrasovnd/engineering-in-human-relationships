# Структура проекта

**Engineering In Human Relationships** — психологический профайлер для команд, совместимости и конфликтов.

Стек: React 18 + Vite + Tailwind CSS + Firebase (Auth + Firestore).

---

## Архитектурные принципы

1. **Однонаправленный поток данных**: `lib → services → context/hooks → pages → components`
2. **Страницы не обращаются к Firebase напрямую** — только через `services/`
3. **Компоненты не хранят бизнес-состояние** — только отображение
4. **Хуки изолируют feature-состояние** — каждый хук отвечает за один раздел UI
5. **Санитайзеры нормализуют данные Firestore** — данные из БД проходят через `utils/firestoreDocuments.js` до попадания в UI

---

## Слои и их ответственности

```
src/
├── main.jsx                  # Точка входа React-приложения
├── App.jsx                   # Роутинг, гарды доступа (auth + questionnaire)
├── index.css                 # Глобальные стили, CSS-переменные темы
│
├── lib/                      # Инициализация внешних сервисов
│   └── firebase.js           # Firebase App, Auth, Firestore — экспортируются как синглтоны
│
├── context/                  # Глобальное состояние приложения (React Context)
│   ├── AuthContext.jsx       # Текущий пользователь + профиль (onSnapshot Firestore)
│   └── ThemeContext.jsx      # Тема (light/dark), синхронизация с localStorage + <html>
│
├── services/                 # Операции записи в Firestore (все write-операции здесь)
│   └── firestore.js          # saveProfile, createTeamWithInvites, saveMatchDecision и др.
│
├── hooks/                    # Feature-хуки (локальное состояние разделов)
│   ├── useFirestoreList.js   # Переиспользуемая обёртка: onSnapshot → {items, loading, error}
│   ├── useDiscoverProfiles.js # Лента кандидатов (discoverProfiles коллекция)
│   ├── useMutualMatches.js   # Вычисление взаимных совпадений из двух потоков решений
│   ├── useTeamInvites.js     # Приглашения в команды для пользователя
│   ├── useTeams.js           # Команды пользователя (creator + member)
│   ├── useDiscoverWorkspace.js  # Всё состояние страницы знакомств
│   ├── useTeamsWorkspace.js     # Список команд, создание, входящие приглашения
│   ├── useTeamWorkspace.js      # Страница одной команды: участники, роли, настройки
│   ├── useTeamPlanningData.js   # Подписка на итерации и задачи команды
│   ├── useTeamPlanning.js       # Вкладки «Задачи» и «Итерации»: фильтры, формы, операции
│   ├── useTeamFeedbackData.js   # Подписка на пульс-опросы и оценки коллег
│   ├── useTeamFeedback.js       # Вкладка «Обратная связь»: формы и сводки
│   ├── useTeamFunctions.js      # Вкладка «Роли»: роли в работе, уровни, подсказки
│   └── useQuestionnaireForm.js  # Состояние опросника (автосохранение черновика, валидация)
│
├── pages/                    # Страницы приложения (по одной на маршрут)
│   ├── AuthPage.jsx          # /auth — вход, регистрация, сброс пароля
│   ├── QuestionnairePage.jsx # /questionnaire — прохождение опросника
│   ├── ProfilePage.jsx       # /profile — просмотр профиля, редактирование базовых данных
│   ├── DiscoverPage.jsx      # /discover — лента знакомств, взаимные совпадения
│   ├── ComparePage.jsx       # /compare — сравнение двух профилей
│   ├── TeamsPage.jsx         # /teams — создание команд, приглашения, список команд
│   ├── TeamPage.jsx          # /teams/:teamId — обзор, задачи, итерации, обратная связь, роли, участники, настройки
│   └── KnowledgeBasePage.jsx # /knowledge — база знаний ТРИЗ с поиском
│
├── components/               # Переиспользуемые UI-компоненты
│   ├── AppShell.jsx          # Обёртка аутентифицированного UI (header + nav + outlet)
│   ├── BottomNav.jsx         # Нижняя навигация (5 маршрутов)
│   ├── ThemeToggle.jsx       # Кнопка переключения темы
│   ├── LoadingScreen.jsx     # Экран загрузки (используется в App.jsx)
│   ├── SectionCard.jsx       # Базовый контейнер секции (title + subtitle + action + children)
│   ├── AvatarBadge.jsx       # Аватар пользователя (инициалы или фото, 3 размера)
│   ├── RadarProfileChart.jsx # Радар-диаграмма 8 факторов (chart.js)
│   ├── SwipeDeck.jsx         # Карточка кандидата в знакомствах (свайп + кнопки)
│   ├── TeamCard.jsx          # Карточка команды с анализом ролей и конфликтов
│   ├── TeamListItem.jsx      # Строка команды в списке (ссылка + роль)
│   ├── TeamRoleBadge.jsx     # Бейдж роли участника
│   ├── TeamMembersPanel.jsx  # Участники: роли, исключение, передача владения, приглашения
│   ├── TeamSettingsPanel.jsx # Данные команды, матрица прав, выход/удаление
│   ├── TeamTasksPanel.jsx    # Канбан задач с фильтрами
│   ├── TaskCard.jsx          # Карточка задачи (дедлайн, исполнители, статус)
│   ├── TaskFormDialog.jsx    # Модальное окно создания/редактирования задачи
│   ├── TeamIterationsPanel.jsx # Итерации: создание, закрытие, прогресс
│   ├── IterationProgress.jsx # Даты, дедлайн и прогресс итерации
│   ├── CurrentIterationCard.jsx # Текущая итерация на обзоре команды
│   ├── DeadlineBadge.jsx     # Бейдж дедлайна (срочно / просрочено)
│   ├── TeamFeedbackPanel.jsx # Вкладка «Обратная связь»
│   ├── PulseSurveyForm.jsx   # Опрос недели о трении
│   ├── PeerReviewForm.jsx    # Оценка коллег после итерации
│   ├── RatingScale.jsx       # Шкала 1–5
│   ├── FeedbackResults.jsx   # Сводки для владельца/админов
│   ├── FrictionTimelineChart.jsx # График индекса трения по неделям
│   ├── TeamFunctionsPanel.jsx # Вкладка «Роли»: назначение и подсказки
│   ├── FunctionalRoleBadge.jsx # Бейдж «Аналитик · Middle»
│   ├── ComparisonResultCard.jsx # Результат сравнения двух профилей
│   ├── ProfileInsightCard.jsx   # Психологический разбор профиля (нарратив)
│   └── InstructionCard.jsx      # Памятка «Быстро и по делу»
│
├── data/                     # Статические данные и расчётная логика предметной области
│   └── questionnaire.js      # FACTOR_CONFIG (8 факторов), вопросы, LIKERT_OPTIONS,
│                             # calculateQuestionnaireResult(), getDisplayFactorScore()
│
└── utils/                    # Чистые вспомогательные функции
    ├── compatibility.js      # calculateCompatibility() — алгоритм совместимости двух профилей
    ├── teamAnalysis.js       # buildTeamSummary(), findMostConflictPair(), getRecommendedRoles()
    ├── teamRoles.js          # Роли в команде (owner/admin/lead/member) и матрица прав
    ├── teamPlanning.js       # Статусы задач, дедлайны, прогресс итераций
    ├── teamFeedback.js       # Пульс-опросы, оценка коллег, индекс трения
    ├── teamFunctions.js      # Роли в работе, квалификация, подсказки по анкете
    ├── clipboard.js          # copyTextToClipboard()
    ├── egoState.js           # formatEgoStateLabel() — человекочитаемый label эго-состояния
    ├── profileState.js       # canUseDiscover(), isDiscoverVisible() — утилиты состояния профиля
    ├── profilePresentation.js # buildAvatarInitials(), getFactorProfileExplanation() — отображение
    ├── profileAnalysis.js    # buildProfileNarrative(), buildInstructionLines() — нарратив
    ├── comparisonCandidates.js # mergeComparisonCandidates(), buildUndecidedProfiles()
    ├── firestoreDocuments.js # sanitize*() — нормализация сырых документов из Firestore
    ├── avatarImage.js        # prepareAvatarImage() — обработка, кроп, base64 аватара
    └── trizKnowledge.js      # TRIZ_KNOWLEDGE (данные) + searchKnowledge() + getConflictResolutionHints()
```

---

## Потоки данных

### Аутентификация и профиль
```
Firebase Auth (onAuthStateChanged)
  → AuthContext: setUser()
  → Firestore onSnapshot('profiles/{uid}')
  → AuthContext: setProfile()
  → Все компоненты через useAuth()
```

### Операции записи
```
UI event (кнопка, форма)
  → Page/Hook handler
  → services/firestore.js (write)
  → Firestore → onSnapshot trigger
  → AuthContext обновляется автоматически
```

### Discover / совпадения
```
useDiscoverProfiles → Firestore 'discoverProfiles' (WHERE discoverVisible == true)
useMutualMatches   → subscribeOwnMatchDecisions + subscribeIncomingMatchDecisions
                   → вычисляет пересечение like-решений
useDiscoverWorkspace → объединяет оба хука + управляет решениями
```

---

## Правила добавления нового кода

| Что добавляете | Куда класть |
|---|---|
| Новая страница | `src/pages/` + новый маршрут в `App.jsx` |
| Переиспользуемый компонент | `src/components/` |
| Состояние для целой страницы | Новый хук `src/hooks/use{Page}Workspace.js` |
| Подписка на Firestore-коллекцию | Новый хук через `useFirestoreList` |
| Операция записи в Firestore | Новая функция в `src/services/firestore.js` |
| Чистая вычислительная функция | `src/utils/` |
| Статические данные предметной области | `src/data/` |
| Глобальное состояние | `src/context/` (только при реальной необходимости) |

---

## Ключевые ограничения

- **Нельзя** вызывать Firestore напрямую из страниц или компонентов
- **Нельзя** хранить бизнес-логику в компонентах — выносить в хуки или utils
- **Нельзя** дублировать функции-утилиты — проверяйте `utils/` перед написанием новой
- **Нельзя** менять схему данных Firestore без миграционной логики в `AuthContext.jsx`

---

## Технический долг (известный)

| Описание | Файл | Приоритет |
|---|---|---|
| Один JS-бандл ~929 KB — нет code splitting | vite.config.js | Низкий |
| `useFirestoreList.js` uses spreading in deps array | useFirestoreList.js | Низкий |
| Тесты есть только для правил Firestore (`npm run test:rules`) | tests/ | Средний |
