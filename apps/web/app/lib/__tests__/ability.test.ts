import { describe, it, expect } from 'vitest';
import { buildAbility, emptyAbility } from '~/lib/ability';
import type { PackedAbility } from '~/lib/types';

describe('buildAbility', () => {
  it('returns empty ability when no rules provided', () => {
    expect(emptyAbility.can('read', 'User')).toBe(false);
    expect(emptyAbility.can('manage', 'all')).toBe(false);
  });

  it('grants manage all for SUPER_ADMIN rules', () => {
    const rules: PackedAbility[] = [{ action: 'manage', subject: 'all' }];
    const ability = buildAbility(rules);
    expect(ability.can('read', 'User')).toBe(true);
    expect(ability.can('delete', 'AuditLog')).toBe(true);
    expect(ability.can('manage', 'all')).toBe(true);
  });

  it('restricts to specified subject', () => {
    const rules: PackedAbility[] = [{ action: 'read', subject: 'User' }];
    const ability = buildAbility(rules);
    expect(ability.can('read', 'User')).toBe(true);
    expect(ability.can('read', 'AuditLog')).toBe(false);
    expect(ability.can('delete', 'User')).toBe(false);
  });

  it('supports inverted rules', () => {
    const rules: PackedAbility[] = [
      { action: 'manage', subject: 'all' },
      { action: 'delete', subject: 'User', inverted: true },
    ];
    const ability = buildAbility(rules);
    expect(ability.can('read', 'User')).toBe(true);
    expect(ability.can('delete', 'User')).toBe(false);
  });
});
