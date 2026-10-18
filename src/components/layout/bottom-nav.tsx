import { Link, useRouterState } from "@tanstack/react-router";
import { Calendar, CreditCard, Settings, Users } from "lucide-react";

export function BottomNav() {
	const routerState = useRouterState();
	const currentPath = routerState.location.pathname;

	if (currentPath.startsWith("/sign-in")) {
		return null;
	}

	const isAttendance = currentPath === "/" || currentPath === "/attendance";
	const isSettle = currentPath.startsWith("/settle");
	const isPeople = currentPath.startsWith("/people");
	const isSettings = currentPath.startsWith("/settings");

	return (
		<nav className="bottom-tab-bar" aria-label="Main Navigation">
			<Link
				to="/attendance"
				className={`tab-item ${isAttendance ? "is-active" : ""}`}
			>
				<Calendar className="w-5 h-5" />
				<span>Today</span>
			</Link>
			<Link to="/settle" className={`tab-item ${isSettle ? "is-active" : ""}`}>
				<CreditCard className="w-5 h-5" />
				<span>Settle</span>
			</Link>
			<Link to="/people" className={`tab-item ${isPeople ? "is-active" : ""}`}>
				<Users className="w-5 h-5" />
				<span>People</span>
			</Link>
			<Link
				to="/settings"
				className={`tab-item ${isSettings ? "is-active" : ""}`}
			>
				<Settings className="w-5 h-5" />
				<span>Settings</span>
			</Link>
		</nav>
	);
}
