import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import Link from 'next/link'
import { notFound } from 'next/navigation'

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

async function updateTaskStatus(formData: FormData) {
  'use server'

  const taskId = formData.get('taskId') as string
  const boardId = formData.get('boardId') as string
  const newStatus = formData.get('newStatus') as string

  const supabase = await createClient()
  await supabase.from('tasks').update({ status: newStatus }).eq('id', taskId)
  revalidatePath(`/dashboard/${boardId}`)
}

async function deleteTask(formData: FormData) {
  'use server'

  const taskId = formData.get('taskId') as string
  const boardId = formData.get('boardId') as string

  const supabase = await createClient()
  await supabase.from('tasks').delete().eq('id', taskId)
  revalidatePath(`/dashboard/${boardId}`)
}

const columns = [
  { key: 'todo', label: 'To Do' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'done', label: 'Done' },
]

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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {columns.map((col) => {
          const columnTasks = tasks?.filter((t) => t.status === col.key) || []

          return (
            <div key={col.key} className="bg-gray-100 rounded-lg p-4">
              <h2 className="font-semibold mb-3">
                {col.label} ({columnTasks.length})
              </h2>

              <div className="space-y-2">
                {columnTasks.map((task) => (
                  <div
                    key={task.id}
                    className="bg-white p-3 rounded-md shadow-sm"
                  >
                    <p className="text-sm mb-2">{task.title}</p>

                    <div className="flex justify-between items-center text-xs">
                      <div className="flex gap-2">
                        {columns
                          .filter((c) => c.key !== col.key)
                          .map((c) => (
                            <form key={c.key} action={updateTaskStatus}>
                              <input type="hidden" name="taskId" value={task.id} />
                              <input type="hidden" name="boardId" value={boardId} />
                              <input type="hidden" name="newStatus" value={c.key} />
                              <button
                                type="submit"
                                className="text-blue-600 hover:underline"
                              >
                                → {c.label}
                              </button>
                            </form>
                          ))}
                      </div>

                      <form action={deleteTask}>
                        <input type="hidden" name="taskId" value={task.id} />
                        <input type="hidden" name="boardId" value={boardId} />
                        <button
                          type="submit"
                          className="text-red-600 hover:underline"
                        >
                          Delete
                        </button>
                      </form>
                    </div>
                  </div>
                ))}

                {columnTasks.length === 0 && (
                  <p className="text-xs text-gray-400 text-center py-4">
                    No tasks
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}