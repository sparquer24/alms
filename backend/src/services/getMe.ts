import { findUserWithRoleAndPermissions } from "../repository/users";

export const getUserDetails = async (userCognitoId: string) => {
    // Fetch user from repository
    const user = await findUserWithRoleAndPermissions(userCognitoId);
    if (!user) {
        throw new Error("User not found");
    }

    // Return formatted user details
    return {
        id: user.Id,
        email: user.EmailId,
        name: user.Name,
        role: user.Role?.Title || "No Role",
        permissionsLinks: user.Role?.RolePermissionLinks?.map((link: any) => link.Permission.Title) || [],
    };
};
