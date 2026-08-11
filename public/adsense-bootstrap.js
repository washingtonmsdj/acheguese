(function () {
  const isLocalhost =
    location.hostname === "localhost" ||
    location.hostname === "127.0.0.1" ||
    location.hostname === "::1";

  if (!isLocalhost) {
    const ads = document.createElement("script");
    ads.async = true;
    ads.src =
      "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6454131132519516";
    ads.crossOrigin = "anonymous";
    document.head.appendChild(ads);
  }
})();
