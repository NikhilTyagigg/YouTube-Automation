# Framewise Workspace Setup

- [x] Verify that this workspace-specific instruction file exists in `.github`.
- [x] Clarify project requirements: React 18, TypeScript, Vite, and the requested SaaS features were specified.
- [x] Scaffold the project in the current workspace root with Node 18-compatible Vite.
- [x] Customize the project with authentication, responsive layouts, theme support, dashboard, and feature screens.
- [x] Install required dependencies. No editor extensions were specified, so none were installed.
- [x] Compile the project and resolve TypeScript/build errors with `npm run build`.
- [x] Create and run the frontend development task from the frontend workspace script.
- [x] Launch the frontend locally for browser verification.
- [x] Validate Docker Compose configuration. Container launch is pending because the Docker Desktop daemon is unavailable in this environment.
- [x] Keep `README.md` and this instruction file aligned with the project.

## Project Conventions

- Keep React screens and domain contracts in TypeScript.
- Prefer feature entry points under `src/features`, shared view primitives under `src/components`, and backend access under `src/services`.
- Use TanStack Query for server state, Zustand for cross-route client state, and Zod with React Hook Form for validated forms.
- Keep API paths relative to `VITE_API_BASE_URL`; do not place credentials in frontend environment variables.
- Preserve the responsive layout and both theme modes when changing shared components.
- Run `npm run build` after implementation changes.