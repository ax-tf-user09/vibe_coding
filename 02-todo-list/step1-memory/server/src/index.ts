import cors from "cors";
import express from "express";

type Todo = {
  id: number;
  text: string;
  done: boolean;
};

const MAX_TEXT_LENGTH = 200;
const PORT = 3000;

const app = express();
app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json({ limit: "16kb" }));

const todos: Todo[] = [
  { id: 1, text: "명세서 읽고 화면 확인하기", done: true },
  { id: 2, text: "할 일 하나 추가해 보기", done: false },
  { id: 3, text: "끝난 일 체크하고 삭제해 보기", done: false },
];
let nextId = 4;

function parseId(value: string): number | null {
  if (!/^[1-9]\d*$/.test(value)) {
    return null;
  }
  return Number(value);
}

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

app.get("/api/todos", (_req, res) => {
  res.json(todos);
});

app.post("/api/todos", (req, res) => {
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

  const todo: Todo = { id: nextId, text, done: false };
  nextId += 1;
  todos.push(todo);
  res.status(201).json(todo);
});

app.patch("/api/todos/:id", (req, res) => {
  const id = parseId(req.params.id);
  if (id === null) {
    res.status(400).json({ message: "할 일 번호가 올바르지 않습니다." });
    return;
  }

  const todo = todos.find((item) => item.id === id);

  if (!todo) {
    res.status(404).json({ message: "할 일을 찾을 수 없습니다." });
    return;
  }

  if (typeof req.body?.done !== "boolean") {
    res.status(400).json({ message: "완료 여부가 올바르지 않습니다." });
    return;
  }

  todo.done = req.body.done;
  res.json(todo);
});

app.delete("/api/todos/:id", (req, res) => {
  const id = parseId(req.params.id);
  if (id === null) {
    res.status(400).json({ message: "할 일 번호가 올바르지 않습니다." });
    return;
  }

  const index = todos.findIndex((item) => item.id === id);

  if (index === -1) {
    res.status(404).json({ message: "할 일을 찾을 수 없습니다." });
    return;
  }

  todos.splice(index, 1);
  res.status(204).send();
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
