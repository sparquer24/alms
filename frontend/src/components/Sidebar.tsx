import React, { memo, useCallback, useMemo, useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { logoutUser } from "../store/thunks/authThunks";
import { useAuthSync } from "../hooks/useAuthSync";
import { useLayout } from "../config/layoutContext";
import { menuMeta, MenuMetaKey } from "../config/menuMeta";
import { getRoleConfig } from "../config/roles";
import { statusIdMap } from "../config/statusMap";
import { HamburgerButton } from "./HamburgerButton";
import { mapAPIApplicationToTableData } from "../utils/applicationMapper";
import { APIApplication } from "../types/api";
import { CornerUpRight, Undo2, Flag, FolderCheck } from "lucide-react";
import { ChartBarIcon } from "@heroicons/react/outline";
import { toggleInbox, openInbox, closeInbox } from "../store/slices/uiSlice";
import { fetchApplicationCounts, fetchApplicationsByStatus } from "../services/sidebarApiCalls";
import { useUserContext } from "../context/UserContext";



interface MenuItemProps {
  icon: React.ReactNode;
  label: string;
  count?: number;
  active?: boolean;
  onClick?: () => void;
  textColor?: string;
}



// Reusable MenuItem component
const MenuItem = memo(({ icon, label, count, active, onClick }: MenuItemProps) => (
  <li>
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center w-full px-4 py-2 rounded-md text-left transition-colors duration-150
        ${active ? "bg-[#001F54] text-white" : "hover:bg-gray-100 text-gray-800"}`}
    >
      <span className="inline-flex items-center justify-center w-6 h-6 mr-2" aria-hidden="true">
        {icon}
      </span>
      <span className="flex-grow">{label}</span>
      {count !== undefined && (
        <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-medium text-white bg-[#6366F1] rounded-full">
          {count}
        </span>
      )}
    </button>
  </li>
));

interface SidebarProps {
  onStatusSelect?: (statusId: string) => void;
}

interface ApplicationCounts {
  forwardedCount: number;
  returnedCount: number;
  redFlaggedCount: number;
  disposedCount: number;
}

export const Sidebar = memo(({ onStatusSelect }: SidebarProps = {}) => {
  const { showSidebar } = useLayout();
  const [visible, setVisible] = useState(false);
  const [activeItem, setActiveItem] = useState(() => {
    if (typeof window !== "undefined" && window.localStorage) {
      return localStorage.getItem("activeNavItem") || "";
    }
    return "";
  });
  const [applicationCounts, setApplicationCounts] = useState<ApplicationCounts>({
    forwardedCount: 0,
    returnedCount: 0,
    redFlaggedCount: 0,
    disposedCount: 0,
  });
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({});
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const dispatch = useDispatch();
  const { userRole, token } = useAuthSync();
  const [roleConfig, setRoleConfig] = useState(getRoleConfig(userRole));
  const router = useRouter();
  const { user } = useUserContext();
  // Role derived from the `user` cookie (if present) will override or supplement auth state.
  const [cookieRole, setCookieRole] = useState<string | undefined>(undefined);

const getUserRoleFromCookie = () => {
  if (typeof window === "undefined" || !document?.cookie) return undefined;
  try {
    // 1. Find "user" cookie from document.cookie
    const raw = document.cookie.split(';').map(c => c.trim()).find(c => c.startsWith('user='));
    if (!raw) return undefined;

    // 2. Remove "user=" prefix
    let value = raw.substring('user='.length);

    // 3. Decode if URI encoded (sometimes cookies are saved encoded)
    let decoded = decodeURIComponent(value);

    // 4. Sometimes cookies are prefixed with "j:" or wrapped in quotes → clean it
    if (decoded.startsWith('j:')) decoded = decoded.slice(2);
    if ((decoded.startsWith('"') && decoded.endsWith('"')) || (decoded.startsWith("'") && decoded.endsWith("'"))) {
      decoded = decoded.slice(1, -1);
    }

    // 5. Parse string → object
    const parsed = JSON.parse(decoded);

    // 6. Get role object
    const roleObj = parsed?.role ?? parsed;
    if (!roleObj) return undefined;

    // 7. If role is a string → return directly
    if (typeof roleObj === 'string') return roleObj.toUpperCase();

    // 8. If role is object → prefer "code", fallback to "name"
    if (typeof roleObj === 'object') {
      if (roleObj.code) return String(roleObj.code).toUpperCase();
      if (roleObj.name) return String(roleObj.name).toUpperCase();
    }
  } catch (err) {
    // ignore parse errors
  }
  return undefined;
};

  // Define RootState type or import it from your store typings
  interface RootState {
    ui: {
      isInboxOpen: boolean;
    };
    // ...other state slices
  }
  const isInboxOpen = useSelector((state: RootState) => state.ui.isInboxOpen); // Get inbox state from Redux

  useEffect(() => {
    // prefer cookie-derived role when available (role code or name), fallback to auth sync role
    const effective = cookieRole || userRole || "SHO";
    setRoleConfig(getRoleConfig(effective));
  }, [userRole, cookieRole]);

  const [loadingCounts, setLoadingCounts] = useState(false);
  const [lastCountsFetch, setLastCountsFetch] = useState<number>(0);

  useEffect(() => {
    // Fetch applications for each status when the sidebar is visible
    const getApplicationCounts = async () => {
      // Prevent duplicate calls within 30 seconds
      const now = Date.now();
      if (loadingCounts || (now - lastCountsFetch) < 30000) {
        return;
      }

      try {
        setLoadingCounts(true);
        const counts = await fetchApplicationCounts();
        
        setApplicationCounts({
          forwardedCount: counts.forwardedCount,
          returnedCount: counts.returnedCount,
          redFlaggedCount: counts.redFlaggedCount,
          disposedCount: counts.disposedCount,
        });
        
        setLastCountsFetch(now);
      } catch (error) {
        console.error('Error fetching application counts:', error);
      } finally {
        setLoadingCounts(false);
      }
    };

    if (visible && !cookieRole?.includes('ADMIN')) {
      getApplicationCounts();
    }
  }, [visible, cookieRole, loadingCounts, lastCountsFetch]);

  useEffect(() => {
    // read cookie role once on mount (client-side only)
    if (typeof window !== 'undefined') {
      const r = getUserRoleFromCookie();
      if (r) setCookieRole(r);
    }
  }, []);

  useEffect(() => {
    if (showSidebar) setVisible(true);
    else setTimeout(() => setVisible(false), 400);
  }, [showSidebar]);

  const handleMenuClick = useCallback(async (item: { name: string; childs?: { name: string }[] }) => {
    if (item.name.toLowerCase() !== "inbox") {
      dispatch(closeInbox()); // Close the inbox if another menu item is clicked
    }
    if (item.childs?.length) {
      setExpandedMenus((prev) => ({ ...prev, [item.name]: !prev[item.name] }));
    } else {
      setActiveItem(item.name);
      localStorage.setItem("activeNavItem", item.name);
      // Robust special-case routing for freshform, finaldisposal, myreports, closed, and sent
      const normalizedName = item.name.replace(/\s+/g, '').toLowerCase();

      // Kick off fetch to /application-form using mapped status
      try {
        const statusIds = statusIdMap[normalizedName as keyof typeof statusIdMap];
        if (statusIds?.length) {
          // Normalize all status IDs to numbers before calling the API (function expects number[])
          const numericStatusIds = statusIds
            .map(id => typeof id === 'number' ? id : Number(id))
            .filter(id => !Number.isNaN(id));
          if (numericStatusIds.length) {
            // Fire and forget; consumers can switch to a page that reads from a store later.
            await fetchApplicationsByStatus(numericStatusIds);
          }
        }
      } catch (error) {
        console.error('Error fetching applications:', error);
      }

      if (normalizedName === "freshform") {
        router.replace("/freshform");
      } else if (normalizedName === "finaldisposal") {
        router.replace("/finalDisposal");
      } else if (normalizedName === "myreports" || normalizedName === "reports") {
        router.replace("/reports/myreports");
      } else if (normalizedName === "closed") {
        router.replace("/closed");
      } else if (normalizedName === "sent") {
        router.replace("/sent");
      } else {
        router.replace(`/${normalizedName}`);
      }
    }
  }, [router, dispatch]);

  const handleInboxToggle = useCallback(() => {
    dispatch(toggleInbox()); // Dispatch toggle action
  }, [dispatch]);

  const handleInboxSubItemClick = useCallback(async (subItem: string) => {
    setActiveItem(`inbox-${subItem}`);
    localStorage.setItem("activeNavItem", `inbox-${subItem}`);
    dispatch(openInbox()); 
    router.push(`/inbox/${subItem}`);
  }, [router, dispatch]);

  const handleLogout = useCallback(async () => {
    if (token) {
      await dispatch(logoutUser() as any);
      document.cookie = 'auth=; Max-Age=0; path=/'; // Remove the auth cookie
    }
    router.push("/login");
  }, [dispatch, router, token]);

  // Update menuItems logic with type casting and guards
  const menuItems = useMemo(() => {
    const items = roleConfig?.menuItems ?? [];
    return items.map((item) => {
      const key = item.name as MenuMetaKey;
      return {
        name: item.name,
        label: menuMeta[key]?.label || item.name,
        icon: menuMeta[key]?.icon,
      };
    });
  }, [roleConfig]);

  // Define inbox sub-items
  const inboxSubItems = useMemo(() => [
    { name: "forwarded", label: "Forwarded", icon: <CornerUpRight className="w-6 h-6 mr-2" aria-label="Forwarded" />, count: applicationCounts.forwardedCount },
    { name: "returned", label: "Returned", icon: <Undo2 className="w-6 h-6 mr-2" aria-label="Returned" />, count: applicationCounts.returnedCount },
    { name: "redFlagged", label: "Red Flagged", icon: <Flag className="w-6 h-6 mr-2" aria-label="Red Flagged" />, count: applicationCounts.redFlaggedCount },
    { name: "disposed", label: "Disposed", icon: <FolderCheck className="w-6 h-6 mr-2" aria-label="Disposed" />, count: applicationCounts.disposedCount },
  ], [applicationCounts]);

  if (!visible && !showSidebar) return null;
  // Only render sidebar if allowed role
  // determine effective role used for rendering checks
  const effectiveRole = cookieRole || userRole;
  if (!effectiveRole) return null;

  return (
    <>
      <div className="md:hidden fixed top-4 left-4 z-50">
        <HamburgerButton open={mobileSidebarOpen} onClick={() => setMobileSidebarOpen((v) => !v)} />
      </div>
      <aside
        className={`z-40 w-[80vw] max-w-xs md:w-[18%] h-screen bg-white border-r border-gray-200 fixed left-0 top-0
        ${showSidebar || mobileSidebarOpen ? 'opacity-100 transform translate-x-0' : 'opacity-0 pointer-events-none -translate-x-full'}
        md:opacity-100 md:transform md:translate-x-0 md:pointer-events-auto`}
      >
        <div className="p-4 flex items-center border-b border-gray-100">
          <Image src="/icon-alms.svg" alt="Arms License Icon" width={52} height={52} className="mr-2" />
          <h1 className="text-lg font-bold">Arms License</h1>
        </div>
        <div className="bg-[#001F54] text-white p-4 flex items-center">
          <span className="mr-3">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </span>
          <span className="font-bold">{roleConfig?.dashboardTitle ?? "Dashboard"}</span>
        </div>
        <nav className="flex-1 overflow-y-auto py-2 px-2">
          <ul className="space-y-1">
            {/* Collapsible Inbox Section */}
            {effectiveRole !== 'ADMIN' && (
              <li>
                <button
                  type="button"
                  onClick={handleInboxToggle}
                  className={`flex items-center w-full px-4 py-2 rounded-md text-left ${isInboxOpen ? "bg-[#001F54] text-white" : "hover:bg-gray-100 text-gray-800"}`}
                >
                  <span className="inline-flex items-center justify-center w-6 h-6 mr-2 group-hover:text-indigo-600 transition-colors" aria-hidden="true">
                    {menuMeta.inbox.icon}
                  </span>
                  <span className="flex-grow">{menuMeta.inbox.label}</span>
                  <span className="ml-2">{isInboxOpen ? '▾' : '▸'}</span>
                </button>
                {isInboxOpen && (
                  <ul className="ml-8 mt-1 space-y-1">
                    {inboxSubItems.map((sub) => (
                      <li key={sub.name}>
                        <button
                          type="button"
                          onClick={() => handleInboxSubItemClick(sub.name)}
                          className={`flex items-center w-full px-2 py-1 rounded-md text-left text-sm ${activeItem === `inbox-${sub.name}` ? "bg-[#001F54] text-white" : "hover:bg-gray-100 text-gray-800"}`}
                        >
                          <span className="inline-flex items-center justify-center w-6 h-6 mr-2 group-hover:text-indigo-600 transition-colors" aria-hidden="true">
                            {sub.icon}
                          </span>
                          <span className="flex-grow">{sub.label}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            )}
            {/* Render other menu items except inbox, settings, login */}
            <ul className="space-y-1">
              {menuItems
                .filter((item) => item.name !== "inbox")
                .map((item) => (
                  <MenuItem
                    key={item.name}
                    icon={item.icon}
                    label={item.label}
                    active={activeItem === item.name}
                    onClick={() => handleMenuClick({ name: item.name })}
                  />
                ))}
            </ul>
            {/* Add Flow Mapping menu item for ADMIN users */}
            {effectiveRole === "ADMIN" && (
              <li>
                <a href="/admin/flow-mapping" className="flex items-center gap-2 px-4 py-2 hover:bg-gray-200 rounded-md">
                  <ChartBarIcon className="w-5 h-5" />
                  <span>Flow Mapping</span>
                </a>
              </li>
            )}
          </ul>
        </nav>
        <div className="absolute bottom-0 w-full p-4 border-t border-gray-200">
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-2 rounded-md text-left transition-colors duration-150 hover:bg-gray-100 text-gray-800"
          >
            <span className="inline-flex items-center justify-center w-6 h-6 mr-2" aria-hidden="true">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-9A2.25 2.25 0 002.25 5.25v13.5A2.25 2.25 0 004.5 21h9a2.25 2.25 0 002.25-2.25V15" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 12H9m3-3l-3 3 3 3" />
              </svg>
            </span>
            Logout
          </button>
        </div>
      </aside>
    </>
  );
});
