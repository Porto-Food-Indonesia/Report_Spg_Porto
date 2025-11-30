"use client"

interface SuccessMessageProps {
  message: string
  onClose?: () => void
}

export default function SuccessMessage({ message, onClose }: SuccessMessageProps) {
  return (
    <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-800 flex items-center justify-between">
      <span>{message}</span>
      {onClose && (
        <button onClick={onClose} className="text-green-600 hover:text-green-800">
          ✕
        </button>
      )}
    </div>
  )
}
