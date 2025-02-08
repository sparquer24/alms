// generator client {
//   provider = "prisma-client-js"
// }

// datasource db {
//   provider = "postgresql"
//   url      = env("DATABASE_URL")
// }

// // User Model
// model User {
//   id    Int      @id @default(autoincrement())
//   email String   @unique
//   name  String?
//   roles Role[]   // One-to-many relation with Role
// }

// // Role Model
// model Role {
//   id         Int      @id @default(autoincrement())
//   roleName   String   // Name of the role
//   userId     Int      // Foreign key to User
//   user       User     @relation(fields: [userId], references: [id]) // Define the relation
//   createdAt  DateTime @default(now()) // Creation date
// }
