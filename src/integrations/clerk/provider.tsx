export default function AppClerkProvider({
	children,
}: {
	children: React.ReactNode;
}) {
	// Clerk bypassed for prototype / local testing phase as requested
	return <>{children}</>;
}
