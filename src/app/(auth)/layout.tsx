export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#fff8f0_0%,#fafaf8_46%,#f5f5f4_100%)] px-4 py-10">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-md items-center justify-center">
        <div className="w-full rounded-[2rem] border border-stone-200/80 bg-white/92 p-8 shadow-sm backdrop-blur">
          {children}
        </div>
      </div>
    </div>
  )
}
