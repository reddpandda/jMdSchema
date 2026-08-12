# jMdSchema

Schema-driven Markdown structure validation and template generation.

A **template** defines how a specific file type is written — headings, required/optional sections, counts, content rules. A document is checked against its template, and can be rebuilt against it if it doesn't match. Bespoke, one-off sections aren't a special category — they're just a section with an "allow additional content" flag, not a separate mechanism.

Structural validation is hand-built, informed by direct study of [mdschema](https://github.com/jackchuka/mdschema)'s real Go source — not delegated to any third-party validation library. Typed field/frontmatter extraction is adapted from a narrow, rewritten slice of [`@markschema/mdshape`](https://github.com/markschema/markschema). Neither is a live dependency; both are studied and rewritten directly into this project's own TypeScript. See [CREDITS.md](CREDITS.md) for the full attribution, including the live dependencies (remark, remark-directive, and the rest) this project actually runs on.

Templates are plain objects matching a TypeScript interface — authorable as YAML or as TS literal objects, no translation layer between them.

A manifest-based reference system resolves cross-document references and standard partials before validation ever runs, so links and shared content can't silently go stale. Directives (`:link[X]`, `:title[X]`, `::include[X]`) and metadata tokens (`:hash`, `:commit`, `:built`) are parsed via [`remark-directive`](https://github.com/remarkjs/remark-directive) as real AST nodes in the same pipeline as everything else — not a separate text pass.

Distributed as a GitHub Action (`uses: reddpandda/jMdSchema@v1`) for use in a consuming repo's own docs-branch CI. Not a CLI, not npm-installed by end users.

See [SCOPE.md](SCOPE.md) for the full design — what's in scope, what's out, open questions, and the reasoning behind each major decision.

**Status:** scope finalized (v1), repository scaffold in place, no implementation yet.

## License
MIT — see [LICENSE](LICENSE).
