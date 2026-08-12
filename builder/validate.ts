/**
 * Runs a resolved document's AST against its template via the engine.
 * Produces the wrong/mangled distinction: unresolvable references are
 * hard failures (placeholder stub); structural mismatches are soft
 * failures (best-effort output, flagged in builder.output.md).
 *
 * <placeholder>
 */
