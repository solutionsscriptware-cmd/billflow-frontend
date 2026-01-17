self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", () => self.clients.claim());

// ❌ DO NOT intercept API requests
self.addEventListener("fetch", (event) => {
  if (event.request.url.includes("/api/")) {
    return; // let browser handle it
  }
});
