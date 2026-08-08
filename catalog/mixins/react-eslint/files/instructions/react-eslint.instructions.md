---
description: "React, hooks, accessibility, JSX, and TSX integration requirements for projects using the shared ESLint configuration."
applyTo: "**/*.{ts,tsx,js,jsx,mjs,cjs,json}"
---

# React ESLint Integration

## Required Peers

- Ensure `react` is resolvable from the dependency scope where ESLint runs.
- Install `eslint-plugin-react`, `eslint-plugin-react-hooks`, and `eslint-plugin-jsx-a11y` in the dependency scope from which ESLint and `@sabinmarcu/eslint-config` resolve tooling.
- Follow the repository's dependency-placement policy when choosing dependency fields and owning projects.
- Treat a missing optional peer as a configuration failure even though the shared config degrades without throwing.

## Shared Configuration Ownership

- Keep `@sabinmarcu/eslint-config` active as the shared flat-config baseline.
- Rely on the shared config for its React and accessibility rule definitions and plugin registration.
- Do not copy the shared React or accessibility rule sets into project configuration.
- Keep project-specific exceptions in descriptively named flat-config chunks with narrow file scopes.

## Temporary TSX and Hooks Completion

The current shared config scopes its React chunks to `**/*.jsx` and registers the hooks plugin without enabling hooks rules. Until the shared config covers TSX and enables hooks rules itself:

- Import the shared JSX config through its exported `configs/jsxConfig` subpath.
- Reuse those config chunks for `**/*.tsx` by replacing only their file selectors and names.
- Add a named rule-only chunk for `**/*.{jsx,tsx}` using the hooks plugin's recommended rules.
- Append the temporary chunks after the shared baseline.
- Do not fork or copy the shared React and accessibility rule objects.

Representative pattern:

```js
import sharedReactConfig from '@sabinmarcu/eslint-config/configs/jsxConfig';
import reactHooks from 'eslint-plugin-react-hooks';

const sharedTsxConfig = sharedReactConfig.map(({
  files: _files,
  name,
  ...config
}) => ({
  ...config,
  name: `${name ?? 'Shared React'}/TSX`,
  files: ['**/*.tsx'],
}));

const reactHooksRules = {
  name: 'Project React Hooks Rules',
  files: ['**/*.{jsx,tsx}'],
  rules: {
    ...reactHooks.configs.recommended.rules,
  },
};
```

Remove these temporary chunks only after the installed shared config demonstrably applies equivalent React, accessibility, and hooks rules to both JSX and TSX.

## Validation

- Inspect the effective ESLint configuration for representative `.jsx` and `.tsx` component files.
- Confirm that React and accessibility plugins and rules are active for both file types.
- Confirm that hooks rules such as `react-hooks/rules-of-hooks` are active.
- Lint representative JSX and TSX components; success on JavaScript or TypeScript files without JSX does not prove React integration loaded.
- Fail setup validation when the shared config reports that it skipped React, hooks, or accessibility configuration.