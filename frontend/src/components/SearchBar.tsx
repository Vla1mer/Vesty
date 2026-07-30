import { Search, X } from "lucide-react";
import { TextInput } from "./ui/TextInput";

interface Props {
  value: string;
  onChange: (value: string) => void;
}

export function SearchBar({ value, onChange }: Props) {
  return (
    <div className="relative mb-4">
      <Search
        size={16}
        aria-hidden="true"
        className="absolute left-3 top-1/2 -translate-y-1/2 text-content-muted"
      />
      <TextInput
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search chats and users..."
        className="rounded-lg pl-10 pr-10"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Clear search"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-content-muted hover:text-content"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}
