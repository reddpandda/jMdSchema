# jShape

Schema-driven Markdown structure validation and template generation.

A **template** defines how a specific file type is written — headings, required/optional sections, counts, content rules. A document is checked against its template, and can be rebuilt against it if it doesn't match. Bespoke, one-off sections aren't a special category — they're just a section with an "allow additional content" flag, not a separate mechanism. Recurring section conventions (a Glossary, a Changelog entry) are documented informally, not modeled as a distinct concept the engine matches against.

JavaScript, browser-based. An independent implementation, informed by studying [mdschema](https://github.com/jackchuka/mdschema) (an existing Go tool solving a closely related problem for Markdown) — not a fork or a port.

See [SCOPE.md](SCOPE.md) for what's in scope, what's out, and open questions.

Status: architecture/scaffolding stage. No working code yet.

## License
MIT — see [LICENSE](LICENSE).
