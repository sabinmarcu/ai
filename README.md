# ai-lib

Composable AI bootstrap library and CLI for isolated repositories.

## Goals

- Keep consumer repositories fully functional in isolation.
- Enable mix-and-match AI modules by project type.
- Preserve vendored shared files unless manually changed.
- Support controlled backport of shared-path changes upstream.

## Project Terminology

A node project is any folder containing a `package.json`. A project may combine classifications where their modules are compatible.

Apps have exactly one classification:

- **Node app:** a standalone production server or service, not a command run locally by a developer.
- **Node tool:** a CLI, build tool, or development utility run as a one-off executable by a developer or CI. A node tool is also a node library; this repository has both classifications.
- **Web app:** an application that runs for the browser or uses web application tooling or frameworks such as Vite, Next.js, React, Vue, Svelte, or Angular.

Libraries also have exactly one classification:

- **Node library:** targets the Node.js runtime and includes `@types/node` in its dependencies or development dependencies.
- **Web library:** targets browsers. At minimum it does not include `@types/node`; browser types or dependencies on React, Vue, Svelte, Angular, or similar web frameworks are stronger signals.

Node and web libraries are mutually exclusive. Node and web apps cannot also be libraries.

"Node package" is not a project classification. "Package" refers only to a package-manager or publication artifact when that meaning is intended.

## Project Layout

- `src/`: Clipanion CLI commands and core orchestration logic.
- `catalog/modules/`: module manifests grouped by concern.
- `catalog/presets/`: reusable module bundles for common project types.
- `plan/`: phase-by-phase implementation plan.

## Current CLI Bootstrap

```sh
yarn cli -- --help
```

### Commands

- `init`: resolve applicable preset/module dependencies into a local stack file.
- `detect`: suggest modules by repository shape.
- `apply`: placeholder for managed file materialization.
- `status`: inspect stack + catalog state.
- `verify`: validate local stack against catalog.

## Development

```sh
yarn install
yarn prepare
yarn lint:fix
yarn check
yarn build
```

## Roadmap

Implementation phases live in `plan/`, one markdown file per phase.
