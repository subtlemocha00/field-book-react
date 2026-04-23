# CLAUDE.md — FIELD BOOK APP (AUTHORITATIVE CONTEXT)

## SYSTEM DIRECTIVE

You are operating in a document-first, specification-locked development environment. All implementation must strictly conform to the locked documents referenced below. No architectural improvisation, no speculative features, and no implicit behavior are permitted.

## AUTHORITATIVE DOCUMENTATION

The following documents are immutable and override all prior context or default patterns:

* `docs/PRODUCT_BRIEF.md`
* `docs/ARCHITECTURE_SPEC.md`
* `docs/FUNCTIONAL_SPEC.md`
* `docs/DATA_MODEL_PERSISTENCE_SPEC.md`
* `docs/DOMAIN_RULES_SPEC.md`
* `CLAUDE.md` (this file)

Treat them as authoritative and immutable.

Confirm once loaded before proceeding.

## ARCHITECTURAL HARD CONSTRAINTS

1. Repository structure is locked. No directory creation, renaming, or relocation without explicit phase authorization.
2. Business logic is strictly isolated in `packages/`. UI components in `apps/web` must contain zero computation.
3. SQL/D1 queries exist only in repository implementations. No raw queries in services or UI.
4. Survey calculations are pure functions only. No side effects, no implicit state.
5. Sync, audit, and domain logic are isolated in their respective `packages/` directories.
6. Cross-package imports are restricted to `@contracts/*`. All other imports must fail at compile time.

## BEHAVIORAL DIRECTIVES

* Treat specifications as deterministic contracts. Do not interpret, infer, or extend behavior.
* Implement only what is explicitly scoped for the current phase.
* If a specification ambiguity is detected, halt and request clarification. Do not assume.
* Preserve package boundaries. Do not co-mingle infrastructure, domain, and presentation concerns.
* All changes must be traceable to a locked document section or an explicit phase directive.

## PHASE EXECUTION PROTOCOL

1. Await explicit phase authorization (e.g., "BEGIN PHASE 1").
2. Scaffold/modify strictly within the authorized scope.
3. Verify independent compilation for all affected packages.
4. Report deviations, tooling conflicts, or constraint violations immediately.
5. Do not proceed to subsequent phases without explicit confirmation.

## HALT CONDITIONS

Terminate execution and report immediately if you:

* Detect a temptation to implement domain logic outside authorized phases
* Encounter a contradiction between specifications
* Are asked to bypass package boundaries or compiler restrictions
* Observe tooling drift that threatens architectural isolation

## VERIFICATION

Upon session initialization, respond with:
 `[CLAUDE.md LOADED] — Constraints active. Awaiting phase directive.`

Do not proceed until phase scope is explicitly defined.

## OUTPUT EXPECTATIONS

When producing implementation output:

* Output only the files required for the current phase
* Do not include explanations, commentary, or reasoning unless explicitly requested
* Do not restate specifications or constraints
* Keep all changes minimal and strictly scoped to the phase

All file outputs must be:

* Complete (no partial snippets)
* Directly usable (no placeholders unless explicitly required)
* Correctly structured according to the locked repository layout

If asked for verification:

* Provide only concrete results (build success, endpoint response, etc.)
* Do not provide speculative confirmations
