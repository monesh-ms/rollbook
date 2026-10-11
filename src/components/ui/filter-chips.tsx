import { parseAsString, useQueryState } from "nuqs";

export interface FilterOption {
	value: string;
	label: string;
	count?: number;
}

interface FilterChipsProps {
	queryKey?: string;
	paramName?: string;
	defaultValue?: string;
	options: FilterOption[];
}

export function FilterChips({
	queryKey,
	paramName,
	defaultValue = "all",
	options,
}: FilterChipsProps) {
	const key = queryKey || paramName || "filter";
	const [activeFilter, setActiveFilter] = useQueryState(
		key,
		parseAsString.withDefault(defaultValue).withOptions({ shallow: true }),
	);

	return (
		<div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
			{options.map((opt) => {
				const isSelected = activeFilter === opt.value;
				return (
					<button
						key={opt.value}
						type="button"
						onClick={() => setActiveFilter(opt.value)}
						className={`px-3 py-1 text-xs font-semibold rounded-full transition-all whitespace-nowrap border ${
							isSelected
								? "bg-foreground text-background border-foreground shadow-sm"
								: "bg-background text-muted-foreground border-border hover:border-foreground/30 hover:text-foreground"
						}`}
					>
						{opt.label}
						{opt.count !== undefined && (
							<span
								className={`ml-1 text-[11px] ${isSelected ? "opacity-90" : "opacity-60"}`}
							>
								({opt.count})
							</span>
						)}
					</button>
				);
			})}
		</div>
	);
}
