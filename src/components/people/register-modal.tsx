import { X } from "lucide-react";
import { useState } from "react";

interface RegisterModalProps {
	isOpen: boolean;
	onClose: () => void;
	onRegister: (data: {
		name: string;
		type: "member" | "student" | "guest";
		batch: "morning" | "evening" | "both";
		gameIds: string[];
		contactNumber?: string;
		address?: string;
		customMonthlyAmount?: number;
	}) => void;
	availableGames: Array<{ id: string; name: string }>;
}

export function RegisterModal({
	isOpen,
	onClose,
	onRegister,
	availableGames,
}: RegisterModalProps) {
	const [name, setName] = useState("");
	const [type, setType] = useState<"member" | "student" | "guest">("student");
	const [batch, setBatch] = useState<"morning" | "evening" | "both">("morning");
	const [selectedGameId, setSelectedGameId] = useState(
		availableGames[0]?.id || "game_badminton",
	);
	const [phone, setPhone] = useState("");
	const [address, setAddress] = useState("");
	const [customRate, setCustomRate] = useState("");

	if (!isOpen) return null;

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!name.trim()) return;

		onRegister({
			name: name.trim(),
			type,
			batch,
			gameIds: [selectedGameId],
			contactNumber: phone.trim() || undefined,
			address: address.trim() || undefined,
			customMonthlyAmount: customRate
				? parseInt(customRate, 10) * 100
				: undefined,
		});
		onClose();
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
			<div className="w-full max-w-sm p-4 rounded-xl border border-border bg-background shadow-xl">
				<div className="flex items-center justify-between pb-3 border-b border-border">
					<span className="text-sm font-bold text-foreground">
						Register Academy Member
					</span>
					<button
						type="button"
						onClick={onClose}
						className="p-1 text-muted-foreground hover:text-foreground"
					>
						<X className="w-4 h-4" />
					</button>
				</div>

				<form onSubmit={handleSubmit} className="flex flex-col gap-3 pt-3">
					<label className="block text-[11px] font-semibold text-muted-foreground">
						Full Name
						<input
							type="text"
							required
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="e.g. Rohan Varma"
							className="w-full h-9 px-3 mt-1 text-xs rounded-lg border border-input bg-background text-foreground font-normal focus:ring-1 focus:ring-teal-700"
						/>
					</label>

					<div className="grid grid-cols-2 gap-2">
						<label className="block text-[11px] font-semibold text-muted-foreground">
							Category
							<select
								value={type}
								onChange={(e) => setType(e.target.value as any)}
								className="w-full h-9 px-2.5 mt-1 text-xs rounded-lg border border-input bg-background text-foreground font-normal"
							>
								<option value="student">Student (Coached)</option>
								<option value="member">Member (Regular)</option>
								<option value="guest">Guest (Per visit)</option>
							</select>
						</label>
						<label className="block text-[11px] font-semibold text-muted-foreground">
							Sport
							<select
								value={selectedGameId}
								onChange={(e) => setSelectedGameId(e.target.value)}
								className="w-full h-9 px-2.5 mt-1 text-xs rounded-lg border border-input bg-background text-foreground font-normal"
							>
								{availableGames.map((g) => (
									<option key={g.id} value={g.id}>
										{g.name}
									</option>
								))}
							</select>
						</label>
					</div>

					<div className="grid grid-cols-2 gap-2">
						<label className="block text-[11px] font-semibold text-muted-foreground">
							Batch
							<select
								value={batch}
								onChange={(e) => setBatch(e.target.value as any)}
								className="w-full h-9 px-2.5 mt-1 text-xs rounded-lg border border-input bg-background text-foreground font-normal"
							>
								<option value="morning">Morning</option>
								<option value="evening">Evening</option>
								<option value="both">Both Batches</option>
							</select>
						</label>
						<label className="block text-[11px] font-semibold text-muted-foreground">
							Phone
							<input
								type="tel"
								value={phone}
								onChange={(e) => setPhone(e.target.value)}
								placeholder="10-digit number"
								className="w-full h-9 px-3 mt-1 text-xs rounded-lg border border-input bg-background text-foreground font-normal"
							/>
						</label>
					</div>

					<label className="block text-[11px] font-semibold text-muted-foreground">
						Address
						<input
							type="text"
							value={address}
							onChange={(e) => setAddress(e.target.value)}
							placeholder="Area / street"
							className="w-full h-9 px-3 mt-1 text-xs rounded-lg border border-input bg-background text-foreground font-normal"
						/>
					</label>

					<label className="block text-[11px] font-semibold text-muted-foreground">
						Custom Monthly Fee (₹, optional override)
						<input
							type="number"
							value={customRate}
							onChange={(e) => setCustomRate(e.target.value)}
							placeholder="Standard rate applied if empty"
							className="w-full h-9 px-3 mt-1 text-xs rounded-lg border border-input bg-background text-foreground font-normal mono-num"
						/>
					</label>

					<div className="flex justify-end gap-2 pt-2">
						<button
							type="button"
							onClick={onClose}
							className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-border text-foreground hover:bg-secondary"
						>
							Cancel
						</button>
						<button
							type="submit"
							className="px-3 py-1.5 text-xs font-bold rounded-lg bg-teal-700 text-white hover:bg-teal-800"
						>
							Save Member
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
