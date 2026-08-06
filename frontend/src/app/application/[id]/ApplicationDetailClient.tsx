'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Sidebar } from '../../../components/Sidebar';
import Header from '../../../components/Header';
import { useAuth } from '@/hooks/useAuth';
import { useLayout } from '../../../config/layoutContext';
import { ApplicationApi } from '../../../config/APIClient';
import { apiClient } from '../../../config/authenticatedApiClient';

import { ApplicationData, LicenseData } from '../../../types';
import LicenseService from '../../../services/licenseService';
import ProcessApplicationModal from '../../../components/ProcessApplicationModal';
import ForwardApplicationModal from '../../../components/ForwardApplicationModal';
import ConfirmationModal from '../../../components/ConfirmationModal';
import EnhancedApplicationTimeline from '../../../components/EnhancedApplicationTimeline';
import {
  PageLayoutSkeleton,
  ApplicationCardSkeleton,
  ApplicationDetailSkeleton,
} from '../../../components/Skeleton';
import ProceedingsForm from '../../../components/ProceedingsForm';
import { LazySection } from '../../../components/LazySection';
import { RichTextDisplay } from '../../../components/RichTextDisplay';
import { getApplicationByApplicationId } from '../../../services/sidebarApiCalls';
import { RenewalService } from '../../../api/renewalService';
import { getDocuments } from '../../../services/documentService';
import { truncateFilename } from '../../../utils/string';
import { useSidebarCounts } from '../../../hooks/useSidebarCounts';

import { useGlobalAction } from '../../../context/GlobalActionContext';

// Import redesigned components and Lucide icons
import {
  StatusBadge,
  DetailItem,
  SectionCard,
  SummaryCard,
  DocumentTable,
} from '../components/RedesignedComponents';
import PrintApplicationForm from '../components/PrintApplicationForm';
import {
  UserRound,
  UserCheck,
  CalendarDays,
  CreditCard,
  Fingerprint,
  FileCheck,
  UserCog,
  BadgeCheck,
  Clock3,
  Shield,
  Target,
  ShieldCheck,
  Crosshair,
  MapPin,
  LocateFixed,
  Package,
  FileText,
  History,
  ClipboardCheck,
  Building2,
  ShieldAlert,
  AlertTriangle,
  Users,
  TriangleAlert,
  FileWarning,
  Calendar,
  Ban,
  Scale,
  FileSearch,
  Building,
  Landmark,
  BriefcaseBusiness,
  MapPinned,
  FolderOpen,
  Eye,
  Download,
  Printer,
} from 'lucide-react';

import {
  humanize,
  formatGender,
  formatStatusLabel,
  formatApplicationType,
  formatPhone,
} from '../../../utils/formatters';
import { normalizeRenewalApplication } from '../../../utils/applicationFormatters';
import { openAttachment } from '../../../utils/attachmentViewer';
import { generateApplicationPrintHtml } from '../../../utils/printGenerators';
import { getStatusStyle } from '../../../utils/statusColors';
import RenewalApplicationDetailsHeader from '../../../components/renewal/renewalapplicationdetailsheader';

const hexToRgba = (hex: string, alpha: number): string => {
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

interface ApplicationDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function ApplicationDetailPage({ params }: ApplicationDetailPageProps) {
  const { isAuthenticated, user, userRole, isLoading: authLoading, initialized } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { setShowHeader, setShowSidebar } = useLayout();
  const [application, setApplication] = useState<ApplicationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isProcessModalOpen, setIsProcessModalOpen] = useState(false);
  const [applicationId, setApplicationId] = useState<string | null>(null);
  const [isForwardModalOpen, setIsForwardModalOpen] = useState(false);
  const [showPrintOptions, setShowPrintOptions] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isForwarding, setIsForwarding] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showTimeline, setShowTimeline] = useState(false);
  const [selectedAction, setSelectedAction] = useState<
    | 'approve'
    | 'reject'
    | 'return'
    | 'flag'
    | 'dispose'
    | 'recommend'
    | 'not-recommend'
    | 're-enquiry'
  >('approve');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [workflowHistory, setWorkflowHistory] = useState<any[]>([]);
  const [confirmationDetails, setConfirmationDetails] = useState({
    title: '',
    message: '',
    actionButtonText: '',
    actionButtonColor: '',
    onConfirm: () => {},
  });

  const [showProceedingsModal, setShowProceedingsModal] = useState(false);
  const [showProceedingsForm, setShowProceedingsForm] = useState(true);
  const [showTimelineDetails, setShowTimelineDetails] = useState(false);
  const [timelineDetails, setTimelineDetails] = useState({
    user1: false,
    user2: false,
    user3: false,
  });
  const [expandedHistory, setExpandedHistory] = useState<Record<number, boolean>>({});
  const [licenseData, setLicenseData] = useState<LicenseData | null>(null);
  const [licenseLoading, setLicenseLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'original'>('info');
  const [rawRenewalData, setRawRenewalData] = useState<any | null>(null);
  // Original License Details tab: loaded via the License GET API only (no fresh-app API).
  const [originalLicenseData, setOriginalLicenseData] = useState<LicenseData | null>(null);
  const [originalLicenseLoading, setOriginalLicenseLoading] = useState(false);
  const originalLicenseLoadedIdRef = useRef<string | number | null>(null);
  // Application History for the Original License tab, sourced from the Workflow History API.
  const [originalLicenseHistory, setOriginalLicenseHistory] = useState<any[]>([]);
  const originalLicenseHistoryLoadedIdRef = useRef<string | number | null>(null);
  // Original License Documents: fetched from the Documents API when the Origin tab is active.
  const [originDocuments, setOriginDocuments] = useState<any[]>([]);
  const [originDocumentsLoading, setOriginDocumentsLoading] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);
  // Becomes false while the hidden print layout's document/PDF previews are still
  // rendering, so the Print buttons don't fire window.print() on blank thumbnails.
  const [printReady, setPrintReady] = useState(true);
  const [dividerPosition, setDividerPosition] = useState(66.66); // Left section percentage (2 of 3 columns)
  const [isDragging, setIsDragging] = useState(false);
  const dividerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isRenewalView =
    searchParams?.get('type') === 'renewal' ||
    (typeof pathname === 'string' && pathname.includes('/renewalApplication'));

  useEffect(() => {
    const tab = searchParams?.get('tab');
    setActiveTab(tab === 'original' ? 'original' : 'info');
  }, [searchParams]);

  const handleTabChange = (tab: string) => {
    const isOriginalTab = tab === 'Original License Details' || tab === 'original';
    const nextTab: 'info' | 'original' = isOriginalTab ? 'original' : 'info';
    setActiveTab(nextTab);
    const params = new URLSearchParams(searchParams?.toString() || '');
    params.set('tab', nextTab);
    router.replace(`${pathname}?${params.toString()}`);

    // Clear stale data when switching to the Origin tab to prevent showing old content while loading.
    if (nextTab === 'original') {
      setOriginalLicenseData(null);
      setOriginalLicenseLoading(true);
      originalLicenseLoadedIdRef.current = null;
      originalLicenseHistoryLoadedIdRef.current = null;
      setOriginalLicenseHistory([]);
      setOriginDocuments([]);
    }
  };

  // Use sidebar counts hook here so we can trigger an immediate refresh
  // after actions that move an application between inbox buckets.
  // We pass !loading to give priority to the /application/4 dependence API first.
  const { refreshCounts } = useSidebarCounts(!loading);
  const { executeAction, setActiveNavigationPath } = useGlobalAction();
  const currentDisplayApp = useMemo(() => {
    if (isRenewalView && activeTab === 'original' && originalLicenseData) {
      return originalLicenseData as unknown as ApplicationData;
    }
    return application;
  }, [isRenewalView, activeTab, originalLicenseData, application]);

  const licenseDetails = useMemo(() => {
    const rawDetails =
      (currentDisplayApp as any)?.licenseDetails || (currentDisplayApp as any)?.licenseDetail;
    if (!rawDetails) return [] as any[];
    return Array.isArray(rawDetails) ? rawDetails.filter(Boolean) : [rawDetails];
  }, [currentDisplayApp]);

  const applicantName = useMemo(() => {
    return (
      [currentDisplayApp?.firstName, currentDisplayApp?.middleName, currentDisplayApp?.lastName]
        .filter(Boolean)
        .join(' ') ||
      currentDisplayApp?.applicantName ||
      'N/A'
    );
  }, [currentDisplayApp]);

  const showFullApplicationDetails =
    !isRenewalView || activeTab === 'info' || activeTab === 'original';

  // Workflow history for the printout: use the same source the on-screen
  // timeline uses (the separately-fetched `workflowHistory` state / the Origin
  // tab's `originalLicenseHistory`) rather than application.workflowHistories,
  // which is often empty for renewals and caused "Application History" to be
  // missing from the print output.
  const printWorkflowHistory = useMemo(() => {
    if (isRenewalView && activeTab === 'original') {
      return originalLicenseHistory && originalLicenseHistory.length > 0
        ? originalLicenseHistory
        : (currentDisplayApp as any)?.workflowHistories || [];
    }
    return workflowHistory && workflowHistory.length > 0
      ? workflowHistory
      : (currentDisplayApp as any)?.workflowHistories || [];
  }, [isRenewalView, activeTab, originalLicenseHistory, workflowHistory, currentDisplayApp]);

  // Base the printout on currentDisplayApp — the same source the on-screen
  // details panel renders from — so printing the Original License Details
  // tab prints the license's original data (currentDisplayApp swaps to
  // originalLicenseData there) instead of always printing the renewal
  // application's own data regardless of which tab is active. Documents get
  // the same origin-tab override used by the on-screen Documents table.
  const printApplication = useMemo(() => {
    if (!currentDisplayApp) return null;
    if (isRenewalView && activeTab === 'original' && originDocuments && originDocuments.length > 0) {
      return { ...currentDisplayApp, documents: originDocuments };
    }
    return currentDisplayApp;
  }, [currentDisplayApp, isRenewalView, activeTab, originDocuments]);

  // Handle params Promise for React 18 compatibility
  useEffect(() => {
    params.then(resolvedParams => {
      setApplicationId(resolvedParams.id);
    });
  }, [params]);

  useEffect(() => {
    if (initialized && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, initialized, router]);

  // Show header and sidebar like other pages (Settings, etc.)
  useEffect(() => {
    setShowHeader(true);
    setShowSidebar(false); // Hide sidebar on Application Details page

    // Cleanup: reset sidebar visibility when leaving this page
    return () => {
      setShowSidebar(true);
    };
  }, [setShowHeader, setShowSidebar]);

  useEffect(() => {
    // Fetch application using shared service which maps workflow history correctly
    const fetchApplication = async () => {
      setLoading(true);
      try {
        if (isRenewalView) {
          const response = await RenewalService.getRenewalForm(applicationId!);
          const renewalData = (response as any)?.data ?? response;
          if (renewalData) {
            setRawRenewalData(renewalData);
            setApplication(normalizeRenewalApplication(renewalData));
          } else {
            setApplication(null);
          }
        } else {
          const result = await getApplicationByApplicationId(applicationId!);
          if (result) {
            setApplication(result as ApplicationData);
          } else {
            setApplication(null);
          }
        }

        // Fetch license data for this application
        const fetchLicense = async () => {
          setLicenseLoading(true);
          try {
            // For fresh apps, sourceApplicationId is the application ID
            // For renewals, we look up the original app's license
            const appIdForLicense = isRenewalView ? applicationId || '' : applicationId;

            // Try fetching license by looking up through the application
            // The license is linked via sourceApplicationId = fresh app ID
            // For fresh applications, try the by-number approach or list with search
            if (!isRenewalView && appIdForLicense) {
              // First try: fetch all licenses and find by sourceApplicationId
              // or use the /licenses/:id/source-application approach
              const result = await LicenseService.getAllLicenses({
                search: appIdForLicense,
                limit: 10,
              });
              if (result?.data?.length) {
                // Check if any license matches our freshApplicationId
                const match = result.data.find(
                  l => l.freshApplicationId === Number(appIdForLicense)
                );
                if (match) {
                  setLicenseData(match);
                  return;
                }
              }
            }
          } catch (err) {
            console.debug('[License fetch] No license found for this application');
          } finally {
            setLicenseLoading(false);
          }
        };
        fetchLicense();

        try {
          const typeParam = isRenewalView ? 'renewal' : 'fresh';
          const historyResponse = await apiClient.get<any>(
            `/workflow/history/${applicationId}?type=${typeParam}`
          );
          if (historyResponse && historyResponse.success) {
            setWorkflowHistory(historyResponse.data);
          }
        } catch (err) {
          console.error('Failed to fetch workflow history', err);
        }
      } catch (error) {
        setApplication(null);
      } finally {
        setLoading(false);
      }
    };

    if (applicationId) {
      fetchApplication();
    }
  }, [applicationId, isRenewalView]);

  // When user opens the "Original License Details" tab:
  // 1. Call the License GET API (using the licenseId from the Renewal) once.
  // 2. From the License response, read `sourceApplicationId` and `lastModifiedAppType`
  //    and call the Workflow History API with those values — this populates the
  //    Application History section. No Fresh Application API is used.
  // Both APIs run only once per license when the tab is opened (duplicate calls avoided).
  useEffect(() => {
    const fetchOriginalLicense = async () => {
      if (!isRenewalView || activeTab !== 'original') return;

      // Derive the license id from the renewal record.
      const licenseId =
        rawRenewalData?.licenseId ??
        rawRenewalData?.renewalLicenseId ??
        rawRenewalData?.almsLicenseId ??
        null;
      if (!licenseId) return;

      // Avoid duplicate License GET API requests for the same license.
      if (String(licenseId) === String(originalLicenseLoadedIdRef.current)) return;
      originalLicenseLoadedIdRef.current = licenseId;

      try {
        setOriginalLicenseLoading(true);
        const license = await LicenseService.getLicenseById(Number(licenseId));
        if (!license) {
          setOriginalLicenseData(null);
          setOriginalLicenseHistory([]);
          return;
        }
        setOriginalLicenseData(license);          // Now call the Workflow History API using the source application data
          // from the License API response, matching the Documents API logic:
          //   - id: the source application's primary key (license.id from the License API)
          //   - type: derived from the first character of the acknowledgement number:
          //       'F' → FRESH | 'R' → RENEWAL | 'C' → CANCELLATION
          if (String(licenseId) !== String(originalLicenseHistoryLoadedIdRef.current)) {
            originalLicenseHistoryLoadedIdRef.current = licenseId;
            setOriginalLicenseHistory([]);

            // Source application ID from the License API response
            const srcAppId = (license as any).id;
            const ackNo = (license as any).acknowledgementNo;

            if (srcAppId && ackNo) {
              // Derive the type from the first character of the acknowledgement number
              const firstChar = String(ackNo).charAt(0).toUpperCase();
              let derivedType: string;
              if (firstChar === 'R') derivedType = 'RENEWAL';
              else if (firstChar === 'C') derivedType = 'CANCELLATION';
              else derivedType = 'FRESH';

              try {
                const historyResponse = await apiClient.get<any>(
                  `/workflow/history/${srcAppId}?type=${derivedType}`
                );
                if (historyResponse && historyResponse.success) {
                  setOriginalLicenseHistory(historyResponse.data);
                } else if (Array.isArray(historyResponse)) {
                  setOriginalLicenseHistory(historyResponse);
                }
              } catch (historyErr) {
                console.error('Failed to fetch original license workflow history', historyErr);
                setOriginalLicenseHistory([]);
              }
            }
          }
      } catch (err) {
        console.error('Failed to fetch original license on tab change', err);
      } finally {
        setOriginalLicenseLoading(false);
      }
    };

    fetchOriginalLicense();
  }, [activeTab, isRenewalView, rawRenewalData]);

  // When the Origin tab is active and original license data is available,
  // fetch the original application's documents via the Documents API.
  //
  // Instead of passing the current renewal application ID and type directly,
  // use the source application data from the License API response:
  //   - id: the source application's primary key (data.id from the License API)
  //   - type: derived from the first character of the acknowledgement number:
  //       'F' → Fresh | 'R' → Renewal | 'C' → Cancellation
  useEffect(() => {
    const fetchOriginDocuments = async () => {
      if (activeTab !== 'original' || !originalLicenseData) return;

      // Source application ID: the License API response merges source application
      // fields at the top level (via buildLicenseDetailResponse), so originalLicenseData.id
      // is the source application's primary key, NOT the license PK.
      const srcAppId = (originalLicenseData as any).id;
      const ackNo = (originalLicenseData as any).acknowledgementNo;

      if (!srcAppId || !ackNo) {
        setOriginDocuments([]);
        return;
      }

      // Derive the type from the first character of the acknowledgement number.
      const firstChar = String(ackNo).charAt(0).toUpperCase();
      let derivedType: string;
      if (firstChar === 'R') derivedType = 'Renewal';
      else if (firstChar === 'C') derivedType = 'Cancellation';
      else derivedType = 'Fresh';

      setOriginDocumentsLoading(true);
      try {
        const docs = await getDocuments(Number(srcAppId), derivedType);
        setOriginDocuments(docs);
      } catch (err) {
        console.error('Failed to fetch origin documents:', err);
        setOriginDocuments([]);
      } finally {
        setOriginDocumentsLoading(false);
      }
    };

    fetchOriginDocuments();
  }, [activeTab, originalLicenseData]);

// Clear success message after 5 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Clear error message after 5 seconds
  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => {
        setErrorMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  const handleSearch = (query: string) => {
    // Navigate back to main page with search query
    router.push(`/?search=${encodeURIComponent(query)}`);
  };

  const handleDateFilter = (startDate: string, endDate: string) => {
    // Navigate back to main page with date filters
    router.push(`/?startDate=${startDate}&endDate=${endDate}`);
  };
  const handleReset = () => {
    // Navigate back to main page with no filters
    router.push('/');
  };

  const handleProcessApplication = async (action: string, reason: string) => {
    if (!application) return;

    const actionId = `process-application-${application.id}`;

    const result = await executeAction(actionId, async () => {
      setIsProcessing(true);

      try {
        // In a real app, this would be an API call
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        // For now, we'll just update the local state to simulate the change
        const updatedApplication = { ...application };

        switch (action) {
          case 'approve':
            updatedApplication.status = 'approved';
            setSuccessMessage('Application has been approved successfully');
            break;
          case 'reject':
            updatedApplication.status = 'rejected';
            setSuccessMessage('Application has been rejected');
            break;
          case 'return':
            updatedApplication.status = 'returned';
            updatedApplication.returnReason = reason;
            setSuccessMessage('Application has been returned to the applicant');
            break;
          case 'flag':
            updatedApplication.status = 'red-flagged';
            updatedApplication.flagReason = reason;
            setSuccessMessage('Application has been red-flagged');
            break;
          case 'dispose':
            updatedApplication.status = 'disposed';
            updatedApplication.disposalReason = reason;
            setSuccessMessage('Application has been disposed');
            break;
          case 'recommend':
            // In a real app, this would change the status differently based on the role
            updatedApplication.status = 'pending';
            setSuccessMessage('Application has been recommended for approval');
            break;
          case 'not-recommend':
            // In a real app, this would change the status differently based on the role
            updatedApplication.status = 'pending';
            setSuccessMessage('Application has been marked as not recommended');
            break;
          case 're-enquiry':
            updatedApplication.status = 'pending';
            setSuccessMessage('Application has been marked for re-enquiry');
            break;
        }

        updatedApplication.lastUpdated = new Date().toISOString().split('T')[0];
        setApplication(updatedApplication);
        setIsProcessModalOpen(false);

        // Trigger an immediate sidebar counts refresh so the UI updates
        try {
          refreshCounts(true);
        } catch (e) {
          /* ignore */
        }

        // Navigate to inbox/forwarded after successful processing
        setActiveNavigationPath('/inbox/forwarded');
        await router.push('/inbox/forwarded');
      } catch (error) {
        setErrorMessage('Failed to process application. Please try again.');
        throw error;
      } finally {
        setIsProcessing(false);
      }
    });

    if (result === null) return; // action was blocked as duplicate
  };
  const handleForwardApplication = async (recipient: string, comments: string) => {
    if (!application) return;

    const actionId = `forward-application-${application.id}`;

    const result = await executeAction(actionId, async () => {
      setIsForwarding(true);

      try {
        // In a real app, this would be an API call
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        const updatedApplication = { ...application };
        updatedApplication.forwardedFrom = userRole;
        updatedApplication.forwardedTo = recipient;
        updatedApplication.forwardComments = comments; // Store comments
        updatedApplication.lastUpdated = new Date().toISOString().split('T')[0];

        setApplication(updatedApplication);
        setIsForwardModalOpen(false);
        setSuccessMessage(`Application has been forwarded to ${recipient}`);
        // Trigger an immediate sidebar counts refresh so the UI updates
        try {
          refreshCounts(true);
        } catch (e) {
          /* ignore */
        }

        // Navigate to inbox/forwarded after successful forwarding
        setActiveNavigationPath('/inbox/forwarded');
        await router.push('/inbox/forwarded');
      } catch (error) {
        setErrorMessage('Failed to forward application. Please try again.');
        throw error;
      } finally {
        setIsForwarding(false);
      }
    });

    if (result === null) return; // action was blocked as duplicate
  };

  // Enhanced print function using our PDF utility
  const handleExportPDF = async () => {
    if (!application) return;

    try {
      setIsPrinting(true);
      // Generate and download the PDF
      // TODO: Fix PDF generation with correct ApplicationData interface
      // await generateApplicationPDF(application);
      setSuccessMessage('PDF generation feature temporarily disabled');
    } catch (error) {
      setErrorMessage('Failed to generate PDF. Please try again.');
    } finally {
      setIsPrinting(false);
      setShowPrintOptions(false);
    }
  };

  // Print the redesigned dashboard layout directly
  const handleBrowserPrint = () => {
    // Guard against firing window.print() while the hidden print layout's
    // document/PDF previews are still rendering asynchronously — otherwise the
    // printout can show blank thumbnails for Uploaded Documents/attachments.
    if (!printReady) return;
    window.print();
  };

  // Handle divider drag start
  const handleDividerMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    e.preventDefault();
  };

  // Handle divider dragging
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;

      const container = containerRef.current;
      const rect = container.getBoundingClientRect();
      const newPosition = ((e.clientX - rect.left) / rect.width) * 100;

      // Constrain position between 40% and 80%
      if (newPosition >= 40 && newPosition <= 80) {
        setDividerPosition(newPosition);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const handleProceedingsSuccess = (message?: string) => {
    setShowProceedingsForm(false);
    setSuccessMessage(message || 'Proceedings action completed successfully');

    // Reload the application data to get the latest workflow history
    if (applicationId) {
      getApplicationByApplicationId(applicationId!)
        .then(result => {
          if (result) {
            setApplication(result as ApplicationData);
          }
        })
        .catch(error => {
          // Error reloading application
        });
    }
    // Refresh sidebar counts as proceedings may change bucket counts
    try {
      refreshCounts(true);
    } catch (e) {
      /* ignore */
    }

    // Redirect to inbox/all after successful proceedings action
    setTimeout(() => {
      router.push('/inbox?type=all');
    }, 2000);
  };

  // Show skeleton loading while authenticating or loading data
  if (!initialized || authLoading || loading) {
    return <ApplicationDetailSkeleton />;
  }
  if (!isAuthenticated) {
    // Optionally, you can return null or a redirect message
    return null;
  }

  return (
    <div className='flex flex-col min-h-screen w-full bg-gray-50 font-[family-name:var(--font-geist-sans)]'>
      {/* Use shared Header with breadcrumbs and status badge */}
      <Header
        breadcrumbs={[
          { label: 'Home', onClick: () => router.push('/') },
          { label: isRenewalView ? 'Renewal' : 'Fresh Application' },
          { label: applicationId ? `Application ID: ${applicationId}` : '...' },
        ]}
        applicationTypeLabel={isRenewalView ? 'Renewal' : 'Fresh Application'}
        statusBadge={
          application
            ? {
                label: formatStatusLabel(
                  application.workflowStatus || application.status || application.status_id
                ),
                style: (() => {
                  const style = getStatusStyle(
                    application.workflowStatus?.name ||
                      application.workflowStatus?.code ||
                      application.status ||
                      application.status_id
                  );
                  return {
                    backgroundColor: style.bg,
                    color: style.text,
                    borderColor: style.border,
                  };
                })(),
              }
            : undefined
        }
        hideCreateForm={true}
        hidePrint={true}
      />

      <main className='flex-1 p-6 overflow-y-auto mt-[120px]'>
        <div className='bg-white rounded-lg shadow'>
          {/* Success Message - Fixed Position at Top */}
          {successMessage && (
            <div className='fixed top-4 right-4 z-50 max-w-md animate-slide-in'>
              <div className='p-4 bg-emerald-50 border-2 border-emerald-500 rounded-xl shadow-lg'>
                <div className='flex items-start'>
                  <div className='flex-shrink-0'>
                    <svg
                      className='w-6 h-6 text-emerald-500'
                      fill='currentColor'
                      viewBox='0 0 20 20'
                    >
                      <path
                        fillRule='evenodd'
                        d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
                        clipRule='evenodd'
                      />
                    </svg>
                  </div>
                  <div className='ml-3 flex-1'>
                    <h3 className='text-sm font-bold text-emerald-900'>Success!</h3>
                    <p className='text-sm font-medium text-emerald-800 mt-1'>{successMessage}</p>
                  </div>
                  <button
                    onClick={() => setSuccessMessage(null)}
                    className='ml-3 flex-shrink-0 text-emerald-500 hover:text-emerald-700'
                  >
                    <svg className='w-5 h-5' fill='currentColor' viewBox='0 0 20 20'>
                      <path
                        fillRule='evenodd'
                        d='M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z'
                        clipRule='evenodd'
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Error Message - Fixed Position at Top */}
          {errorMessage && (
            <div className='fixed top-4 right-4 z-50 max-w-md animate-slide-in'>
              <div className='p-4 bg-red-50 border-2 border-red-500 rounded-xl shadow-lg'>
                <div className='flex items-start'>
                  <div className='flex-shrink-0'>
                    <svg className='w-6 h-6 text-red-500' fill='currentColor' viewBox='0 0 20 20'>
                      <path
                        fillRule='evenodd'
                        d='M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z'
                        clipRule='evenodd'
                      />
                    </svg>
                  </div>
                  <div className='ml-3 flex-1'>
                    <h3 className='text-sm font-bold text-red-900'>Error!</h3>
                    <p className='text-sm font-medium text-red-800 mt-1'>{errorMessage}</p>
                  </div>
                  <button
                    onClick={() => setErrorMessage(null)}
                    className='ml-3 flex-shrink-0 text-red-500 hover:text-red-700'
                  >
                    <svg className='w-5 h-5' fill='currentColor' viewBox='0 0 20 20'>
                      <path
                        fillRule='evenodd'
                        d='M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z'
                        clipRule='evenodd'
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {isRenewalView && application && (
          <div className='mb-6'>
            <RenewalApplicationDetailsHeader
              applicationId={application.id}
              renewalId={application.id}
              acknowledgementNo={application.acknowledgementNo}
              licenseId={originalLicenseData?.id ?? rawRenewalData?.licenseId}
              licenseNumber={originalLicenseData?.licenseNumber}
              activeTab={activeTab === 'original' ? 'Original License Details' : 'Renewal Info'}
              onTabChange={handleTabChange}
            />
          </div>
        )}

        {/* Application Content Card */}
        <div
          data-printable='application-card'
          className='bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden avoid-break'
        >
          {(() => {
            return application;
          })() ? (
            <>
              {/* Tab Loading Skeleton — shown when the Origin tab data is being fetched */}
              {isRenewalView && activeTab === 'original' && originalLicenseLoading ? (
                <div className='p-6 lg:p-8 bg-slate-50/30 transition-opacity duration-300 animate-pulse'>
                  {/* Application Information Section Skeleton */}
                  <div className='bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-8'>
                    <div className='flex items-center justify-between border-b border-slate-100 pb-4 mb-6'>
                      <div className='flex items-center gap-3'>
                        <div className='h-10 w-10 rounded-lg bg-gray-200'></div>
                        <div className='h-6 w-48 bg-gray-200 rounded'></div>
                      </div>
                      <div className='flex gap-2'>
                        <div className='h-10 w-32 bg-gray-200 rounded-xl'></div>
                        <div className='h-10 w-32 bg-gray-200 rounded-xl hidden sm:block'></div>
                      </div>
                    </div>
                    <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
                      <div className='lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6'>
                        {[...Array(8)].map((_, i) => (
                          <div key={i} className={`space-y-2 ${i === 0 ? 'md:col-span-2' : ''}`}>
                            <div className='h-4 w-24 bg-gray-200 rounded'></div>
                            <div className='h-5 w-48 max-w-full bg-gray-200 rounded'></div>
                          </div>
                        ))}
                      </div>
                      <div className='space-y-6'>
                        <div className='h-48 w-full bg-gray-200 rounded-2xl'></div>
                        <div className='h-64 w-full bg-gray-200 rounded-2xl'></div>
                      </div>
                    </div>
                  </div>
                  {/* Three-Column Row Skeleton */}
                  <div className='grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8'>
                    {[...Array(3)].map((_, i) => (
                      <div
                        key={i}
                        className='bg-white rounded-xl border border-slate-200 shadow-sm p-5 h-[400px]'
                      >
                        <div className='flex items-center gap-3 mb-6'>
                          <div className='h-10 w-10 rounded-lg bg-gray-200'></div>
                          <div className='h-5 w-32 bg-gray-200 rounded'></div>
                        </div>
                        <div className='space-y-5'>
                          {[...Array(5)].map((_, j) => (
                            <div key={j} className='space-y-2'>
                              <div className='h-3 w-20 bg-gray-200 rounded'></div>
                              <div className='h-4 w-full bg-gray-200 rounded'></div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* Loading indicator */}
                  <div className='flex flex-col items-center justify-center py-8 text-center'>
                    <div className='w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mb-4'></div>
                    <p className='text-sm font-medium text-slate-500'>
                      Loading original license details...
                    </p>
                  </div>
                </div>
              ) : (
                /* Redesigned Sections — normal content */
                (() => {
                  const displayApp = currentDisplayApp;
                  if (!displayApp) return null;
                  const application = displayApp;
                  return (
                    <div className='p-6 lg:p-8 space-y-8 bg-slate-50/30' ref={printRef}>
                      {showFullApplicationDetails && (
                        <>
                          {/* 1. Application Information Section */}
                          <div className='bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 p-6'>
                            <div className='flex items-center justify-between border-b border-slate-100 pb-4 mb-6'>
                              <div className='flex items-center gap-3'>
                                <div className='p-2.5 rounded-lg border border-blue-100 bg-blue-50 text-blue-600'>
                                  <UserRound className='w-5 h-5' />
                                </div>
                                <h3 className='font-bold text-slate-800 text-lg tracking-tight'>
                                  Application Information
                                </h3>
                              </div>
                              <div className='flex gap-2'>
                                <button
                                  type='button'
                                  onClick={handleBrowserPrint}
                                  disabled={!printReady}
                                  className='inline-flex items-center gap-2 px-4 py-2 bg-white text-slate-700 border border-slate-200 rounded-xl shadow-sm text-sm font-semibold hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 print:hidden disabled:opacity-60 disabled:cursor-not-allowed'
                                  title={
                                    printReady
                                      ? 'Print application details'
                                      : 'Preparing document previews for printing…'
                                  }
                                >
                                  <Printer className='w-4.5 h-4.5 text-slate-500' />
                                  {printReady ? 'Print Details' : 'Preparing…'}
                                </button>
                              </div>
                            </div>

                            <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
                              {/* Left 2 columns: Applicant Details */}
                              <div className='lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4'>
                                <DetailItem
                                  label='Full Name'
                                  value={applicantName}
                                  icon={UserRound}
                                  className='md:col-span-2'
                                />
                                {application?.parentOrSpouseName && (
                                  <DetailItem
                                    label='Parent / Spouse Name'
                                    value={application.parentOrSpouseName}
                                    icon={Users}
                                  />
                                )}
                                {application?.sex && (
                                  <DetailItem
                                    label='Gender'
                                    value={formatGender(application.sex)}
                                    icon={UserCheck}
                                  />
                                )}
                                {application?.placeOfBirth && (
                                  <DetailItem
                                    label='Place of Birth'
                                    value={application.placeOfBirth}
                                    icon={MapPin}
                                  />
                                )}
                                {(application?.dateOfBirth || application?.dob) && (
                                  <DetailItem
                                    label='Date of Birth'
                                    value={
                                      application?.dateOfBirth
                                        ? new Date(application.dateOfBirth).toLocaleDateString(
                                            'en-IN',
                                            {
                                              year: 'numeric',
                                              month: 'long',
                                              day: 'numeric',
                                            }
                                          )
                                        : application?.dob
                                          ? new Date(application.dob).toLocaleDateString('en-IN', {
                                              year: 'numeric',
                                              month: 'long',
                                              day: 'numeric',
                                            })
                                          : null
                                    }
                                    icon={CalendarDays}
                                  />
                                )}
                                {application?.panNumber && (
                                  <DetailItem
                                    label='PAN Number'
                                    value={application.panNumber}
                                    icon={CreditCard}
                                    mono
                                  />
                                )}
                                {application?.aadharNumber && (
                                  <DetailItem
                                    label='Aadhar Number'
                                    value={application.aadharNumber}
                                    icon={Fingerprint}
                                    mono
                                  />
                                )}
                                {application?.acknowledgementNo && (
                                  <DetailItem
                                    label='Acknowledgement Number'
                                    value={application.acknowledgementNo}
                                    icon={FileCheck}
                                    mono
                                  />
                                )}
                                {application?.currentUser && (
                                  <DetailItem
                                    label='Current User'
                                    value={application.currentUser.username}
                                    icon={UserCog}
                                  />
                                )}
                                {application?.workflowStatus && (
                                  <DetailItem
                                    label='Workflow Status'
                                    value={<StatusBadge status={application.workflowStatus} />}
                                    icon={BadgeCheck}
                                  />
                                )}
                                <DetailItem
                                  label='Application Type'
                                  value={
                                    <StatusBadge
                                      status={application?.applicationType || 'N/A'}
                                      label={formatApplicationType(application?.applicationType)}
                                    />
                                  }
                                  icon={Clock3}
                                />
                                {application?.applicationDate && (
                                  <DetailItem
                                    label='Date & Time of Submission'
                                    value={new Date(application.applicationDate).toLocaleString(
                                      'en-IN',
                                      {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                      }
                                    )}
                                    icon={CalendarDays}
                                    className='md:col-span-2'
                                  />
                                )}
                              </div>

                              {/* Right column: Photo & Quick Summary */}
                              <div>
                                <SummaryCard
                                  application={
                                    isRenewalView &&
                                    activeTab === 'original' &&
                                    originDocuments?.length
                                      ? { ...application, documents: originDocuments }
                                      : application
                                  }
                                  applicationId={applicationId}
                                  applicantName={applicantName}
                                />
                                <div className='bg-slate-50/50 rounded-2xl border border-slate-100 p-6 overflow-hidden relative group'>
                                  <div className='absolute inset-0 bg-gradient-to-br from-blue-50/50 to-emerald-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none'></div>
                                  <div className='relative z-10'>
                                    <LazySection minHeight='400px'>
                                      <EnhancedApplicationTimeline
                                        application={application!}
                                        workflowHistory={
                                          activeTab === 'original'
                                            ? application.workflowHistories || []
                                            : workflowHistory
                                        }
                                      />
                                    </LazySection>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </>
                      )}

                      {showFullApplicationDetails && (
                        <>
                          {/* 2. Three-Column Row: License Details, License History, Criminal History */}
                          <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
                            {/* License Details Card */}
                            {(() => {
                              const license = (licenseDetails[0] || {}) as any;
                              const requestedWeapons = Array.isArray(license?.requestedWeapons)
                                ? license.requestedWeapons
                                : license?.requestedWeaponIds;
                              const weaponsLabel = Array.isArray(requestedWeapons)
                                ? requestedWeapons
                                    .map((w: any) =>
                                      typeof w === 'object' ? w?.name || w?.type || w?.id : w
                                    )
                                    .filter(Boolean)
                                    .join(', ')
                                : '';
                              const evidenceFiles =
                                license?.uploadedFiles || license?.specialClaimsEvidence || [];
                              const normalizedEvidence = Array.isArray(evidenceFiles)
                                ? evidenceFiles.filter(Boolean)
                                : [];

                              return (
                                <SectionCard
                                  title='License Details'
                                  icon={Shield}
                                  iconColorClass='text-blue-600 bg-blue-50 border-blue-100'
                                >
                                  <div className='space-y-4 flex-1'>
                                    <DetailItem
                                      label='Need for License'
                                      value={license.needForLicense}
                                      icon={Target}
                                    />
                                    <DetailItem
                                      label='Arms Category'
                                      value={license.armsCategory}
                                      icon={ShieldCheck}
                                    />
                                    <DetailItem
                                      label='Requested Weapons'
                                      value={weaponsLabel}
                                      icon={Crosshair}
                                    />
                                    <DetailItem
                                      label='Area of Validity'
                                      value={license.areaOfValidity}
                                      icon={MapPin}
                                    />
                                    <DetailItem
                                      label='Licence Place / Area'
                                      value={license.licencePlaceArea}
                                      icon={LocateFixed}
                                    />
                                    <DetailItem
                                      label='Ammunition Description'
                                      value={license.ammunitionDescription}
                                      icon={Package}
                                    />
                                    <DetailItem
                                      label='Special Consideration Reason'
                                      value={license.specialConsiderationReason}
                                      icon={FileText}
                                    />
                                    {license.wildBeastsSpecification && (
                                      <DetailItem
                                        label='Wild Beasts Specification'
                                        value={license.wildBeastsSpecification}
                                        icon={FileText}
                                      />
                                    )}

                                    {normalizedEvidence.length > 0 && (
                                      <div className='mt-4 pt-4 border-t border-slate-100'>
                                        <p className='text-xs font-bold uppercase tracking-wider text-slate-400 mb-2'>
                                          Evidence / Attachments
                                        </p>
                                        <div className='flex flex-wrap gap-2'>
                                          {normalizedEvidence.map((file: any, fileIdx: number) => {
                                            const fileLabel = truncateFilename(
                                              file?.name ||
                                                file?.fileName ||
                                                file?.originalName ||
                                                'File',
                                              10
                                            );
                                            return (
                                              <button
                                                key={fileIdx}
                                                type='button'
                                                onClick={() => openAttachment(file)}
                                                className='inline-flex items-center gap-2 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-blue-600 font-semibold hover:bg-blue-50 transition-colors'
                                                title={
                                                  file?.name || file?.fileName || file?.originalName
                                                }
                                              >
                                                <FileText className='w-3.5 h-3.5 text-rose-500' />
                                                <span className='truncate max-w-[120px]'>
                                                  {fileLabel}
                                                </span>
                                              </button>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </SectionCard>
                              );
                            })()}

                            {/* License History Card */}
                            {(() => {
                              const history = ((application?.licenseHistories &&
                                application.licenseHistories[0]) ||
                                {}) as any;
                              return (
                                <SectionCard
                                  title='License History'
                                  icon={History}
                                  iconColorClass='text-amber-600 bg-amber-50 border-amber-100'
                                >
                                  <div className='space-y-4 flex-1'>
                                    <DetailItem
                                      label='Previously Applied'
                                      value={
                                        history.hasAppliedBefore !== undefined
                                          ? history.hasAppliedBefore
                                            ? 'Yes'
                                            : 'No'
                                          : null
                                      }
                                      icon={ClipboardCheck}
                                    />
                                    <DetailItem
                                      label='Previous Result'
                                      value={history.previousResult}
                                      icon={BadgeCheck}
                                    />
                                    <DetailItem
                                      label='Previous Authority'
                                      value={history.previousAuthorityName}
                                      icon={Building2}
                                    />
                                    <DetailItem
                                      label='License Suspended'
                                      value={
                                        history.hasLicenceSuspended !== undefined
                                          ? history.hasLicenceSuspended
                                            ? 'Yes'
                                            : 'No'
                                          : null
                                      }
                                      icon={ShieldAlert}
                                    />
                                    <DetailItem
                                      label='Suspension Reason'
                                      value={history.suspensionReason}
                                      icon={AlertTriangle}
                                    />
                                    <DetailItem
                                      label='Family License'
                                      value={
                                        history.hasFamilyLicence !== undefined
                                          ? history.hasFamilyLicence
                                            ? 'Yes'
                                            : 'No'
                                          : null
                                      }
                                      icon={Users}
                                    />
                                    <DetailItem
                                      label='Family Member Name'
                                      value={history.familyMemberName}
                                      icon={UserRound}
                                    />
                                    <DetailItem
                                      label='Family License Number'
                                      value={history.familyLicenceNumber}
                                      icon={ShieldCheck}
                                    />
                                  </div>
                                </SectionCard>
                              );
                            })()}

                            {/* Criminal History Card */}
                            {(() => {
                              const criminal = ((application?.criminalHistories &&
                                application.criminalHistories[0]) ||
                                {}) as any;
                              return (
                                <SectionCard
                                  title='Criminal History'
                                  icon={TriangleAlert}
                                  iconColorClass='text-red-600 bg-red-50 border-red-100'
                                >
                                  <div className='space-y-4 flex-1'>
                                    <DetailItem
                                      label='Convicted'
                                      value={
                                        criminal.isConvicted !== undefined
                                          ? criminal.isConvicted
                                            ? 'Yes'
                                            : 'No'
                                          : null
                                      }
                                      icon={Ban}
                                    />
                                    <DetailItem
                                      label='Bond Executed'
                                      value={
                                        criminal.isBondExecuted !== undefined
                                          ? criminal.isBondExecuted
                                            ? 'Yes'
                                            : 'No'
                                          : null
                                      }
                                      icon={FileWarning}
                                    />
                                    <DetailItem
                                      label='Bond Date'
                                      value={
                                        criminal.bondDate
                                          ? new Date(criminal.bondDate).toLocaleDateString('en-IN')
                                          : null
                                      }
                                      icon={Calendar}
                                    />
                                    <DetailItem
                                      label='Prohibited'
                                      value={
                                        criminal.isProhibited !== undefined
                                          ? criminal.isProhibited
                                            ? 'Yes'
                                            : 'No'
                                          : null
                                      }
                                      icon={Scale}
                                    />

                                    {criminal.firDetails && criminal.firDetails.length > 0 && (
                                      <div className='mt-4 pt-4 border-t border-slate-100'>
                                        <h4 className='text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5'>
                                          <FileSearch className='w-3.5 h-3.5' />
                                          FIR Details
                                        </h4>
                                        <div className='space-y-3'>
                                          {criminal.firDetails.map((fir: any, firIdx: number) => (
                                            <div
                                              key={firIdx}
                                              className='bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs space-y-2'
                                            >
                                              <div className='grid grid-cols-2 gap-2'>
                                                <div>
                                                  <span className='text-slate-400 font-semibold uppercase block'>
                                                    FIR Number
                                                  </span>
                                                  <span className='font-bold text-slate-700'>
                                                    {fir.firNumber || '—'}
                                                  </span>
                                                </div>
                                                <div>
                                                  <span className='text-slate-400 font-semibold uppercase block'>
                                                    District
                                                  </span>
                                                  <span className='font-bold text-slate-700'>
                                                    {fir.District || '—'}
                                                  </span>
                                                </div>
                                                <div>
                                                  <span className='text-slate-400 font-semibold uppercase block'>
                                                    Police Station
                                                  </span>
                                                  <span className='font-bold text-slate-700'>
                                                    {fir.policeStation || '—'}
                                                  </span>
                                                </div>
                                                <div>
                                                  <span className='text-slate-400 font-semibold uppercase block'>
                                                    Under Section
                                                  </span>
                                                  <span className='font-bold text-slate-700'>
                                                    {fir.underSection || '—'}
                                                  </span>
                                                </div>
                                              </div>
                                              {fir.offence && (
                                                <div>
                                                  <span className='text-slate-400 font-semibold uppercase block'>
                                                    Offence
                                                  </span>
                                                  <span className='font-medium text-slate-700'>
                                                    {fir.offence}
                                                  </span>
                                                </div>
                                              )}
                                              {fir.DateOfSentence && (
                                                <div>
                                                  <span className='text-slate-400 font-semibold uppercase block'>
                                                    Sentence Date
                                                  </span>
                                                  <span className='font-medium text-slate-700'>
                                                    {fir.DateOfSentence}
                                                  </span>
                                                </div>
                                              )}
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </SectionCard>
                              );
                            })()}
                          </div>
                        </>
                      )}

                      {showFullApplicationDetails && (
                        <>
                          {/* 3. Three-Column Address Row: Present, Permanent, Occupation */}
                          <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
                            {/* Present Address Details */}
                            {(() => {
                              const present = (application?.presentAddress || {}) as any;
                              const presentState =
                                typeof present.state === 'object'
                                  ? present.state?.name
                                  : present.state;
                              const presentDistrict =
                                typeof present.district === 'object'
                                  ? present.district?.name
                                  : present.district;

                              return (
                                <SectionCard
                                  title='Present Address Details'
                                  icon={MapPin}
                                  iconColorClass='text-purple-600 bg-purple-50 border-purple-100'
                                >
                                  <div className='space-y-4 flex-1'>
                                    <DetailItem
                                      label='Address'
                                      value={present.addressLine}
                                      icon={Building}
                                    />
                                    <DetailItem
                                      label='State'
                                      value={presentState}
                                      icon={Landmark}
                                    />
                                    <DetailItem
                                      label='District'
                                      value={presentDistrict}
                                      icon={Building2}
                                    />
                                    <DetailItem
                                      label='Zone'
                                      value={present.zone?.name}
                                      icon={MapPin}
                                    />
                                    <DetailItem
                                      label='Division'
                                      value={present.division?.name}
                                      icon={MapPin}
                                    />
                                    <DetailItem
                                      label='Police Station'
                                      value={present.policeStation?.name}
                                      icon={Building2}
                                    />
                                    <DetailItem
                                      label='Residing Since'
                                      value={
                                        present.sinceResiding
                                          ? new Date(present.sinceResiding).toLocaleDateString(
                                              'en-IN',
                                              {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric',
                                              }
                                            )
                                          : null
                                      }
                                      icon={Calendar}
                                    />
                                  </div>
                                </SectionCard>
                              );
                            })()}

                            {/* Permanent Address Details */}
                            {(() => {
                              const permanent = (application?.permanentAddress || {}) as any;
                              const permanentState =
                                typeof permanent.state === 'object'
                                  ? permanent.state?.name
                                  : permanent.state;
                              const permanentDistrict =
                                typeof permanent.district === 'object'
                                  ? permanent.district?.name
                                  : permanent.district;

                              return (
                                <SectionCard
                                  title='Permanent Address Details'
                                  icon={MapPin}
                                  iconColorClass='text-indigo-600 bg-indigo-50 border-indigo-100'
                                >
                                  <div className='space-y-4 flex-1'>
                                    <DetailItem
                                      label='Address'
                                      value={permanent.addressLine}
                                      icon={Building}
                                    />
                                    <DetailItem
                                      label='State'
                                      value={permanentState}
                                      icon={Landmark}
                                    />
                                    <DetailItem
                                      label='District'
                                      value={permanentDistrict}
                                      icon={Building2}
                                    />
                                    <DetailItem
                                      label='Zone'
                                      value={permanent.zone?.name}
                                      icon={MapPin}
                                    />
                                    <DetailItem
                                      label='Division'
                                      value={permanent.division?.name}
                                      icon={MapPin}
                                    />
                                    <DetailItem
                                      label='Police Station'
                                      value={permanent.policeStation?.name}
                                      icon={Building2}
                                    />
                                    <DetailItem
                                      label='Residing Since'
                                      value={
                                        permanent.sinceResiding
                                          ? new Date(permanent.sinceResiding).toLocaleDateString(
                                              'en-IN',
                                              { year: 'numeric', month: 'long', day: 'numeric' }
                                            )
                                          : null
                                      }
                                      icon={Calendar}
                                    />
                                  </div>
                                </SectionCard>
                              );
                            })()}

                            {/* Occupation & Business Details */}
                            {(() => {
                              const occ = (application?.occupationAndBusiness || {}) as any;
                              return (
                                <SectionCard
                                  title='Occupation & Business Details'
                                  icon={BriefcaseBusiness}
                                  iconColorClass='text-teal-600 bg-teal-50 border-teal-100'
                                >
                                  <div className='space-y-4 flex-1'>
                                    <DetailItem
                                      label='Occupation'
                                      value={occ.occupation}
                                      icon={BriefcaseBusiness}
                                    />
                                    <DetailItem
                                      label='Office Address'
                                      value={occ.officeAddress}
                                      icon={Building}
                                    />
                                    <DetailItem
                                      label='State'
                                      value={occ.state?.name}
                                      icon={Landmark}
                                    />
                                    <DetailItem
                                      label='District'
                                      value={occ.district?.name}
                                      icon={Building2}
                                    />
                                    <DetailItem
                                      label='Crop Location'
                                      value={occ.cropLocation}
                                      icon={MapPinned}
                                    />
                                    <DetailItem
                                      label='Area Under Cultivation'
                                      value={occ.areaUnderCultivation}
                                      icon={Building}
                                    />
                                  </div>
                                </SectionCard>
                              );
                            })()}
                          </div>
                        </>
                      )}

                      {/* License Record Section — shown when license data exists */}
                      {showFullApplicationDetails && licenseData && (
                        <div className='bg-white rounded-xl border-2 border-emerald-200 shadow-sm hover:shadow-md transition-all duration-300 p-6'>
                          <div className='flex items-center justify-between border-b border-emerald-100 pb-4 mb-6'>
                            <div className='flex items-center gap-3'>
                              <div className='p-2.5 rounded-lg border border-emerald-100 bg-emerald-50 text-emerald-600'>
                                <BadgeCheck className='w-5 h-5' />
                              </div>
                              <h3 className='font-bold text-slate-800 text-lg tracking-tight'>
                                License Record
                              </h3>
                            </div>
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                                licenseData.status === 'ACTIVE'
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : licenseData.status === 'EXPIRED'
                                    ? 'bg-red-100 text-red-700'
                                    : licenseData.status === 'CANCELLED'
                                      ? 'bg-slate-100 text-slate-700'
                                      : licenseData.status === 'SUSPENDED'
                                        ? 'bg-amber-100 text-amber-700'
                                        : 'bg-rose-100 text-rose-700'
                              }`}
                            >
                              {licenseData.status}
                            </span>
                          </div>
                          <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
                            <div className='space-y-4'>
                              <DetailItem
                                label='License Number'
                                value={licenseData.licenseNumber}
                                icon={FileCheck}
                                mono
                              />
                              <DetailItem
                                label='Arms Category'
                                value={licenseData.armsCategory}
                                icon={Shield}
                              />
                              <DetailItem
                                label='Area of Validity'
                                value={licenseData.areaOfValidity}
                                icon={MapPin}
                              />
                              <DetailItem
                                label='Valid From'
                                value={
                                  licenseData.validFrom
                                    ? new Date(licenseData.validFrom).toLocaleDateString('en-IN', {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric',
                                      })
                                    : null
                                }
                                icon={Calendar}
                              />
                              <DetailItem
                                label='Valid Till'
                                value={
                                  licenseData.validTill
                                    ? new Date(licenseData.validTill).toLocaleDateString('en-IN', {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric',
                                      })
                                    : null
                                }
                                icon={Calendar}
                              />
                            </div>
                            <div className='space-y-4'>
                              <DetailItem
                                label='Issue Date'
                                value={
                                  licenseData.issueDate
                                    ? new Date(licenseData.issueDate).toLocaleDateString('en-IN', {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric',
                                      })
                                    : null
                                }
                                icon={CalendarDays}
                              />
                              <DetailItem
                                label='Last Renewed'
                                value={
                                  licenseData.lastRenewedDate
                                    ? new Date(licenseData.lastRenewedDate).toLocaleDateString(
                                        'en-IN',
                                        { year: 'numeric', month: 'short', day: 'numeric' }
                                      )
                                    : null
                                }
                                icon={History}
                              />
                              <DetailItem
                                label='Renewal Count'
                                value={licenseData.renewalCount?.toString() || '0'}
                                icon={ClipboardCheck}
                              />
                              <DetailItem
                                label='Ammunition Description'
                                value={licenseData.ammunitionDescription}
                                icon={Package}
                              />
                              {licenseData.cancellationReason && (
                                <DetailItem
                                  label='Cancellation Reason'
                                  value={licenseData.cancellationReason}
                                  icon={Ban}
                                />
                              )}
                            </div>
                            <div className='space-y-4'>
                              {licenseData.endorsedWeapons &&
                                licenseData.endorsedWeapons.length > 0 && (
                                  <div>
                                    <p className='text-xs font-bold uppercase tracking-wider text-slate-400 mb-2'>
                                      Endorsed Weapons
                                    </p>
                                    <div className='flex flex-wrap gap-2'>
                                      {licenseData.endorsedWeapons.map((w: any, wi: number) => (
                                        <span
                                          key={wi}
                                          className='inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700'
                                        >
                                          <Crosshair className='w-3 h-3 text-blue-500' />
                                          {w.name}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              {licenseData.issuedByUser && (
                                <DetailItem
                                  label='Issued By'
                                  value={licenseData.issuedByUser.username}
                                  icon={UserCog}
                                />
                              )}
                              {licenseData.qrCodeUrl && (
                                <div className='mt-2'>
                                  <button
                                    type='button'
                                    onClick={() => window.open(licenseData.qrCodeUrl!, '_blank')}
                                    className='inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg text-xs font-semibold text-blue-700 hover:bg-blue-100 transition-colors'
                                  >
                                    <Eye className='w-3.5 h-3.5' />
                                    View QR Code
                                  </button>
                                </div>
                              )}
                              {licenseData.pdfUrl && (
                                <div className='mt-2'>
                                  <button
                                    type='button'
                                    onClick={() => window.open(licenseData.pdfUrl!, '_blank')}
                                    className='inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors'
                                  >
                                    <Download className='w-3.5 h-3.5' />
                                    Download License PDF
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* License Workflow History */}
                          {licenseData.workflowHistories &&
                            licenseData.workflowHistories.length > 0 && (
                              <div className='mt-6 pt-4 border-t border-emerald-100'>
                                <h4 className='text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5'>
                                  <History className='w-3.5 h-3.5' />
                                  License Workflow Timeline
                                </h4>
                                <div className='space-y-2'>
                                  {licenseData.workflowHistories.map((wh: any, whIdx: number) => (
                                    <div
                                      key={whIdx}
                                      className='flex items-center gap-3 p-2.5 bg-slate-50 border border-slate-100 rounded-lg text-xs'
                                    >
                                      <div
                                        className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                          wh.action === 'ISSUED'
                                            ? 'bg-emerald-500'
                                            : wh.action === 'RENEWED'
                                              ? 'bg-blue-500'
                                              : wh.action === 'CANCELLED'
                                                ? 'bg-red-500'
                                                : 'bg-slate-400'
                                        }`}
                                      />
                                      <span className='font-bold text-slate-700 uppercase'>
                                        {wh.action}
                                      </span>
                                      {wh.changedByUser && (
                                        <span className='text-slate-500'>
                                          by {wh.changedByUser.username}
                                        </span>
                                      )}
                                      {wh.createdAt && (
                                        <span className='text-slate-400 ml-auto'>
                                          {new Date(wh.createdAt).toLocaleString('en-IN', {
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                          })}
                                        </span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                        </div>
                      )}

                      {/* Loading indicator for license data */}
                      {licenseLoading && !licenseData && (
                        <div className='bg-white rounded-xl border border-slate-200 shadow-sm p-6'>
                          <div className='flex items-center gap-3 text-slate-400'>
                            <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500'></div>
                            <span className='text-sm'>Checking license records...</span>
                          </div>
                        </div>
                      )}

                      {/* Additional Status-Specific Information */}
                      {(application?.returnReason ||
                        application?.flagReason ||
                        application?.disposalReason) && (
                        <div className='bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4'>
                          <h3 className='text-base font-bold text-slate-800 flex items-center gap-2 mb-2'>
                            <div className='w-1 h-5 bg-orange-500 rounded-full'></div>
                            Additional Information
                          </h3>

                          {application.returnReason && (
                            <div className='p-4 bg-orange-50/50 border border-orange-200 rounded-xl'>
                              <h4 className='font-bold text-orange-800 text-sm mb-1.5 flex items-center gap-2'>
                                <AlertTriangle className='w-4 h-4 text-orange-600' />
                                Return Reason
                              </h4>
                              <p className='text-slate-700 text-sm font-medium'>
                                {application.returnReason}
                              </p>
                            </div>
                          )}

                          {application.flagReason && (
                            <div className='p-4 bg-rose-50/50 border border-rose-200 rounded-xl'>
                              <h4 className='font-bold text-rose-800 text-sm mb-1.5 flex items-center gap-2'>
                                <AlertTriangle className='w-4 h-4 text-rose-600' />
                                Red Flag Reason
                              </h4>
                              <p className='text-slate-700 text-sm font-medium'>
                                {application.flagReason}
                              </p>
                            </div>
                          )}

                          {application.disposalReason && (
                            <div className='p-4 bg-slate-50 border border-slate-200 rounded-xl'>
                              <h4 className='font-bold text-slate-800 text-sm mb-1.5 flex items-center gap-2'>
                                <AlertTriangle className='w-4 h-4 text-slate-600' />
                                Disposal Reason
                              </h4>
                              <p className='text-slate-700 text-sm font-medium'>
                                {application.disposalReason}
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      {showFullApplicationDetails && (
                        <>
                          {/* 4. Uploaded Documents Section */}
                          <div className='bg-white rounded-xl border border-slate-200 shadow-sm p-6'>
                            <h3 className='text-base font-bold text-slate-800 flex items-center gap-2 mb-6'>
                              <div className='w-1 h-5 bg-emerald-500 rounded-full'></div>
                              Uploaded Documents
                            </h3>
                            <LazySection minHeight='250px'>
                              {isRenewalView && activeTab === 'original' ? (
                                originDocumentsLoading ? (
                                  <div className='flex flex-col items-center justify-center py-12 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200'>
                                    <div className='w-8 h-8 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin mb-3'></div>
                                    <p className='text-slate-500 text-sm font-semibold'>
                                      Loading origin documents...
                                    </p>
                                  </div>
                                ) : (
                                  <DocumentTable documents={originDocuments} />
                                )
                              ) : (
                                <DocumentTable documents={application?.documents || []} />
                              )}
                            </LazySection>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })()
              )}

              {/* Action Buttons and Timeline Section - Show if NOT Draft OR if Renewal */}
              {(application?.workflowStatus?.name?.toLowerCase() !== 'draft' || isRenewalView) && (
                <div className='p-6 lg:p-8 border-t border-gray-100 bg-white overflow-hidden print:hidden'>
                  <div
                    ref={containerRef}
                    className='flex h-[600px] items-stretch gap-0 relative w-full overflow-hidden'
                    style={{
                      display: 'flex',
                    }}
                  >
                    {/* Action Buttons - Full Width Editor (2 columns) - Hidden on License Tab */}
                    {!(isRenewalView && activeTab === 'original') && (
                      <div
                        className='flex flex-col h-full overflow-hidden pr-4'
                        style={{
                          width: `${dividerPosition}%`,
                          transition: isDragging ? 'none' : 'width 0.1s ease',
                        }}
                      >
                        <div className='flex items-center justify-between mb-4'>
                          <div>
                            <h3 className='text-2xl font-bold text-gray-900 flex items-center'>
                              <div className='w-1 h-6 bg-blue-600 rounded-full mr-3'></div>
                              Application Processing
                            </h3>
                          </div>
                        </div>
                        <div className='flex flex-col gap-4 flex-1 overflow-hidden'>
                          {(() => {
                            // Determine which application to use based on active tab
                            const displayApp: ApplicationData | null =
                              isRenewalView && activeTab === 'original'
                                ? (originalLicenseData as unknown as ApplicationData)
                                : application;
                            const displayAppId =
                              isRenewalView && activeTab === 'original'
                                ? originalLicenseData?.id
                                : applicationId;
                            const isLoading =
                              isRenewalView && activeTab === 'original' && originalLicenseLoading;
                            const isNotAvailable =
                              isRenewalView &&
                              activeTab === 'original' &&
                              !originalLicenseLoading &&
                              !originalLicenseData;

                            // If on license tab and still loading, show loading state
                            if (isLoading) {
                              return (
                                <div className='bg-white rounded-xl border border-gray-200 shadow-sm h-full overflow-hidden flex flex-col items-center justify-center'>
                                  <div className='flex flex-col items-center gap-3'>
                                    <div className='w-8 h-8 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin'></div>
                                    <p className='text-sm text-gray-600'>Loading License...</p>
                                  </div>
                                </div>
                              );
                            }

                            // If on license tab and license not available, show message
                            if (isNotAvailable) {
                              return (
                                <div className='bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded-lg shadow-sm'>
                                  <div className='flex items-start'>
                                    <svg
                                      className='w-6 h-6 text-yellow-600 mr-3 flex-shrink-0 mt-0.5'
                                      fill='none'
                                      stroke='currentColor'
                                      viewBox='0 0 24 24'
                                    >
                                      <path
                                        strokeLinecap='round'
                                        strokeLinejoin='round'
                                        strokeWidth={2}
                                        d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
                                      />
                                    </svg>
                                    <div>
                                      <h4 className='text-lg font-semibold text-yellow-800 mb-2'>
                                        License Details Not Available
                                      </h4>
                                      <p className='text-sm text-yellow-700'>
                                        The fresh application details could not be loaded. Please
                                        check if the application ID is correct.
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              );
                            }

                            // Read `user_data` from cookies
                            let user_data: any = null;
                            try {
                              if (typeof document !== 'undefined' && document.cookie) {
                                const cookie = document.cookie
                                  .split(';')
                                  .map(c => c.trim())
                                  .find(c => c.startsWith('user='));
                                if (cookie) {
                                  const raw = cookie.split('=')[1] || '';
                                  const decoded = decodeURIComponent(raw);
                                  user_data = decoded ? JSON.parse(decoded) : null;
                                }
                              }
                            } catch (e) {
                              user_data = null;
                            }

                            const currentUserId = user_data?.id
                              ? Number(user_data.id)
                              : user?.id
                                ? Number(user.id)
                                : null;
                            const applicationUserId = Number(displayApp?.currentUser?.id) || null;
                            // Check for final/closed status first — if final, show only a status message
                            const finalStatuses = ['APPROVED', 'REJECTED', 'CANCELLED', 'DISPOSED', 'EXPIRED'];
                            const rawStatusCode = displayApp?.workflowStatus?.code || displayApp?.status || '';
                            const rawStatusName = displayApp?.workflowStatus?.name || rawStatusCode;
                            const isFinalStatus = finalStatuses.some(s => 
                              String(rawStatusCode).toUpperCase() === s || 
                              String(rawStatusName).toUpperCase() === s
                            );
                            if (isFinalStatus) {
                              const displayStatus = String(rawStatusName).charAt(0).toUpperCase() + String(rawStatusName).slice(1).toLowerCase();
                              return (
                                <div className='bg-amber-50 border-2 border-amber-400 rounded-xl p-4 flex items-start gap-3 shadow-sm'>
                                  <div className='p-1.5 rounded-full bg-amber-100 text-amber-600 flex-shrink-0'>
                                    <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' />
                                    </svg>
                                  </div>
                                  <div>
                                    <p className='text-sm font-semibold text-amber-900'>
                                      Your application has been <span className='uppercase font-bold'>{displayStatus}</span>. No further processing is allowed.
                                    </p>
                                  </div>
                                </div>
                              );
                            }

                            const statusName = (
                              displayApp?.workflowStatus?.name || ''
                            ).toLowerCase();
                            const statusId = Number(
                              displayApp?.status_id || displayApp?.workflowStatus?.id
                            );
                            const isClosed = statusName === 'closed' || statusId === 10;

                            const canTakeAction =
                              currentUserId &&
                              applicationUserId &&
                              currentUserId == applicationUserId &&
                              !isClosed;

                            return canTakeAction ? (
                              <>
                                {/* Proceedings Form - Always Open */}
                                <div className='bg-white rounded-xl border border-gray-200 shadow-sm h-full overflow-hidden flex flex-col'>
                                  <div className='p-2 bg-gray-50 flex-1 overflow-auto'>
                                    <div className='p-2 h-full'>
                                      <ProceedingsForm
                                        applicationId={String(displayAppId)}
                                        onSuccess={handleProceedingsSuccess}
                                        userRole={userRole}
                                        applicationData={displayApp || undefined}
                                      />
                                    </div>
                                  </div>
                                </div>
                              </>
                            ) : (
                              /* Show message if user is not authorized */
                              <div className='bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded-lg shadow-sm'>
                                <div className='flex items-start'>
                                  <svg
                                    className='w-6 h-6 text-yellow-600 mr-3 flex-shrink-0 mt-0.5'
                                    fill='none'
                                    stroke='currentColor'
                                    viewBox='0 0 24 24'
                                  >
                                    <path
                                      strokeLinecap='round'
                                      strokeLinejoin='round'
                                      strokeWidth={2}
                                      d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
                                    />
                                  </svg>
                                  <div>
                                    <h4 className='text-lg font-semibold text-yellow-800 mb-2'>
                                      {isClosed ? 'Application Closed' : 'Action Not Available'}
                                    </h4>
                                    <p className='text-sm text-yellow-700 leading-relaxed'>
                                      {isClosed
                                        ? 'This application has been closed. No further actions can be taken on it.'
                                        : 'At this point, you cannot take action on this request. This application is currently assigned to another user.'}
                                    </p>
                                    {!isClosed && displayApp?.currentUser && (
                                      <p className='text-sm text-yellow-700 mt-2'>
                                        <span className='font-medium'>Current handler:</span>{' '}
                                        {displayApp.currentUser.username}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    )}

                    {/* Resizable Divider - Hidden on License Tab */}
                    {!(isRenewalView && activeTab === 'original') && (
                      <div
                        ref={dividerRef}
                        onMouseDown={handleDividerMouseDown}
                        className='w-1 bg-gradient-to-b from-transparent via-gray-300 to-transparent hover:bg-gradient-to-b hover:from-transparent hover:via-blue-400 hover:to-transparent cursor-col-resize transition-all duration-200 group relative'
                        style={{
                          cursor: 'col-resize',
                          userSelect: 'none',
                        }}
                      >
                        {/* Hover indicator */}
                        <div className='absolute inset-y-0 -left-1 -right-1 group-hover:bg-blue-400/10 transition-colors duration-200'></div>
                      </div>
                    )}

                    {/* Application Timeline/History - Right Side with Scroll */}
                    <div
                      className={`flex flex-col h-full overflow-hidden ${isRenewalView && activeTab === 'original' ? '' : 'pl-4'}`}
                      style={{
                        width:
                          isRenewalView && activeTab === 'original'
                            ? '100%'
                            : `${100 - dividerPosition}%`,
                        transition: isDragging ? 'none' : 'width 0.1s ease',
                      }}
                    >
                      <div className='flex items-center justify-between mb-4'>
                        <h3 className='text-lg font-semibold text-gray-900 flex items-center'>
                          <div className='w-1 h-5 bg-green-600 rounded-full mr-3'></div>
                          Application History
                        </h3>
                      </div>

                      <div className='flex-1 bg-white rounded-xl border border-gray-200 shadow-sm h-full overflow-hidden'>
                        <div className='overflow-y-auto p-6 custom-scrollbar h-full'>
                          {isRenewalView && activeTab === 'original' && originalLicenseLoading ? (
                            <div className='flex flex-col items-center justify-center h-full'>
                              <div className='w-8 h-8 border-4 border-green-100 border-t-green-600 rounded-full animate-spin mb-3'></div>
                              <p className='text-sm text-gray-600'>Loading license history...</p>
                            </div>
                          ) : null}
                          {(() => {
                            // Use the Workflow History API response (from the Original License's
                            // sourceApplicationId + lastModifiedAppType) when on the original tab,
                            // otherwise use the renewal application's workflow history.
                            const historyToShow =
                              isRenewalView && activeTab === 'original'
                                ? originalLicenseHistory
                                : application?.workflowHistories;
                            const expandedHistoryMap =
                              isRenewalView && activeTab === 'original'
                                ? expandedHistory
                                : expandedHistory;
                            const setExpandedHistoryMap =
                              isRenewalView && activeTab === 'original'
                                ? setExpandedHistory
                                : setExpandedHistory;

                            return historyToShow && historyToShow.length > 0 ? (
                              <div className='space-y-5'>
                                {historyToShow.map((h, idx) => {
                                  const actionTaken =
                                    h?.actionTaken || (h as any)?.action || 'Unknown Action';
                                  const statusStyle = getStatusStyle(actionTaken);
                                  const borderColor = statusStyle.border;
                                  const backgroundColor = hexToRgba(borderColor, 0.05);
                                  const attachmentsArr = h.attachments || [];
                                  const hasAttachments =
                                    Array.isArray(attachmentsArr) && attachmentsArr.length > 0;
                                  const hasRemarks = !!(h.remarks || (h as any).comment);
                                  const hasDetails = hasAttachments || hasRemarks;
                                  const createdAt =
                                    h.createdAt || (h as any).date || (h as any).timestamp;
                                  const isExpanded = !!expandedHistoryMap[idx];
                                  const historyDate = createdAt ? new Date(createdAt) : new Date();
                                  const formattedDate = historyDate.toLocaleDateString('en-IN', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                  });
                                  const formattedTime = historyDate.toLocaleTimeString('en-IN', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  });

                                  // Extract user and role names from nested objects
                                  const previousUserName =
                                    (h as any).previousUserName ||
                                    (h as any).previousUser?.username ||
                                    'Unknown User';
                                  const previousRoleName =
                                    (h as any).previousRoleName ||
                                    (h as any).previousRole?.name ||
                                    'Role';
                                  const nextUserName =
                                    (h as any).nextUserName || (h as any).nextUser?.username;
                                  const nextRoleName =
                                    (h as any).nextRoleName || (h as any).nextRole?.name;

                                  return (
                                    <div
                                      key={h.id}
                                      className='border-l-4 pl-4 pr-4 py-3 rounded-r-lg transition-all duration-200 hover:shadow-sm'
                                      style={{
                                        borderLeftColor: borderColor,
                                        backgroundColor: backgroundColor,
                                      }}
                                    >
                                      <div className='flex items-start justify-between'>
                                        <div className='flex-1'>
                                          <p className='font-semibold text-gray-900 text-sm'>
                                            {previousUserName}
                                          </p>
                                          <p className='text-xs text-gray-600 mt-0.5'>
                                            {previousRoleName}
                                          </p>
                                          <p className='text-sm text-gray-700 font-medium mt-1'>
                                            {actionTaken}
                                          </p>
                                          {nextUserName &&
                                            !(
                                              h.previousUserId &&
                                              h.nextUserId &&
                                              Number(h.previousUserId) === Number(h.nextUserId)
                                            ) && (
                                              <p className='text-xs text-gray-600 mt-1'>
                                                → Forwarded to:{' '}
                                                <span className='font-medium'>{nextUserName}</span>{' '}
                                                ({nextRoleName})
                                              </p>
                                            )}
                                          <p className='text-xs text-gray-500 mt-1 flex items-center'>
                                            <svg
                                              className='w-3 h-3 mr-1'
                                              fill='none'
                                              stroke='currentColor'
                                              viewBox='0 0 24 24'
                                            >
                                              <path
                                                strokeLinecap='round'
                                                strokeLinejoin='round'
                                                strokeWidth={2}
                                                d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
                                              />
                                            </svg>
                                            {formattedDate} {formattedTime}
                                          </p>
                                        </div>
                                        {hasDetails && (
                                          <button
                                            type='button'
                                            onClick={() => {
                                              setExpandedHistoryMap(prev => ({
                                                ...prev,
                                                [idx]: !prev[idx],
                                              }));
                                            }}
                                            className={`ml-4 text-sm font-semibold px-3 py-1.5 rounded-lg transition-all duration-200 flex items-center group relative ${
                                              isExpanded
                                                ? 'bg-blue-600 text-white shadow-md hover:bg-blue-700 hover:shadow-lg'
                                                : 'bg-blue-100 text-blue-700 hover:bg-blue-200 hover:text-blue-800 hover:shadow-md'
                                            }`}
                                            aria-expanded={isExpanded}
                                            aria-controls={`history-remarks-${idx}`}
                                            aria-label={
                                              isExpanded ? 'Hide details' : 'Show details'
                                            }
                                          >
                                            <svg
                                              className={`w-4 h-4 mr-2 transform transition-all duration-300 ${isExpanded ? 'rotate-180' : ''}`}
                                              fill='none'
                                              stroke='currentColor'
                                              viewBox='0 0 24 24'
                                            >
                                              <path
                                                strokeLinecap='round'
                                                strokeLinejoin='round'
                                                strokeWidth={2}
                                                d='M19 9l-7 7-7-7'
                                              />
                                            </svg>
                                            {isExpanded ? 'Hide' : 'Show more'}
                                          </button>
                                        )}
                                      </div>
                                      {hasRemarks && isExpanded && (
                                        <div
                                          id={`history-remarks-${idx}`}
                                          className='mt-3 p-4 bg-white rounded-lg border border-gray-200 shadow-sm'
                                        >
                                          <div className='text-base font-semibold text-gray-800 mb-3'>
                                            Remarks
                                          </div>
                                          <div className='flex'>
                                            <svg
                                              className='w-5 h-5 mr-3 text-indigo-500 mt-0.5 flex-shrink-0'
                                              fill='none'
                                              stroke='currentColor'
                                              viewBox='0 0 24 24'
                                            >
                                              <path
                                                strokeLinecap='round'
                                                strokeLinejoin='round'
                                                strokeWidth={2}
                                                d='M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z'
                                              />
                                            </svg>
                                            <div className='flex-1 overflow-auto'>
                                              <RichTextDisplay
                                                content={h.remarks}
                                                className='text-sm text-gray-700'
                                              />
                                            </div>
                                          </div>
                                        </div>
                                      )}
                                      {hasAttachments && isExpanded && (
                                        <div className='mt-3 p-3 bg-white rounded-lg border border-gray-200 shadow-sm'>
                                          <div className='text-base font-semibold text-gray-800 mb-2'>
                                            Attachments
                                          </div>
                                          <div className='grid grid-cols-1 sm:grid-cols-2 gap-2'>
                                            {attachmentsArr.map((att: any, aidx: number) => {
                                              const displayName = truncateFilename(
                                                att?.name || 'Attachment',
                                                10
                                              );
                                              const contentType = String(
                                                att?.contentType || ''
                                              ).toLowerCase();
                                              const fileLower = String(
                                                att?.name || ''
                                              ).toLowerCase();
                                              const isPdf =
                                                contentType.includes('pdf') ||
                                                fileLower.endsWith('.pdf');
                                              const isImage =
                                                contentType.startsWith('image/') ||
                                                /\.(png|jpe?g|gif|svg|webp)$/.test(fileLower);
                                              const iconColor = isPdf
                                                ? 'text-red-500'
                                                : isImage
                                                  ? 'text-emerald-500'
                                                  : 'text-blue-500';
                                              return (
                                                <div
                                                  key={aidx}
                                                  className='flex items-center text-xs text-blue-700 min-w-0'
                                                >
                                                  <svg
                                                    className={`w-5 h-5 mr-2 ${iconColor}`}
                                                    fill='none'
                                                    stroke='currentColor'
                                                    viewBox='0 0 24 24'
                                                  >
                                                    {isImage ? (
                                                      <path
                                                        strokeLinecap='round'
                                                        strokeLinejoin='round'
                                                        strokeWidth={2}
                                                        d='M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z'
                                                      />
                                                    ) : (
                                                      <path
                                                        strokeLinecap='round'
                                                        strokeLinejoin='round'
                                                        strokeWidth={2}
                                                        d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                                                      />
                                                    )}
                                                  </svg>
                                                  <button
                                                    type='button'
                                                    onClick={() => openAttachment(att)}
                                                    className='hover:underline truncate text-left text-blue-700'
                                                    title={att?.name}
                                                  >
                                                    {displayName}
                                                  </button>
                                                </div>
                                              );
                                            })}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <div className='flex flex-col items-center justify-center h-full text-center py-8'>
                                <svg
                                  className='w-12 h-12 text-gray-300 mb-4'
                                  fill='none'
                                  stroke='currentColor'
                                  viewBox='0 0 24 24'
                                >
                                  <path
                                    strokeLinecap='round'
                                    strokeLinejoin='round'
                                    strokeWidth={1}
                                    d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                                  />
                                </svg>
                                <p className='text-gray-500 text-sm font-medium'>
                                  No history available
                                </p>
                                <p className='text-gray-400 text-xs mt-1'>
                                  Application history will appear here when actions are taken
                                </p>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Process Application Modal */}
                  {application && (
                    <ProcessApplicationModal
                      application={application}
                      isOpen={isProcessModalOpen}
                      onClose={() => setIsProcessModalOpen(false)}
                      onProcess={handleProcessApplication}
                      initialAction={selectedAction}
                      isLoading={isProcessing}
                    />
                  )}

                  {/* Forward Application Modal */}
                  {application && (
                    <ForwardApplicationModal
                      application={application}
                      isOpen={isForwardModalOpen}
                      onClose={() => setIsForwardModalOpen(false)}
                      onForward={handleForwardApplication}
                      isLoading={isForwarding}
                    />
                  )}

                  {/* Print Options Modal */}
                  {application && showPrintOptions && (
                    <div className='fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 backdrop-blur-sm'>
                      <div className='bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 lg:p-8 border border-gray-100'>
                        <div className='flex justify-between items-center mb-6'>
                          <div className='flex items-center'>
                            <div className='w-2 h-6 bg-blue-600 rounded-full mr-3'></div>
                            <h3 className='text-xl font-bold text-gray-900'>Print Options</h3>
                          </div>
                          <button
                            onClick={() => setShowPrintOptions(false)}
                            className='p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all duration-200'
                          >
                            <svg
                              className='w-5 h-5'
                              fill='none'
                              stroke='currentColor'
                              viewBox='0 0 24 24'
                            >
                              <path
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth='2'
                                d='M6 18L18 6M6 6l12 12'
                              />
                            </svg>
                          </button>
                        </div>

                        <div className='space-y-4'>
                          <div
                            className={`p-4 border border-gray-200 rounded-xl transition-all duration-200 ${
                              printReady
                                ? 'hover:bg-gray-50 hover:shadow-sm cursor-pointer'
                                : 'opacity-60 cursor-not-allowed'
                            }`}
                            onClick={handleBrowserPrint}
                            title={
                              printReady ? undefined : 'Preparing document previews for printing…'
                            }
                          >
                            <div className='flex items-center'>
                              <div className='bg-blue-100 p-3 rounded-xl mr-4'>
                                <svg
                                  xmlns='http://www.w3.org/2000/svg'
                                  className='h-6 w-6 text-blue-600'
                                  fill='none'
                                  viewBox='0 0 24 24'
                                  stroke='currentColor'
                                >
                                  <path
                                    strokeLinecap='round'
                                    strokeLinejoin='round'
                                    strokeWidth={2}
                                    d='M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2z'
                                  />
                                </svg>
                              </div>
                              <div>
                                <h4 className='font-semibold text-gray-900'>Print using browser</h4>
                                <p className='text-sm text-gray-600 mt-1'>
                                  {printReady
                                    ? 'Opens a printable view in a new window'
                                    : 'Preparing document previews…'}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div
                            className='p-4 border border-gray-200 rounded-xl hover:bg-gray-50 hover:shadow-sm cursor-pointer transition-all duration-200'
                            onClick={handleExportPDF}
                          >
                            <div className='flex items-center'>
                              <div className='bg-green-100 p-3 rounded-xl mr-4'>
                                <svg
                                  xmlns='http://www.w3.org/2000/svg'
                                  className='h-6 w-6 text-green-600'
                                  fill='none'
                                  viewBox='0 0 24 24'
                                  stroke='currentColor'
                                >
                                  <path
                                    strokeLinecap='round'
                                    strokeLinejoin='round'
                                    strokeWidth={2}
                                    d='M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                                  />
                                </svg>
                              </div>
                              <div>
                                <h4 className='font-semibold text-gray-900'>Export as PDF</h4>
                                <p className='text-sm text-gray-600 mt-1'>
                                  Download application as a PDF document
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Loading indicator while PDF is being generated */}
                        {isPrinting && (
                          <div className='mt-6 flex items-center justify-center text-blue-600 bg-blue-50 rounded-xl p-4'>
                            <svg
                              className='animate-spin -ml-1 mr-3 h-5 w-5'
                              xmlns='http://www.w3.org/2000/svg'
                              fill='none'
                              viewBox='0 0 24 24'
                            >
                              <circle
                                className='opacity-25'
                                cx='12'
                                cy='12'
                                r='10'
                                stroke='currentColor'
                                strokeWidth='4'
                              ></circle>
                              <path
                                className='opacity-75'
                                fill='currentColor'
                                d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                              ></path>
                            </svg>
                            <span className='font-medium'>Generating PDF...</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Confirmation Modal */}
                  <ConfirmationModal
                    isOpen={showConfirmation}
                    onClose={() => setShowConfirmation(false)}
                    onConfirm={confirmationDetails.onConfirm}
                    title={confirmationDetails.title}
                    message={confirmationDetails.message}
                    actionButtonText={confirmationDetails.actionButtonText}
                    actionButtonColor={confirmationDetails.actionButtonColor}
                  />
                  {showProceedingsModal && (
                    <div className='fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm'>
                      <div className='bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-gray-100'>
                        <div className='flex justify-between items-center p-6 lg:p-8 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50'>
                          <div className='flex items-center'>
                            <div className='w-2 h-8 bg-blue-600 rounded-full mr-4'></div>
                            <div>
                              <h2 className='text-2xl font-bold text-gray-900'>Proceedings</h2>
                              <p className='text-gray-600 mt-1'>
                                Process application #{applicationId!}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => setShowProceedingsModal(false)}
                            className='p-2 text-gray-500 hover:text-gray-700 hover:bg-white rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                          >
                            <svg
                              className='w-6 h-6'
                              fill='none'
                              stroke='currentColor'
                              viewBox='0 0 24 24'
                            >
                              <path
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth={2}
                                d='M6 18L18 6M6 6l12 12'
                              />
                            </svg>
                          </button>
                        </div>
                        <div className='p-6 lg:p-8'>
                          <ProceedingsForm
                            applicationId={applicationId!}
                            onSuccess={handleProceedingsSuccess}
                            userRole={userRole}
                            applicationData={application || undefined}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className='p-6 lg:p-8'>
              <div className='text-center py-8'>
                <p className='text-gray-500'>Application not found</p>
                <button
                  onClick={() => router.push('/')}
                  className='mt-4 px-4 py-2 text-[#6366F1] border border-[#6366F1] rounded-md hover:bg-[#EEF2FF]'
                >
                  Return to Dashboard
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Loading Overlay */}
      {(isProcessing || isForwarding) && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm'>
          <div className='bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 border border-gray-100'>
            <div className='flex flex-col items-center'>
              <div className='animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mb-4'></div>
              <h3 className='text-lg font-semibold text-gray-900 mb-2'>
                {isProcessing ? 'Processing Application...' : 'Forwarding Application...'}
              </h3>
              <p className='text-gray-600 text-center'>
                {isProcessing
                  ? 'Please wait while we process your request.'
                  : 'Please wait while we forward the application.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Print-Only Layout Component */}
      {printApplication && (
        <div className='hidden print:block print:w-full print:bg-white print:text-black'>
          <PrintApplicationForm
            application={printApplication}
            applicantName={applicantName}
            workflowHistory={printWorkflowHistory}
            onReadyChange={setPrintReady}
          />
        </div>
      )}

      {/* Global CSS style block to completely hide the normal app shell and details on print */}
      <style jsx global>{`
        @media print {
          /* Force hide standard app shell containers, sidebar, headers, and footer */
          html,
          body {
            margin: 0 !important;
            padding: 0 !important;
            background: #fff !important;
            color: #000 !important;
            width: 210mm;
            /* Not a fixed height: the app shell normally sets html/body to
               overflow: hidden/auto for its fixed-viewport layout. Combining
               that with a fixed height: 297mm (exactly one page) turns the
               body into a single-page scroll box in Chromium's print engine,
               which silently swallows every page-break rule below and
               clips/overlaps anything past page 1. height: auto plus
               overflow: visible lets the printout paginate across as many
               pages as the content actually needs. */
            height: auto !important;
            min-height: 297mm;
            overflow: visible !important;
          }
          header,
          footer,
          aside,
          nav,
          button,
          .print\:hidden,
          .flex.h-screen,
          main,
          [data-printable='application-card'] {
            display: none !important;
            height: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            opacity: 0 !important;
            visibility: hidden !important;
            overflow: hidden !important;
            position: absolute !important;
            top: -9999px !important;
            left: -9999px !important;
          }
          /* Override body elements and next container */
          #__next,
          #__next > div {
            display: block !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            background: transparent !important;
          }
          /* Ensure print form container is visible starting immediately on page 1 */
          .hidden.print\:block {
            display: block !important;
            position: relative !important;
            top: 0 !important;
            left: 0 !important;
            visibility: visible !important;
            opacity: 1 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            box-sizing: border-box !important;
          }
          @page {
            size: A4 portrait;
            margin: 0 !important;
          }
          body {
            padding: 10mm 15mm !important;
          }
        }
      `}</style>
    </div>
  );
}
