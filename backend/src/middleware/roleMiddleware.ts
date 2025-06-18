export function authorize(user: any, allowedRoles: string[]) {
  if (!user || !allowedRoles.includes(user.role)) {
    return false;
  }
  return true;
}
