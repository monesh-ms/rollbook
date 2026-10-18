import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

interface MobileHeaderProps {
	title?: string;
	subtitle?: string;
	action?: React.ReactNode;
}

export function MobileHeader({
	title = "Roll Book",
	subtitle = "",
	action,
}: MobileHeaderProps) {
	const [isDark, setIsDark] = useState(false);

	useEffect(() => {
		setIsDark(document.documentElement.classList.contains("dark"));
	}, []);

	const toggleTheme = () => {
		const html = document.documentElement;
		const next = !isDark;
		setIsDark(next);
		if (next) {
			html.classList.add("dark");
		} else {
			html.classList.remove("dark");
		}
	};

	return (
		<header className="sticky top-0 z-40 flex items-center justify-between h-[60px] px-4 bg-background/95 backdrop-blur-md border-b border-border">
			<div className="flex items-center gap-3">
				<div className="flex items-center justify-center w-8 h-8 font-extrabold text-white rounded-lg bg-gradient-to-br from-teal-700 to-teal-500 shadow-sm">
					R
				</div>
				<div className="flex flex-direction flex-col">
					<span className="text-sm font-bold tracking-tight text-foreground leading-tight">
						{title}
					</span>
					<span className="text-[11px] font-medium text-muted-foreground">
						{subtitle}
					</span>
				</div>
			</div>
			<div className="flex items-center gap-2">
				{action}
				<button
					type="button"
					onClick={toggleTheme}
					className="flex items-center justify-center w-9 h-9 rounded-lg border border-border bg-secondary text-muted-foreground hover:text-foreground transition-colors"
					title="Toggle Theme"
				>
					{isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
				</button>
			</div>
		</header>
	);
}
