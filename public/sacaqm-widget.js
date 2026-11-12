(function () {
  const script = document.currentScript;
  if (!script) return;

  const renderWidgets = () => {
    document
      .querySelectorAll("#sacaqm-widget[data-widget], [data-sacaqm-widget][data-widget]")
      .forEach((container) => {
        if (container.dataset.sacaqmInitialized === "true") return;
        container.dataset.sacaqmInitialized = "true";

        const widget = container.dataset.widget || "current-aqi";
        const station = container.dataset.station || "";
        const theme = container.dataset.theme || "light";
        const params = new URLSearchParams({ widget, embed: "1", theme });
        if (station) params.set("station", station);
        const appUrl = new URL("/", script.src);
        appUrl.hash = `/news-widgets?${params.toString()}`;

        const iframe = document.createElement("iframe");
        iframe.src = appUrl.toString();
        iframe.title = `SACAQM ${widget}`;
        iframe.loading = "lazy";
        iframe.width = "100%";
        iframe.height =
          widget === "alert"
            ? "180"
            : widget === "pollutants"
              ? "380"
              : widget === "trend"
                ? "300"
              : widget === "station-selector"
                ? "400"
                : widget === "worst-stations"
                  ? "300"
                : "320";
        iframe.frameBorder = "0";
        iframe.style.display = "block";
        iframe.style.width = "100%";
        iframe.style.border = "0";

        window.addEventListener("message", (event) => {
          if (event.source !== iframe.contentWindow || event.origin !== appUrl.origin) {
            return;
          }
          if (
            event.data?.type !== "sacaqm:resize" ||
            !Number.isFinite(event.data.height)
          ) {
            return;
          }
          iframe.style.height = `${Math.max(80, Math.min(1200, event.data.height))}px`;
        });

        container.appendChild(iframe);
      });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", renderWidgets, { once: true });
  } else {
    renderWidgets();
  }
})();
