import { TabBar } from '@/components/layout/TabBar'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <div className="mx-auto max-w-md min-h-screen">
        {children}
      </div>
      <TabBar />
    </div>
  )
}
