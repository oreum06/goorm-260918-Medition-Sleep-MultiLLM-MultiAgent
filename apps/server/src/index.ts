import "dotenv/config";
import express from "express";
import cors from "cors";
import { checkinsRouter } from "./routes/checkins";
import { sleepLogsRouter } from "./routes/sleepLogs";
import { aiRouter } from "./routes/ai";
import { routinesRouter } from "./routes/routines";
import { sessionsRouter } from "./routes/sessions";
import { insightsRouter } from "./routes/insights";
import { meRouter } from "./routes/me";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => res.json({ ok: true }));
app.use(checkinsRouter);
app.use(sleepLogsRouter);
app.use(aiRouter);
app.use(routinesRouter);
app.use(sessionsRouter);
app.use(insightsRouter);
app.use(meRouter);

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ code: "INTERNAL_ERROR" });
});

const port = Number(process.env.PORT) || 4000;
app.listen(port, () => {
  console.log(`server listening on http://localhost:${port}`);
});
