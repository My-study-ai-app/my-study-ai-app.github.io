
import express from "express";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "1mb" }));

app.get("/", (req, res) => {
  res.json({
    name: "Study AI",
    status: "online",
    endpoints: ["/api/health", "/api/videos"]
  });
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/videos", async (req, res) => {
  const query = String(req.query.q || "aulas escolares Portugal")
    .slice(0, 150);

  const sources = [
    {
      type: "invidious",
      base: "https://inv.nadeko.net"
    },
    {
      type: "invidious",
      base: "https://invidious.nerdvpn.de"
    },
    {
      type: "invidious",
      base: "https://invidious.privacyredirect.com"
    },
    {
      type: "piped",
      base: "https://pipedapi.adminforge.de"
    }
  ];

  for (const source of sources) {
    try {
      const url = source.type === "invidious"
        ? new URL("/api/v1/search", source.base)
        : new URL("/search", source.base);

      url.searchParams.set("q", query);

      if (source.type === "invidious") {
        url.searchParams.set("type", "video");
      }

      const response = await fetch(url, {
        signal: AbortSignal.timeout(7000),
        headers: { Accept: "application/json" }
      });

      if (!response.ok) continue;

      const data = await response.json();
      const items = Array.isArray(data)
        ? data
        : Array.isArray(data.items) ? data.items : [];

      const videos = items
        .map(item => {
          if (source.type === "invidious") {
            if (!item.videoId) return null;

            return {
              id: item.videoId,
              title: item.title || "Vídeo educativo",
              description: item.description || "",
              thumbnail: item.videoThumbnails?.[0]?.url || "",
              url: `https://www.youtube.com/watch?v=${item.videoId}`,
              embedUrl: `https://www.youtube.com/embed/${item.videoId}`,
              channel: item.author || ""
            };
          }

          const path = item.url || "";
          const id = item.videoId ||
            path.match(/[?&]v=([^&]+)/)?.[1] ||
            path.match(/\/watch\/([^/?]+)/)?.[1];

          if (!id || item.type === "channel") return null;

          return {
            id,
            title: item.title || "Vídeo educativo",
            description: item.shortDescription || "",
            thumbnail: item.thumbnail || "",
            url: `https://www.youtube.com/watch?v=${id}`,
            embedUrl: `https://www.youtube.com/embed/${id}`,
            channel: item.uploaderName || item.uploader || ""
          };
        })
        .filter(Boolean)
        .slice(0, 12);

      if (videos.length > 0) {
        return res.json({ videos, query });
      }
    } catch (error) {
      console.error(`Fonte indisponível: ${source.base}`);
    }
  }

  return res.status(502).json({
    error: "As fontes públicas de vídeos não responderam. Tenta novamente mais tarde.",
    videos: []
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Study AI API ativa na porta ${PORT}`);
});
