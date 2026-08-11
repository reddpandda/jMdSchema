# jShape

Schema-driven Markdown structure validation and template generation.

A **shape** defines how a specific section type is written (a Glossary, a Prerequisites block, a Changelog entry). A **template** defines how a whole file type is written, composed of shapes. A document is checked against its template, and can be rebuilt against it if it doesn't match. Bespoke, one-off sections aren't a special category — they're just a shape used once.

JavaScript, browser-based. An independent implementation, informed by studying [mdschema](https://github.com/jackchuka/mdschema) (an existing Go tool solving a closely related problem for Markdown) — not a fork or a port.

See [SCOPE.md](SCOPE.md) for what's in scope, what's out, and open questions.

Status: architecture/scaffolding stage. No working code yet.

## License
MIT — see [LICENSE](LICENSE).
