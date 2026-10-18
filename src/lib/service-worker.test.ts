import { describe, expect, test } from "bun:test";

// Loads public/sw.js with fake browser globals and returns the fetch listener.
async function loadFetchListener(
	fakeFetch: () => Promise<unknown>,
	fakeCaches: unknown,
) {
	const listeners: Record<string, (event: unknown) => void> = {};
	const fakeSelf = {
		location: { origin: "https://app.test" },
		addEventListener: (type: string, fn: (event: unknown) => void) => {
			listeners[type] = fn;
		},
	};
	const source = await Bun.file(
		new URL("../../public/sw.js", import.meta.url),
	).text();
	new Function("self", "caches", "fetch", source)(
		fakeSelf,
		fakeCaches,
		fakeFetch,
	);
	return listeners.fetch;
}

const offlineCaches = {
	match: async (key: string) =>
		key === "/offline.html" ? "offline-page" : undefined,
	open: async () => ({
		match: async () => undefined,
		put: async () => {},
	}),
};

/** Runs the fetch listener and returns the promise it answered with, or null if it did not answer. */
function answerOf(
	fetchListener: (event: unknown) => void,
	url: string,
	options: { method?: string; mode?: string } = {},
): Promise<unknown> | null {
	let answer: Promise<unknown> | null = null;
	fetchListener({
		request: {
			url,
			method: options.method ?? "GET",
			mode: options.mode ?? "cors",
		},
		respondWith: (promise: Promise<unknown>) => {
			answer = promise;
		},
	});
	return answer;
}

describe("service worker", () => {
	test("never answers server function calls, so data always comes from the server", async () => {
		const listener = await loadFetchListener(
			async () => "network",
			offlineCaches,
		);
		expect(
			answerOf(listener, "https://app.test/_serverFn/abc?payload=1"),
		).toBeNull();
	});

	test("never answers writes or other origins", async () => {
		const listener = await loadFetchListener(
			async () => "network",
			offlineCaches,
		);
		expect(
			answerOf(listener, "https://app.test/attendance", { method: "POST" }),
		).toBeNull();
		expect(answerOf(listener, "https://clerk.example/v1/client")).toBeNull();
	});

	test("page loads come from the network, not a cache", async () => {
		const listener = await loadFetchListener(
			async () => "live-page",
			offlineCaches,
		);
		const answer = answerOf(listener, "https://app.test/settle", {
			mode: "navigate",
		});
		expect(await answer).toBe("live-page");
	});

	test("a page load with no connection shows the offline page", async () => {
		const listener = await loadFetchListener(async () => {
			throw new TypeError("offline");
		}, offlineCaches);
		const answer = answerOf(listener, "https://app.test/settle", {
			mode: "navigate",
		});
		expect(await answer).toBe("offline-page");
	});
});
