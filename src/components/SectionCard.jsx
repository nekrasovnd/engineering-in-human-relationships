export default function SectionCard({
  title,
  subtitle,
  action,
  children,
  className = '',
}) {
  return (
    <section
      className={`rounded-[28px] border border-slate-800/90 bg-slate-900/70 p-5 shadow-glow backdrop-blur sm:p-6 ${className}`}
    >
      {(title || subtitle || action) && (
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            {title ? (
              <h2 className="font-display text-xl text-white sm:text-2xl">{title}</h2>
            ) : null}
            {subtitle ? (
              <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-400">
                {subtitle}
              </p>
            ) : null}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
