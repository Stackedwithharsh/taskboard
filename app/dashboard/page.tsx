import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { revalidatePath } from 'next/cache'

async function createBoard(formData: FormData) {
  'use server'

  const title = formData.get('title') as string
  if (!title || title.trim() === '') return

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase.from('boards').insert({ title, user_id: user.id })
  revalidatePath('/dashboard')
}

async function deleteBoard(formData: FormData) {
  'use server'

  const boardId = formData.get('boardId') as string
  const supabase = await createClient()
  await supabase.from('boards').delete().eq('id', boardId)
  revalidatePath('/dashboard')
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: boards } = await supabase
    .from('boards')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Your Boards</h1>

      <form action={createBoard} className="mb-8 flex gap-2">
        <input
          type="text"
          name="title"
          placeholder="New board name..."
          required
          className="flex-1 px-3 py-2 border rounded-md"
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Create Board
        </button>
      </form>

      {boards && boards.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {boards.map((board) => (
            <div
              key={board.id}
              className="bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <Link href={`/dashboard/${board.id}`}>
                <h2 className="font-semibold text-lg mb-2">{board.title}</h2>
                <p className="text-sm text-gray-500">
                  Created {new Date(board.created_at).toLocaleDateString()}
                </p>
              </Link>
              <form action={deleteBoard} className="mt-3">
                <input type="hidden" name="boardId" value={board.id} />
                <button
                  type="submit"
                  className="text-sm text-red-600 hover:underline"
                >
                  Delete
                </button>
              </form>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 text-center py-12">
          No boards yet. Create your first one above!
        </p>
      )}
    </div>
  )
}