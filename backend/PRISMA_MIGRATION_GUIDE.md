# Prisma Migration and Role Update Guide

## Available Commands

### Migration Commands:
```bash
# Apply pending migrations to database
npm run up

# Create a new migration (after schema changes)
npx prisma migrate dev --name your_migration_name

# Reset database and re-run all migrations (WARNING: deletes all data!)
npm run down

# Open Prisma Studio to view database
npm run studio
```

### Seeding Commands:
```bash
# Run the main seed file (creates initial data)
npm run seed

# Update roles based on code matching (creates or updates roles)
npm run update-roles
```

## How to Update Roles Based on Code Matching

The `update-roles` script will:
1. Check if each role exists by its `code` field
2. If the role exists, update all its fields with the new data
3. If the role doesn't exist, create a new role record

### Running the Role Update:
```bash
cd backend
npm run update-roles
```

## Migration Workflow

1. **Make schema changes** in `prisma/schema.prisma`
2. **Create migration**:
   ```bash
   npx prisma migrate dev --name descriptive_name
   ```
3. **Apply migration**:
   ```bash
   npm run up
   ```
4. **Seed/update data**:
   ```bash
   npm run seed        # For initial seeding
   npm run update-roles # For role updates
   ```

## Important Notes

- Always backup your database before running destructive commands like `npm run down`
- The `update-roles` script uses UPSERT logic (update if exists, create if not exists)
- Role data is matched by the `code` field which must be unique
- JSON fields (`menu_items`, `permissions`) are automatically stringified

## Troubleshooting

If you encounter issues:
1. Check that your database connection is configured in `.env`
2. Ensure all dependencies are installed: `npm install`
3. Verify Prisma client is generated: `npx prisma generate`
4. Use Prisma Studio to inspect current data: `npm run studio`
