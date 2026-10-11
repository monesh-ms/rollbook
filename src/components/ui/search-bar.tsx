import { Search, X } from "lucide-react";
import { parseAsString, useQueryState } from "nuqs";

interface SearchBarProps {
	queryKey?: string;
	placeholder?: string;
}

export function SearchBar({
	queryKey = "q",
	placeholder = "Search by name or sport...",
}: SearchBarProps) {
	const [query, setQuery] = useQueryState(
		queryKey,
		parseAsString.withDefault("").withOptions({ shallow: true }),
	);

	return (
		<div className="px-4 py-2">
			<div className="relative flex items-center w-full">
				<Search className="absolute left-3 w-4 h-4 text-muted-foreground pointer-events-none" />
				<input
					type="search"
					value={query}
					onChange={(e) => setQuery(e.target.value || null)}
					placeholder={placeholder}
					className="w-full h-10 pl-9 pr-8 text-sm rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 transition-all"
				/>
				{query && (
					<button
						type="button"
						onClick={() => setQuery(null)}
						className="absolute right-2.5 p-1 text-muted-foreground hover:text-foreground"
						title="Clear search"
					>
						<X className="w-3.5 h-3.5" />
					</button>
				)}
			</div>
		</div>
	);
}
