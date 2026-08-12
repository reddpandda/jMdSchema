# jMdSchema

Schema-driven Markdown structure validation and template generation.

A **template** defines how a specific file type is written — headings, required/optional sections, counts, content rules. A document is checked against its template, and can be rebuilt against it if it doesn't match. Bespoke, one-off sections aren't a special category — they're just a section with an "allow additional content" flag, not a separate mechanism.

Validation is handled by [`@markschema/mdshape`](https://github.com/markschema/markschema), an existing TypeScript library — not reimplemented here. Templates can be written as plain YAML (a thin, optional sugar layer that translates 1:1 into mdshape's own API) or authored directly against mdshape for anything the sugar doesn't cover. A manifest-based reference system (`{{link:X}}`, `{{include:X}}`, and similar) resolves cross-document references and standard partials before validation ever runs, so links and shared content can't silently go stale.

See [SCOPE.md](SCOPE.md) for what's in scope, what's out, and open questions.

Status: architecture/scaffolding stage. No working code yet.

## License
MIT — see [LICENSE](LICENSE).
