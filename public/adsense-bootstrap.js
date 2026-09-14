(function () {
  const isLocalhost =
    location.hostname === "localhost" ||
    location.hostname === "127.0.0.1" ||
    location.hostname === "::1";

  if (isLocalhost) return;

  let loaded = false;
  const loadAds = function () {
    if (loaded) return;
    loaded = true;

    const ads = document.createElement("script");
    ads.async = true;
    ads.src =
      "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6454131132519516";
    ads.crossOrigin = "anonymous";
    document.head.appendChild(ads);
  };

  const scheduleAds = function () {
    if ("requestIdleCallback" in window) {
      window.requestIdleCallback(loadAds, { timeout: 2500 });
      return;
    }

    window.setTimeout(loadAds, 1200);
  };

  if (document.readyState === "complete") {
    scheduleAds();
  } else {
    window.addEventListener("load", scheduleAds, { once: true });
  }
})();
