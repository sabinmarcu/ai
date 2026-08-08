# Phase 04 - Release, Documentation, and Adoption

Status: Planned

## Objective

Publish and operationalize `@sabinmarcu/ai` for broader internal and external
usage with two complementary release channels:

- immutable, tagged stable releases with generated changelogs
- continuously available rolling prereleases from the default branch

Build a searchable Docusaurus documentation site from repository-owned source
content, keep stable documentation aligned with stable releases, and preserve
the documentation needed to use supported compatibility lines.

Phase 4 establishes the package, release, compatibility, and documentation
baseline that Phase 5 extends with the `ai` and `ai-mcp` entrypoints and
exact-version bootstrap behavior.

## Decisions

### Release Automation

Use Release Please rather than Yarn's version plugin as the stable release
coordinator.

Release Please is the better fit because this repository currently publishes
one public package and already requires Conventional Commits. It provides the
needed release PR, semantic version calculation, changelog maintenance, Git
tag, and GitHub Release workflow without introducing a second version-intent
format.

Yarn's version plugin is useful when many workspaces need independent release
decisions and coordinated granular version plans. The documentation site may
become a private Yarn workspace, but it is not independently published and
does not justify adopting Yarn release definitions. Reconsider this decision
only if the repository later publishes multiple independently versioned npm
packages.

### Release Channels

Publish two npm distribution tags:

- `latest` points to the newest deliberate stable release.
- `next` points to the newest successful rolling prerelease from `main`.

There is no mutable or unversioned npm artifact. Every npm publication has a
unique immutable semantic version. The rolling behavior comes from moving the
`next` dist-tag, not from overwriting an existing package version.

Consumers choose stability explicitly:

```sh
yarn dlx @sabinmarcu/ai@latest --help
yarn dlx @sabinmarcu/ai@next --help
```

The primary binary remains `ai`, matching the unscoped portion of the package
name. Package runners can therefore select it directly from
`@sabinmarcu/ai`; only the secondary `ai-mcp` binary requires explicit
package-to-binary mapping.

### Documentation Ownership

Repository files are the documentation source of truth. Docusaurus renders and
indexes that content; it must not introduce independently maintained copies.

- Root `README.md` owns concise installation and common usage.
- `docs/` owns guides, concepts, migration instructions, compatibility policy,
	and longer workflows.
- Each `catalog/modules/<folder>/README.md` owns the narrative documentation
	for that module.
- Each `catalog/mixins/<folder>/README.md` owns the narrative documentation for
	that mixin.
- `module.json` and `mixin.json` own structured catalog facts.
- Clipanion command definitions own CLI names, options, descriptions, and
	command-level usage text.
- `CHANGELOG.md` is generated and maintained by Release Please.

Generated Docusaurus input and output must not become an alternative authoring
surface. Committed Docusaurus version snapshots are release artifacts and must
be refreshed through scripts rather than edited manually.

### Documentation Versions

Expose these documentation channels:

- `next` represents documentation generated from `main` and corresponds to the
	npm `next` channel.
- `stable` resolves to the documentation for the current npm `latest` release.
- Historical documentation is retained by compatibility line.

Before `1.0.0`, a minor version is a compatibility line, for example `0.3` or
`0.4`. Starting with `1.0.0`, a major version is a compatibility line, for
example `1.x` or `2.x`. A patch release refreshes the snapshot for its existing
line rather than creating another complete documentation copy. Exact patch
differences remain available through `CHANGELOG.md` and GitHub Release notes.

Examples:

| Package release | Documentation line | Result |
| --- | --- | --- |
| `0.3.0` | `0.3` | Create the `0.3` snapshot. |
| `0.3.2` | `0.3` | Refresh the `0.3` snapshot. |
| `0.4.0` | `0.4` | Create `0.4`; make it stable; retain `0.3`. |
| `1.0.0` | `1.x` | Create `1.x`; make it stable. |
| `1.7.0` | `1.x` | Refresh `1.x`; retain older supported lines. |
| `2.0.0` | `2.x` | Create `2.x`; make it stable; retain `1.x`. |

The stable documentation snapshot must be produced from the same source state
as the stable package tag. Documentation on `main` must never silently replace
stable documentation before a package release.

## Version Domains

Keep the repository's independent version domains explicit:

1. **Package version:** the semantic version in `package.json`, npm, the Git
	 tag, the GitHub Release, and CLI `--version` output.
2. **Stack schema version:** the integer `version` in `.ai/stack.yml`. It changes
	 only for incompatible serialized stack shape changes and is not tied to
	 every package release.
3. **Module and mixin versions:** catalog manifest versions used to detect
	 installed-content drift or compatibility. They change when that catalog
	 unit's behavior or managed content changes.
4. **Documentation compatibility line:** the retained documentation boundary
	 described above.

Do not infer one domain directly from another. A package release can include
zero or many catalog version changes. A package major release does not require
a stack schema bump, and a stack migration can be introduced in a package
minor release when backward compatibility is preserved.

The package manifest is the single source of truth for the CLI version. Source
and compiled entrypoints both resolve the package manifest relative to their
module location so local execution, packed-artifact execution, and npm
execution report the published package version.

## Stable Release Model

### Conventional Commit Mapping

Release Please derives the next stable version from commits since the previous
release:

- `fix:` produces a patch release.
- `feat:` produces a minor release.
- `!` or a `BREAKING CHANGE:` footer produces a major release.
- other configured commit types may appear in release notes without forcing a
	version increment unless Release Please configuration says otherwise.

Before `1.0.0`, explicitly configure and document how breaking changes affect
minor versions. Do not rely on contributors guessing Release Please's
pre-1.0 behavior. The chosen configuration and repository commit guidance must
agree.

Commit scopes organize changelog entries but do not represent independently
versioned packages. Useful scopes include `cli`, `catalog`, `docs`, `release`,
and command or subsystem names already recognized by repository guidance.

### Release Please Files

Add the standard manifest-based configuration so future multi-component needs
can be handled without replacing the release model:

- `release-please-config.json`
- `.release-please-manifest.json`

Configure one releasable component rooted at the repository root with the Node
release strategy. Release Please owns updates to:

- `package.json` version
- `.release-please-manifest.json`
- `CHANGELOG.md`

Keep `include-v-in-tag` explicit and use one consistent tag shape, preferably
`v<semver>`. Do not add manually maintained version constants.

### Stable Workflow

On each push to `main`, the Release Please workflow updates or opens one release
PR. The PR is the human approval boundary for stable publication. It must show:

- proposed package version
- accumulated changelog entries
- breaking changes and migration notes
- package metadata changes
- the documentation compatibility line that will be created or refreshed

Merging the release PR creates the Git tag and GitHub Release. Stable npm
publication runs only for the release created from that tagged commit. The
publish job must:

1. Check out the exact tag.
2. Install dependencies from the immutable Yarn lockfile.
3. Run the release validation suite.
4. Build the package.
5. Produce and inspect the package tarball.
6. Smoke-test the installed tarball in a clean fixture.
7. Publish the public scoped package with provenance under `latest`.
8. Verify that npm reports the expected version and `latest` dist-tag.

Do not publish stable packages from an arbitrary branch build or manually
selected working tree. A failed stable publish may be retried for the same Git
tag only when npm does not already contain that version.

## Rolling Release Model

### Version Shape

Each successful eligible `main` build receives a unique prerelease version. A
recommended shape is:

```text
<next-patch>-next.<github-run-number>.<run-attempt>.<short-sha>
```

For example, when `package.json` contains `0.3.0`:

```text
0.3.1-next.184.1.a1b2c3d
```

The computed prerelease does not predict the semantic level of the next stable
Release Please release. It provides uniqueness, ordering, traceability, and a
valid version greater than the current stable version. Release Please remains
the only authority for the eventual stable version.

### Rolling Workflow

After required checks pass on a push to `main`, the rolling workflow must:

1. Read the stable base version from `package.json`.
2. Compute the unique prerelease version deterministically from CI context.
3. Apply that version only in the ephemeral CI checkout.
4. Build and test the exact files that will be packed.
5. Produce and inspect the package tarball.
6. Smoke-test the tarball in a clean fixture.
7. Publish with provenance under the `next` npm dist-tag.
8. Verify the published version, dist-tag, and CLI `--version` output.
9. Record the package version and source commit in the workflow summary.

Do not commit rolling versions, create rolling Git tags, add rolling entries to
`CHANGELOG.md`, or move `latest`. If a retry discovers that its exact npm
version already exists and points to the same source commit, treat publication
as complete rather than inventing an unrelated replacement.

Use workflow concurrency to prevent older `main` builds from moving `next`
after a newer build. Cancel an unstarted obsolete build, but do not interrupt a
publish operation after npm mutation may have begun. Before moving the dist-tag,
verify that the commit is still the newest eligible `main` commit.

### Rolling Support Policy

The `next` channel is for early adoption and integration testing:

- it may contain changes not yet represented in stable documentation
- it may be superseded on every successful `main` build
- consumers that require reproducibility must pin the exact prerelease version
- bug reports must include the exact version, not only the `next` label
- no migration promise exists between arbitrary rolling builds beyond the
	compatibility guarantees already documented for the upcoming stable line

Phase 5's persistent MCP installation must pin an exact resolved package
version even when initialization was invoked through `@next`. It must never
persist a floating dist-tag as the runtime dependency.

## npm Publication and Supply Chain

Before enabling publication:

- confirm package name ownership and public scoped-package access
- configure npm trusted publishing through GitHub Actions when supported
- use GitHub OIDC and npm provenance instead of a long-lived automation token
- grant `id-token: write` only to jobs that publish
- grant `contents: write` and `pull-requests: write` only to Release Please
- leave validation and documentation jobs with read-only repository access
- pin third-party actions to reviewed immutable revisions according to
	repository policy
- protect the npm package with organization-level MFA and least privilege

The packed artifact must contain only declared publication content. Validate
that it includes at minimum:

- compiled executable and runtime files under `dist/`
- catalog manifests and source assets under `catalog/`
- package metadata required by npm and Node
- user-facing package README and license once selected

It must exclude source tests, plans, temporary files, repository-local AI
overrides, documentation build output, and credentials.

Use `yarn npm publish` consistently with the repository package manager unless
a verified trusted-publishing limitation requires the npm CLI. Record any such
exception in this plan and package scripts rather than mixing clients silently.

## Documentation Architecture

### Site Project

Create the Docusaurus site as a private project under `website/`. If it becomes
a Yarn workspace, update the repository's project classification and active
catalog stack through the normal reconciliation flow. The website is a web app
used only to build static documentation; it is not an npm release component.

Keep site dependencies and configuration isolated from the runtime package.
The root package remains the only public package and the only Release Please
component.

Expected high-level layout:

```text
README.md
docs/
	concepts/
	guides/
	migrations/
	reference/
catalog/
	modules/<folder>/README.md
	mixins/<folder>/README.md
website/
	docusaurus.config.ts
	sidebars.ts
	src/
	static/
```

Generated current-reference content should live in an ignored build directory
owned by the documentation generator. Docusaurus compatibility snapshots may
be committed where its versioning system requires them, but must carry clear
generated ownership and be reproducible from release source.

### Usage Documentation

Keep the root README short enough to serve npm and repository visitors. It must
cover:

- package purpose and support status
- stable and rolling installation commands
- executable name and basic help invocation
- minimal initialization example
- materialized and source asset modes
- links to full guides, CLI reference, catalog, changelog, and migration docs

Long-form usage belongs in `docs/`, including:

- installation and execution through Yarn and other supported npm runners
- initialization, detection, verification, status, apply, and reconciliation
- stack file concepts and asset modes
- managed content, source-linked content, drift, repair, and local overrides
- presets, ordinary modules, automatic dependencies, and automatic mixins
- release channels and reproducible version pinning
- troubleshooting and diagnostic information to include in bug reports

Do not present `npx` as the only or primary path in this Yarn-managed
repository. It may be documented as a supported npm ecosystem runner after its
package smoke test passes.

### CLI API Reference

Generate Yarn-style command reference pages from Clipanion's registered command
definitions. Each page must include:

- command path and synopsis
- purpose and detailed description
- positional arguments
- options, aliases, defaults, and repeatability
- examples supplied by command metadata
- relevant exit behavior and mutation warnings
- links to related conceptual guides

Refactor CLI construction into an import-safe factory if necessary so the docs
generator can inspect the same command registry without executing a command or
terminating the process. Do not parse terminal-formatted `--help` output when a
structured Clipanion definition is available.

Add a test that compares generated command identities with the registered CLI
commands. Documentation validation must fail when a public command lacks usable
metadata or generated output is stale.

### Catalog Reference

Require a README for every ordinary module and every mixin. Add catalog
validation for this requirement.

Module README narrative should explain:

- intent and applicability
- behavior and guardrails introduced
- important dependencies and conflicts
- managed or source-linked assets at a conceptual level
- repository-local override strategy
- relevant examples and limitations

Mixin README narrative should explain:

- required ordinary modules
- the intersection-specific behavior it contributes
- why no ordinary module owns that behavior alone
- activation and deactivation consequences
- migration or duplication risks where relevant

Do not manually duplicate manifest fields merely to render tables. The docs
generator combines README prose with structured `module.json` or `mixin.json`
data to produce each page. Validate README-to-manifest pairing, unique IDs,
links, and catalog loading before building the site.

Generate searchable catalog indexes with at least:

- ID and display name
- kind: module or mixin
- category for modules
- description and version
- dependencies or `requiresAll` relationships
- conflicts where applicable
- managed paths, source assets, and override locations

Provide filters for kind and module category. Link dependency, conflict, and
mixin requirement IDs to their generated catalog pages. Preserve a stable URL
derived from the catalog ID rather than the incidental directory name.

### Search

Use build-time local full-text search for the initial GitHub Pages deployment
so search does not require a hosted backend or external crawler. Index guides,
CLI reference, module pages, mixin pages, migration docs, and the current
compatibility line.

Exclude duplicate generated content and obsolete unsupported snapshots from
default results where the selected search plugin permits it. Search results
must visibly identify `next`, stable, or historical documentation context.

Algolia DocSearch may replace local search later if public eligibility,
indexing behavior, and operational ownership justify it. Search provider choice
must not change documentation source ownership.

### Site Design and Navigation

The first screen is documentation, not a marketing landing page. Use compact,
task-oriented navigation similar to mature CLI documentation sites:

- getting started and guides
- CLI commands
- modules
- mixins
- migrations and compatibility
- changelog and GitHub repository
- visible version/channel selector
- persistent search

The site must be usable on desktop and mobile, meet accessible color and
keyboard-navigation expectations, and avoid hiding version context. Every page
must show whether it describes `next`, stable, or a historical line.

## Documentation Generation and Version Synchronization

Implement deterministic scripts with these conceptual responsibilities:

- `docs:generate` builds current CLI and catalog reference inputs from source.
- `docs:check` regenerates into a temporary location and fails on stale or
	invalid documentation.
- `docs:version` creates or refreshes the compatibility-line snapshot for a
	proposed stable version.
- `docs:build` performs a production Docusaurus build with broken-link and
	broken-anchor failures enabled.
- `docs:serve` runs the local documentation development server.

Exact names may follow the final website workspace layout, but CI and release
workflows must call repository scripts rather than reproduce generation logic
in YAML.

The stable release process must enforce this ordering:

1. Release Please proposes a version in its release PR.
2. Determine the documentation compatibility line from that version.
3. Generate CLI and catalog reference from the release PR source.
4. Create or refresh that line's Docusaurus snapshot.
5. Build and link-check `next`, proposed stable, and retained snapshots.
6. Ensure the release PR contains or reproducibly identifies the snapshot.
7. Merge the release PR and create the package tag.
8. Build stable package and stable docs from the same tagged commit.
9. Publish npm `latest` and deploy the matching stable docs.

Automate snapshot refresh on the Release Please branch if GitHub permissions
allow a narrowly scoped bot update. Otherwise provide one documented
maintainer command and make release validation fail until the generated
snapshot matches the proposed version. Never allow stale stable docs merely
because snapshot automation could not write to the PR.

The `next` docs build runs from `main` after source validation. It may deploy
independently of npm `next`, but each page and deployment summary must expose
the source commit. Prefer deploying npm `next` and docs `next` from the same
validated commit so their behavior remains easy to correlate.

## GitHub Pages Deployment

Publish the static site through GitHub Pages using GitHub Actions and the Pages
artifact/deployment flow. Configure the correct repository subpath as the
Docusaurus base URL and validate generated links under that base path rather
than only at `/`.

The Pages deployment must contain the complete coherent site in one artifact:

- current stable documentation
- `next` documentation
- retained compatibility lines
- root redirects and version selector metadata
- search indexes for deployed content

Do not let separate stable and rolling workflows race to replace Pages with
partial sites. Use one deployment workflow or one serialized assembly step
that builds all required channels. The newest eligible source state wins only
after stable snapshot integrity has been verified.

For pull requests, build the complete site without deploying it. Optionally
upload the static build as a workflow artifact for review. Pages deployment is
restricted to protected release or default-branch environments.

## Compatibility and Migration Policy

### Package Compatibility

Follow semantic versioning for the public CLI and catalog behavior:

- patch: backward-compatible fixes and documentation corrections
- minor: backward-compatible commands, options, modules, mixins, and behavior
- major: removals, incompatible defaults, incompatible CLI contracts, or
	unsupported migration boundaries

Before `1.0.0`, minor releases may carry breaking changes only when explicitly
identified by the configured policy, release PR, changelog, and migration
guide. Patch releases remain backward compatible.

Document the supported Node.js and Yarn ranges from package metadata. CI must
test the minimum supported Node.js version and the primary development version
before stable release.

### Stack Compatibility

For every supported stack schema version, define whether the current CLI can:

- read it
- report status without mutation
- migrate it
- apply or reconcile it
- write it back

Never silently reinterpret an unsupported stack version. A migration must:

1. Parse and validate the old shape.
2. Produce a reviewable plan.
3. Preserve user selections and local overrides.
4. Refuse mutation when managed drift makes the result ambiguous.
5. Write the new version atomically.
6. Remain idempotent after success.

Maintain a compatibility table in documentation and fixture tests for each
supported migration path. Phase 3's stack version 2 is the initial baseline.

### Catalog Compatibility

Catalog IDs and manifest semantics are public contracts because consumer stack
files retain module IDs. Renaming or removing an ID requires an alias,
migration, or explicit breaking release. Dependency, conflict, activation, and
managed-path changes require fixture coverage proportional to their migration
risk.

Module and mixin manifest versions must change when managed content or behavior
changes in a way consumers need to detect. Add validation that prevents changed
catalog units from retaining stale manifest versions once a reliable
comparison strategy is selected.

### Support Window

Initially support:

- the current stable compatibility line
- migration from the immediately preceding compatibility line
- current `next` for best-effort early testing

Retain older documentation even after runtime support ends, but label it
unsupported and remove it from default search results where practical. Expand
the runtime support window only when CI fixtures and maintenance capacity can
enforce it.

## CI Policy and Validation

Keep `yarn check` as the baseline and always use fixing lint through
`yarn lint:fix` according to repository policy. Release validation adds focused
checks rather than weakening the baseline.

Pull requests must verify:

- unit and integration tests
- typecheck and `yarn lint:fix`
- deterministic catalog loading and validation
- a README for every module and mixin
- generated CLI and catalog docs are current
- Docusaurus production build, links, anchors, and search index
- package build and tarball contents
- CLI execution from the packed artifact
- package version and CLI version agreement
- stack compatibility fixtures and migrations
- consumer initialization and reconciliation fixtures

Release workflows repeat security- and artifact-critical checks against the
exact publishing commit. Do not assume a previously successful PR build is
sufficient after a merge commit, release metadata update, or tag creation.

## Consumer Integration Fixtures

Exercise packed artifacts rather than repository source against clean temporary
repositories. At minimum cover:

- empty Node repository initialization
- repository using a preset
- explicit module selection and dependency expansion
- automatic mixin activation
- materialized mode apply, drift report, and repair refusal
- source mode with repository-contained catalog paths
- status and verify on a current stack
- migration from every supported older stack schema
- unsupported future stack rejection
- install or execution through stable and exact prerelease versions
- CLI `--version` matching the packed package version

Fixtures must not depend on this repository at runtime after package
installation except where source mode intentionally points at catalog files
contained in the fixture itself.

## Adoption Documentation

Provide a migration guide from legacy bootstrap repositories and manually
copied AI assets. It must explain:

- inventorying existing instructions and overrides
- mapping legacy content to modules, mixins, and repository-local overrides
- choosing materialized or source mode
- handling collisions with managed paths
- reviewing the first apply plan
- preserving intentionally customized files
- validating the resulting stack
- pinning a stable or exact rolling package version
- rollback before and after managed content is applied

Provide upgrade guides for every compatibility-line transition. A guide should
include prerequisites, changed defaults, removed behavior, stack migration,
catalog ID migration, commands to run, expected review output, and rollback
limits.

## Failure Handling and Recovery

### npm Publication

- Never reuse or delete a published semantic version.
- If package upload succeeds but dist-tag movement fails, verify package
	integrity and repair only the dist-tag.
- If verification fails after publication, leave the immutable version in npm,
	remove or move an incorrect channel tag if policy permits, and publish a new
	fixing version.
- Never force a Git tag to point at different source after publication.
- Record manual recovery actions in the GitHub Release or follow-up issue.

### Documentation Deployment

- A docs failure must not roll back or mutate an already published npm package.
- Keep the previous Pages deployment active until a complete replacement site
	passes validation.
- Rebuild stable docs from the immutable package tag when repairing deployment.
- Do not build a stable repair from newer `main` content.
- Surface package-published/docs-failed state prominently in workflow output
	and repair it before the next stable release.

### Release Please

- Do not hand-edit generated changelog sections unless the release PR requires
	a curated correction that Release Please will preserve.
- If commit classification is wrong, fix commit guidance or Release Please
	configuration rather than repeatedly patching symptoms in release PRs.
- Closing a release PR delays stable publication but does not affect rolling
	builds; document how to recreate or reopen it.

## Workflow Boundaries

Use separate workflows or clearly separated jobs for these responsibilities:

1. **Pull request validation:** read-only checks, package smoke test, docs build.
2. **Release Please:** maintain release PR and create GitHub release/tag.
3. **Rolling publish:** publish eligible `main` commits under `next`.
4. **Stable publish:** publish the exact GitHub release tag under `latest`.
5. **Pages deployment:** assemble and deploy all documentation channels.

Keep publish and Pages environments protected. Use explicit workflow
permissions, concurrency groups, timeouts, and job summaries. Avoid a single
broadly privileged workflow token shared across validation, publication, and
deployment.

## Implementation Order

### Release Foundation

1. Confirm npm package ownership, access level, license, repository metadata,
	 funding metadata if applicable, issue links, and support policy.
2. Make package metadata publish-ready and verify `files`, `bin`, exports if
	 introduced, engines, and README rendering.
3. Keep CLI version output sourced from the package manifest.
4. Add deterministic package build, pack inspection, clean-install smoke test,
	 and version-agreement test.
5. Add Release Please manifest configuration and initial changelog bootstrap.
6. Add stable release workflow with least privilege and npm provenance.
7. Add rolling version computation and `next` publication workflow.
8. Test publication against a disposable package or dry-run boundary before
	 enabling the production npm environment.

### Documentation Foundation

9. Create the private Docusaurus site project under `website/`.
10. Add guide source structure under `docs/` and reshape root README for npm
		usage.
11. Add missing README files for every module and mixin, following catalog
		reflection requirements for catalog changes.
12. Extend catalog validation to require and pair README files with manifests.
13. Refactor CLI registration into an import-safe factory if needed.
14. Generate structured CLI command pages from Clipanion metadata.
15. Generate module and mixin pages and indexes from manifests plus READMEs.
16. Add local full-text search, filters, cross-links, version context, and
		responsive navigation.
17. Add deterministic generation, stale-output checks, production build, link
		checks, accessibility smoke checks, and desktop/mobile visual checks.

### Versioned Documentation and Adoption

18. Implement `next`, stable, and compatibility-line documentation routing.
19. Implement release snapshot creation and patch-line refresh.
20. Couple proposed version and snapshot validation at the release PR boundary.
21. Add serialized GitHub Pages assembly and deployment.
22. Add stack compatibility table, migration engine coverage, and historical
		fixtures.
23. Write legacy adoption and compatibility-line upgrade guides.
24. Run an end-to-end rolling publication and documentation deployment.
25. Run an end-to-end stable release, npm verification, and matching stable
		documentation deployment.

## Acceptance Scenarios

### Rolling Release

Given a normal feature or fix is merged to `main`:

1. Required checks pass for the merge commit.
2. CI computes a unique prerelease version without committing it.
3. The packed artifact reports that exact version through `--version`.
4. npm receives the immutable prerelease with provenance.
5. `next` points to it only if no newer eligible build superseded it.
6. The deployment summary links the source commit and matching `next` docs.
7. `latest`, stable Git tags, and `CHANGELOG.md` remain unchanged.

### Stable Release

Given releasable Conventional Commits have accumulated:

1. Release Please proposes the expected semantic version and changelog.
2. Release validation identifies and refreshes the correct documentation line.
3. A maintainer reviews and merges the release PR.
4. Release Please creates the immutable tag and GitHub Release.
5. The tagged package passes build, tarball, clean-install, and CLI smoke tests.
6. npm publishes the tag's version with provenance and moves `latest`.
7. Pages deploys stable documentation generated from that same tagged source.
8. The stable selector, changelog, npm page, GitHub Release, and CLI all report
	 the same package version.

### Documentation Drift

Given a command, module manifest, mixin manifest, or catalog README changes:

1. Documentation generation reflects the source change deterministically.
2. Pull request validation fails when generated reference or snapshots are
	 stale.
3. Search and cross-links include the updated entry.
4. Stable documentation remains unchanged until a stable release is approved.
5. The release snapshot records the change in the appropriate compatibility
	 line.

### Compatibility Migration

Given a fixture using the immediately preceding supported stack version:

1. The new CLI reads and reports it without silent mutation.
2. Migration produces a reviewable deterministic plan.
3. Apply preserves selections, local overrides, and unrelated files.
4. Repeated migration is a no-op.
5. The migration guide and compatibility table describe the tested behavior.

## Deliverables

- Release Please configuration, generated changelog, and release PR workflow.
- Stable npm publication with immutable Git tags, GitHub Releases, provenance,
	and the `latest` dist-tag.
- Unique rolling npm prereleases from `main` under the `next` dist-tag.
- Package tarball inspection and clean-consumer smoke tests.
- Package-derived CLI version output and agreement tests.
- Private Docusaurus site project and GitHub Pages deployment.
- Concise npm usage README and long-form guides.
- Generated Clipanion CLI API reference.
- README-backed searchable module and mixin catalog.
- `next`, stable, and retained compatibility-line documentation.
- Consumer onboarding, legacy migration, and version upgrade guides.
- Enforced package, stack, catalog, and documentation compatibility policy.

## Exit Criteria

- `@sabinmarcu/ai@latest` resolves to a tested package from an immutable Git tag
	and GitHub Release.
- `@sabinmarcu/ai@next` resolves to the newest eligible tested `main` build, and
	its exact version identifies the CI run and source commit.
- The installed CLI reports the exact npm package version.
- Stable releases include a Release Please-generated changelog and provenance.
- A new consumer can discover, install, initialize, verify, and upgrade the CLI
	from published documentation.
- Every module and mixin has validated source documentation and a searchable
	generated page.
- CLI reference pages are generated from the registered Clipanion commands.
- GitHub Pages exposes coherent `next`, stable, and retained compatibility-line
	documentation without deployment races.
- Stable package and stable documentation derive from the same tagged commit.
- CI protects package contents, command contracts, catalog contracts, stack
	compatibility, generated documentation, and consumer workflows.
- The immediately preceding supported compatibility line has a tested,
	documented migration path.
