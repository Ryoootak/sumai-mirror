export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] bg-[radial-gradient(circle_at_top,#fff8f0_0%,#fafaf8_46%,#f5f5f4_100%)] px-3 py-3 sm:px-4 sm:py-6">
      <div className="mx-auto flex min-h-[calc(100dvh-1.5rem)] max-w-md items-center justify-center sm:min-h-[calc(100dvh-3rem)]">
        <div className="w-full rounded-[1.75rem] border border-stone-200/80 bg-white/92 p-5 shadow-sm backdrop-blur sm:rounded-[2rem] sm:p-8">
          {children}
        </div>
      </div>
    </div>
  )
}
