# Credits

This project doesn't exist in a vacuum. Its design leans directly on other people's published work — some of it studied and adapted into this codebase, some of it borrowed as a concept, some of it just a genuinely useful tool this project depends on. This file exists to keep that honest and current, not as a formality.

**This is a living document.** Whenever a new project gets studied, adapted, or depended on, it gets added here — in the same commit, not "later."

---

## Adapted directly into this codebase

Source material that was read line-by-line and directly informs jMdSchema's own hand-written logic. Neither is a live dependency — both are studied and rewritten, not imported.

- **[jackchuka/mdschema](https://github.com/jackchuka/mdschema)** (Go) — the structural-matching and heading-pattern-matching logic in this project's own validation engine is directly informed by a full source-level read of `structure.go` and `pattern.go`. The exhaustive "flag anything the schema doesn't account for" behavior — the actual core of this project's concept — is confirmed, verified behavior from this codebase, not guessed at.
- **[markschema/mdshape](https://github.com/markschema/markschema)** (TypeScript) — the typed field/frontmatter extraction layer (`primitives.ts` and relevant parts of `core/`) is adapted from a narrow, rewritten slice of this library. Used narrowly and rewritten rather than depended on live, given its early (v0.1) status as a project.

## Live dependencies

Tools this project actually runs on, not studied-and-rewritten.

- **[remark](https://github.com/remarkjs/remark)** / the [unified](https://unifiedjs.com/) collective — markdown → AST parsing, the foundation everything else in this project's pipeline builds on
- **[remark-directive](https://github.com/remarkjs/remark-directive)** — parses this project's `:directive[X]` / `::directive[X]` syntax into real AST nodes
- **[remark-frontmatter](https://github.com/remarkjs/remark-frontmatter)** — frontmatter extraction inside the same AST pipeline
- **[remark-gfm](https://github.com/remarkjs/remark-gfm)** — GitHub Flavored Markdown support (tables, etc.)
- **[remark-validate-links](https://github.com/remarkjs/remark-validate-links)** — internal anchor and relative-file link validation
- **[js-yaml](https://github.com/nodeca/js-yaml)** — YAML parsing for the manifest, manifest schema, and plain-YAML templates
- **[lychee](https://github.com/lycheeverse/lychee)** — external URL validation

## Conceptual prior art

Ideas this project's design is built on, without adapting or depending on any actual code.

- **[DITA](https://en.wikipedia.org/wiki/Darwin_Information_Typing_Architecture)** — "specialization" (a bespoke type that still validates as a base type) is the same underlying idea as this project's allow-additional-content flag, arrived at independently and confirmed against DITA's own established design after the fact. "Conref" is prior art for this project's `::include[X]` transclusion directive.
- **[Sphinx](https://www.sphinx-doc.org/)** — `literalinclude` is further prior art for the same transclusion concept.
- **Chrome and Firefox browser extension manifests** — the `manifest_version` field, and specifically Firefox's model of supporting multiple manifest versions indefinitely side by side (rather than Chrome's model of dropping old versions), is the direct precedent for this project's own manifest versioning strategy.
- **[markdownlint](https://github.com/DavidAnson/markdownlint)** — not used as a dependency, but its `MD001` rule (no skipped heading levels) is the named precedent for the equivalent check folded natively into this project's own structural engine.

---

*If you're reading this because your own work is referenced here and you have a concern about how it's characterized, please open an issue.*
