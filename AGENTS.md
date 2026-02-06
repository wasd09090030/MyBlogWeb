# Repository Guidelines

## Project Structure & Module Organization
The repo is a full-stack blog with a Nuxt frontend and an ASP.NET Core backend.
- `nuxt/`: Nuxt 3 app (pages, components, composables, layouts, stores). Static assets live in `nuxt/public/` and global styles in `nuxt/assets/css/`.
- `backend-dotnet/BlogApi/`: .NET 8 Web API (Controllers, Services, Models, DTOs, Data, Program.cs).
- Root docs: `README.md`, `API_INTERFACE_DOCUMENTATION.md`, `IMAGEBED_IMPLEMENTATION.md`, `Imagebed.http`.

## Build, Test, and Development Commands
Frontend (from `nuxt/`):
- `npm install`: install dependencies.
- `npm run dev`: start dev server (default http://localhost:3000).
- `npm run build`: production build.
- `npm run generate`: static generation.
- `npm run preview`: preview production build.

Backend (from `backend-dotnet/BlogApi/`):
- `dotnet run`: start API (default http://localhost:3000 or per launch settings).
- `dotnet build`: build the API.
- `dotnet publish -c Release`: publish artifacts.

## Coding Style & Naming Conventions
- Vue/Nuxt: 2-space indentation is used in `.vue` and `.js` files. Components use PascalCase (e.g., `MarkdownRenderer.vue`), composables follow `useX` naming (e.g., `useArticles.js`).
- C#: 4-space indentation, PascalCase for classes and public members, camelCase for locals/parameters.
- Styling: Tailwind utilities plus component-scoped CSS in `nuxt/assets/css/components/*.styles.css`.

## Testing Guidelines
There are no test suites in the repo today. If you add tests, wire a backend test project (e.g., `backend-dotnet/BlogApi.Tests`) so `dotnet test` runs, and introduce a `nuxt/tests` setup if frontend tests are needed.

## Commit & Pull Request Guidelines
Recent commit messages are short, descriptive, and often in Chinese (e.g., bug fixes and config updates). Keep commits concise and scoped to one change when possible.
For PRs, include:
- A short summary of changes and affected areas (`nuxt/` or `backend-dotnet/`).
- Testing notes (commands run and results).
- Screenshots or clips for UI changes.
- Linked issues if applicable.

## Configuration & Security Notes
Frontend config uses `.env` (see `nuxt/README.md`) with `NUXT_PUBLIC_API_BASE_URL` and `NUXT_PUBLIC_SITE_URL`. Backend configuration is in `backend-dotnet/BlogApi/appsettings.json`; the SQLite database defaults to `blog.sqlite`. Change the default admin password (`admin123`) after first login.


## Enhanced Operational Rules for AI Agent


1. 你的每一步操作，都需要调用 Sequential thinking mcp 服务思考问题。并反思自己上下文是否一致，如果发现冲突，立刻停止工作，向用户报告情况，等待反馈
2. 你必须调用 mcp router 的 fetch、context7 mcp等服务，你必须搜索最新的知识，禁止直接使用 LLM 内置过时知识库。避免造成时间滞后带来的错误
3. 你必须调用 search/query-docs mcp 服务，去搜索最新的项目文档和代码，禁止直接使用 LLM 内置过时知识库。避免造成时间滞后带来的错误
4. 项目管理级别工具调用优先级   sequential thinking > search/query-docs