/* global window, document */
(function () {
  "use strict";

  const cfg = window.NHACHUNG && window.NHACHUNG.ANALYTICS;
  const token = cfg && typeof cfg.CLOUDFLARE_WEB_ANALYTICS_TOKEN === "string"
    ? cfg.CLOUDFLARE_WEB_ANALYTICS_TOKEN.trim()
    : "";

  if (!token) return;

  const script = document.createElement("script");
  script.defer = true;
  script.src = "https://static.cloudflareinsights.com/beacon.min.js";
  script.setAttribute("data-cf-beacon", JSON.stringify({ token }));
  document.head.appendChild(script);
})();
