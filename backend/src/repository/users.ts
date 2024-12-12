// import { PrismaClient } from '@prisma/client';

// const prisma = new PrismaClient();

// export const createUser = async (data: any) => {
//     const user = await prisma.user.create({
//         data: {
//             email: data.email,
//             name: data.name,
//         },
//     });
//     console.log({ user });
//     return user;
// };

// export const getUserByEmail = async (email: string) => {
//     const user = await prisma.user.findUnique({
//         where: { email },
//     });
//     return user;
// };

// export const updateUser = async (id: number, data: { name?: string, email?: string }) => {
//     const user = await prisma.user.update({
//         where: { id },
//         data,
//     });
//     return user;
// };

// export const deleteUser = async (id: number) => {
//     await prisma.user.delete({
//         where: { id },
//     });
// };