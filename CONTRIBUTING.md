# Contributing

Thanks for helping with Pendant MCP. This is an early-stage project, so small, focused contributions are the easiest to review and merge.

## Setup

```bash
git clone https://github.com/zeeshanp1/live-agent.git
cd live-agent
npm start    # http://127.0.0.1:8080
npm test
```

Requires Node.js 20+. There are no dependencies to install.

## Ground rules

- **Privacy first.** Do not add network calls, analytics, or third-party services that receive user data. If a feature needs one, open an issue first.
- **Keep logic testable.** Put behaviour in `src/core/` or `src/mcp/` (no DOM access) and add a test in `test/`. Browser-only code belongs in `src/services/` or `src/ui/`.
- **Escape everything.** Any user-provided text rendered as HTML must go through `escapeHtml`.
- **Approval by default.** New MCP servers must default to `autoRun: false`.
- **No build step.** Keep the app runnable with plain ES modules unless there is a strong reason to change that.

## Workflow

1. Open an issue for anything beyond a small fix.
2. Branch from `main`: `feat/short-name`, `fix/short-name`, `docs/short-name`.
3. Make your change and add or update tests. Run `npm test`.
4. Commit using [Conventional Commits](https://www.conventionalcommits.org/): `feat:`, `fix:`, `docs:`, `test:`, `refactor:`, `chore:`.
5. Open a pull request using the template. CI must pass.

## Style

Formatting is defined in [`.editorconfig`](.editorconfig): UTF-8, LF, 2-space indent, final newline. Use ES modules, `const` by default, and short JSDoc on exported functions.

## Adding a local MCP server

1. Add a server entry to `createDefaultState()` in `src/core/store.js`.
2. Extend `detectIntent()` in `src/mcp/intent.js` to return `{ serverId, title, payload }`.
3. Add a handler to `src/mcp/executor.js` that returns `{ message, file }`.
4. Add tests for the intent and the handler, and update `docs/ARCHITECTURE.md`.

## Reporting security issues

Please do not open a public issue. See [SECURITY.md](SECURITY.md).
