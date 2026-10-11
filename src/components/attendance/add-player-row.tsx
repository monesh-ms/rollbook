import { Plus } from "lucide-react";
import { useState } from "react";

interface AddPlayerRowProps {
	batch: "morning" | "evening";
	onAddPlayer: (name: string) => void;
}

export function AddPlayerRow({ batch, onAddPlayer }: AddPlayerRowProps) {
	const [name, setName] = useState("");

	const handleAdd = (e: React.FormEvent) => {
		e.preventDefault();
		if (!name.trim()) return;
		onAddPlayer(name.trim());
		setName("");
	};

	return (
		<form
			onSubmit={handleAdd}
			className="flex items-center gap-2 p-3 bg-secondary/30 border-t border-border"
		>
			<input
				type="text"
				value={name}
				onChange={(e) => setName(e.target.value)}
				placeholder={`Add attendee to ${batch} session...`}
				className="flex-1 h-8 px-2.5 text-xs rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-teal-700 focus:border-teal-700"
			/>
			<button
				type="submit"
				disabled={!name.trim()}
				className="flex items-center gap-1 h-8 px-3 text-xs font-semibold rounded-md bg-secondary border border-border text-foreground hover:bg-secondary/80 disabled:opacity-40 transition-colors"
			>
				<Plus className="w-3.5 h-3.5" />
				<span>Add</span>
			</button>
		</form>
	);
}
