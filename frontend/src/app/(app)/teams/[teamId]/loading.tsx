export default function TeamLoading() {
  return (
    <div className="mx-auto max-w-[860px]">
      <header className="mb-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="h-3 w-28 animate-pulse rounded bg-paper-deep" />
            <div className="mt-1 h-9 w-56 animate-pulse rounded bg-paper-deep" />
            <div className="mt-1.5 h-4 w-40 animate-pulse rounded bg-paper-deep" />
          </div>
          <div className="h-7 w-16 animate-pulse rounded bg-paper-deep" />
        </div>
      </header>

      <div className="mb-6 flex gap-3">
        <div className="h-10 w-24 animate-pulse rounded-md bg-paper-deep" />
        <div className="h-10 w-28 animate-pulse rounded-md bg-paper-deep" />
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-md bg-paper-deep" />
        ))}
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-44 animate-pulse rounded-md bg-paper-deep" />
        ))}
      </div>
    </div>
  );
}
