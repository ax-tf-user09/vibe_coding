-- 할 일 목록 테이블
-- 2단계(로컬 Docker PostgreSQL)와 3단계(Neon 클라우드)에서 같은 파일을 사용한다.

CREATE TABLE IF NOT EXISTS todos (
  id SERIAL PRIMARY KEY,
  text TEXT NOT NULL,
  done BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO todos (text, done)
SELECT seed.text, seed.done
FROM (
  VALUES
    ('명세서 읽고 화면 확인하기', TRUE),
    ('할 일 하나 추가해 보기', FALSE),
    ('끝난 일 체크하고 삭제해 보기', FALSE)
) AS seed(text, done)
WHERE NOT EXISTS (SELECT 1 FROM todos);
