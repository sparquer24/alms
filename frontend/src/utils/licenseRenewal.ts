/**
 * The renewal a license is still waiting on, or null when a new renewal can be started.
 * `renewalApplicationId` keeps pointing at the last renewal after it is approved; once the
 * license's last modification is that same renewal it is complete, not pending.
 */
export const getPendingRenewalId = (license: any): number | null => {
  const id = license?.renewalApplicationId;
  if (!id) return null;
  const completed =
    String(license.lastModifiedAppType || '').toUpperCase() === 'RENEWAL' &&
    String(license.lastModifiedAppId ?? license.lastModifiedRenewalId) === String(id);
  return completed ? null : id;
};
