export function Notice({
	tone = "error",
	children,
}: {
	tone?: "error" | "success";
	children: React.ReactNode;
}) {
	const styles =
		tone === "error"
			? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800"
			: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800";
	return (
		<p
			role={tone === "error" ? "alert" : "status"}
			className={`px-3 py-2 text-xs font-semibold rounded-lg border ${styles}`}
		>
			{children}
		</p>
	);
}
