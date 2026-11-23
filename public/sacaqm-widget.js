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
                  ? "160"
                : "320";
        iframe.frameBorder = "0";
        iframe.style.display = "block";
        iframe.style.width = "100%";
        iframe.style.border = "0";

        const placeholder = document.createElement("div");
        placeholder.setAttribute("role", "status");
        placeholder.textContent = "Loading Johannesburg air quality…";
        placeholder.style.boxSizing = "border-box";
        placeholder.style.minHeight = `${iframe.height}px`;
        placeholder.style.display = "grid";
        placeholder.style.placeItems = "center";
        placeholder.style.padding = "16px";
        placeholder.style.border = "1px solid #e6edf5";
        placeholder.style.borderRadius = "12px";
        placeholder.style.background = "linear-gradient(110deg, #f8fafc, #fff, #f8fafc)";
        placeholder.style.color = "#52667f";
        placeholder.style.font = "600 14px system-ui, sans-serif";
        iframe.addEventListener("load", () => placeholder.remove(), { once: true });
        iframe.addEventListener("error", () => {
          placeholder.textContent = "The SACAQM widget could not be loaded. Please try again shortly.";
          placeholder.style.color = "#9f1239";
        });

        window.addEventListener("message", (event) => {
          if (event.source !== iframe.contentWindow || event.origin !== appUrl.origin) {
            return;
          }
          if (event.data?.type === "sacaqm:station-change" && typeof event.data.stationId === "string") {
            document.querySelectorAll("iframe").forEach((sibling) => {
              try {
                const siblingUrl = new URL(sibling.src, window.location.href);
                if (siblingUrl.origin !== appUrl.origin || !siblingUrl.hash.startsWith("#/news-widgets")) return;
                const [route, query = ""] = siblingUrl.hash.slice(1).split("?");
                const siblingParams = new URLSearchParams(query);
                siblingParams.set("station", event.data.stationId);
                siblingUrl.hash = `${route}?${siblingParams.toString()}`;
                sibling.src = siblingUrl.toString();
              } catch (_) {}
            });
            return;
          }
          if (event.data?.type !== "sacaqm:resize" || !Number.isFinite(event.data.height)) return;
          iframe.style.height = `${Math.max(80, Math.min(1200, event.data.height))}px`;
        });

        container.setAttribute("aria-busy", "true");
        container.appendChild(placeholder);
        container.appendChild(iframe);
        iframe.addEventListener("load", () => container.removeAttribute("aria-busy"), { once: true });
      });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", renderWidgets, { once: true });
  } else {
    renderWidgets();
  }
})();
