# src/utils — Вспомогательные функции

Чистые функции без сайд-эффектов. Не обращаются к Firebase, не хранят состояние.

---

## Модули

### `compatibility.js`
Алгоритм вычисления совместимости двух профилей.

**Экспорты:**
- `calculateCompatibility(profileA, profileB)` → `ComparisonResult`
  - Возвращает: `compatibility` (%), `conflictRisk`, `verdict`, `teamFitLabel`, `supportPoint`, `frictionPoint`, `explanation`, `pairSummary`, `resonanceScore`, `pairReserveScore`, `reliabilityScore`
- `hasComparableProfileData(profile)` → `boolean` — проверяет наличие `factorScores`

> ⚠️ Алгоритм не менять без понимания всей формульной цепочки.

---

### `teamAnalysis.js`
Анализ состава команды на основе набора профилей.

**Экспорты:**
- `buildTeamSummary(memberProfiles)` → `{ summary, strength, caution }` — текстовый обзор команды
- `findMostConflictPair(memberProfiles)` → `ComparisonResult | null` — пара с наибольшим риском трения
- `getRecommendedRoles(memberProfiles)` → `RoleRecommendation[]` — рекомендуемые роли

---

### `teamRoles.js`
Роли участников команды и матрица прав (зеркало хелперов в `firestore.rules`).

**Экспорты:**
- `TEAM_ROLES`, `TEAM_ROLE_KEYS`, `ASSIGNABLE_TEAM_ROLES`, `TEAM_PERMISSIONS`
- `getTeamRole(team, uid)` → `'owner' | 'admin' | 'lead' | 'member' | null`
- `canTeamMember(team, uid, action)`, `canManageMember(team, actorId, targetId)`
- `compareMembersByRole(team)` — компаратор для сортировки участников

---

### `teamPlanning.js`
Задачи и итерации: `TASK_STATUSES`, `TASK_PRIORITIES`, даты `'YYYY-MM-DD'`.

**Экспорты:**
- `getTaskDeadline(task, iterationsById)` — свой дедлайн задачи или дедлайн итерации
- `getDeadlineState(deadline, { done })` → `{ tone: 'none'|'done'|'ok'|'soon'|'overdue', label }`
- `getIterationProgress(iteration, tasks)`, `getCurrentIteration(iterations)`
- `compareTasks(iterationsById)`, `compareIterations` — сортировки

---

### `teamFeedback.js`
Обратная связь как контур управления из ТАУ: опросы измеряют «уровень сигнала» — трение.

**Экспорты:**
- `PULSE_QUESTIONS`, `PEER_CRITERIA`, `FRICTION_ALERT_THRESHOLD` (6 из 10)
- `getWeekKey(date)` — ISO-неделя `'2026-W44'`
- `getPulseFrictionIndex(answers)` — индекс трения 0–10
- `buildPulseTimeline`, `buildFrictionMentions` — сводки пульса
- `buildPeerReviewSummary`, `buildForecastVsFact` — оценки коллег и «прогноз против факта»
- `getPendingPeerReviewIterations` — закрытые за 14 дней итерации без моей оценки

---

### `teamFunctions.js`
Роли в работе (HR/руководитель, исследователь, аналитик, разработчик) и квалификация
(Junior/Middle/Senior). Не путать с ролями прав из `teamRoles.js`.

Подсказки без нейросети: у роли — веса черт из анкеты (0–10), у руководителя
ещё и бонус за уровень. Для людей без роли перебором ищется распределение
с максимальным суммарным соответствием; закрытие пустой роли даёт бонус +2.

**Экспорты:**
- `FUNCTIONAL_ROLES`, `QUALIFICATIONS` и их ключи
- `getFunctionFit(profile, role, qualification)` — соответствие роли 0–10
- `getMemberFunctionFits`, `getFunctionReason` — рейтинг ролей и сильные стороны
- `suggestFunctionAssignment(profiles, qualifications, coveredRoles)` — подсказка распределения
- `buildFunctionHints(team, members)` — строки для вкладки «Роли» и предупреждения
  (нет руководителя, незакрытая роль, в роли только Junior, роль не по сильным сторонам)

---

### `clipboard.js`
`copyTextToClipboard(text)` → `Promise<boolean>` — копирование с фолбэком.

---

### `egoState.js`
Форматирование эго-состояния профиля в читаемый label.

**Экспорты:**
- `formatEgoStateLabel(egoState)` → `string`

---

### `profileState.js`
Утилиты для проверки состояния профиля.

**Экспорты:**
- `canUseDiscover(profile)` → `boolean` — завершён ли опросник и включена ли видимость
- `isDiscoverVisible(profile)` → `boolean`

---

### `profilePresentation.js`
Функции для отображения данных профиля.

**Экспорты:**
- `buildAvatarInitials(name)` → `string` — инициалы из имени (до 2 букв)
- `getFactorProfileExplanation(factor, score)` → `string` — текстовое объяснение значения фактора

---

### `profileAnalysis.js`
Построение нарратива и инструкций на основе профиля.

**Экспорты:**
- `buildProfileNarrative(profile)` → `{ summary, strengths, risks, teamPrediction }`
- `buildInstructionLines()` → `string[]` — строки памятки для `InstructionCard`

---

### `comparisonCandidates.js`
Фильтрация и объединение кандидатов для сравнения.

**Экспорты:**
- `mergeComparisonCandidates(mutualMatches, teams, currentUserId)` → `Profile[]` — объединяет взаимные совпадения и участников команд без дублирования
- `buildUndecidedProfiles(profiles, decisions)` → `Profile[]` — исключает уже оценённых кандидатов

---

### `firestoreDocuments.js`
Нормализация (санитизация) сырых документов из Firestore.

**Экспорты:**
- `sanitizeDiscoverProfile(raw)` → `DiscoverProfile | null`
- `sanitizeTeamInvite(raw, id)` → `TeamInvite | null`
- `sanitizeTeam(raw, id)` → `Team | null`
- `sanitizeMatchAction(raw)` → `MatchAction | null`

> Все функции возвращают `null` при невалидных данных — используйте `.filter(Boolean)` после маппинга.

---

### `avatarImage.js`
Обработка изображения аватара перед сохранением.

**Экспорты:**
- `prepareAvatarImage(file)` → `Promise<string>` — валидирует, кропает, конвертирует в base64
  - Бросает: `Error('invalid-file-type')`, `Error('file-too-large')`

---

### `trizKnowledge.js`
База знаний ТРИЗ + поиск + генерация подсказок по конфликту.

**Экспорты:**
- `TRIZ_KNOWLEDGE` — константа с `{ laws, principles, analogies, teamExamples }`
- `searchKnowledge(query)` → отфильтрованная копия `TRIZ_KNOWLEDGE`
- `getConflictResolutionHints(profileA, profileB, comparison)` → `Hint[]` — до 2 принципов ТРИЗ

---

## Правила

- Функции в `utils/` должны быть **чистыми** (без сайд-эффектов, без React-хуков)
- Перед добавлением новой функции — проверьте, нет ли похожей в существующих модулях
- Не добавляйте сюда Firestore-логику — она принадлежит `services/`
