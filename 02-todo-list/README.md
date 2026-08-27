# 할 일 목록 앱

PC 브라우저에서 할 일을 **추가하고, 완료하고, 지울 수 있는** 연습용 웹 앱입니다.  
로그인은 없고, 한 사람이 쓰는 단순한 목록입니다.

화면에서 버튼을 누르면 데이터가 브라우저 안에만 머무르지 않고 **서버를 거쳐 저장**됩니다.  
같은 화면을 유지한 채, 저장 방식만 바꿔 가며 단계를 나눴습니다.

| 단계 | 저장 위치 | 서버를 꺼도 남나요? |
|------|-----------|---------------------|
| 1단계 | 서버 메모리 | 아니요. 서버를 끄면 사라집니다. |
| 2단계 | 내 컴퓨터의 PostgreSQL (Docker) | 네. 데이터베이스가 켜져 있으면 남습니다. |
| 3단계 (예정) | 클라우드 데이터베이스 (Neon) + GitHub 자동 배포 | 인터넷 주소로도 같은 목록을 봅니다. |

---

## 무엇을 할 수 있나요?

- 할 일을 입력하고 추가합니다. 빈 칸이면 추가되지 않고 안내가 나옵니다.
- 체크박스로 완료/미완료를 바꿉니다. 완료한 일은 취소선이 그어집니다.
- 삭제 버튼으로 목록에서 지웁니다.
- 아직 안 끝난 할 일 개수가 함께 보입니다.

명세서: [`SPEC.md`](./SPEC.md)

---

## 기술

어려운 말부터 풀어 쓰면 이렇습니다.

| 이름 | 역할 | 쉽게 말하면 |
|------|------|-------------|
| React + TypeScript (Vite) | 화면 | 입력창·버튼·목록을 그립니다. |
| Express | 서버 | 화면의 요청을 받아 할 일을 저장하거나 돌려줍니다. |
| PostgreSQL | 데이터베이스 | 할 일을 표(테이블)로 오래 보관합니다. |
| Docker | 실행 상자 | 내 PC에 DB를 직접 설치하지 않고 상자처럼 켭니다. |
| Adminer | DB 보기 도구 | 엑셀처럼 표를 눈으로 확인합니다. 서버(백엔드)는 아닙니다. |

화면은 `http://localhost:5173`, 서버는 `http://localhost:3000` 입니다.

---

## 폴더가 단계별로 나뉜 이유

1단계 결과를 지우고 덮어쓰지 않았습니다.  
나중에 “메모리에 두면 어떻게 되고, DB에 두면 어떻게 되는지”를 **나란히 비교**할 수 있게 폴더를 나눴습니다.

```text
02-todo-list/
├── README.md              ← 지금 보고 있는 소개
├── SPEC.md                ← 앱이 해야 할 일의 약속
├── db/schema.sql          ← 할 일 표 구조 (2·3단계에서 같이 씀)
├── step1-memory/          ← 1단계: 서버 메모리에 저장
│   ├── client/            ← 화면
│   └── server/            ← 서버
└── step2-docker-db/       ← 2단계: Docker PostgreSQL에 저장
    ├── client/            ← 화면 (1단계와 같은 형태)
    ├── server/            ← 서버 (저장만 DB로 바뀜)
    ├── db/schema.sql
    ├── docker-compose.yml
    └── .env.example
```

화면이 서버를 부르는 주소는 단계가 바뀌어도 같습니다.

- 목록 보기 `GET /api/todos`
- 추가 `POST /api/todos`
- 완료 바꾸기 `PATCH /api/todos/번호`
- 삭제 `DELETE /api/todos/번호`

---

## 실행하기 전에

컴퓨터에 아래가 있어야 합니다.

- [Node.js](https://nodejs.org/)
- 2단계를 볼 때는 [Docker Desktop](https://www.docker.com/products/docker-desktop/)

두 단계 앱이 **같은 번호(5173, 3000)** 를 쓰므로, 한 번에 하나만 켜는 것이 좋습니다.

---

## 1단계 실행 — 서버 메모리

할 일이 서버가 켜져 있는 동안에만 기억됩니다. 서버를 끄면 목록이 처음 예시로 돌아갑니다.

```bash
cd step1-memory
npm install
cd client && npm install && cd ..
cd server && npm install && cd ..
npm run dev
```

브라우저에서 [http://localhost:5173](http://localhost:5173) 을 엽니다.

---

## 2단계 실행 — Docker 데이터베이스

할 일이 PostgreSQL 표에 남습니다. 서버만 껐다 켜도, 데이터베이스 상자만 재시작해도 목록이 유지됩니다.

### 1. 비밀번호 파일 만들기

`step2-docker-db/.env.example`을 복사해 `.env`로 만들고, 비밀번호를 본인 값으로 바꿉니다.  
`.env`는 GitHub에 올리지 않습니다.

### 2. 데이터베이스 상자 켜기

```bash
cd step2-docker-db
docker compose up -d
```

기본 포트는 데이터베이스 **5437**, Adminer **8087** 입니다. (이미 쓰이는 번호가 있으면 비어 있는 번호로 바꿔 두었습니다.)

표를 눈으로 보려면 [http://localhost:8087](http://localhost:8087) 에서 아래처럼 로그인합니다.

| 칸 | 값 |
|----|-----|
| 시스템 | PostgreSQL |
| 서버 | `db` (`localhost`가 아닙니다) |
| 사용자명 | `.env`의 `POSTGRES_USER` |
| 비밀번호 | `.env`의 `POSTGRES_PASSWORD` |
| 데이터베이스 | `.env`의 `POSTGRES_DB` |

서버 칸에 `db`를 넣는 이유: Adminer와 데이터베이스가 같은 Docker 마을 안에 있고, 그 마을에서 DB 상자의 이름이 `db`이기 때문입니다.

### 3. 화면과 서버 켜기

```bash
npm install
cd client && npm install && cd ..
cd server && npm install && cd ..
npm run dev
```

브라우저에서 [http://localhost:5173](http://localhost:5173) 을 엽니다.  
화면에서 할 일을 추가한 뒤 Adminer의 `todos` 표를 새로고침하면 같은 줄이 보여야 합니다.

---

## 이 프로젝트에서 배운 것

- 화면과 서버를 나누면, 저장 방식만 바꿔도 버튼과 목록은 그대로 쓸 수 있습니다.
- 메모리 저장은 만들기 쉽지만, 서버가 꺼지면 데이터가 사라집니다.
- 데이터베이스에 두면 오래 남고, Adminer로 표를 직접 확인할 수 있습니다.
- SQL에 글자를 그대로 이어 붙이지 않고 파라미터 바인딩을 쓰면, 입력값이 명령으로 실행되는 일을 막을 수 있습니다.

3단계는 GitHub에 올린 뒤 Vercel로 자동 배포하고, 데이터베이스는 Neon을 사용할 예정입니다.
