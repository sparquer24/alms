import { getRoleBasedRedirectPath } from './roleRedirections';

describe('getRoleBasedRedirectPath', () => {
    test('returns admin path for ADMIN role', () => {
        expect(getRoleBasedRedirectPath('ADMIN')).toBe('/admin/userManagement');
        expect(getRoleBasedRedirectPath(' admin ')).toBe('/admin/userManagement');
    });

    test('returns freshform for ZS role', () => {
        expect(getRoleBasedRedirectPath('ZS')).toBe('/home?type=freshform');
        expect(getRoleBasedRedirectPath('zs')).toBe('/home?type=freshform');
    });

    test('returns forwarded for officer roles', () => {
        expect(getRoleBasedRedirectPath('SHO')).toBe('/home?type=forwarded');
        expect(getRoleBasedRedirectPath('ARMS_SUPDT')).toBe('/home?type=forwarded');
    });

    test('falls back to root for unknown role', () => {
        expect(getRoleBasedRedirectPath(undefined)).toBe('/');
        expect(getRoleBasedRedirectPath('')).toBe('/');
    });
});
