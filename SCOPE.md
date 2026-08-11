# Scope Document

*Living document — captures the reasoning trail, not just the conclusions, so future decisions can be checked against why past ones were made.*

---

## Origin

- Started from an unfinished shapes/templates documentation system already partially built in JLib's `docs` branch
- That system's shapes were too document-specific — not generic or reusable across document types
- Its templates allowed bespoke, special-cased sections — rejected as a concept from the start

## Core concept (kept from the original idea)

- **Shape** — a reusable definition of how a specific section type is written (e.g. Glossary, Prerequisites, Changelog)
- **Template** — how a specific file type is written, composed entirely of shapes
- A handwritten document is validated against its template; if it doesn't match, it can be rebuilt/regenerated against the template
- **Bespoke sections are not a special category.** A one-off section is just a shape used once — not a different kind of thing. This was the original instinct, and it's confirmed correct by seeing how a mature real implementation (mdschema) handles the same problem: an "allow additional content" flag on any element, not a separate concept.

## Research summary

- Confirmed this is a known, solved problem space at three levels of weight:
  - **JSON Schema composition** — general-purpose, lightweight, foundational (`$defs`/`$ref` ≈ shapes referenced into a template)
  - **DITA** — the documentation industry's heavyweight standard ("topics" ≈ shapes, "maps" ≈ templates, "specialization" ≈ the bespoke-as-shape idea)
  - **mdschema** — a real, actively maintained open-source Go tool doing almost exactly this for Markdown specifically, with direct vocabulary overlap: schema-defined structural elements ≈ shapes, a schema composed of elements ≈ a template, `check`/`generate`/`derive` ≈ verify/rebuild

## Decision trail: why a JS reimplementation, not vendoring or depending on mdschema directly

Kept in order, since each step ruled something out for a specific reason:

1. **Vendor the Go source outright** — rejected. No Go literacy; owning unreadable source doesn't deliver "pull and modify simply," and can't be personally human-verified.
2. **Depend on the published npm/CLI tool** — rejected. Requires a terminal/npm workflow, which is explicitly not wanted.
3. **Confluence** (the same author's other tool, `confluence-md`, converts *from* it) — rejected as a platform for this. Solves team-collaboration problems that don't exist here; paid tiers past a point; and it adds a lossy conversion step in the middle of an otherwise fully portable plain-markdown workflow, which cuts against the swappability principle in the [jReference doctrine](https://github.com/reddpandda/jReference/blob/main/doctrine/no-paperweight-buying-guide.md). `confluence-md` itself remains a legitimately useful one-off tool for a totally different, unrelated future scenario — pulling content *out* of someone else's existing Confluence instance.
4. **Depend on mdschema's published GitHub Action** — workable (zero terminal, free on public repos) but rejected as the primary path: zero hackability beyond exposed inputs, doesn't cover `generate`/`derive` well (push-triggered CI doesn't fit authoring-time actions), and it's still someone else's logic, not owned or verifiable.
5. **Fork mdschema on GitHub, run Actions against the fork, modify freely** — the real git-native right mechanism for "pull and modify," but leaves an honestly acknowledged gap: no way to personally verify Go code changes, only to trust CI + black-box behavioral testing.
6. **Reimplement the relevant logic in JavaScript, as a browser-based tool** — landed here. Solves the verification gap (every line is readable) and the terminal-avoidance preference in one move. JavaScript's `remark`/`unified` ecosystem also eliminates the two hardest, riskiest subsystems (markdown parsing, YAML parsing) entirely — they don't need to be written at all, just depended on.

## What we are KEEPING (porting the actual logic/concept)

- **Structural shape-matching engine**, based on mdschema's `structure.go`:
  - First-heading-order check (does the first child match the first required element, at each level)
  - Missing-required-element detection, respecting unbound ancestors (skip reporting a child as missing if its parent already wasn't matched, to avoid cascading duplicate errors)
  - Min/max count constraints per element
  - Sibling ordering check — a lightweight "furthest matched sibling seen so far" heuristic, not a full sequence-diff algorithm
  - Unmatched-section handling gated by an allow-additional flag per element — this **is** the bespoke-section idea, confirmed working exactly as intended in a real implementation
- **Heading pattern matching**, based on mdschema's `pattern.go`, **minus** the `expr` mode:
  - Literal (exact match)
  - Regex pattern (auto-anchored with `^`/`$`, cached to avoid recompilation)
- **Frontmatter validation concept** (typed fields, nested keys, format checks) — written fresh in JS, informed by `frontmatter.go`'s approach, not a line-for-line port
- **Section content rule concepts** — code block / image / table / list / word-count / required-and-forbidden-text checks — written fresh against a `remark` AST, informed by the corresponding Go rule files
- **Test files as behavioral spec** — port relevant test cases alongside the logic they cover. mdschema's own tests are frequently larger than their source files (e.g. `structure_test.go` at 19.6KB vs. `structure.go` at 12.3KB) — a ready-made spec that meaningfully reduces verification risk, rather than inventing test cases from scratch

## What we are GETTING RID OF (explicitly not porting)

- **The `expr` dynamic heading-matching mode** — a full expression language via `expr-lang/expr` (its own compiler, runtime, injected function environment). Real complexity, no evidence of need yet. Can be added later as a narrow, purpose-built feature if a specific case demands it — not as a general-purpose interpreter built preemptively.
- **`link.go`'s actual validation logic** (internal anchor checks, external URL HEAD-request checking, domain allow/blocklists) — offloaded entirely to existing, more mature tools (see Tooling section below) rather than ported or hand-rolled.
- **Any live cross-template shape-reuse/composition engine** — concluded not proven worth building. Shapes and templates are being kept as **written reference documents** (prose description + an example schema snippet) rather than a code-level reuse mechanism, until there's real evidence of duplication across many templates that would justify one. Native YAML anchors are the fallback for the rare case something genuinely needs sharing within a single file.
- **Rendering/output tooling** (HTML conversion, math, diagrams) — out of scope entirely. This project validates and generates structure, not visual output.
- **A Node CLI / npm-based interface** — the tool is browser-based instead, per the terminal-avoidance requirement.

## What we are KEEPING "in spirit" (the idea, not the code)

- **Domain suffix-matching technique** from `link.go` — `HasSuffix(host, "."+blocked)` with the leading dot, which correctly blocks subdomains (`sub.example.com`) without false-matching unrelated domains (`notexample.com`). Not used here since link validation itself isn't being ported, but worth remembering as the correct pattern if any future domain-matching need arises.
- **Root-relative vs. document-relative path resolution**, also from `link.go` — paths starting with `/` resolve from a schema root directory; everything else resolves relative to the document's own directory. Worth adopting as the convention for how shapes/templates reference each other later, independent of link-checking.
- **DITA's "specialization" concept** — a bespoke type is just a type that extends and still validates as a base type. Same underlying idea as the allow-additional flag; cross-confirms the design direction from a second, independent source.

## Tooling being depended on (not written ourselves)

| Tool | Role |
|---|---|
| `remark` (unified ecosystem) | Markdown → AST parsing. Do not hand-roll a markdown parser. |
| `remark-frontmatter`, `remark-gfm` | Frontmatter and GFM/table extension support for remark |
| `js-yaml` or `gray-matter` | YAML/frontmatter parsing |
| `remark-validate-links` | Internal anchor and relative-file link validation — official remarkjs plugin, replaces the need to port or hand-roll `link.go` at all |
| `lychee` | External URL validation — treated as an opaque, trusted black-box tool; network-edge-case handling (timeouts, retries, redirects) is not something to own |
| `markdownlint` / `markdownlint-cli2` | Candidate for generic heading-style rules (skip-levels, duplicates) where they overlap with schema-driven needs — degree of overlap not yet fully mapped |
| `ajv` or `zod` | Candidate for validating parsed schema/frontmatter data structures |
| `node:test` | Built into Node, zero added dependency — candidate test runner |
| `fast-glob` / `minimatch` | File-matching utilities, if/when needed |
| `@actions/core` + GitHub Actions toolkit | Only relevant if/when this gets packaged as an actual runnable Action — not needed for core logic |

## Tools evaluated and rejected or flagged

- **`@markschema/mdshape`** — does not appear to exist. Confirmed via direct search (no npm listing, no GitHub repo, no trace). Origin: surfaced in a DeepSeek-generated "guess" list produced under a deliberately vague prompt. Kept here as a standing reminder — verify anything from a low-context brainstorm independently before trusting it, per the jReference doctrine's obscurity/sourcing rule.
- **`@jhuix/imark`, `unified-diff`** — unverified, treat with suspicion until independently confirmed real and relevant.
- **`cherow`, described as a "wasm parser"** — likely inaccurate. Cherow was a real but now-abandoned JavaScript *syntax* parser, unrelated to WASM.
- **`textlint` and its Japanese-language presets, the `rehype`/HTML rendering chain, `playwright`** — real, well-known tools, just solving problems this project doesn't have.

## Open questions / not yet decided

- [ ] How much of `markdownlint`'s existing rule set actually overlaps with mdschema's `heading_rules` block, vs. what still needs custom logic
- [ ] Whether frontmatter validation gets built directly on `zod`/`ajv`, or as fresh custom logic informed by `frontmatter.go`'s approach
- [ ] Whether/when a live shape-reuse layer ever gets built — currently: not until there's real evidence of cross-template duplication
- [ ] Whether to fork mdschema anyway, purely as a permanent reference copy (not for direct code reuse) — separate question from the decision to reimplement in JS
- [ ] Actual folder/file structure for shapes vs. templates vs. the matching engine itself

## Guiding principle

Every decision above traces back to the [jReference doctrine](https://github.com/reddpandda/jReference/blob/main/doctrine/no-paperweight-buying-guide.md): no obscure or unverifiable dependencies, evidence of need before adding complexity (the `expr` mode, the reuse engine), avoid single-source lock-in, and prefer fewer failure points over more capability. This project is a live application of that doctrine to a real technical decision, not just a planning exercise adjacent to it.

---

*Update this document as decisions are finalized or reversed — the reasoning trail is as valuable as the conclusions.*
