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

#### `ensureTeamJoinCode(team, creatorProfile)` → `string`
Генерирует или возвращает существующий `joinCode` для команды.
Только создатель команды может генерировать код.

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
  memberSnapshots (subcollection или поле) — снапшоты профилей участников
teamInvites/{inviteId}      — приглашение в команду
```
