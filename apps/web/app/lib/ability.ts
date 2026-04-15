import {
  createMongoAbility,
  type MongoAbility,
  type RawRuleOf,
} from '@casl/ability';
import type { Action, PackedAbility, Subject } from '~/lib/types';

export type AppAbility = MongoAbility<[Action, Subject]>;

export function buildAbility(rules: PackedAbility[]): AppAbility {
  return createMongoAbility<AppAbility>(rules as RawRuleOf<AppAbility>[]);
}

export const emptyAbility = buildAbility([]);
