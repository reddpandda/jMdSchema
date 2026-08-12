# Scope Document

*v1 — complete. Defines what this project is and isn't. If a real decision changes later, update this document rather than letting it drift from reality.*

---

## Concept

- **Template** — how a specific file type is written; defines its structural elements (headings, required/optional sections, counts, content rules)
- A document is validated against its template, and can be rebuilt against it if it doesn't match
- Bespoke sections are not a special category — a one-off section is just an element with an "allow additional content" flag, not a separate mechanism
- **Templates are plain objects matching a TypeScript interface.** They can be authored as YAML (parsed via `js-yaml`) or as TS literal objects — no translation layer between them.

## What this repo is — the authoritative, general tool, not a project's docs branch

- **jMdSchema is not any project's docs branch.** It's the general, versioned tool that every project's own docs branch references — the engine, the builder, and a general-purpose template library live here; nothing project-specific does.
- **This repo has no separate docs branch of its own.** The `main` branch contains everything — engine, builder, templates, Action definition. Only *consuming* repos have a `docs`/`main` split.
- **Each consuming repo** (JLib, jReference, future repos) has its own `docs` branch with its own `manifest.yml`, its own `content/`, its own `partials/` — and references jMdSchema to actually run the builder against them.
- **Distribution: jMdSchema is consumed as a GitHub Action.** A consuming repo's docs-branch CI does `uses: reddpandda/jMdSchema@v1`. This does not conflict with the "no live dependency" rule below — that rule is about depending on *someone else's* unowned code (mdschema, mdshape); this is our own repo, our own tags, referenced by our own other repos the normal way an internal tool gets reused.
- A consuming repo's own docs-branch README should point to jMdSchema for how the system works, but jMdSchema itself is the authoritative source, not a copy of the explanation.

### Versioning strategy

- jMdSchema follows SemVer. The `v1` tag points to the latest `v1.x` release.
- Consuming repos should use `uses: reddpandda/jMdSchema@v1` to get non-breaking updates automatically, or pin to a specific tag (e.g. `@v1.2.3`) for strict reproducibility.
- **jMdSchema's major version is not tied to `manifest_version`** — see Manifest versioning strategy below for why they were deliberately decoupled.

## Engine — settled after a full verification pass

- **Structural validation is hand-built**, not delegated to a third-party library — informed by direct, line-by-line study of [mdschema](https://github.com/jackchuka/mdschema)'s real Go source (`structure.go`, `pattern.go` minus the `expr` mode), which is confirmed to do exhaustive structural validation: every heading in a document is checked against the schema, with unmatched sections flagged unless explicitly allowed (`AllowAdditional`) — exactly the behavior this project's core concept depends on.
- **Heading-level hygiene (no skipped levels, MD001-equivalent) is folded natively into the structural engine's own tree walk**, not sourced from an external linter — the engine already walks the heading tree to do real validation, so this check is a near-free addition to work already happening, not a new dependency. Minor stylistic drift between individual documents' code blocks or prose is treated as acceptable; only structural/heading correctness is enforced.
- **Typed field/frontmatter extraction is adapted from a narrow, rewritten slice of [`@markschema/mdshape`](https://github.com/markschema/markschema)** — specifically its `primitives.ts` (string/number/boolean/date/email/url/enum builders) and the relevant parts of its `core/` combinator hierarchy (optional/nullable/default/transform/refine) — trimmed to what's actually used and rewritten in our own style, not imported as a live dependency or copied unmodified.
- **The same typed-extraction engine is reused to validate the manifest's own schema** (see Manifest validation below) — rather than writing a second, parallel validator just for that one file.
- **mdshape is not used as the primary validation engine.** A full source-level verification pass confirmed why:
  - Its model is **targeted extraction** (pull named sections out of a document you trust is roughly right), not **exhaustive validation** (does this document match this shape completely, flag anything unaccounted for)
  - Confirmed directly in `document.ts`/`section.ts`: it walks the document's sections, but only ever checks the ones your schema explicitly named — there is no mechanism, and no option, to flag a section that exists but wasn't declared
  - It supports `.min()` count constraints but has no `.max()` anywhere in the codebase
  - It's an early release (v0.1) as a live dependency, which was a real factor before the decision to vendor-and-rewrite instead of depend on it live
- **Both libraries are fully owned, not live dependencies** — neither is ever an npm package dependency, at any stage; both are read, adapted, and rewritten directly into this project's own TypeScript source

## Reference resolution (manifest + directives)

- A single **root manifest** file maps a stable logical name to wherever that file currently lives — one source of truth, not one per directory. **Versioned**, following the browser-extension `manifest_version` precedent:
  ```yaml
  manifest_version: 1
  entries:
    api.md: docs/api-reference.md
    architecture.md: docs/architecture/overview.md
  ```
  The `entries:` wrapper exists specifically so `manifest_version` can sit at the top level without any risk of colliding with a real entry key.
- Two distinct categories, not one undifferentiated list, both implemented via [`remark-directive`](https://github.com/remarkjs/remark-directive) — parsed as real AST nodes in the same unified/remark pipeline as everything else, not a separate text pass beforehand. Colon count follows remark-directive's own convention: single colon (`:name`) is an inline/text directive, used where the result is inline content (a link, a text string); double colon (`::name`) is a block-level directive, used where the result can be a whole block or multiple blocks (transclusion):
  - **Directives (manifest-key resolution)** — the target key sits in the directive's label, resolved against the manifest:
    - `:link[X]` — resolves to a real markdown link using the manifest's current path for `X`
    - `:title[X]` — resolves to `X`'s actual current H1
    - `::include[X]` — transclusion; splices another file's *parsed* content directly into the AST at that point (same concept as DITA's conref or Sphinx's `literalinclude`) — a genuine AST-level operation, so heading structure and block boundaries in the included content stay intact, not naive string concatenation
  - **Metadata tokens (current-document only, no manifest lookup)** — always apply to the document being built; bare directives, no label needed, since there is no other valid target:
    - `:hash`, `:commit`, `:built` — the current document's content hash, the commit it was built against, and the last build date
  - The directive/metadata-token split is what makes this mapping clean: metadata tokens need no argument at all, which maps directly onto remark-directive's bare directive form — nothing awkward forced into the syntax.
- **Resolution runs as a plugin in the same AST pipeline as parsing and structural validation** — not a separate pre-processing pass. This keeps the project consistent with its own reasoning for preferring `remark-frontmatter` over `gray-matter`: no disconnected parsing outside the pipeline. The resolution plugin runs before the structural-validation plugin in the same `.use()` chain, so validation always sees fully-resolved content — same guarantee as before, different mechanism.
- **An unresolvable manifest key is a hard document-level failure** — see Builder Pipeline below.

### Worked example

Given this manifest:
```yaml
manifest_version: 1
entries:
  architecture.md: docs/architecture/overview.md
```

A source document containing:
```markdown
See :link[architecture.md] for details. Built :built.
```

Resolves to:
```markdown
See [Architecture Overview](docs/architecture/overview.md) for details. Built 2026-08-12.
```

`:link[architecture.md]` is parsed by `remark-directive` into an AST node, looked up against the manifest, and replaced with a real link node using both the current path *and* the target's actual H1 as the link text. `:built` needed no lookup at all — it's always about the document being built, right now.

### Manifest validation — three distinct kinds, only two automated

- **Schema validation (automated)** — is the manifest shaped correctly: known `manifest_version`, `entries` is a record of string-to-string. Checked via the engine's own typed-extraction logic, not a separate mechanism.
- **Existence validation (automated)** — does every path in `entries` actually exist on disk. Runs once, as a pipeline pre-step, before the per-document loop. Uses Node's built-in `fs.existsSync` — no extra dependency needed unless the manifest later supports glob patterns (not currently planned). Logged as its own top-level entry in `builder.output.md`, distinct from per-document sections.
- **Semantic staleness (deliberately not automated)** — is a key's name still a meaningful description of what that file is actually about now. Not deterministically checkable — Claude-assisted or manual review territory. **This becomes the primary long-term maintenance burden precisely because all manifest versions stay supported indefinitely** (see below) — a key can remain technically valid, at any version, indefinitely, while quietly pointing somewhere semantically wrong. Deliberately not automated; requires human judgment.

### Manifest versioning strategy

- `manifest_version: 1` is the initial format — `entries` is a flat record of string-to-string paths.
- **All `manifest_version` values are supported indefinitely.** The builder knows how to parse v1, v2, v3, etc., and keeps doing so — following the Firefox model (v2 and v3 supported side by side), not the Chrome model (old versions dropped). The builder never refuses to process an older manifest.
- **A new `manifest_version` is a feature addition, not a deprecation.** Newer versions may unlock capabilities (metadata on entries, glob support, a `base_url` field) that older versions simply don't have access to — not a forced migration.
- **Migration is manual, by choice, not because support is being dropped.** Each `manifest_version` bump ships a one-time `migrate-manifest.ts` script for consumers who *want* the new features. The builder never auto-migrates, and there is no pressure to run it — an unmigrated manifest keeps working exactly as before.
- **`manifest_version` and jMdSchema's major version are deliberately decoupled**: adding support for a new `manifest_version` is additive and can ship in a minor jMdSchema release without breaking anyone — `@v1` stays safe regardless. A jMdSchema major-version bump would only ever correspond to an unrelated breaking change in the Action's own behavior or inputs, not to a manifest version change.

## Universal partials

- Every document carries two universal, byte-identical blocks, injected via `::include[X]`:
  - **Header** — content hash, commit built against, last build date
  - **Footer** — a style block that hides a specific note locally (most local viewers render embedded `<style>` permissively) while leaving it visible on GitHub (GitHub strips raw `<style>` tags on render)
- These are global includes, resolved through the same directive system as any other reference

## Repository structure

```
jMdSchema/ (this repo — general, authoritative, no project-specific content, no separate docs branch)
├── engine/
│   ├── structure.ts          ← structural validation, informed by mdschema
│   ├── extract.ts            ← typed field extraction, adapted from mdshape
│   └── index.ts
├── builder/
│   ├── resolve.ts             ← manifest/directive resolution (remark-directive AST plugin)
│   ├── validate.ts             ← runs resolved doc against its template
│   └── index.ts                  ← pipeline orchestration
├── templates/
│   ├── documents/              ← full structural validation applies
│   │   ├── readme.yml
│   │   ├── api.yml
│   │   ├── changelog.yml
│   │   ├── credits.yml
│   │   ├── onboarding.yml
│   │   └── scope.yml
│   ├── schemas/                  ← what the engine validates a manifest against
│   │   └── manifest.schema.yml
│   └── examples/                   ← annotated starting point for a new consuming repo
│       └── manifest.example.yml
├── action.yml                        ← GitHub Action definition
├── MIGRATION.md                        ← manifest_version upgrade guides (v1→v2, v2→v3, ...)
└── CREDITS.md

(each consuming repo's own docs branch, e.g. JLib — illustrative, not exhaustive; a real repo may have more)
├── manifest.yml
├── content/
│   ├── docs/api-reference.md
│   └── architecture/overview.md
├── partials/
│   ├── header.md
│   └── footer.md
└── bundles/                    ← generated output, mirrors content/ 1:1
    ├── docs/api-reference.md
    ├── architecture/overview.md
    └── builder.output.md
```

*(README.md and LICENSE aren't listed — they're universal to every repo and don't need calling out; only files specific to this project's architecture are shown.)*


## Builder pipeline

The builder writes its output to `bundles/`. A separate, manually-triggered **pusher** action moves reviewed content from `bundles/` to `main` — this human-in-the-loop step is why structural failures are soft failures: mangled output is staged for review, never published automatically. (See Post-build behavior below for exactly what the Action does and doesn't do with branches.)

Per source document, resolution and validation run as sequential plugins within one unified pipeline invocation — not two separate passes over the document — in this order:

0. **Manifest pre-check** (once, before the per-document loop, outside the unified pipeline — it validates `manifest.yml` itself, not a document): schema validation, then existence validation. Any failure here is logged as its own top-level `builder.output.md` entry.
1. **Resolution plugin** (`remark-directive` parses directives/metadata tokens into AST nodes; our own plugin resolves them against the manifest).
   - If any directive fails to resolve: **hard document-level failure** — the document is still generated at its expected output path, but its content is replaced entirely with `This is a placeholder, see builder.output.md`. Never skipped, never left silently broken-but-plausible.
   - The specific broken reference is logged to `builder.output.md`.
   - The structural-validation plugin does not run against a document whose resolution plugin failed — the pipeline short-circuits before reaching it.
2. **Structural-validation and internal-link-validation plugins run next in the same chain**, against the now-resolved AST — `remark-validate-links` checks internal anchors and relative file references alongside our own structural rules, in the same pass.
   - If either fails — a **soft failure** ("mangled," not "wrong") — the real, best-effort resolved content is still written to `bundles/` as-is, since it's staged for human review before the pusher ever runs, not published live.
   - The specific violations, structural or link-related, are logged to `builder.output.md` together.
3. **If both succeed**, clean output, nothing to log.

**The wrong/mangled distinction:**
- **Wrong** (a directive reference that doesn't resolve — factually broken) → hard failure → placeholder stub
- **Mangled** (structurally doesn't match its template, or contains a broken internal link/anchor — nothing factually broken about the manifest itself) → soft failure → best-effort real output, flagged for review

### External link validation (lychee) — deliberately not part of this pipeline

`lychee` is a standalone compiled tool, not a JS/remark plugin — it cannot run inside the same AST pipeline as everything else, unlike `remark-validate-links`. Rather than shell out to it from within jMdSchema's own Action (real added complexity, and a second failure surface for something [lychee's own official Action](https://github.com/lycheeverse/lychee-action) already does well), external link checking is **not invoked by jMdSchema's Action at all**. It's documented here as a recommended, separate step for a consuming repo's own workflow to add alongside jMdSchema's Action, with its own independent pass/fail reporting via `lychee-action`'s own GitHub annotations. jMdSchema's `builder.output.md` and exit code don't account for lychee's results — it's a genuinely separate check, not a gap in this one.

## `builder.output.md`

- Lives at `bundles/builder.output.md`, alongside the output it describes
- Overwritten fresh each build run — a snapshot, not an accumulating log
- Manifest pre-check results appear as their own top-level entry, separate from per-document sections
- Grouped per-document, pass/fail status, specific violations, plain prose/markdown
- Literal `HARD FAIL` / `SOFT FAIL` markers, and the Action's own exit code (0 clean, 1 on any hard failure) — both exist so a workflow can gate on build state without parsing prose
- **Exact format for machine parsing is not yet specified** — see Open Questions

```markdown
# Build Report — <commit/timestamp>

## Manifest
- Schema: OK (manifest_version 1)
- Existence: 1 broken entry — "old-api.md" → "docs/old-api-reference.md" does not exist

## Summary
- 12 processed · 10 clean · 1 soft failure · 1 hard failure

## Failures

### content/docs/api-reference.md — HARD FAIL
- Unresolvable reference: :link[old-api.md] — see Manifest section above

### content/docs/other.md — SOFT FAIL
- Missing required section: "## Usage"
```


## Implementation

- **TypeScript throughout** — not mixed with plain JS. The build step (bundling for the browser, and packaging as a GitHub Action) is already required regardless of language; TypeScript adds a compiler-level verification layer at no additional process cost, and the adapted mdshape source is already real TypeScript with type information worth keeping.
- **GitHub Action for automated use in a consuming repo's docs-branch CI** — this is the actual, planned v1 interface.
- Neither mdschema nor mdshape is an npm dependency — see Engine above for the full reasoning

## Post-build behavior (GitHub Action mode)

- The Action runs with the repository already checked out (via `actions/checkout`). It writes the built `bundles/` directory to the local filesystem at the root of that checkout.
- **The Action does not know or care which branch it's on.** The consuming repo's workflow is responsible for checking out the right branch (`docs`), running the Action, and then committing/pushing the results — this keeps the Action decoupled from git operations entirely, and makes it testable locally without any git state at all.
- **It does not auto-commit or auto-push.** That's the consuming repo's own workflow step (e.g. `git add bundles/ && git commit`) — matches the human-verification gate the pusher already depends on.
- The Action exits `0` on a clean build, `1` if any `HARD FAIL` occurred anywhere (manifest or per-document), so the workflow itself can fail visibly rather than silently succeeding on broken output.


## Future considerations (potential, not guaranteed)

- **A browser-based interface for local/manual use, no terminal required.** Not committed to for v1 — no evidence of need yet beyond the Action, which already satisfies "no terminal required" for the actual planned workflow. Worth revisiting if a real, standalone (non-CI) use case shows up. Flagged here rather than dropped, per this project's own [evidence-before-need principle](https://github.com/reddpandda/jReference/blob/main/doctrine/no-paperweight-buying-guide.md) — a note to return to, not a promise.

## In scope

- **Own structural validation engine**: heading-order checking, missing-required-element detection, min/max count constraints, sibling ordering, unmatched-section handling via the allow-additional flag, native heading-hygiene checks (no skipped levels) — informed by verified mdschema logic, written fresh
- **Own typed field/frontmatter extraction**: adapted from a narrow, rewritten slice of mdshape's primitives and combinators; reused for manifest schema validation
- **A single plain-data template shape** (a TypeScript interface), authorable as YAML or as a TS object literal — no translation layer between them
- **A general-purpose template library**, split into `documents/` (full structural validation), `schemas/` (what the engine validates config-type files against), and `examples/` (annotated starting points) — not tied to any one consuming project
- **Manifest-based reference resolution**, split into directives (manifest-key lookup) and metadata tokens (current-document only), implemented via `remark-directive` as an AST-pipeline plugin, not a separate text pass
- **Internal link/anchor validation**, via `remark-validate-links` integrated into the same AST pipeline as structural validation — contributes to the soft-failure/mangled category, same handling as structural violations
- **Manifest schema and existence validation, and indefinite multi-version support** — not semantic staleness, which stays manual/Claude-assisted
- **Universal header/footer partials**
- **The builder pipeline and `builder.output.md`**
- **Distribution as a GitHub Action**, including defined post-build behavior and exit-code semantics
- **CREDITS.md**, maintained as a real, current attribution record
- **MIGRATION.md**, one guide per `manifest_version` bump, for consumers who opt in to new features
- Test suite for the hand-built structural engine, informed by mdschema's own tests (frequently larger than their source)

## Out of scope

- **Depending on mdschema or mdshape live** — both are studied, adapted, and rewritten, never installed as runtime dependencies
- **A separate YAML-to-engine translation/"sugar" layer** — YAML and TS object literals both directly express the same native template data; nothing to translate
- **Dynamic expression-based heading matching** — no evidence of need; revisit only if a specific case demands it
- **Hand-rolling link validation logic** — internal link/anchor checking is orchestrated via `remark-validate-links` within the builder's own pipeline (see Builder pipeline); external link checking is not invoked by jMdSchema's Action at all, and is instead documented as the consuming repo's own separate workflow step — neither reimplements checks that existing, purpose-built tools already do well
- **A general cross-template reusable-section engine** — templates remain self-contained; the manifest/directive system covers the one proven case (universal partials)
- **Automated semantic staleness detection on the manifest** — deliberately manual/Claude-assisted, not a pipeline check
- **Automatic manifest migration** — each version bump ships a one-time script consumers run themselves; the builder never migrates silently
- **Dropping support for older `manifest_version` values** — every version stays supported indefinitely; a new version is a feature addition, never a deprecation
- **Auto-commit/auto-push from the Action** — the Action only writes to the runner's filesystem; committing and pushing are the consuming repo's own workflow steps
- **Rendering/output tooling** (HTML, math, diagrams)
- **The pusher** (bundles/ → main branch) — a separate, simpler mechanism, not designed here
- **Project-specific content of any kind** — no consuming repo's actual `manifest.yml`, `content/`, or `partials/` lives in this repo

## Kept in spirit (idea only, not code)

- **Root-relative vs. document-relative path resolution** — paths starting with `/` resolve from a root directory, others relative to the current file.
- **DITA's "specialization" concept** — a bespoke type extends and still validates as a base type. Same idea as the allow-additional flag.
- **DITA's "conref" / Sphinx's `literalinclude`** — prior art for the `::include[X]` transclusion directive.
- **Browser extension `manifest_version` versioning** — Chrome/Firefox's precedent for letting a config format evolve without breaking older files; specifically the **Firefox model** (multiple versions supported side by side) rather than Chrome's (old versions dropped), applied directly to our own manifest.
- **Domain suffix-matching pattern**, from mdschema's `link.go` — a leading-dot suffix check (`HasSuffix(host, "."+blocked)`) that correctly blocks subdomains without false-matching unrelated domains. Not implemented here (link validation is out of scope), worth remembering if a future domain-matching need arises.

## Dependencies

| Tool | Role |
|---|---|
| `remark` (unified) | Markdown → AST parsing |
| `remark-directive` | Parses `:directive[X]` / `::directive[X]` syntax into AST nodes — the mechanism the manifest/metadata resolution plugin operates on |
| `remark-frontmatter`, `remark-gfm` | Frontmatter and table/GFM support — handled inside the same AST pipeline as everything else, not a separate parsing pass |
| `js-yaml` | YAML parsing, for the manifest, manifest schema, and plain-YAML templates |
| `remark-validate-links` | Internal anchor/file link validation — runs inside the same AST pipeline as structural validation, contributing to the soft-failure/mangled category |
| `lychee` | External URL validation — **not invoked by jMdSchema's own Action**; run via lychee's own official `lychee-action` as a separate, recommended step in the consuming repo's workflow (see Builder pipeline) |
| `node:test` | Test runner |

**Two separate YAML contexts, by design, not overlap:** `js-yaml` parses standalone YAML files (manifest, templates, schemas) as pure data. `remark-frontmatter` extracts frontmatter from *within* Markdown documents, inside the same unified/remark AST pass that does everything else — not a separate, disconnected parsing step. `gray-matter` would duplicate `remark-frontmatter`'s job outside that pipeline, which is exactly the kind of redundant parser this project's design avoids — hence it's not used.

*mdschema and mdshape are not listed here — both are source material, adapted directly into the codebase, not live dependencies. `markdownlint` is also not listed — its one relevant rule (no skipped heading levels) is folded natively into the structural engine. `glob`/`fast-glob` are not currently needed — existence checking uses Node's built-in `fs.existsSync`; would only be added if the manifest later supports glob patterns.*

## CREDITS.md — real attribution debt, not a placeholder

This project's actual design leans directly on studying other people's work:
- **[jackchuka/mdschema](https://github.com/jackchuka/mdschema)** — the structural-matching and pattern-matching logic this engine is informed by
- **[markschema/mdshape](https://github.com/markschema/markschema)** — the typed-field extraction approach this engine's extraction layer is adapted from
- **DITA / Sphinx** — prior art for the `::include[X]` transclusion directive and the "specialization" concept behind the allow-additional flag, named as influence even though nothing was adapted directly from either

Maturity/risk nuance between mdschema and mdshape is documented in the Engine section above, where it's actionable (informing what got vendored vs. rewritten) — CREDITS.md itself stays a plain, equal-toned thank-you, not a second place to relitigate it.

This should be one of the first real files in the repo, not something deferred to later.

## Open questions

- [ ] Exact list of mdshape combinators/primitives worth adapting (likely: string, number, boolean, date, email, url, enum, optional, default) vs. skipping (refine, pipeline — unconfirmed whether needed)
- [ ] Finalize the template TypeScript interface shape, now that it's the one native format both YAML and direct TS authoring express
- [ ] Full content for each `templates/documents/` entry (readme, api, changelog, credits, onboarding, scope) — list is set, actual template definitions are not yet written
- [ ] `templates/schemas/manifest.schema.yml`'s own definition — what exactly the engine checks when validating a manifest against itself
- [ ] **Exact `builder.output.md` format spec for machine parsing** — the sample shown is illustrative, not a defined grammar. If a future tool (e.g. the pusher) wants to parse it programmatically rather than just read the exit code, the actual structure (heading levels, marker placement, summary line format) needs to be nailed down.
- [ ] `action.yml`'s actual declared inputs/outputs — implementation detail once the Action is actually built, not a scope-level question given the manifest's fixed root location already constrains this
- [ ] `MIGRATION.md`'s internal structure (one file with per-version sections vs. a table of contents linking to separate files) — an authoring choice to make when the first real migration guide gets written

---

*Origin: generalized from an unfinished, document-specific shapes/templates system in JLib's `docs` branch.*
