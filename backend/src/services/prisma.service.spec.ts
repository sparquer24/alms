import { withPoolSize } from './prisma.service';

describe('withPoolSize', () => {
  const url = 'postgresql://u:p@db:5432/alms';

  it('appends connection_limit', () => {
    expect(withPoolSize(url, '15')).toBe(`${url}?connection_limit=15`);
    expect(withPoolSize(`${url}?schema=public`, '15')).toBe(`${url}?schema=public&connection_limit=15`);
  });

  it('leaves the URL alone when unset, invalid, or already configured', () => {
    expect(withPoolSize(url, undefined)).toBe(url);
    expect(withPoolSize(url, 'abc')).toBe(url);
    expect(withPoolSize(url, '0')).toBe(url);
    expect(withPoolSize(`${url}?connection_limit=5`, '15')).toBe(`${url}?connection_limit=5`);
    expect(withPoolSize(undefined, '15')).toBeUndefined();
  });
});
