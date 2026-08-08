# tooling/commitlint

Commit-message validation infrastructure with commitlint.

## Included AI Files

- `files/instructions/commitlint-configuration.instructions.md`

## Intent

- Own commitlint dependencies, configuration, and package scripts.
- Keep commitlint configuration in a dedicated root config file, never in `package.json`.
- Leave format and rule selection to guidance integration mixins.
- Leave Git hook integration to a Husky mixin.