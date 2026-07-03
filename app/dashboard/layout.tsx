import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-4 sm:px-6 py-4 flex flex-col sm:flex-row justify-between sm:items-center gap-2">
        <Link href="/dashboard" className="font-bold text-lg">
          TaskBoard
        </Link>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600 truncate max-w-[200px]">{user.email}</span>
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="text-sm text-red-600 hover:underline whitespace-nowrap"
            >
              Log out
            </button>
          </form>
        </div>
      </nav>
      <main className="p-6">{children}</main>
    </div>
  )
}