import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center px-6">
        <h1 className="text-4xl font-bold mb-4">TaskBoard</h1>
        <p className="text-gray-600 mb-8 max-w-md mx-auto">
          A simple, fast Kanban board to organize your projects. Sign up and start
          tracking tasks in seconds.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/signup"
            className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700"
          >
            Get Started
          </Link>
          <Link
            href="/login"
            className="border border-gray-300 px-6 py-3 rounded-md hover:bg-gray-100"
          >
            Log In
          </Link>
        </div>
      </div>
    </div>
  )
}