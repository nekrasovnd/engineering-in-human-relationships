import { Check, Copy, RefreshCw, UserMinus, X } from 'lucide-react';
import { formatEgoStateLabel } from '../utils/egoState';
import AvatarBadge from './AvatarBadge';
import SectionCard from './SectionCard';

function PersonRow({ profile, children }) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <AvatarBadge initials={profile.avatarInitials} imageUrl={profile.avatarUrl} size="sm" />
        <div>
          <p className="text-sm font-medium text-white">{profile.name}</p>
          <p className="text-xs text-slate-400">{formatEgoStateLabel(profile.egoState)}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

const ICON_BUTTON =
  'inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs transition disabled:opacity-60';

export default function FriendsPanel({ friends }) {
  const {
    loading,
    canUseFriends,
    friendCode,
    copyState,
    codeValue,
    busyAction,
    message,
    incoming,
    outgoing,
    updateCodeValue,
    generateCode,
    copyCode,
    sendRequest,
    accept,
    decline,
    cancel,
    unfriend,
  } = friends;

  return (
    <SectionCard
      title={`Друзья${friends.friends.length > 0 ? ` · ${friends.friends.length}` : ''}`}
      subtitle="Обменяйтесь личными кодами — после подтверждения друг попадёт в подбор команды и в приглашения. Друзья видят психологический профиль друг друга."
    >
      {!canUseFriends ? (
        <p className="text-sm leading-6 text-slate-400">
          Сначала пройдите анкету: без неё нечего показать друзьям и не из чего подбирать команду.
        </p>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Мой код друга</p>
              {loading ? (
                <p className="mt-3 text-sm text-slate-400">Загружаем...</p>
              ) : friendCode ? (
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <p className="font-display text-2xl tracking-[0.2em] text-white">{friendCode}</p>
                  <button
                    type="button"
                    onClick={copyCode}
                    className={`${ICON_BUTTON} border-slate-700 text-slate-200 hover:border-blue-400`}
                  >
                    <Copy className="h-3.5 w-3.5" />
                    {copyState === 'copied' ? 'Скопирован' : 'Скопировать'}
                  </button>
                  <button
                    type="button"
                    onClick={generateCode}
                    disabled={busyAction === 'code'}
                    title="Старый код перестанет работать, друзья останутся"
                    className={`${ICON_BUTTON} border-slate-700 text-slate-400 hover:text-white`}
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Новый код
                  </button>
                </div>
              ) : (
                <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm leading-6 text-slate-400">
                    Создайте код и отправьте его тому, кого хотите добавить.
                  </p>
                  <button
                    type="button"
                    onClick={generateCode}
                    disabled={busyAction === 'code'}
                    className="shrink-0 rounded-2xl border border-blue-500/40 bg-blue-500/10 px-4 py-2.5 text-sm text-blue-100 transition hover:bg-blue-500/20 disabled:opacity-60"
                  >
                    {busyAction === 'code' ? 'Создаём...' : 'Создать код'}
                  </button>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Добавить по коду</p>
              <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                <input
                  type="text"
                  value={codeValue}
                  onChange={(event) => updateCodeValue(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      sendRequest();
                    }
                  }}
                  maxLength={12}
                  placeholder="Код друга"
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-white outline-none focus:border-blue-400"
                />
                <button
                  type="button"
                  onClick={sendRequest}
                  disabled={busyAction === 'send'}
                  className="shrink-0 rounded-2xl bg-blue-500 px-4 py-3 text-sm font-medium text-white transition hover:bg-blue-400 disabled:opacity-60"
                >
                  {busyAction === 'send' ? 'Отправляем...' : 'Добавить'}
                </button>
              </div>
              {message.text ? (
                <p
                  className={`mt-3 text-sm ${
                    message.tone === 'error' ? 'text-rose-200' : 'text-emerald-200'
                  }`}
                >
                  {message.text}
                </p>
              ) : null}
              {outgoing.length > 0 ? (
                <div className="mt-3 space-y-2">
                  {outgoing.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-3 text-sm text-slate-400"
                    >
                      <span>Заявка по коду {item.code || ''} ждёт подтверждения</span>
                      <button
                        type="button"
                        onClick={() => cancel(item)}
                        disabled={busyAction === `remove:${item.id}`}
                        className="text-xs text-slate-400 underline-offset-2 hover:text-white hover:underline"
                      >
                        Отменить
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          <div className="space-y-4">
            {incoming.length > 0 ? (
              <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-amber-200">
                  Хотят добавить вас · {incoming.length}
                </p>
                <div className="mt-3 space-y-2">
                  {incoming.map((item) => (
                    <PersonRow key={item.friendshipId} profile={item.profile}>
                      <button
                        type="button"
                        onClick={() => accept(item)}
                        disabled={busyAction !== ''}
                        className={`${ICON_BUTTON} border-emerald-400/50 text-emerald-200 hover:bg-emerald-500/10`}
                      >
                        <Check className="h-3.5 w-3.5" />
                        Принять
                      </button>
                      <button
                        type="button"
                        onClick={() => decline(item)}
                        disabled={busyAction !== ''}
                        className={`${ICON_BUTTON} border-slate-700 text-slate-300 hover:border-rose-400`}
                      >
                        <X className="h-3.5 w-3.5" />
                        Отклонить
                      </button>
                    </PersonRow>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Мои друзья</p>
              {friends.friends.length === 0 ? (
                <p className="mt-3 text-sm leading-6 text-slate-400">
                  Пока никого. Друзья появятся здесь, когда примут заявку.
                </p>
              ) : (
                <div className="mt-3 space-y-2">
                  {friends.friends.map((item) => (
                    <PersonRow key={item.friendshipId} profile={item.profile}>
                      <button
                        type="button"
                        onClick={() => unfriend(item)}
                        disabled={busyAction !== ''}
                        title="Удалить из друзей"
                        className={`${ICON_BUTTON} border-slate-700 text-slate-400 hover:border-rose-400 hover:text-rose-200`}
                      >
                        <UserMinus className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Удалить</span>
                      </button>
                    </PersonRow>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </SectionCard>
  );
}
