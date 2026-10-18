import { auth } from "@clerk/tanstack-react-start/server";
import { createServerFn } from "@tanstack/react-start";

export async function resolveAuthUser(): Promise<{ userId: string | null }> {
	if (process.env.NODE_ENV === "test") {
		return { userId: "test_user" };
	}
	const session = await auth();
	return { userId: session?.userId ?? null };
}

export const getAuthUser = createServerFn({ method: "GET" }).handler(
	resolveAuthUser,
);

export async function requireAuth(): Promise<{ userId: string }> {
	if (process.env.NODE_ENV === "test") {
		return { userId: "test_user" };
	}
	const session = await auth();
	if (!session?.userId) {
		throw new Response("Unauthorized", { status: 401 });
	}
	return { userId: session.userId };
}
