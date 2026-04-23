// Compile-time boundary enforcement. Cross-package imports from apps/api are
// restricted to @field-book/contracts. Redeclaring the internal packages as
// empty ambient modules blocks named imports at typecheck time.
declare module '@field-book/domain' {}
declare module '@field-book/survey-core' {}
declare module '@field-book/sync-core' {}
declare module '@field-book/audit-core' {}
