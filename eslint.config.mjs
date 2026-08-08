import js from '@eslint/js';
import globals from 'globals';
import sabinmarcuConfig from '@sabinmarcu/eslint-config';
import tseslint from 'typescript-eslint';

const sharedConfig = Array.isArray(sabinmarcuConfig) ? sabinmarcuConfig : [sabinmarcuConfig];

export default tseslint.config(
  {
    name: 'project/ignores',
    ignores: ['dist/**', '.yarn/**', '.pnp.*', 'node_modules/**', 'eslint.config.mjs'],
  },
  ...sharedConfig,
  {
    name: 'project/typescript-and-node-defaults',
    files: ['**/*.{js,mjs,cjs,ts,tsx,mts,cts}'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: {
      globals: globals.node,
    },
    rules: {
      'no-console': 'off',
    },
  },
  {
    name: 'policy-exception/tools-cli-process-exit',
    files: ['tools/**/*.mjs'],
    rules: {
      'unicorn/no-process-exit': 'off',
    },
  }
);
