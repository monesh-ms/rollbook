// Makes Roll Book installable and shows an offline page when there is no connection.
// It stores no data. Pages are rendered by the server with live attendance and payments,
// and server function calls (/_serverFn/) always go to the network. Neither is cached.

const CACHE = "rollbook-v1";
const PRECACHE = [
	"/offline.html",
	"/manifest.webmanifest",
	"/icons/icon-192.png",
	"/icons/icon-512.png",
	"/icons/icon-maskable-512.png",
	"/icons/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
	event.waitUntil(
		caches
			.open(CACHE)
			.then((cache) => cache.addAll(PRECACHE))
			.then(() => self.skipWaiting()),
	);
});

self.addEventListener("activate", (event) => {
	event.waitUntil(
		caches
			.keys()
			.then((keys) =>
				Promise.all(
					keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)),
				),
			)
			.then(() => self.clients.claim()),
	);
});

self.addEventListener("fetch", (event) => {
	const { request } = event;
	const url = new URL(request.url);
	if (request.method !== "GET" || url.origin !== self.location.origin) return;
	if (url.pathname.startsWith("/_serverFn/")) return;

	if (request.mode === "navigate") {
		event.respondWith(fetch(request).catch(() => caches.match("/offline.html")));
		return;
	}

	// Build files have hashed names, so a cached copy never goes stale.
	// Limit: old hashed files are kept across deploys. Upgrade path: delete entries
	// the current build no longer references, if the cache grows too large.
	if (url.pathname.startsWith("/assets/")) {
		event.respondWith(
			caches.open(CACHE).then(async (cache) => {
				const cached = await cache.match(request);
				if (cached) return cached;
				const response = await fetch(request);
				if (response.ok) cache.put(request, response.clone());
				return response;
			}),
		);
	}
});
