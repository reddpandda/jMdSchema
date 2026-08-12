# Scope Document

*Living document — defines what this project is and isn't. Update as decisions change.*

---

## Concept

- **Template** — how a specific file type is written; defines its structural elements (headings, required/optional sections, counts, content rules)
- A document is validated against its template, and can be rebuilt against it if it doesn't match
- Bespoke sections are not a special category — a one-off section is just an element with an "allow additional content" flag, not a separate mechanism
- **Shape** — narrowed to a specific meaning: a universal, always-injected, byte-identical partial (e.g. a standard footer or header block present in every document). Resolved through the manifest/directive system below like any other reference, not a separate mechanism of its own.
- **Templates can be authored two ways, both producing the same underlying schema:**
  - **YAML sugar** — a plain-data shorthand, mechanically translated 1:1 into calls against the validation engine's own API. Covers the common template patterns.
  - **Direct authoring against the engine itself** — for anything the sugar doesn't cover, or that needs full flexibility.
  - The sugar is optional convenience, never a requirement. A template is as simple or as complicated as it actually needs to be.

## Engine

- Validation is delegated to **[`@markschema/mdshape`](https://github.com/markschema/markschema)** — an existing, actively maintained TypeScript library doing schema-based Markdown validation (documents, frontmatter, sections, tables, GFM, LaTeX; 27 builders) — not built from scratch here
- Our own code is the layer around it: the YAML→mdshape sugar translator, and the manifest/directive reference-resolution system
- mdshape also ships a browser-based playground (schema/markdown/result panes, live validation) — worth using as a direct reference, and possibly a starting point, for whatever browser interface this project ends up needing

## Reference resolution (manifest + directives)

- A single **root manifest** file maps a stable logical name to wherever that file currently lives — one source of truth, not one per directory, to avoid conflicting locations for the same name:
  ```yaml
  api.md: docs/api-reference.md
  architecture.md: docs/architecture/overview.md
  ```
- Documents reference targets using directive syntax: **`{{directive:target}}`** — double-brace, colon-separated, one consistent grammar for every directive
- `self` is a reserved target meaning "the current document," for directives that describe the document rather than reference another one
- **Directives (finalized for now, open to more later):**
  - `{{link:X}}` — resolves to a real markdown link using the manifest's current path for `X`
  - `{{title:X}}` — resolves to `X`'s actual current H1, so link text can't go stale independent of the path
  - `{{include:X}}` — transclusion; injects another file's content directly (same concept as DITA's conref or Sphinx's `literalinclude`)
  - `{{hash:self}}`, `{{commit:self}}`, `{{built:self}}` — resolve to the current document's content hash, the commit it was built against, and the last build date, for the standard per-document header block
- **Resolution is a pre-processing pass**, run before validation. Directives resolve to plain markdown/links first; the validation engine and link-checking tools run against already-resolved output, unmodified.
- **An unresolvable manifest key is a hard build error**, not a silent pass-through — the actual anti-staling mechanism; the directive syntax is just the interface to it.

## Standard document partials

- Every document carries two universal, byte-identical blocks, injected via `{{include:X}}`:
  - **Header** — content hash, commit built against, last build date
  - **Footer** — a style block that hides a specific note locally (most local viewers render embedded `<style>` permissively) while leaving it visible on GitHub (GitHub strips raw `<style>` tags on render) — same source file, different rendered output per viewer, no runtime logic involved
- These are the proven, already-in-use case that justifies `shape` as a narrow concept — not a reopening of general cross-template content reuse

## Implementation

- JavaScript/TypeScript, browser-based
- mdshape as the validation engine; a thin, optional YAML sugar layer on top; manifest/directive resolution as a pre-processing pass before mdshape ever sees a document

## In scope

- **YAML sugar translator**: 1:1 mechanical mapping from a plain-YAML template dialect to mdshape's own API — not a real translator with judgment calls, a direct substitution. Covers common template patterns; not required for any given template.
- **Manifest-based reference resolution**: the directive system above, run as a pre-processing pass
- **Standard header/footer partials**: automating the hash/commit/date header and the GitHub-vs-local visibility footer, both already in manual use
- Correctness tests for the sugar translator — confirming YAML input produces the same validation result as writing the equivalent schema directly against mdshape

## Out of scope

- **A hand-built structural-matching or frontmatter-validation engine** — delegated to mdshape entirely, not reimplemented
- **Dynamic expression-based heading matching** — out of scope unless mdshape supports it natively; not something to work around independently
- **Rendering/output tooling** (HTML, math, diagrams)
- **A general cross-template reusable-section engine** — templates remain self-contained; the manifest/directive system covers the one proven case (universal partials), not a general mechanism for sharing arbitrary section definitions between templates

## Kept in spirit (idea only, not code)

- **Domain suffix-matching pattern** — a leading-dot suffix check that correctly blocks subdomains without false-matching unrelated domains. Worth remembering if a future domain-matching need arises.
- **Root-relative vs. document-relative path resolution** — paths starting with `/` resolve from a root directory, others relative to the current file. Worth adopting as the convention for how templates and documents reference files.
- **DITA's "specialization" concept** — a bespoke type extends and still validates as a base type. Same idea as the allow-additional flag, arrived at independently.
- **DITA's "conref" / Sphinx's `literalinclude`** — established prior art for the `{{include:X}}` transclusion directive.

## Dependencies

| Tool | Role |
|---|---|
| `@markschema/mdshape` | Core schema-based Markdown validation — the actual engine |
| `js-yaml` or `gray-matter` | YAML parsing, for the manifest and the sugar layer |
| `remark-validate-links` | Internal anchor/file link validation — pending check against mdshape's own capabilities |
| `lychee` | External URL validation |
| `markdownlint` / `markdownlint-cli2` | Candidate for heading-style rules — pending check against mdshape's own capabilities |
| `node:test` | Test runner |

## Open questions

- [ ] Map the draft YAML sugar dialect against mdshape's 27 builders — confirm the 1:1 correspondence holds, identify real gaps (which fall back to direct authoring, not a blocker)
- [ ] Does mdshape have built-in link validation that overlaps with or replaces `remark-validate-links`?
- [ ] Does mdshape have built-in heading-style rules that overlap with or replace `markdownlint`?
- [ ] Folder/file structure for templates (YAML sugar vs. direct-authored), standard partials, and the sugar translator
- [ ] Manifest file format specifics beyond "single root file, key → path"

---

*Origin: generalized from an unfinished, document-specific shapes/templates system in JLib's `docs` branch.*
