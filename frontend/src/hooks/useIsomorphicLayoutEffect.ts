import { useEffect, useLayoutEffect } from 'react';

/**
 * useLayoutEffect on the client (runs before paint, so layout changes such as
 * hiding the sidebar don't flash), useEffect on the server to avoid SSR warnings.
 */
export const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;
