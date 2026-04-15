import type { MongoAbility, RawRuleOf, ForcedSubject } from '@casl/ability';
import type { Request } from 'express';

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

export type Action = 'manage' | 'create' | 'read' | 'update' | 'delete';

// ---------------------------------------------------------------------------
// Subjects - string-based; Prisma models are interfaces, not classes.
// Including ForcedSubject<SubjectStr> lets tagged objects from subject()
// be assignable to Subject without "as unknown as Subject" casts.
// ---------------------------------------------------------------------------

type SubjectStr = 'User' | 'Tenant' | 'TenantMember' | 'AuditLog';
export type Subject = SubjectStr | ForcedSubject<SubjectStr> | 'all';

// ---------------------------------------------------------------------------
// AppAbility
// ---------------------------------------------------------------------------

export type AppAbility = MongoAbility<[Action, Subject]>;

// ---------------------------------------------------------------------------
// Serialized rules (what goes to the frontend via GET /auth/me)
// ---------------------------------------------------------------------------

export type PackedAbility = RawRuleOf<AppAbility>;

// ---------------------------------------------------------------------------
// Policy handler - a function that receives the built ability and the raw
// HTTP request, so handlers can check conditions against route params.
// ---------------------------------------------------------------------------

export type PolicyHandler = (ability: AppAbility, req: Request) => boolean;
