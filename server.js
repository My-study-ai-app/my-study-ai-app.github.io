
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
  const query = String(req.query.q || "aulas escolares Portugal").slice(0, 150);

  const instances = [
    "https://invidious.nerdvpn.de",
    "https://inv.nadeko.net",
    "https://invidious.privacyredirect.com"
  ];

  const errors = [];

  for (const instance of instances) {
    try {
      const url = new URL("/api/v1/search", instance);
      url.searchParams.set("q", query);
      url.searchParams.set("type", "video");

      const response = await fetch(url, {
        signal: AbortSignal.timeout(8000),
        headers: { Accept: "application/json" }
      });

      if (!response.ok) {
        errors.push(`${instance}: HTTP ${response.status}`);
        continue;
      }

      const data = await response.json();

      if (!Array.isArray(data)) {
        errors.push(`${instance}: resposta inválida`);
        continue;
      }

      const videos = data
        .filter(item => item.type === "video" && item.videoId)
        .slice(0, 12)
        .map(item => ({
          id: item.videoId,
          title: item.title || "Vídeo educativo",
          description: item.description || "",
          thumbnail:
            item.videoThumbnails?.find(image => image.quality === "medium")?.url ||
            item.videoThumbnails?.[0]?.url ||
            "",
          url: `https://www.youtube.com/watch?v=${item.videoId}`,
          embedUrl: `https://www.youtube.com/embed/${item.videoId}`,
          channel: item.author || ""
        }));

      return res.json({ videos, query });
    } catch (error) {
      errors.push(`${instance}: ${error.message}`);
    }
  }

  console.error("Todas as pesquisas de vídeos falharam:", errors);

  return res.status(502).json({
    error: "As fontes públicas de vídeos estão indisponíveis. Tenta novamente mais tarde.",
    videos: []
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Study AI API ativa na porta ${PORT}`);
});
