---
description: "Architecture guardrails for publishable libraries targeting Node.js."
applyTo: "**/*.{ts,cts,mts,js,mjs,cjs,json}"
---

# Node Library Architecture

## Runtime Contract

- Apply this module to publishable libraries targeting the Node.js runtime.
- Include `@types/node` in dependencies or development dependencies.
- Declare supported Node.js versions and expose Node-compatible package entry points.
- Keep browser compatibility out of scope unless local guidance explicitly defines a dual-runtime contract.
