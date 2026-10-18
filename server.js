
import express from "express";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "1mb" }));

app.get("/", (req, res) => {
  res.json({ message: "Study AI Professor API is running." });
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/videos", async (req, res) => {
  const query = String(req.query.q || "aulas escolares Portugal")
    .slice(0, 150);

  const instances = [
    "https://invidious.nerdvpn.de",
    "https://inv.nadeko.net",
    "https://invidious.privacyredirect.com"
  ];

  for (const instance of instances) {
    try {
      const url = new URL("/api/v1/search", instance);
      url.searchParams.set("q", query);
      url.searchParams.set("type", "video");

      const response = await fetch(url, {
        signal: AbortSignal.timeout(7000),
        headers: { Accept: "application/json" }
      });

      if (!response.ok) continue;

      const data = await response.json();

      const videos = data
        .filter(item => item.type === "video" && item.videoId)
        .slice(0, 12)
        .map(item => ({
          id: item.videoId,
          title: item.title || "Vídeo educativo",
          description: item.description || "",
          thumbnail: item.videoThumbnails?.find(
            image => image.quality === "medium"
          )?.url || "",
          url: `https://www.youtube.com/watch?v=${item.videoId}`,
          embedUrl: `https://www.youtube.com/embed/${item.videoId}`,
          channel: item.author || ""
        }));

      return res.json({ videos });
    } catch (error) {
      console.error(`Instância indisponível: ${instance}`);
    }
  }

  res.status(502).json({
    error: "A pesquisa pública de vídeos está temporariamente indisponível.",
    videos: []
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Study AI API ativa na porta ${PORT}`);
});
