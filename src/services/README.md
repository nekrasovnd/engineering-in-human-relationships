# src/services — Сервисный слой

Все операции **записи** в Firestore находятся здесь. Страницы и компоненты не должны обращаться к Firebase напрямую.

---

## `firestore.js`

### Профиль пользователя

#### `saveProfile(userId, profileData)`
Сохраняет (merge) произвольные поля профиля в `profiles/{userId}`.

Используется для:
- Финального сохранения после опросника
- Обновления базовых данных (имя, возраст, пол, аватар) без повторного опросника
- Переключения видимости в знакомствах (`discoverVisible`)

#### `saveQuestionnaireDraft(userId, draftData)`
Сохраняет черновик опросника в `questionnaireDrafts/{userId}`.
Вызывается автоматически через debounce из `useQuestionnaireForm`.

---

### Знакомства (Discover)

#### `saveMatchDecision({ fromUid, toUid, decision, compatibility, conflictRisk })`
Сохраняет решение (like/pass) в `matchDecisions`.
Используется одноразово за каждую пару пользователей.

#### `subscribeOwnMatchDecisions(userId, onItems, onError)` → `unsubscribe`
Подписка на исходящие решения пользователя (он оценивал других).

#### `subscribeIncomingMatchDecisions(userId, onItems, onError)` → `unsubscribe`
Подписка на входящие решения (другие оценивали пользователя).

---

### Команды

#### `createTeamWithInvites({ name, description, goal, creatorProfile, invitedProfiles })`
Атомарная операция (batch):
1. Создаёт документ в `teams`
2. Добавляет снапшот профиля создателя в `teams/{id}/memberSnapshots`
3. Создаёт приглашения в `teamInvites` для каждого из `invitedProfiles`

#### `acceptTeamInvite(inviteId, memberProfile)`
Атомарная операция (batch):
1. Обновляет статус приглашения в `teamInvites/{inviteId}` → `accepted`
2. Добавляет пользователя в `memberIds` команды
3. Добавляет снапшот его профиля в `teams/{id}/memberSnapshots`

#### `declineTeamInvite(inviteId)`
Обновляет статус приглашения → `declined`.

#### `requestTeamInviteByCode(code, profile)`
Ищет команду по `joinCode`, проверяет условия вступления, создаёт приглашение.

Ошибки (через `throw new Error(code)`):
- `invalid-code` — код слишком короткий
- `code-not-found` — команда не найдена или код неактивен
- `own-team` — это код своей команды
- `already-joined` — пользователь уже в команде
- `invite-already-pending` — уже есть ожидающее приглашение

#### `ensureTeamJoinCode(team, actorProfile)` → `string`
Генерирует или возвращает существующий `joinCode` для команды.
Код могут создавать владелец и администраторы.

### Управление командой (роли и права — `utils/teamRoles.js`)

Права проверяются дважды: в сервисе (понятная ошибка `team-permission-denied`)
и в `firebase/firestore.rules` (настоящая защита).

#### `updateTeamInfo(team, actorId, { name, description, goal })`
Владелец/админ. Синхронно обновляет карточку `teamJoinCodes/{code}`.

#### `inviteMembersToTeam(team, actorProfile, profiles)` → `number`
Владелец/админ. Прямые приглашения в существующую команду (перезаписывает старые).

#### `setTeamMemberRole(teamId, actorId, targetId, role)`
Владелец/админ. `role` ∈ `admin | lead | member`. Нельзя менять себя и владельца.

#### `setTeamMemberFunctions(team, actorId, changes)`
Владелец/админ. Роли в работе и квалификация (`utils/teamFunctions.js`),
можно сразу нескольким: `[{ userId, functionalRole?, qualification? }]`, `''` — снять.

#### `removeTeamMember(teamId, actorId, targetId)` / `leaveTeam(teamId, userId)`
Исключение (владелец/админ) или выход. Владелец выйти не может.
Роль, роль в работе и уровень участника удаляются вместе с ним.

#### `transferTeamOwnership(teamId, actorId, nextOwnerId)`
Только владелец. Прежний владелец становится админом.

#### `deleteTeam(team, actorId)`
Только владелец. Удаляет задачи, итерации, саму команду и выключает её код.

### Итерации и задачи (`utils/teamPlanning.js`)

Ведут владелец, админы и тимлиды. Исполнитель меняет только статус своей задачи.

#### `createTeamIteration(team, actorId, { title, goal, startDate, deadline })` → `id`
#### `updateTeamIteration(team, iteration, actorId, input)`
#### `setTeamIterationStatus(team, iteration, actorId, 'active' | 'closed')`
#### `deleteTeamIteration(team, iteration, actorId, tasks)`
Задачи удалённой итерации остаются в команде без итерации.

#### `createTeamTask(team, actorId, input)` → `id` / `updateTeamTask(team, task, actorId, input)`
`input`: `title, description, status, priority, assigneeIds, iterationId, deadline`.
Новые исполнители — только участники команды.

#### `updateTeamTaskStatus(team, task, actorId, status)`
Планирующие роли — любая задача, остальные — только назначенная им.

#### `deleteTeamTask(team, task, actorId)`

### Обратная связь (`utils/teamFeedback.js`)

Отвечает любой участник, один раз (повторная запись запрещена правилами).
Ответы читают автор и владелец/админы.

#### `submitPulseSurvey(team, actorId, { answers, frictionWith, comment })`
Пульс недели: 5 вопросов 1–5, «с кем сложно» (участники), комментарий.
Документ `pulseSurveys/{weekKey}_{uid}`, неделя — ISO (`2026-W44`).

#### `submitPeerReview(team, iteration, actorId, { ratings, comments })`
Оценка коллег по закрытой итерации: каждому участнику 1–5 по 4 критериям.
Документ `peerReviews/{iterationId}_{uid}`.

---

### Синхронизация снапшотов (вызывается из AuthContext)

#### `syncProfileSnapshot(profile)`
Обновляет `discoverProfiles/{userId}` если профиль видим, или удаляет документ если скрыт.

#### `syncMemberSnapshotsInTeams(profile)`
Обновляет снапшот профиля во всех командах пользователя (когда пользователь изменил профиль).

---

## Правила

- Все функции **async** и бросают исключения при ошибках
- Вызывающая сторона (хуки/страницы) обязана обрабатывать `catch`
- **Не добавляйте** логику отображения или форматирования в этот файл
- Атомарные операции (несколько документов сразу) используют Firestore **batch** или **transaction**
- Функции `subscribe*` возвращают `unsubscribe` для очистки в useEffect

---

## Схема коллекций Firestore

```
profiles/{userId}           — полный профиль пользователя
discoverProfiles/{userId}   — публичный снапшот для ленты знакомств
questionnaireDrafts/{userId} — черновик опросника
matchDecisions/{autoId}     — решения (like/pass) между пользователями
teams/{teamId}              — команда
  ownerId                   — владелец (у старых команд нет → createdBy)
  roles                     — { uid: 'owner' | 'admin' | 'lead' }, нет ключа → 'member'
  functionalRoles           — { uid: 'hr' | 'researcher' | 'analyst' | 'developer' }
  qualifications            — { uid: 'junior' | 'middle' | 'senior' }
  memberIds, memberSnapshots — состав и снапшоты профилей участников
  iterations/{id}           — итерации: title, goal, startDate, deadline, status
  tasks/{id}                — задачи: title, status, priority, assigneeIds,
                              iterationId, deadline ('YYYY-MM-DD'), completedAt
  pulseSurveys/{week_uid}   — пульс недели: answers, frictionWith, comment
  peerReviews/{iter_uid}    — оценка коллег: ratings { uid: { критерий: 1–5 } }
teamJoinCodes/{code}        — код вступления в команду
teamInvites/{inviteId}      — приглашение в команду
```
