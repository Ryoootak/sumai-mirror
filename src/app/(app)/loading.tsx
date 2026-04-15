export default function AppLoading() {
  return (
    <div className="min-h-screen bg-[#FAFAF8] px-5 pb-28 pt-10">
      <div className="mx-auto max-w-md space-y-4">
        <div className="overflow-hidden rounded-[1.75rem] border border-stone-200/80 bg-white/80 p-6 shadow-sm">
          <div className="h-3 w-24 rounded-full bg-stone-200" />
          <div className="mt-4 h-9 w-40 rounded-2xl bg-stone-200" />
          <div className="mt-3 h-4 w-56 rounded-full bg-stone-100" />
          <div className="mt-2 h-4 w-44 rounded-full bg-stone-100" />
        </div>

        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="rounded-2xl border border-stone-200/80 bg-white/80 p-4 shadow-sm">
              <div className="h-3 w-14 rounded-full bg-stone-200" />
              <div className="mt-3 h-7 w-10 rounded-xl bg-stone-100" />
            </div>
          ))}
        </div>

        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="rounded-[1.5rem] border border-stone-200/80 bg-white/80 p-5 shadow-sm">
            <div className="h-4 w-32 rounded-full bg-stone-200" />
            <div className="mt-4 h-5 w-40 rounded-full bg-stone-100" />
            <div className="mt-3 h-4 w-full rounded-full bg-stone-100" />
            <div className="mt-2 h-4 w-4/5 rounded-full bg-stone-100" />
          </div>
        ))}
      </div>
    </div>
  )
}
