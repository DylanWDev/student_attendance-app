export default function FriendlyError({ message }) {
  if (!message) return null
  return (
    <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">
      {message}
    </div>
  )
}
