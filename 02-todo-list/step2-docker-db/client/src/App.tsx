import { FormEvent, useEffect, useState } from "react";
import "./App.css";

type Todo = {
  id: number;
  text: string;
  done: boolean;
};

const API_URL = "http://localhost:3000/api/todos";
const MAX_TEXT_LENGTH = 200;
const THEME_KEY = "todo-theme";

type Theme = "dark" | "light";

function readTheme(): Theme {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    return saved === "light" ? "light" : "dark";
  } catch {
    return "dark";
  }
}

function App() {
  const [theme, setTheme] = useState<Theme>(readTheme);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [loadError, setLoadError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [pendingId, setPendingId] = useState<number | null>(null);

  const unfinishedCount = todos.filter((todo) => !todo.done).length;
  const isBusy = isAdding || pendingId !== null;

  async function loadTodos() {
    setIsLoading(true);
    try {
      const response = await fetch(API_URL);
      if (!response.ok) {
        throw new Error("목록을 불러오지 못했습니다.");
      }
      const data: Todo[] = await response.json();
      setTodos(data);
      setLoadError("");
    } catch {
      setLoadError("서버에 연결하지 못했습니다. 서버가 켜져 있는지 확인해 주세요.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadTodos();
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      // 저장에 실패해도 화면 모드는 바꿀 수 있게 둔다.
    }
  }, [theme]);

  async function handleAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextText = text.trim();

    if (!nextText) {
      setError("할 일을 입력해 주세요.");
      return;
    }

    if (nextText.length > MAX_TEXT_LENGTH) {
      setError(`할 일은 ${MAX_TEXT_LENGTH}자 이하로 입력해 주세요.`);
      return;
    }

    setIsAdding(true);
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: nextText }),
    });

    if (!response.ok) {
      const data = (await response.json()) as { message?: string };
      setError(data.message ?? "추가하지 못했습니다.");
      setIsAdding(false);
      return;
    }

    const created: Todo = await response.json();
    setTodos((current) => [...current, created]);
    setText("");
    setError("");
    setIsAdding(false);
  }

  async function handleToggle(todo: Todo) {
    setPendingId(todo.id);
    const response = await fetch(`${API_URL}/${todo.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ done: !todo.done }),
    });

    if (response.ok) {
      const updated: Todo = await response.json();
      setTodos((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
    }
    setPendingId(null);
  }

  async function handleDelete(id: number) {
    setPendingId(id);
    const response = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
    if (response.ok) {
      setTodos((current) => current.filter((item) => item.id !== id));
    }
    setPendingId(null);
  }

  return (
    <>
      <a className="skip-link" href="#todo-input">
        본문 바로가기
      </a>

      <main className="page">
        <header className="page-header">
          <div className="page-header-text">
            <h1>할 일 목록</h1>
            <p className="lead">할 일을 추가하고, 끝나면 체크하세요.</p>
          </div>
          <button
            type="button"
            className="theme-toggle"
            onClick={() => {
              setTheme((current) => (current === "dark" ? "light" : "dark"));
            }}
            aria-pressed={theme === "light"}
            aria-label={
              theme === "dark" ? "밝은 모드로 바꾸기" : "다크 모드로 바꾸기"
            }
          >
            {theme === "dark" ? "밝은 모드" : "다크 모드"}
          </button>
        </header>

        <section className="card" aria-labelledby="todo-heading">
          <h2 id="todo-heading" className="visually-hidden">
            할 일 관리
          </h2>

          <form className="form" onSubmit={handleAdd}>
            <input
              id="todo-input"
              value={text}
              onChange={(event) => {
                setText(event.target.value);
                if (error) {
                  setError("");
                }
              }}
              placeholder="할 일을 입력하세요"
              maxLength={MAX_TEXT_LENGTH}
              aria-label="할 일 입력"
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? "todo-error" : undefined}
              disabled={isBusy}
            />
            <button
              className="btn"
              type="submit"
              disabled={isBusy}
              aria-busy={isAdding}
            >
              {isAdding ? "추가 중" : "추가"}
            </button>
          </form>
          {error ? (
            <p id="todo-error" className="error" role="alert">
              {error}
            </p>
          ) : null}

          <p className="count" aria-live="polite">
            아직 안 끝난 할 일 {unfinishedCount}개
          </p>

          {isLoading ? (
            <p className="empty" aria-busy="true">
              목록을 불러오는 중입니다.
            </p>
          ) : todos.length === 0 ? (
            <p className="empty">아직 할 일이 없습니다.</p>
          ) : (
            <ul className="list">
              {todos.map((todo) => (
                <li key={todo.id} className={todo.done ? "item done" : "item"}>
                  <label>
                    <input
                      type="checkbox"
                      checked={todo.done}
                      disabled={isBusy}
                      onChange={() => {
                        void handleToggle(todo);
                      }}
                    />
                    <span>{todo.text}</span>
                  </label>
                  <button
                    type="button"
                    className="btn btn-danger"
                    disabled={isBusy}
                    aria-label={`${todo.text} 삭제`}
                    aria-busy={pendingId === todo.id}
                    onClick={() => {
                      void handleDelete(todo.id);
                    }}
                  >
                    {pendingId === todo.id ? "삭제 중" : "삭제"}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {loadError ? (
          <p className="status" role="alert">
            {loadError}
          </p>
        ) : null}
      </main>
    </>
  );
}

export default App;
