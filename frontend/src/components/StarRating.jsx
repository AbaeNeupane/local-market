export default function StarRating({ value = 0, max = 5, onChange, size = 20 }) {
  return (
    <div className="flex gap-0.5">
      {[...Array(max)].map((_, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onChange && onChange(i + 1)}
          className={`transition-transform ${onChange ? 'hover:scale-110 cursor-pointer' : 'cursor-default'}`}
          style={{ fontSize: size }}
        >
          <span className={i < value ? 'text-yellow-400' : 'text-gray-600'}>★</span>
        </button>
      ))}
    </div>
  )
}