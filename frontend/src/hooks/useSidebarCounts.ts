import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
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

const EMPTY_COUNTS: ApplicationCounts = {
    forwardedCount: 0,
    returnedCount: 0,
    redFlaggedCount: 0,
    reEnquiryCount: 0,
    pendingCount: 0,
    draftCount: 0,
    allCount: 0,
};

export const sidebarCountsQueryKey = ['sidebarCounts'] as const;

export const useSidebarCounts = (enabled: boolean = true) => {
    const queryClient = useQueryClient();

    const { data, isLoading, isFetching, error, dataUpdatedAt } = useQuery({
        queryKey: sidebarCountsQueryKey,
        queryFn: async () => {
            const counts = await fetchApplicationCounts();
            return {
                forwardedCount: counts.forwardedCount,
                returnedCount: counts.returnedCount,
                redFlaggedCount: counts.redFlaggedCount,
                reEnquiryCount: counts.reEnquiryCount,
                pendingCount: counts.pendingCount,
                draftCount: counts.draftCount,
                allCount: counts.allCount ?? 0,
            } as ApplicationCounts;
        },
        enabled,
        staleTime: 1000 * 60 * 2, // 2 minutes — matches previous manual throttle
        refetchOnWindowFocus: false,
    });

    const refreshCounts = useCallback(
        async (force: boolean = false) => {
            if (force) {
                await queryClient.invalidateQueries({ queryKey: sidebarCountsQueryKey });
            } else {
                await queryClient.refetchQueries({ queryKey: sidebarCountsQueryKey, type: 'active' });
            }
        },
        [queryClient]
    );

    return {
        applicationCounts: data ?? EMPTY_COUNTS,
        loading: isLoading || isFetching,
        error: error instanceof Error ? error.message : null,
        refreshCounts,
        lastFetch: dataUpdatedAt,
    };
};
