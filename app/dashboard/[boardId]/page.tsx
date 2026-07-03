import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import BoardClient from './BoardClient'

async function createTask(formData: FormData) {
  'use server'

  const title = formData.get('title') as string
  const boardId = formData.get('boardId') as string
  if (!title || title.trim() === '') return

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase.from('tasks').insert({
    title,
    board_id: boardId,
    user_id: user.id,
    status: 'todo',
  })
  revalidatePath(`/dashboard/${boardId}`)
}

export default async function BoardPage({
  params,
}: {
  params: Promise<{ boardId: string }>
}) {
  const { boardId } = await params
  const supabase = await createClient()

  const { data: board } = await supabase
    .from('boards')
    .select('*')
    .eq('id', boardId)
    .single()

  if (!board) notFound()

  const { data: tasks } = await supabase
    .from('tasks')
    .select('*')
    .eq('board_id', boardId)
    .order('position', { ascending: true })

  return (
    <div className="max-w-6xl mx-auto">
      <Link href="/dashboard" className="text-sm text-blue-600 hover:underline mb-4 inline-block">
        ← Back to boards
      </Link>
      <h1 className="text-2xl font-bold mb-6">{board.title}</h1>

      <form action={createTask} className="mb-8 flex gap-2">
        <input type="hidden" name="boardId" value={boardId} />
        <input
          type="text"
          name="title"
          placeholder="New task..."
          required
          className="flex-1 px-3 py-2 border rounded-md"
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Add Task
        </button>
      </form>

      <BoardClient initialTasks={tasks || []} />
    </div>
  )
}