# Scope Document

*Living document — defines what this project is and isn't. Update as decisions change.*

---

## Concept

- **Template** — how a specific file type is written; defines its structural elements directly (headings, required/optional sections, counts, content rules)
- A document is validated against its template, and can be rebuilt against it if it doesn't match
- Bespoke sections are not a special category — a one-off section is just an element with an "allow additional content" flag, not a separate mechanism
- Recurring section conventions (e.g. "here's how a Glossary is written") are documented informally — prose plus an example snippet — not modeled as a distinct concept the engine reads or matches against

## Implementation

- JavaScript, browser-based
- Independent implementation, informed by studying [mdschema](https://github.com/jackchuka/mdschema) (an existing Go tool solving a closely related problem for Markdown) — not a fork or direct port

## In scope

- **Structural matching**: heading-order checking, missing-required-element detection, min/max count constraints per element, sibling ordering, unmatched-section handling via the allow-additional flag
- **Heading matching**: literal (exact) and regex pattern matching
- **Frontmatter validation**: typed fields, nested keys, format checks
- **Section content rules**: code blocks, images, tables, lists, word count, required/forbidden text
- Test suite, ported alongside the logic it covers

## Out of scope

- **Dynamic expression-based heading matching** — no evidence of need; revisit only if a specific case demands it
- **Link validation logic** — handled by existing tools (see Dependencies), not built here
- **A live cross-template reusable-section engine** — templates are self-contained; recurring section patterns are documented informally rather than referenced from a shared library, until real duplication across templates justifies a code-level mechanism
- **Rendering/output tooling** (HTML, math, diagrams)

## Kept in spirit (idea only, not code)

- **Domain suffix-matching pattern** — a leading-dot suffix check that correctly blocks subdomains without false-matching unrelated domains. Not implemented here (link validation is out of scope), worth remembering if a future domain-matching need arises.
- **Root-relative vs. document-relative path resolution** — paths starting with `/` resolve from a root directory, others relative to the current file. Worth adopting as the convention for how templates and documents reference files later.
- **DITA's "specialization" concept** — a bespoke type extends and still validates as a base type. Same idea as the allow-additional flag, arrived at independently.

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

- [ ] `markdownlint` rule overlap with heading-structure needs
- [ ] Frontmatter validation: build on `zod`/`ajv`, or custom logic
- [ ] Whether/when a reusable cross-template section layer gets built
- [ ] Folder/file structure for templates, documented section conventions, and the matching engine
- [ ] Evaluate [`@markschema/mdshape`](https://www.npmjs.com/package/@markschema/mdshape) as potential prior art or dependency — exists, not yet assessed

---

*Origin: generalized from an unfinished, document-specific shapes/templates system in JLib's `docs` branch.*
