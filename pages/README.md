# Why This Folder Exists

This empty `pages/` folder at project root is **required** to prevent Next.js from treating `src/pages/` as the Pages Router.

Without this folder, Next.js would interpret `src/pages/` (our FSD pages layer) as the legacy Pages Router, breaking the build.

**Do not delete this folder or add route files here.**

All routing is handled by the `app/` folder (App Router). FSD page components live in `src/pages/`.
