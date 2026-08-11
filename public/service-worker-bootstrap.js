(function () {
  const isLocalhost =
    location.hostname === "localhost" ||
    location.hostname === "127.0.0.1" ||
    location.hostname === "::1";

  if (!isLocalhost || !("serviceWorker" in navigator)) return;

  navigator.serviceWorker
    .getRegistrations()
    .then((registrations) =>
      Promise.all(
        registrations.map((registration) => registration.unregister()),
      ),
    )
    .then(() => ("caches" in window ? caches.keys() : []))
    .then((keys) =>
      Array.isArray(keys)
        ? Promise.all(keys.map((key) => caches.delete(key)))
        : undefined,
    )
    .finally(() => {
      if (sessionStorage.getItem("sw-dev-reset-done") !== "1") {
        sessionStorage.setItem("sw-dev-reset-done", "1");
        location.reload();
      }
    });
})();
