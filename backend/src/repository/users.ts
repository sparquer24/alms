import prisma  from './prismaClient';

export const createUser = async (data: { email: string; name: string; roles?: { roleName: string }[] }) => {
    const user = await prisma.user.create({
        data: {
            email: data.email,
            name: data.name
        }
    });
    console.log({ user });
    return user;
};
