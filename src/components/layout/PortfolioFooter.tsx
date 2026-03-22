export function PortfolioFooter() {
  return (
    <footer className="pointer-events-none absolute inset-x-0 bottom-0 z-20 px-4 pt-8 pb-[max(1rem,env(safe-area-inset-bottom,0px))]">
      <div className="pointer-events-auto mx-auto max-w-2xl space-y-3 px-2 text-center text-xs leading-relaxed text-slate-800 sm:text-sm">
        <p className="text-balance">
          Quick quiz with score and scratch reveal. Independent portfolio piece;
          not affiliated with or endorsed by Drimify.
        </p>
        <p className="text-balance text-slate-700">
          Built and iterated with{' '}
          <a
            href="https://cursor.com"
            target="_blank"
            rel="noreferrer"
            className="rounded-sm px-0.5 py-2 font-semibold text-slate-900 underline decoration-slate-400 underline-offset-2 transition-colors [-webkit-tap-highlight-color:transparent] hover:text-[var(--drimify-blue)] active:opacity-80"
          >
            Cursor
          </a>
          .
        </p>
      </div>
    </footer>
  )
}
