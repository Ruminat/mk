import http from "http";

const server = http.createServer((req, res) => {
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.url === "/api/moods" && req.method === "GET") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        message: "Mood API is working!",
        moods: ["happy", "sad", "angry", "calm"],
      })
    );
    return;
  }

  if (req.url === "/api/moods" && req.method === "POST") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    req.on("end", () => {
      try {
        const moodData = JSON.parse(body);
        console.log("Received mood:", moodData);

        res.writeHead(201, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            message: "Mood recorded successfully!",
            mood: moodData,
          })
        );
      } catch (error) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Invalid JSON" }));
      }
    });
    return;
  }

  // Default route
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(
    JSON.stringify({
      message: "Mooduck Server is running!",
      timestamp: new Date().toISOString(),
    })
  );
});

const PORT = process.env.PORT || 3009;

server.listen(PORT, () => {
  console.log(`🚀 Mooduck bot running on http://localhost:${PORT}`);
});
