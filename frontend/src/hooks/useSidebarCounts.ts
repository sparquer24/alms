import { useState, useEffect, useCallback } from 'react';
import { fetchApplicationCounts } from '../services/sidebarApiCalls';

interface ApplicationCounts {
    forwardedCount: number;
    returnedCount: number;
    redFlaggedCount: number;
    disposedCount: number;
}

export const useSidebarCounts = (enabled: boolean = true) => {
    const [applicationCounts, setApplicationCounts] = useState<ApplicationCounts>({
        forwardedCount: 0,
        returnedCount: 0,
        redFlaggedCount: 0,
        disposedCount: 0,
    });
    const [loading, setLoading] = useState(false);
    const [lastFetch, setLastFetch] = useState<number>(0);
    const [error, setError] = useState<string | null>(null);

    const refreshCounts = useCallback(async (force: boolean = false) => {
        // Prevent duplicate calls within 2 minutes unless forced
        const now = Date.now();
        if (!force && (loading || (now - lastFetch) < 120000)) {
            return;
        }

        if (!enabled) return;

        try {
            setLoading(true);
            setError(null);
            const counts = await fetchApplicationCounts();

            setApplicationCounts({
                forwardedCount: counts.forwardedCount,
                returnedCount: counts.returnedCount,
                redFlaggedCount: counts.redFlaggedCount,
                disposedCount: counts.disposedCount,
            });

            setLastFetch(now);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch counts');
        } finally {
            setLoading(false);
        }
    }, [enabled]); // Removed loading and lastFetch from dependencies to prevent infinite loops

    // Initial fetch - separate effect with stable dependencies
    useEffect(() => {
        let isMounted = true;

        const initialFetch = async () => {
            if (!enabled || lastFetch !== 0) return;

            try {
                setLoading(true);
                setError(null);
                const counts = await fetchApplicationCounts();

                if (isMounted) {
                    setApplicationCounts({
                        forwardedCount: counts.forwardedCount,
                        returnedCount: counts.returnedCount,
                        redFlaggedCount: counts.redFlaggedCount,
                        disposedCount: counts.disposedCount,
                    });
                    setLastFetch(Date.now());
                }
            } catch (err) {
                if (isMounted) {
                    setError(err instanceof Error ? err.message : 'Failed to fetch counts');
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        initialFetch();

        return () => {
            isMounted = false;
        };
    }, [enabled]); // Only depend on enabled to prevent re-fetching

    return {
        applicationCounts,
        loading,
        error,
        refreshCounts,
        lastFetch
    };
};
