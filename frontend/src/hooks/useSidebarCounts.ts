import { useState, useEffect, useCallback } from 'react';
import { fetchApplicationCounts } from '../services/sidebarApiCalls';

interface ApplicationCounts {
    reEnquiryCount: number;
    forwardedCount: number;
    returnedCount: number;
    redFlaggedCount: number;
    pendingCount: number;
    draftCount: number;
    allCount: number;
}

export const useSidebarCounts = (enabled: boolean = true) => {
    const [applicationCounts, setApplicationCounts] = useState<ApplicationCounts>({
        forwardedCount: 0,
        returnedCount: 0,
        redFlaggedCount: 0,
        reEnquiryCount: 0,
        pendingCount: 0,
        draftCount: 0,
        allCount: 0,
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
                reEnquiryCount: counts.reEnquiryCount,
                pendingCount: counts.pendingCount,
                draftCount: counts.draftCount,
                allCount: counts.allCount ?? 0,
            });

            setLastFetch(now);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch counts');
        } finally {
            setLoading(false);
        }
    }, [enabled]); // Removed loading and lastFetch from dependencies to prevent infinite loops

    // Initial fetch - runs whenever enabled flips to true (e.g. when sidebar becomes visible)
    useEffect(() => {
        if (!enabled) return;

        let isMounted = true;

        const initialFetch = async () => {
            // Skip if we already have fresh data (fetched within last 2 minutes)
            if (lastFetch !== 0 && (Date.now() - lastFetch) < 120000) return;

            try {
                setLoading(true);
                setError(null);
                const counts = await fetchApplicationCounts();

                if (isMounted) {
                    setApplicationCounts({
                        forwardedCount: counts.forwardedCount,
                        returnedCount: counts.returnedCount,
                        redFlaggedCount: counts.redFlaggedCount,
                        reEnquiryCount: counts.reEnquiryCount,
                        pendingCount: counts.pendingCount,
                        draftCount: counts.draftCount,
                        allCount: counts.allCount ?? 0,
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
    }, [enabled]); // Re-runs when enabled changes (e.g. sidebar becomes visible)

    return {
        applicationCounts,
        loading,
        error,
        refreshCounts,
        lastFetch
    };
};
