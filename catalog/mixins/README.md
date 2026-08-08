# Mixins

Mixins contain managed guidance that activates automatically when a resolved
stack contains every ordinary module required by the mixin.

Each mixin lives under `catalog/mixins/<mixin-folder>` and provides a
`mixin.json` manifest. Mixin IDs use the `mixin/` namespace.

Mixins are not selectable modules and must not appear in presets or selected
stack state. Their `requiresAll` field references the ordinary modules whose
combination activates them.

Current integrations compose ESLint with lint-staged and compose Husky hooks
with lint-staged, TypeScript, commitlint, and Yarn monorepo checks without
moving ownership of package scripts into Husky itself.

Commit integrations keep authoring policy separate from enforcement:

- Conventional Commits guidance is universal through `global/core`.
- Monorepo guidance requires scopes drawn from workspace aliases or approved repository concerns.
- Commitlint integrations translate the active guidance into shareable config dependencies and rules.