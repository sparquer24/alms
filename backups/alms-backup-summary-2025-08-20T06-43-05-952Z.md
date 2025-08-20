# ALMS Metadata Backup Summary

**Backup Created:** 2025-08-20T06:43:05.951Z
**Version:** 1.0.0

## Data Summary:
- **Statuses:** 11 records
- **Actions:** 11 records
- **Roles:** 16 records
- **States:** 1 records
- **Districts:** 1 records
- **Zones:** 15 records
- **Divisions:** 15 records
- **Police Stations:** 10 records
- **Weapon Types:** 0 records
- **Users:** 9 records (passwords excluded)

## Files Included:
1. Database Schema: `prisma/schema.prisma`
2. Migrations: `prisma/migrations/`
3. Seed Data: `prisma/seed.ts`
4. Metadata Backup: `alms-metadata-backup-2025-08-20T06-43-05-952Z.json`

## Restore Instructions:
1. Copy schema.prisma to new project
2. Run: `npx prisma generate`
3. Run: `npx prisma db push`
4. Use restore script with backup JSON file

## Security Note:
User passwords are excluded from this backup for security reasons.
