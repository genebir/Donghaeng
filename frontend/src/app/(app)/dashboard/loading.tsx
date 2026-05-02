export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-[1080px]">
      <header className="mb-10">
        <div className="h-3 w-36 animate-pulse rounded bg-paper-deep" />
        <div className="mt-2 h-9 w-72 animate-pulse rounded bg-paper-deep" />
      </header>

      <div className="flex flex-col gap-12">
        <div>
          <div className="mb-4 flex items-center justify-between">
            <div className="h-7 w-52 animate-pulse rounded bg-paper-deep" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-36 animate-pulse rounded-md bg-paper-deep" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
