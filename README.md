# jShape

Schema-driven Markdown structure validation and template generation.

A **shape** defines how a specific section type is written (a Glossary, a Prerequisites block, a Changelog entry). A **template** defines how a whole file type is written, composed of shapes. A handwritten document is checked against its template, and can be rebuilt against it if it doesn't match. Bespoke, one-off sections aren't a special category — they're just a shape used once.

This is a from-scratch JavaScript reimplementation of that concept — informed heavily by studying [mdschema](https://github.com/jackchuka/mdschema) (an existing, actively maintained Go tool solving a closely related problem), but built independently: browser-based rather than CLI-based, and scoped to what's actually needed rather than full feature parity.

See [SCOPE.md](SCOPE.md) for the full reasoning — what's being kept, what's being dropped, and why, including the research trail that led here.

Status: architecture/scaffolding stage. No working code yet.

## License
MIT — see [LICENSE](LICENSE).
