# src/hooks — Feature-хуки

React-хуки для управления локальным состоянием разделов приложения и подписками на Firestore.

---

## Базовые хуки (строительные блоки)

### `useFirestoreList.js`
**Переиспользуемая обёртка** над `onSnapshot` для подписки на Firestore-коллекцию.

```js
useFirestoreList({ enabled, dependencies, createQuery, mapSnapshot })
// → { items, loading, error }
```

**Параметры:**
- `enabled` — `boolean`: подписка активна только если `true`
- `dependencies` — `any[]`: список зависимостей для пересоздания подписки (аналог deps в useEffect)
- `createQuery()` → `FirestoreQuery`: функция, создающая Firestore query
- `mapSnapshot(snapshot)` → `T[]`: функция маппинга DocumentSnapshot → массив объектов

**Поведение:**
- Если `enabled === false` → немедленно возвращает `{ items: [], loading: false, error: '' }`
- Автоматически отписывается при смене deps или размонтировании

> Используйте этот хук как основу для любых новых Firestore-подписок вместо написания useEffect вручную.

---

## Data-хуки (подписки на данные)

### `useDiscoverProfiles.js`
Подписывается на `discoverProfiles` коллекцию (только видимые профили).

```js
useDiscoverProfiles(currentUserId, { excludeCurrent, enabled })
// → { profiles, loading, error }
```

### `useMutualMatches.js`
Вычисляет взаимные совпадения (оба поставили `like`).

```js
useMutualMatches(currentUserId, { enabled })
// → { mutualMatches, loading, error }
```

**Логика:** подписывается на исходящие и входящие `matchDecisions`, вычисляет пересечение `like`-решений, затем фильтрует `discoverProfiles` по найденным userId.

### `useTeamInvites.js`
Приглашения в команды для текущего пользователя.

```js
useTeamInvites(userId)
// → { invites, loading, error }
```

Отдаёт приглашения из `teamInvites` WHERE `toUid == userId`, отсортированные по дате.

### `useTeams.js`
Команды, в которых участвует пользователь.

```js
useTeams(userId)
// → { teams, loading, error }
```

Отдаёт команды из `teams` WHERE `memberIds array-contains userId`.

---

## Workspace-хуки (состояние целых страниц)

### `useDiscoverWorkspace.js`
Всё состояние страницы `/discover`:
- Видимость профиля (`discoverVisible`) с оптимистичным обновлением
- Текущий кандидат (`candidate`) и его совместимость (`comparison`)
- Очередь кандидатов (`undecidedProfiles`)
- Взаимные совпадения (`mutualMatches`)
- Сохранение решений (`storeDecision`)

```js
useDiscoverWorkspace(profile)
// → { discoverVisible, isVisibilityPending, displayError, loading,
//     mutualMatches, mutualMatchesLoading, busyId, matchMessage,
//     undecidedProfiles, candidate, comparison,
//     storeDecision, setDiscoverVisibility }
```

### `useTeamsWorkspace.js`
Всё состояние страницы `/teams`:
- Список взаимных совпадений для приглашения
- Список входящих приглашений (`pendingInvites`)
- Список команд пользователя (`teams`)
- Форма создания команды
- Операции: `createTeam` (→ id новой команды), `acceptInvite`, `declineInvite`, `requestInviteByCode`

```js
useTeamsWorkspace(profile, locationState)
// → { ...формы и состояния, ...операции }
```

**Константы:** `GOAL_OPTIONS` — массив опций цели команды.

### `useTeamWorkspace.js`
Состояние страницы одной команды `/teams/:teamId`:
- `team`, `myRole`, `can` (права текущего пользователя), `members` (по убыванию роли)
- Форма данных команды, приглашения из взаимных совпадений, код команды
- Операции: `saveInfo`, `changeMemberRole`, `removeMember`, `transferOwnership`,
  `leave`, `removeTeam`, `generateCode`, `copyCode`, `sendInvites`

```js
useTeamWorkspace(teamId, profile)
```

### `useTeamPlanningData.js`
Подписка на подколлекции `iterations` и `tasks` команды → `{ iterations, tasks, loading }`.

### `useTeamPlanning.js`
Вкладки «Задачи» и «Итерации»: фильтры (итерация, «только мои»), формы задачи и
итерации, операции. Ошибки и уведомления отдаёт через `onError` / `onNotice`.

```js
useTeamPlanning(team, profile, { onError, onNotice })
```

### `useQuestionnaireForm.js`
Состояние страницы `/questionnaire`:
- Гидратация из профиля при первом рендере
- Автосохранение черновика (debounce 900ms) через `saveQuestionnaireDraft`
- Предупреждение перед закрытием вкладки (`useBeforeUnload`)
- Расчёт прогресса (`answeredCount`, `completionPercent`)
- Финальное сохранение профиля (`handleSaveProfile`)

```js
useQuestionnaireForm(user, profile)
// → { FACTOR_CONFIG, TOTAL_QUESTIONS, currentFactorIndex, currentFactor,
//     saving, error, baseForm, answers, answeredCount, completionPercent,
//     isLastFactor, remainingCount, draftStatusMessage,
//     handleBaseFormChange, handleAnswerChange, handleSaveProfile,
//     setCurrentFactorIndex }
```

---

## Правила

- Каждый хук отвечает за **один** feature-slice или **одну** коллекцию
- Хуки могут вызывать другие хуки и `services/`
- Хуки **не должны** рендерить JSX
- Для новой Firestore-подписки — используйте `useFirestoreList` как базу
- Для нового раздела приложения — создавайте `use{Page}Workspace.js`
