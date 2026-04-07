import type { MongoAbility, RawRuleOf } from '@casl/ability';

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

export type Action = 'manage' | 'create' | 'read' | 'update' | 'delete';

// ---------------------------------------------------------------------------
// Subjects - string-based; Prisma models are interfaces, not classes
// ---------------------------------------------------------------------------

export type Subject = 'User' | 'Tenant' | 'TenantMember' | 'AuditLog' | 'all';

// ---------------------------------------------------------------------------
// AppAbility
// ---------------------------------------------------------------------------

export type AppAbility = MongoAbility<[Action, Subject]>;

// ---------------------------------------------------------------------------
// Serialized rules (what goes to the frontend via GET /auth/me)
// ---------------------------------------------------------------------------

export type PackedAbility = RawRuleOf<AppAbility>;

// ---------------------------------------------------------------------------
// Policy handler - a function that checks a specific ability
// ---------------------------------------------------------------------------

export type PolicyHandler = (ability: AppAbility) => boolean;
