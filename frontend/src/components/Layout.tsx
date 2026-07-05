import type { ReactNode } from 'react'

interface LayoutProps {
  title: string
  description?: string
  children: ReactNode
}

export default function Layout({ title, description, children }: LayoutProps) {
  return (
    <main className="flex-1 overflow-y-auto p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-white">{title}</h1>
        {description && (
          <p className="mt-2 text-slate-400">{description}</p>
        )}
      </header>
      {children}
    </main>
  )
}
