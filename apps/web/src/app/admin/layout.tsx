import { redirect } from 'next/navigation'
import { checkIsAdmin } from '@/lib/admin'
import { AdminSidebar } from '@/features/admin/components/AdminSidebar'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const isAdmin = await checkIsAdmin()

  if (!isAdmin) {
    redirect('/')
  }

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)]">
      <AdminSidebar />
      <div className="flex-1 overflow-auto">
        <div className="w-full px-4 py-6 md:px-8">
          {children}
        </div>
      </div>
    </div>
  )
}
