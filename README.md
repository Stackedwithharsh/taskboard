# TaskBoard

A full-stack Kanban-style task management app with authentication, real-time persistence, and drag-and-drop task organization.

**Live Demo:** https://taskboard-seven-eta.vercel.app/
**Repository:** https://github.com/Stackedwithharsh/taskboard

## Features

- Email/password authentication (sign up, log in, log out)
- Create, view, and delete multiple boards
- Create, delete, and move tasks across To Do / In Progress / Done columns
- Drag-and-drop task management with dnd-kit
- Data secured per-user with PostgreSQL Row Level Security (RLS)
- Protected routes — dashboard requires authentication
- Responsive design (mobile, tablet, desktop)

## Tech Stack

- **Framework:** Next.js 16 (App Router), TypeScript
- **Backend/Database:** Supabase (Auth + PostgreSQL)
- **Styling:** Tailwind CSS
- **Drag & Drop:** dnd-kit
- **Deployment:** Vercel

## Architecture Notes

- Server Components handle initial data fetching (boards, tasks) directly from Supabase for fast page loads.
- Server Actions handle mutations (create/delete board, create task) without needing a separate API layer.
- A dedicated Client Component (`BoardClient.tsx`) manages drag-and-drop interactivity, with optimistic UI updates that revert automatically if the database write fails.
- Row Level Security policies on both `boards` and `tasks` tables ensure users can only read or modify their own data — enforced at the database level, not just in application code.
- Middleware refreshes the Supabase auth session on every request to keep protected routes reliable.

## Running Locally

1. Clone the repository:
```bash
   git clone https://github.com/Stackedwithharsh/taskboard.git
   cd taskboard
```

2. Install dependencies:
```bash
   npm install
```

3. Create a Supabase project at [supabase.com](https://supabase.com), then run the SQL below in the Supabase SQL Editor to set up the schema:

```sql
   create table boards (
     id uuid primary key default gen_random_uuid(),
     user_id uuid references auth.users not null,
     title text not null,
     created_at timestamp with time zone default now()
   );

   create table tasks (
     id uuid primary key default gen_random_uuid(),
     board_id uuid references boards on delete cascade not null,
     user_id uuid references auth.users not null,
     title text not null,
     description text,
     status text not null default 'todo' check (status in ('todo', 'in_progress', 'done')),
     position integer not null default 0,
     created_at timestamp with time zone default now()
   );

   alter table boards enable row level security;
   alter table tasks enable row level security;

   create policy "Users can view own boards" on boards for select using (auth.uid() = user_id);
   create policy "Users can insert own boards" on boards for insert with check (auth.uid() = user_id);
   create policy "Users can update own boards" on boards for update using (auth.uid() = user_id);
   create policy "Users can delete own boards" on boards for delete using (auth.uid() = user_id);

   create policy "Users can view own tasks" on tasks for select using (auth.uid() = user_id);
   create policy "Users can insert own tasks" on tasks for insert with check (auth.uid() = user_id);
   create policy "Users can update own tasks" on tasks for update using (auth.uid() = user_id);
   create policy "Users can delete own tasks" on tasks for delete using (auth.uid() = user_id);
```

4. Copy `.env.example` to `.env.local` and fill in your Supabase project credentials (found in Supabase under Settings → API Keys):