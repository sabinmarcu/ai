# arch/react

Renderer-neutral architecture guardrails for React applications, libraries,
and terminal interfaces.

## Included AI Files

- `files/instructions/react-architecture.instructions.md`

## Intent

- Keep component ownership local and APIs composition-oriented.
- Select Jotai, hooks, or Context according to state ownership and lifetime.
- Separate rendering from models, data access, state, and effects.
- Favor concrete React and functional-programming vocabulary over enterprise-layer naming.