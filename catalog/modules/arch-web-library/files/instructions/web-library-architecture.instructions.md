---
description: "Architecture guardrails for publishable libraries targeting browsers."
applyTo: "**/*.{ts,tsx,js,jsx,json,css}"
---

# Web Library Architecture

## Runtime Contract

- Apply this module to publishable libraries targeting browsers.
- Do not depend on `@types/node`.
- Prefer positive browser evidence such as DOM types or dependencies on React, Vue, Svelte, Angular, or similar web libraries.
- Keep published JavaScript, declarations, styles, and assets free of accidental Node.js runtime dependencies.
