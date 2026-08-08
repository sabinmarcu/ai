---
description: "Architecture guardrails for deployable Node.js servers and services."
applyTo: "**/*.{ts,cts,mts,js,mjs,cjs,json}"
---

# Node Application Architecture

## Applicability

- Apply this module to Node.js servers and services intended for production deployment.
- Do not apply it to one-off developer or CI tools.

## Service Lifecycle

- Declare a production entry point and start command explicitly.
- Keep startup, readiness, shutdown, and failure behavior deterministic.
- Handle termination signals and close owned resources gracefully.
- Keep configuration external to deployed artifacts and validate it at startup.

## Operational Boundaries

- Emit structured diagnostics suitable for production operation.
- Expose health and readiness behavior appropriate to the deployment platform.
- Keep server lifecycle concerns out of reusable library modules.

## Hard Rule Summary

- Node applications are production servers or services.
- Node tools and libraries use their own architecture modules.
