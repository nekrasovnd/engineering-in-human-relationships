export default function LoadingScreen({ label = 'Секунду, всё почти готово...' }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-aurora px-6">
      <div className="rounded-3xl border border-slate-800 bg-slate-900/70 px-8 py-10 text-center shadow-glow backdrop-blur">
        <div className="mx-auto mb-4 h-14 w-14 animate-pulse rounded-full border border-blue-400/40 bg-blue-500/20" />
        <p className="font-display text-xl text-white">{label}</p>
        <p className="mt-2 text-sm text-slate-400">
          Сейчас откроем нужный экран.
        </p>
      </div>
    </div>
  );
}
