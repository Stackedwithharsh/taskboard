'use client'

import { useState } from 'react'
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { createClient } from '@/utils/supabase/client'

type Task = {
  id: string
  title: string
  status: string
  board_id: string
  position: number
}

const columns = [
  { key: 'todo', label: 'To Do' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'done', label: 'Done' },
]

function TaskCard({ task, onDelete }: { task: Task; onDelete: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-white p-3 rounded-md shadow-sm cursor-grab active:cursor-grabbing"
    >
      <div className="flex justify-between items-start gap-2">
        <p className="text-sm">{task.title}</p>
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => onDelete(task.id)}
          className="text-xs text-red-600 hover:underline shrink-0"
        >
          Delete
        </button>
      </div>
    </div>
  )
}

function Column({
  columnKey,
  label,
  tasks,
  onDelete,
}: {
  columnKey: string
  label: string
  tasks: Task[]
  onDelete: (id: string) => void
}) {
  const { setNodeRef } = useDroppable({ id: columnKey })

  return (
    <div ref={setNodeRef} className="bg-gray-100 rounded-lg p-4 min-h-[200px]">
      <h2 className="font-semibold mb-3">
        {label} ({tasks.length})
      </h2>
      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} onDelete={onDelete} />
          ))}
          {tasks.length === 0 && (
            <p className="text-xs text-gray-400 text-center py-4">No tasks</p>
          )}
        </div>
      </SortableContext>
    </div>
  )
}

export default function BoardClient({ initialTasks }: { initialTasks: Task[] }) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const supabase = createClient()

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  )

  function handleDelete(taskId: string) {
    setTasks((prev) => prev.filter((t) => t.id !== taskId))
    supabase.from('tasks').delete().eq('id', taskId).then()
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over) return

    const activeTask = tasks.find((t) => t.id === active.id)
    if (!activeTask) return

    // Determine target column: either dropped on a column directly, or on another task
    let newStatus = over.id as string
    const overTask = tasks.find((t) => t.id === over.id)
    if (overTask) {
      newStatus = overTask.status
    }

    if (activeTask.status === newStatus) return

    // Optimistic update
    setTasks((prev) =>
      prev.map((t) => (t.id === activeTask.id ? { ...t, status: newStatus } : t))
    )

    // Persist to Supabase
    const { error } = await supabase
      .from('tasks')
      .update({ status: newStatus })
      .eq('id', activeTask.id)

    if (error) {
      // revert on failure
      setTasks((prev) =>
        prev.map((t) => (t.id === activeTask.id ? { ...t, status: activeTask.status } : t))
      )
    }
  }

  return (
         <DndContext id="taskboard-dnd" sensors={sensors} onDragEnd={handleDragEnd}>      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {columns.map((col) => (
          <Column
            key={col.key}
            columnKey={col.key}
            label={col.label}
            tasks={tasks.filter((t) => t.status === col.key)}
            onDelete={handleDelete}
          />
        ))}
      </div>
    </DndContext>
  )
}