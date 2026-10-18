import { SignIn } from "@clerk/tanstack-react-start";
import { createFileRoute } from "@tanstack/react-router";
import { MobileHeader } from "../components/layout/mobile-header";

export const Route = createFileRoute("/sign-in/$")({
	component: SignInPage,
});

function SignInPage() {
	return (
		<div className="flex flex-col min-h-dvh bg-background">
			<MobileHeader title="Roll Book" subtitle="Sign in to continue" />
			<main className="flex-1 flex flex-col items-center justify-center p-4">
				<div className="w-full max-w-sm flex flex-col items-center gap-4">
					<SignIn routing="path" path="/sign-in" />
				</div>
			</main>
		</div>
	);
}
