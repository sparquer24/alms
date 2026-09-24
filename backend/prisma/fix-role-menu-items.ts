/// <reference types="node" />
/**
 * Corrects `menu_items` (name + statusIds) for known menu item names, per role,
 * in the Roles table — WITHOUT removing or reordering any existing item.
 *
 * Why this exists: menu_items was seeded as plain strings with no statusIds
 * (see update-roles.ts), so the frontend falls back to matching each item by
 * name against frontend/src/config/statusMap.ts. That's fragile and, for the
 * ZS role specifically, two tabs ("Applications", "Cancel Form") are missing
 * from the seeded list entirely.
 *
 * This script:
 *   - Never hardcodes a numeric status id — every status is looked up by CODE
 *     against this database's live Statuses table, so it's correct regardless
 *     of row-insertion order (different environments have been observed with
 *     different orderings).
 *   - MERGES rather than replaces: every menu item name already present in
 *     the database is kept, in its existing position. Only items with a known,
 *     unambiguous status mapping below get their statusIds corrected/added.
 *     Items with no mapping here (e.g. "logout", "userManagement") are left
 *     completely untouched.
 *   - Only ADDS new items for roles explicitly listed in NEW_ITEMS_BY_ROLE
 *     below (currently just ZS's "applications" and "cancelform", which are
 *     the two tabs reported missing).
 *
 * Usage:
 *   npx ts-node prisma/fix-role-menu-items.ts            # dry run (prints the diff only)
 *   npx ts-node prisma/fix-role-menu-items.ts --apply     # writes the changes
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type MenuItem = { name: string; statusIds?: number[] };

// Status codes for menu item names that mean the same thing for every role
// they appear on (a "Closed" tab always means the CLOSE status, etc).
const GLOBAL_ITEM_CODES: Record<string, string[]> = {
  freshform: ['INITIATED'],
  closed: ['CLOSE'],
  drafts: ['DRAFT'],
  finaldisposal: ['DISPOSE'],
  applications: ['CLOSE', 'APPROVED'],
};

// "inbox" and "sent" mean different things per role (who they see applications
// from), so they're defined per role instead of globally.
const PER_ROLE_ITEM_CODES: Record<string, Record<string, string[]>> = {
  ZS: { inbox: ['FORWARD', 'INITIATED'], sent: ['RECOMMEND', 'FORWARD', 'INITIATED'] },
  SHO: { inbox: ['FORWARD', 'INITIATED'], sent: ['RECOMMEND', 'FORWARD'] },
  ACP: { inbox: ['FORWARD', 'INITIATED'], sent: ['RECOMMEND', 'FORWARD'] },
  DCP: { inbox: ['FORWARD', 'INITIATED', 'RECOMMEND'], sent: ['RECOMMEND', 'APPROVED'] },
  AS: { inbox: ['FORWARD', 'INITIATED'], sent: ['RECOMMEND', 'FORWARD'] },
  ADO: { inbox: ['FORWARD', 'INITIATED'], sent: ['RECOMMEND'] },
  CADO: { inbox: ['FORWARD', 'INITIATED', 'RECOMMEND'], sent: ['RECOMMEND', 'APPROVED'] },
  RANGE: { inbox: ['FORWARD', 'INITIATED', 'RECOMMEND'], sent: ['RECOMMEND', 'APPROVED'] },
  JTCP: { inbox: ['FORWARD', 'INITIATED', 'RECOMMEND'], sent: ['RECOMMEND', 'APPROVED'] },
  CP: { inbox: ['FORWARD', 'INITIATED', 'RECOMMEND'], sent: ['RECOMMEND', 'APPROVED'] },
  ARMS_SUPDT: { inbox: ['FORWARD', 'INITIATED'], sent: ['RECOMMEND', 'FORWARD'] },
  ARMS_SEAT: { inbox: ['FORWARD', 'INITIATED'], sent: ['RECOMMEND'] },
  ACO: { inbox: ['FORWARD', 'INITIATED'], sent: ['RECOMMEND'] },
};

// New items to append (only) for these roles — the ones actually reported
// missing. No items are added for any role not listed here.
const NEW_ITEMS_BY_ROLE: Record<string, MenuItem[]> = {
  ZS: [
    { name: 'applications' }, // statusIds filled in from GLOBAL_ITEM_CODES below
    { name: 'cancelform' },   // no statusIds: filtered by applicationType, not status
  ],
};

// menu_items is a Json column: Prisma returns it already parsed as a plain
// JS value (array of strings, array of objects, a JSON string, or null,
// depending on how it was written historically) — normalize all of those.
function parseExistingMenuItems(raw: unknown): MenuItem[] {
  let value: any = raw;
  if (typeof value === 'string') {
    try {
      value = JSON.parse(value);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(value)) return [];
  return value.map((it) =>
    typeof it === 'string' ? { name: it } : { name: it?.name ?? String(it), statusIds: Array.isArray(it?.statusIds) ? it.statusIds : undefined },
  );
}

async function main() {
  const apply = process.argv.includes('--apply');
  console.log(apply ? 'Running in APPLY mode — the database will be updated.' : 'Running in DRY-RUN mode — no changes will be written. Pass --apply to write.');

  const statuses = await prisma.statuses.findMany({ select: { id: true, code: true } });
  const codeToId = new Map(statuses.map((s: { id: number; code: string }) => [s.code, s.id]));

  const missingCodes = new Set<string>();
  const resolve = (codes: string[]): number[] =>
    codes
      .map((code) => {
        const id = codeToId.get(code);
        if (id === undefined) missingCodes.add(code);
        return id;
      })
      .filter((id): id is number => id !== undefined);

  const allRoleCodes = new Set([...Object.keys(PER_ROLE_ITEM_CODES), ...Object.keys(NEW_ITEMS_BY_ROLE)]);

  for (const roleCode of allRoleCodes) {
    const role = await prisma.roles.findUnique({ where: { code: roleCode } });
    if (!role) {
      console.warn(`Skipping ${roleCode}: no matching role in Roles table.`);
      continue;
    }

    const existing = parseExistingMenuItems(role.menu_items);
    const perRoleCodes = PER_ROLE_ITEM_CODES[roleCode] || {};
    const existingNames = new Set(existing.map((it) => it.name));

    // Correct statusIds for existing items with a known mapping; leave every
    // other existing item exactly as it is.
    const corrected: MenuItem[] = existing.map((item) => {
      const codes = perRoleCodes[item.name] || GLOBAL_ITEM_CODES[item.name];
      if (!codes) return item;
      return { name: item.name, statusIds: resolve(codes) };
    });

    // Append new items for this role that aren't already present.
    const additions = (NEW_ITEMS_BY_ROLE[roleCode] || []).filter((it) => !existingNames.has(it.name));
    const withAdditions = additions.map((it) => {
      const codes = perRoleCodes[it.name] || GLOBAL_ITEM_CODES[it.name];
      return codes ? { name: it.name, statusIds: resolve(codes) } : it;
    });

    const menuItems = [...corrected, ...withAdditions];

    const beforeStr = JSON.stringify(role.menu_items);
    const afterStr = JSON.stringify(menuItems);

    if (beforeStr === afterStr) {
      console.log(`${roleCode}: already up to date.`);
      continue;
    }

    console.log(`${roleCode}:`);
    console.log(`  before: ${beforeStr}`);
    console.log(`  after:  ${afterStr}`);

    if (apply) {
      await prisma.roles.update({
        where: { code: roleCode },
        data: { menu_items: menuItems },
      });
      console.log(`  -> updated.`);
    }
  }

  if (missingCodes.size > 0) {
    console.warn(`Status code(s) not found in Statuses table, skipped: ${[...missingCodes].join(', ')}`);
  }

  console.log(apply ? 'Done.' : 'Dry run complete. Re-run with --apply to write these changes.');
}

main()
  .catch((e) => {
    console.error('Error while fixing role menu items:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
