interface Props {
  value: string;
  onChange: (value: string) => void;
}

export function SearchBar({ value, onChange }: Props) {
  return (
    <div className="relative mb-4">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
        🔍
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search chats and users..."
        className="w-full pl-10 pr-10 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Clear search"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-200 text-lg leading-none"
        >
          ×
        </button>
      )}
    </div>
  );
}
