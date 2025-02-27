import { prisma } from "./prismaClient";
import { User } from "@prisma/client";

export const findUserByCognitoId = async (userCognitoId: string): Promise<User | null> => {
    return await prisma.user.findUnique({
        where: { UserCognitoId: userCognitoId },
    });
};

export const findUserWithRoleAndPermissions = async (userCognitoId: string): Promise<any> => {
    return await prisma.user.findUnique({
        where: { UserCognitoId: userCognitoId },
        include: {
            Role: {
                include: {
                    RolePermissionLinks: {
                        include: {
                            Permission: true,
                        },
                    },
                },
            },
        },
    });
};
