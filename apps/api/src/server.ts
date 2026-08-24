import cors from "cors";
import express from "express";

const app = express();
const port = Number(process.env.API_PORT ?? 3000);

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "production-platform-api",
  });
});

app.listen(port, () => {
  console.log(`API listening on port ${port}`);
});
