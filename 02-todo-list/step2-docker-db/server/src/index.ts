import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

type Todo = {
  id: number;
  text: string;
  done: boolean;
};

const MAX_TEXT_LENGTH = 200;

const envPath = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../.env",
);
dotenv.config({ path: envPath, quiet: true });

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `${name} 값이 없습니다. step2-docker-db/.env 파일을 만들고 예시 값을 본인 값으로 바꾸세요.`,
    );
  }
  return value;
}

function parseId(value: string): number | null {
  if (!/^[1-9]\d*$/.test(value)) {
    return null;
  }
  return Number(value);
}

const PORT = 3000;
const { Pool } = pg;

const pool = new Pool({
  host: "127.0.0.1",
  port: Number(requiredEnv("POSTGRES_PORT")),
  user: requiredEnv("POSTGRES_USER"),
  password: requiredEnv("POSTGRES_PASSWORD"),
  database: requiredEnv("POSTGRES_DB"),
});

if (process.env.POSTGRES_PASSWORD === "your-password-here") {
  throw new Error(
    "POSTGRES_PASSWORD가 예시 값입니다. .env에 본인이 정한 비밀번호를 넣으세요.",
  );
}

const app = express();
app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json({ limit: "16kb" }));

app.get("/", (_req, res) => {
  res.type("html").send(`<!doctype html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <title>할 일 서버</title>
  </head>
  <body>
    <h1>여기는 화면이 아닙니다</h1>
    <p>3000번은 할 일을 저장하는 서버(창고) 주소입니다.</p>
    <p>앱 화면은 <a href="http://localhost:5173">http://localhost:5173</a> 으로 들어가 주세요.</p>
  </body>
</html>`);
});

app.get("/api/todos", async (_req, res, next) => {
  try {
    const result = await pool.query<Todo>(
      "SELECT id, text, done FROM todos ORDER BY created_at ASC, id ASC",
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

app.post("/api/todos", async (req, res, next) => {
  try {
    const text = typeof req.body?.text === "string" ? req.body.text.trim() : "";

    if (!text) {
      res.status(400).json({ message: "할 일을 입력해 주세요." });
      return;
    }

    if (text.length > MAX_TEXT_LENGTH) {
      res.status(400).json({
        message: `할 일은 ${MAX_TEXT_LENGTH}자 이하로 입력해 주세요.`,
      });
      return;
    }

    const result = await pool.query<Todo>(
      "INSERT INTO todos (text) VALUES ($1) RETURNING id, text, done",
      [text],
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

app.patch("/api/todos/:id", async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    if (id === null) {
      res.status(400).json({ message: "할 일 번호가 올바르지 않습니다." });
      return;
    }

    if (typeof req.body?.done !== "boolean") {
      res.status(400).json({ message: "완료 여부가 올바르지 않습니다." });
      return;
    }

    const result = await pool.query<Todo>(
      "UPDATE todos SET done = $1 WHERE id = $2 RETURNING id, text, done",
      [req.body.done, id],
    );

    if (result.rowCount === 0) {
      res.status(404).json({ message: "할 일을 찾을 수 없습니다." });
      return;
    }

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

app.delete("/api/todos/:id", async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    if (id === null) {
      res.status(400).json({ message: "할 일 번호가 올바르지 않습니다." });
      return;
    }

    const result = await pool.query("DELETE FROM todos WHERE id = $1", [id]);

    if (result.rowCount === 0) {
      res.status(404).json({ message: "할 일을 찾을 수 없습니다." });
      return;
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

app.use(
  (
    error: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    console.error(error);
    if (!res.headersSent) {
      res.status(500).json({ message: "서버에 문제가 생겼습니다." });
    }
  },
);

app.listen(PORT, "127.0.0.1", () => {
  console.log(`할 일 서버가 http://127.0.0.1:${PORT} 에서 실행 중입니다.`);
});
