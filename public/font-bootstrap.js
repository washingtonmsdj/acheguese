(function () {
  "use strict";

  var link = document.querySelector("link[data-public-font-stylesheet]");
  if (!link) return;

  var activated = false;
  var activate = function () {
    if (activated) return;
    activated = true;
    link.rel = "stylesheet";
    link.removeAttribute("as");
    link.removeAttribute("fetchpriority");
  };

  if ("requestAnimationFrame" in window) {
    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(activate);
    });
    return;
  }

  window.setTimeout(activate, 0);
})();
