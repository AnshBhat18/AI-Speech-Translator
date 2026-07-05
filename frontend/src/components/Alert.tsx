interface AlertProps {
  type?: 'error' | 'success' | 'info'
  message: string
}

export default function Alert({ type = 'info', message }: AlertProps) {
  const styles = {
    error: 'border-red-500/40 bg-red-500/10 text-red-200',
    success: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200',
    info: 'border-blue-500/40 bg-blue-500/10 text-blue-200',
  }

  return (
    <div
      role="alert"
      className={`rounded-xl border px-4 py-3 text-sm ${styles[type]}`}
    >
      {message}
    </div>
  )
}
