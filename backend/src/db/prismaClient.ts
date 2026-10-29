import { PrismaService } from '../services/prisma.service';

// The one Prisma client (and connection pool) for the whole backend.
// Nest modules receive this same instance through PrismaModule.
const prisma = new PrismaService();

export default prisma;
