# src/data — Данные предметной области

Статические данные и расчётная логика, специфичная для предметной области приложения (психологические факторы, опросник).

---

## `questionnaire.js`

Центральный модуль всей психологической модели приложения.

### Структуры данных

#### `FACTOR_CONFIG` — массив из 8 факторов
Каждый фактор:
```js
{
  key: string,          // Уникальный ключ (например 'dominance', 'empathy')
  label: string,        // Полное название
  shortLabel: string,   // Короткое название для графиков
  description: string,  // Что измеряет этот фактор
  questions: Question[], // 5 вопросов Likert-scale
  lowPole: string,      // Описание низкого полюса (score 1-3)
  highPole: string,     // Описание высокого полюса (score 7-10)
}
```

#### `LIKERT_OPTIONS` — 5 вариантов ответа
```js
[{ value: 1, label: '...' }, ..., { value: 5, label: '...' }]
```

#### Схема профиля (результат опросника)
```js
{
  factorScores: { [factorKey]: number (1-10) },
  factorReliability: { [factorKey]: number (0-1) },
  egoState: string,            // Вычисленное эго-состояние
  systemIndices: Object,        // Дополнительные системные индексы
  profileIntegrity: number,     // Согласованность ответов (0-10)
  psychologicalVector50: Object, // Вектор из 50 параметров
  answers: { [questionId]: number }, // Сырые ответы
}
```

### Функции

#### `calculateQuestionnaireResult(answers)` → `QuestionnaireResult`
Вычисляет весь профиль из набора ответов. Вызывается один раз при финальном сохранении.

> ⚠️ Критическая функция. Менять только при полном понимании формул.

#### `getInitialAnswers()` → `{ [questionId]: '' }`
Возвращает пустой объект ответов для инициализации формы опросника.

#### `getDisplayFactorScore(factorKey, rawScore)` → `number`
Конвертирует сырой score в отображаемое значение (учитывает инвертированные факторы).

#### `getFactorPoleLabel(factor, score)` → `string`
Возвращает label полюса (`lowPole` или `highPole`) в зависимости от значения.

---

## Правила

- Данные в `data/` — **источник истины** для предметной модели
- Не размещайте здесь UI-логику или Firestore-операции
- При изменении `FACTOR_CONFIG` (добавление фактора/вопроса) — обязательно проверьте:
  - `calculateQuestionnaireResult()` — формулы учитывают новый фактор
  - `compatibility.js` — алгоритм совместимости использует правильные ключи
  - `teamAnalysis.js` — роли и анализ команды не сломаны
  - Все `sanitize*()` в `firestoreDocuments.js` — нормализация корректна
