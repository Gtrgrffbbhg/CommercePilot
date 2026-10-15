# Operating Rules for CommercePilot

This document defines the persistent operating guidelines for all development on CommercePilot.

## 1. Inspect First
- Always inspect the workspace before making changes: verify directory path, check `git status`, `node -v`, `npm -v`, and detect the operating system.
- Never overwrite or delete existing files without inspecting and reporting what currently exists.
- If the workspace is not empty, adapt to existing structure and report findings.

## 2. Cross-Platform Compatibility
- All npm scripts and tool executions must be strictly cross-platform (no bash-only syntax like `export FOO=bar`, `rm -rf`, or bash chaining that breaks on Windows PowerShell or CMD).
- Use Node-based or cross-platform tools where necessary (e.g., standard npm script syntax).

## 3. Code Simplicity & Dependencies
- Write simple, clean, maintainable code.
- Avoid unnecessary external dependencies.
- Any dependency outside the approved stack must be explicitly justified in the implementation report.

## 4. Modular Design & Documentation
- Avoid large, monolithic files and giant components.
- Favor small, focused modules with a single responsibility.
- Add concise comments explaining **WHY** a decision was made, not merely repeating **WHAT** the code is doing.

## 5. Demo Data Transparency
- Demo data must always be explicitly labelled as demo data across API responses (`meta.isDemo === true`, `X-Data-Source: demo`) and in the UI (persistent amber demo badge).
- Never disguise mock data as live store data.

## 6. Real Integration Integrity
- Never claim a WooCommerce integration works before it is built and verified.
- No WooCommerce integration code is permitted in Prompt 1.

## 7. Security & Secrets Management
- All credentials and sensitive connection parameters must remain strictly server-side in environment variables.
- Never commit `.env` files. Ensure `.gitignore` prevents tracking of environment secrets.
- Never prefix secrets with `VITE_` (which exposes them to client-side browser bundles).

## 8. Test & Verification Honesty
- Never ignore a failing test.
- Never declare a feature or milestone complete unless all tests pass and criteria are verified.
- Report all test results and failures honestly.

## 9. Git Etiquette
- Do **not** run `git commit` or `git push` autonomously.
- At defined checkpoints, display the exact Git commands for the user to review and run.
- Check `git status --short` before recommending commits to ensure no secrets or untracked build artifacts are staged.

## 10. Strict Scope Discipline
- Adhere strictly to the active prompt's scope.
- Do not build ahead (e.g., no router, dashboard charts, search/filters, MongoDB, RFM algorithms, WooCommerce clients, or auth until their designated prompts).
