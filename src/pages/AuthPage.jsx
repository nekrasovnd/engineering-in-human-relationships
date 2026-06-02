import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, BrainCircuit, FlaskConical, HeartHandshake } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const featureCards = [
  {
    icon: BrainCircuit,
    title: 'Профиль из 8 шкал',
    text: '40 вопросов формируют радарную карту, эго-состояние по Берну и вектор из 50 числовых параметров.',
  },
  {
    icon: HeartHandshake,
    title: 'Совместимость и знакомства',
    text: 'Сравнивайте людей, прогнозируйте конфликтность и ловите взаимные совпадения в режиме подбора.',
  },
  {
    icon: FlaskConical,
    title: 'TRIZ-подсказки',
    text: 'Инженерные принципы помогают переводить межличностные противоречия в управляемые решения.',
  },
];

export default function AuthPage() {
  const navigate = useNavigate();
  const { signIn, signUp, resetPassword } = useAuth();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  const title = useMemo(
    () => (mode === 'login' ? 'Вход в систему' : 'Создание аккаунта'),
    [mode],
  );

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setInfo('');

    if (mode === 'register' && form.password !== form.confirmPassword) {
      setError('Пароли не совпадают.');
      return;
    }

    try {
      setLoading(true);
      if (mode === 'login') {
        await signIn(form.email, form.password);
      } else {
        await signUp(form.email, form.password);
      }
      navigate('/');
    } catch (requestError) {
      setError('Не удалось выполнить авторизацию. Проверьте email, пароль и настройки Firebase Auth.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setError('');
    setInfo('');

    if (!form.email.trim()) {
      setError('Сначала введите email, на который нужно отправить письмо для сброса пароля.');
      return;
    }

    try {
      setLoading(true);
      await resetPassword(form.email.trim());
      setInfo('Письмо для сброса пароля отправлено. Проверьте входящие и папку "Спам".');
    } catch (requestError) {
      setError('Не удалось отправить письмо для сброса. Проверьте email и настройки Firebase Auth.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-aurora">
      <div className="mx-auto grid min-h-screen max-w-7xl gap-8 px-4 py-8 lg:grid-cols-[1.1fr_0.9fr] lg:px-6 lg:py-10">
        <div className="rounded-[36px] border border-slate-800 bg-slate-950/65 p-6 shadow-glow backdrop-blur sm:p-8">
          <p className="text-sm uppercase tracking-[0.28em] text-blue-300/80">
            Engineering In Human Relationships
          </p>
          <h1 className="mt-4 max-w-3xl font-display text-4xl leading-tight text-white sm:text-5xl">
            Психологический профайлер для команд, совместимости и конфликтов.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
            Вдохновение — модели отбора людей для экстремальных сред. Здесь это
            превращено в веб-приложение: опросник, совместимость, команды,
            знакомства и база знаний ТРИЗ в одном интерфейсе.
          </p>

          <div className="mt-8 grid gap-4">
            {featureCards.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.title}
                  className="rounded-3xl border border-slate-800 bg-slate-900/75 p-5"
                >
                  <div className="flex items-start gap-4">
                    <div className="rounded-2xl bg-blue-500/10 p-3 text-blue-300">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-display text-xl text-white">{card.title}</p>
                      <p className="mt-2 text-sm leading-7 text-slate-400">
                        {card.text}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-8 rounded-3xl border border-slate-800 bg-slate-900/75 p-5">
            <p className="text-xs uppercase tracking-[0.24em] text-cyan-300">
              Как начать
            </p>
            <ol className="mt-3 space-y-3 text-sm leading-7 text-slate-200">
              <li>1. Зарегистрируйтесь по email и паролю.</li>
              <li>2. Пройдите обязательный опросник из 40 вопросов.</li>
              <li>3. После этого станут доступны команды, сравнение и знакомства.</li>
            </ol>
          </div>
        </div>

        <div className="flex items-center">
          <div className="w-full rounded-[36px] border border-slate-800 bg-slate-950/70 p-6 shadow-glow backdrop-blur sm:p-8">
            <div className="flex rounded-full border border-slate-800 bg-slate-900 p-1">
              {[
                { key: 'login', label: 'Вход' },
                { key: 'register', label: 'Регистрация' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => {
                    setMode(tab.key);
                    setError('');
                    setInfo('');
                  }}
                  className={`flex-1 rounded-full px-4 py-3 text-sm transition ${
                    mode === tab.key
                      ? 'bg-blue-500/20 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="mt-8">
              <p className="font-display text-3xl text-white">{title}</p>
              <p className="mt-2 text-sm leading-7 text-slate-400">
                Firebase Auth используется только для email/password входа.
              </p>
            </div>

            <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
              <label className="block">
                <span className="mb-2 block text-sm text-slate-300">Email</span>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      email: event.target.value,
                    }))
                  }
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-white outline-none transition focus:border-blue-400"
                  placeholder="you@example.com"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm text-slate-300">Пароль</span>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={form.password}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      password: event.target.value,
                    }))
                  }
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-white outline-none transition focus:border-blue-400"
                  placeholder="Минимум 6 символов"
                />
              </label>

              {mode === 'register' ? (
                <label className="block">
                  <span className="mb-2 block text-sm text-slate-300">
                    Повторите пароль
                  </span>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={form.confirmPassword}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        confirmPassword: event.target.value,
                      }))
                    }
                    className="w-full rounded-2xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-white outline-none transition focus:border-blue-400"
                    placeholder="Повторите пароль"
                  />
                </label>
              ) : null}

              {error ? (
                <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                  {error}
                </div>
              ) : null}

              {info ? (
                <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                  {info}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-500 px-4 py-3 font-medium text-white transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span>{loading ? 'Подключаемся...' : title}</span>
                <ArrowRight className="h-4 w-4" />
              </button>

              {mode === 'login' ? (
                <button
                  type="button"
                  onClick={handleResetPassword}
                  disabled={loading}
                  className="w-full rounded-2xl border border-slate-700 px-4 py-3 text-sm text-slate-200 transition hover:border-blue-400 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Забыл пароль
                </button>
              ) : null}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
