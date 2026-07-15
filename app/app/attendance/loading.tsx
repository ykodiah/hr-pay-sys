export default function Loading() {
  return (
    <div className="p-6">
      <div className="space-y-6 animate-pulse">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <div className="h-8 w-64 rounded bg-slate-200" />
            <div className="h-4 w-80 max-w-full rounded bg-slate-200" />
          </div>
          <div className="flex items-center gap-4">
            <div className="h-10 w-28 rounded bg-slate-200" />
            <div className="h-10 w-40 rounded bg-slate-200" />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {[...Array(5)].map((_, index) => (
            <div key={index} className="h-28 rounded-xl border border-slate-100 bg-slate-200/70" />
          ))}
        </div>

        <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="mb-4 grid gap-3 lg:grid-cols-3 xl:grid-cols-6">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="h-10 rounded-lg bg-slate-200" />
            ))}
          </div>
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-4">
              {[...Array(3)].map((_, index) => (
                <div key={index} className="h-32 rounded-lg bg-slate-200" />
              ))}
            </div>
            <div className="space-y-4">
              {[...Array(3)].map((_, index) => (
                <div key={index} className="h-36 rounded-lg bg-slate-200" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
