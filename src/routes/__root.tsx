import { TanStackDevtools } from "@tanstack/react-devtools";
import {
	createRootRoute,
	HeadContent,
	redirect,
	Scripts,
} from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { NuqsAdapter } from "nuqs/adapters/tanstack-router";
import { useEffect } from "react";
import { BottomNav } from "../components/layout/bottom-nav";
import ClerkProvider from "../integrations/clerk/provider";
import { getAuthUser } from "../lib/api/auth";

import appCss from "../styles.css?url";

export const Route = createRootRoute({
	beforeLoad: async ({ location }) => {
		if (location.pathname.startsWith("/sign-in")) {
			return;
		}
		const auth = await getAuthUser();
		if (!auth.userId) {
			throw redirect({
				to: "/sign-in/$",
			});
		}
	},
	head: () => ({
		meta: [
			{
				charSet: "utf-8",
			},
			{
				name: "viewport",
				content:
					"width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
			},
			{
				name: "theme-color",
				content: "#0f766e",
			},
			{
				name: "apple-mobile-web-app-capable",
				content: "yes",
			},
			{
				name: "apple-mobile-web-app-title",
				content: "Roll Book",
			},
			{
				title: "Roll Book",
			},
		],
		links: [
			{
				rel: "stylesheet",
				href: appCss,
			},
			{
				rel: "manifest",
				href: "/manifest.webmanifest",
			},
			{
				rel: "icon",
				type: "image/png",
				href: "/icons/icon-192.png",
			},
			{
				rel: "apple-touch-icon",
				href: "/icons/apple-touch-icon.png",
			},
		],
	}),
	shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
	useEffect(() => {
		if (import.meta.env.PROD && "serviceWorker" in navigator) {
			void navigator.serviceWorker.register("/sw.js");
		}
	}, []);

	return (
		<html lang="en">
			<head>
				<HeadContent />
			</head>
			<body>
				<ClerkProvider>
					<NuqsAdapter>
						<div className="mobile-shell">
							{children}
							<BottomNav />
						</div>
					</NuqsAdapter>

					<TanStackDevtools
						config={{
							position: "bottom-right",
						}}
						plugins={[
							{
								name: "Tanstack Router",
								render: <TanStackRouterDevtoolsPanel />,
							},
						]}
					/>
				</ClerkProvider>
				<Scripts />
			</body>
		</html>
	);
}
