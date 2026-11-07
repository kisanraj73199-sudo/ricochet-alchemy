# Collaboration & Branch Workflow Guide

To keep our codebase clean, modular, and bug-free for all contributors:

## 1. Branch Strategy
- **`main`**: Production Play Store release branch. Never push directly to `main`.
- **`develop`**: Integration branch for upcoming updates.
- **`feature/*` or `branch-1`**: Create a branch for your feature or balancing update:
  ```bash
  git checkout -b branch-1
  ```

## 2. Testing Before Merging into `main`
1. Test locally in VS Code using `npm run dev`.
2. Push your branch to GitHub:
   ```bash
   git push origin branch-1
   ```
3. Open GitHub **Actions** tab -> Click the latest **Branch Preview Debug APK** workflow run -> Download `ricochet-alchemy-debug-apk` artifact and test on your Android phone.
4. Once verified, open a Pull Request (PR) to merge into `develop` / `main`.

## 3. Code Length & Modularity Rule
- Keep every file focused on a single responsibility (aim for <150-200 lines per file).
- Put all balance numbers in `src/config/` rather than hardcoding inside scenes.
