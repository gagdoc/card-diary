# Card Diary

사진과 글을 날짜별로 기록하고 Google Drive와 동기화하는 React/Vite 다이어리입니다.

## 개발 시작

```bash
npm install
npm run dev
```

Google OAuth 개발 origin은 `http://localhost:5174`로 고정되어 있습니다. `127.0.0.1`로 접속하면 로그인할 수 없습니다.

## 개발 인수인계

- [2026-06-21 개발 히스토리](docs/updates/2026-06-21.md)
- [다이어리 읽기 패널 설계](docs/superpowers/specs/2026-06-21-diary-reading-panel-design.md)
- [다이어리 읽기 패널 구현 계획](docs/superpowers/plans/2026-06-21-diary-reading-panel.md)

## 기존 Vite 안내

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
