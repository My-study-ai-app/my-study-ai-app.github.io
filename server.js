
import express from "express";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "Study AI Professor API is running." });
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/videos", async (req, res) => {
  try {
    const query = String(req.query.q || "aulas escolares Portugal")
      .slice(0, 150);

    const apiKey = process.env.YOUTUBE_API_KEY;

    if (!apiKey) {
      return res.status(503).json({
        error: "Falta configurar a chave da YouTube Data API.",
        setup: "Adiciona YOUTUBE_API_KEY nas variáveis de ambiente do Render."
      });
    }

    const params = new URLSearchParams({
      part: "snippet",
      type: "video",
      maxResults: "12",
      q: query,
      relevanceLanguage: "pt",
      regionCode: "PT",
      safeSearch: "strict",
      key: apiKey
    });

    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?${params}`
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("YouTube API:", data);
      return res.status(502).json({
        error: "Não foi possível obter vídeos do YouTube."
      });
    }

    const videos = (data.items || []).map(item => ({
      id: item.id.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnail: item.snippet.thumbnails?.medium?.url || "",
      url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
      embedUrl: `https://www.youtube.com/embed/${item.id.videoId}`,
      channel: item.snippet.channelTitle
    }));

    res.json({ videos });
  } catch (error) {
    console.error("Erro ao procurar vídeos:", error);
    res.status(500).json({
      error: "Erro interno ao procurar vídeos."
    });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Study AI API ativa na porta ${PORT}`);
});
