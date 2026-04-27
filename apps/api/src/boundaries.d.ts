// Compile-time boundary enforcement for apps/api.
//
// Phase 3 exception (CLAUDE.md): apps/api is authorized to import
// `@field-book/domain` strictly for pre-persistence validation inside route
// handlers. All other internal packages remain blocked at typecheck time by
// being redeclared as empty ambient modules.
declare module '@field-book/survey-core' {}
declare module '@field-book/sync-core' {}
declare module '@field-book/audit-core' {}
