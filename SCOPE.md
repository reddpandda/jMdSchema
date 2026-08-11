# Scope Document

*Living document — defines what this project is and isn't. Update as decisions change.*

---

## Concept

- **Template** — how a specific file type is written; defines its structural elements directly (headings, required/optional sections, counts, content rules)
- A document is validated against its template, and can be rebuilt against it if it doesn't match
- Bespoke sections are not a special category — a one-off section is just an element with an "allow additional content" flag, not a separate mechanism
- **Shape** — narrowed to a specific meaning: a universal, always-injected, byte-identical partial (e.g. a standard footer or header block present in every document). Not a general reuse concept — resolved through the manifest/directive system below like any other reference, not a separate mechanism of its own.

## Reference resolution (manifest + directives)

- A single **manifest** file maps a stable logical name to wherever that file currently lives:
  ```yaml
  api.md: docs/api-reference.md
  architecture.md: docs/architecture/overview.md
  ```
- Documents reference targets using directive syntax: **`{{directive:target}}`** — double-brace, colon-separated, one consistent grammar for every directive
- `self` is a reserved target meaning "the current document," for directives that describe the document rather than reference another one
- **Directives (initial set, not final):**
  - `{{link:X}}` — resolves to a real markdown link using the manifest's current path for `X`
  - `{{title:X}}` — resolves to `X`'s actual current H1, so link text can't go stale independent of the path
  - `{{include:X}}` — transclusion; injects another file's content directly (same concept as DITA's conref or Sphinx's `literalinclude`)
  - `{{hash:self}}`, `{{commit:self}}`, `{{built:self}}` — resolve to the current document's content hash, the commit it was built against, and the last build date, for the standard per-document header block
- **Resolution is a pre-processing pass**, run before the validation pipeline. Directives resolve to plain markdown/links first; `remark-validate-links`, `lychee`, and the structural/content rules all run against already-resolved output, unmodified. No duplication of link-checking logic.
- **An unresolvable manifest key is a hard build error**, not a silent pass-through — this is the actual anti-staling mechanism; the directive syntax is just the interface to it.

## Standard document partials

- Every document carries two universal, byte-identical blocks, injected via `{{include:X}}`:
  - **Header** — content hash, commit built against, last build date (via `{{hash:self}}`, `{{commit:self}}`, `{{built:self}}`)
  - **Footer** — a style block that hides a specific note locally (most local viewers render embedded `<style>` permissively) while leaving it visible on GitHub (GitHub strips raw `<style>` tags on render) — same source file, different rendered output per viewer, no runtime logic involved
- These are the proven, already-in-use case that justifies `shape` as a narrow concept — not a reopening of general cross-template content reuse

## Implementation

- JavaScript, browser-based
- Independent implementation, informed by studying [mdschema](https://github.com/jackchuka/mdschema) (an existing Go tool solving a closely related problem for Markdown) — not a fork or direct port

## In scope

- **Structural matching**: heading-order checking, missing-required-element detection, min/max count constraints per element, sibling ordering, unmatched-section handling via the allow-additional flag
- **Heading matching**: literal (exact) and regex pattern matching
- **Frontmatter validation**: typed fields, nested keys, format checks
- **Section content rules**: code blocks, images, tables, lists, word count, required/forbidden text
- **Manifest-based reference resolution**: the directive system above, run as a pre-processing pass
- **Standard header/footer partials**: automating the hash/commit/date header and the GitHub-vs-local visibility footer, both already in manual use
- Test suite, ported alongside the logic it covers

## Out of scope

- **Dynamic expression-based heading matching** — no evidence of need; revisit only if a specific case demands it
- **Link validation logic** — handled by existing tools (see Dependencies), not built here
- **A general cross-template reusable-section engine** — templates remain self-contained for their own structural content; the manifest/directive system covers the one proven case (universal partials), not a general mechanism for sharing arbitrary section definitions between templates
- **Rendering/output tooling** (HTML, math, diagrams)

## Kept in spirit (idea only, not code)

- **Domain suffix-matching pattern** — a leading-dot suffix check that correctly blocks subdomains without false-matching unrelated domains. Not implemented here (link validation is out of scope), worth remembering if a future domain-matching need arises.
- **Root-relative vs. document-relative path resolution** — paths starting with `/` resolve from a root directory, others relative to the current file. Worth adopting as the convention for how templates and documents reference files.
- **DITA's "specialization" concept** — a bespoke type extends and still validates as a base type. Same idea as the allow-additional flag, arrived at independently.
- **DITA's "conref" / Sphinx's `literalinclude`** — established prior art for the `{{include:X}}` transclusion directive; not reinvented from scratch.

## Dependencies

| Tool | Role |
|---|---|
| `remark` (unified) | Markdown → AST parsing |
| `remark-frontmatter`, `remark-gfm` | Frontmatter and table/GFM support |
| `js-yaml` or `gray-matter` | YAML parsing |
| `remark-validate-links` | Internal anchor/file link validation |
| `lychee` | External URL validation |
| `markdownlint` / `markdownlint-cli2` | Candidate for heading-style rules — overlap with structural needs not yet mapped |
| `ajv` or `zod` | Candidate for schema/frontmatter data validation |
| `node:test` | Test runner |
| `fast-glob` / `minimatch` | File matching, if needed |

## Open questions

- [ ] Finalize the directive list (link/title/include/hash/commit/built proposed, not locked)
- [ ] Manifest file format and location — one root manifest vs. per-directory
- [ ] `markdownlint` rule overlap with heading-structure needs
- [ ] Frontmatter validation: build on `zod`/`ajv`, or custom logic
- [ ] Folder/file structure for templates, standard partials, and the matching engine
- [ ] Evaluate [`@markschema/mdshape`](https://www.npmjs.com/package/@markschema/mdshape) as potential prior art or dependency — exists, not yet assessed

---

*Origin: generalized from an unfinished, document-specific shapes/templates system in JLib's `docs` branch.*
