"use client"

interface ErrorMessageProps {
  message: string
  onClose?: () => void
}

export default function ErrorMessage({ message, onClose }: ErrorMessageProps) {
  return (
    <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 flex items-center justify-between">
      <span>{message}</span>
      {onClose && (
        <button onClick={onClose} className="text-red-600 hover:text-red-800">
          ✕
        </button>
      )}
    </div>
  )
}
