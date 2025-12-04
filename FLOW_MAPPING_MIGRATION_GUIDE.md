# Flow Mapping Database Migration Guide

## Quick Setup

### Step 1: Create Migration

Run this command in the backend directory:

```bash
cd backend
npx prisma migrate dev --name add_role_flow_mapping
```

This will:
1. Create a new migration file
2. Apply the schema changes to your database
3. Generate updated Prisma Client

### Step 2: What Gets Created

The migration creates:

#### New Table: `RoleFlowMapping`
```sql
CREATE TABLE "RoleFlowMapping" (
  "id" SERIAL NOT NULL PRIMARY KEY,
  "currentRoleId" INTEGER NOT NULL UNIQUE,
  "nextRoleIds" INTEGER[] NOT NULL,
  "updatedBy" INTEGER,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RoleFlowMapping_currentRoleId_fkey" 
    FOREIGN KEY ("currentRoleId") REFERENCES "Roles"("id") ON DELETE CASCADE,
  CONSTRAINT "RoleFlowMapping_updatedBy_fkey" 
    FOREIGN KEY ("updatedBy") REFERENCES "Users"("id") ON DELETE SET NULL
);
```

#### New Indexes
- Unique index on `currentRoleId`
- Foreign key index on `updatedBy`

### Step 3: Seed Initial Data (Optional)

Create a seed file in `prisma/seed.ts` to initialize some test mappings:

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Example: DCP can forward to ACP and SHO
  // Assuming role IDs: DCP=1, ACP=2, SHO=3
  
  const dcp = await prisma.roles.findUnique({ where: { code: 'DCP' } });
  const acp = await prisma.roles.findUnique({ where: { code: 'ACP' } });
  const sho = await prisma.roles.findUnique({ where: { code: 'SHO' } });

  if (dcp && acp && sho) {
    await prisma.roleFlowMapping.create({
      data: {
        currentRoleId: dcp.id,
        nextRoleIds: [acp.id, sho.id],
      },
    });
    console.log('Seeded role flow mappings');
  }
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
```

Run seed:
```bash
npx prisma db seed
```

### Step 4: Verify Migration

Check that the table was created:

```bash
npx prisma studio
```

Or query directly:
```sql
SELECT * FROM "RoleFlowMapping";
```

## Schema Changes Summary

### Modified: Roles Model
```prisma
model Roles {
  // ... existing fields ...
  currentRoleFlowMappings    RoleFlowMapping[]  @relation("CurrentRole")
  nextRoleFlowMappings       RoleFlowMapping[]  @relation("NextRoles")
}
```

### Modified: Users Model
```prisma
model Users {
  // ... existing fields ...
  flowMappingUpdates  RoleFlowMapping[]
}
```

### New: RoleFlowMapping Model
```prisma
model RoleFlowMapping {
  id           Int       @id @default(autoincrement())
  currentRoleId Int      @unique
  nextRoleIds  Int[]
  updatedBy    Int?
  updatedAt    DateTime  @updatedAt @default(now())
  createdAt    DateTime  @default(now())
  currentRole  Roles     @relation("CurrentRole", fields: [currentRoleId], references: [id], onDelete: Cascade)
  updatedByUser Users?   @relation(fields: [updatedBy], references: [id], onDelete: SetNull)

  @@unique([currentRoleId])
}
```

## Rollback (If Needed)

If you need to rollback the migration:

```bash
npx prisma migrate resolve --rolled-back add_role_flow_mapping
```

Or to completely remove the migration:

```bash
npx prisma migrate reset
```

**⚠️ Warning**: `reset` will delete all data in the database.

## Environment Setup

Ensure your `.env` file has the correct DATABASE_URL:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/alms_db"
```

## Verification Checklist

- [ ] Migration file created in `prisma/migrations/`
- [ ] `RoleFlowMapping` table created in database
- [ ] Prisma Client generated with new model
- [ ] Foreign keys properly linked to `Roles` and `Users`
- [ ] Unique constraint on `currentRoleId` working
- [ ] Unique indexes created
- [ ] API endpoints responding correctly
- [ ] Frontend can fetch and save mappings

## Connection Notes

- **currentRoleId**: References role that forwards applications
- **nextRoleIds**: PostgreSQL array type (integer array)
- **updatedBy**: Tracks which user made the change (can be NULL)
- **Cascade Delete**: Deleting a role deletes its mappings
- **Set Null on User Delete**: If user is deleted, mapping's updatedBy becomes NULL

## Performance Considerations

- Unique index on `currentRoleId` for fast lookups: O(1)
- Small table (one row per role) - minimal index overhead
- Foreign key checks on inserts only slight performance impact
- Array operations are efficient for small datasets

## Testing the Migration

```bash
# Generate client with new model
npx prisma generate

# View schema changes
npx prisma studio

# Run tests if available
npm run test

# Check if API endpoints work
curl http://localhost:3001/api/flow-mapping/1
```

---

**Status**: Ready for migration
**Estimated Time**: 1-2 minutes
**Risk Level**: Low (additive changes only)
