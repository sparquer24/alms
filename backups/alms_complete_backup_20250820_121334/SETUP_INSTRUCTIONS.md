# ALMS Project Setup Instructions

## Prerequisites
- Node.js (v18 or higher)
- PostgreSQL database
- Git

## Setup Steps

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Setup
Create a `.env` file in the root directory:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/alms_db"
JWT_SECRET="your-jwt-secret-key"
PORT=3000
```

### 3. Database Setup
```bash
# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# Run migrations (if using migration-based workflow)
npx prisma migrate deploy

# Seed initial data
npm run seed
```

### 4. Start Development Server
```bash
npm run start:dev
```

## Restoring Metadata (Optional)
If you have a metadata backup file:
```bash
npx ts-node scripts/restore-metadata.ts path/to/backup-file.json --include-users
```

## Project Structure
- `src/` - Application source code
- `prisma/` - Database schema and migrations
- `scripts/` - Utility scripts for backup/restore

## Important Notes
- Change default passwords after setup
- Update JWT secret in production
- Configure database connection properly
- Review and update environment variables

## Support
Contact the development team for any setup issues.
