export default function Ticker({ titulos }: { titulos: string[] }) {
  return (
    <div className="overflow-hidden border-b border-ink bg-ink text-paper" aria-hidden>
      <div className="ticker-track kicker flex w-max gap-10 whitespace-nowrap py-2">
        {[0, 1].map((n) => (
          <div key={n} className="flex gap-10">
            <span>En esta edición</span>
            {titulos.map((t, i) => (
              <span key={`${i}-${n}`}>✦ {t}</span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
