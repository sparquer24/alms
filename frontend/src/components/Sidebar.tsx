import React, { memo, useCallback, useMemo, useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { logoutUser } from "../store/thunks/authThunks";
import { useAuthSync } from "../hooks/useAuthSync";
import { useLayout } from "../config/layoutContext";
import { menuMeta, MenuMetaKey } from "../config/menuMeta";
import { getRoleConfig } from "../config/roles";
import { HamburgerButton } from "./HamburgerButton";
import { CornerUpRight, Undo2, Flag, FolderCheck } from "lucide-react";
import { ChartBarIcon } from "@heroicons/react/outline";
import { toggleInbox, openInbox, closeInbox } from "../store/slices/uiSlice";

// Mock implementation for useUserContext if unavailable
const useUserContext = () => ({ user: { role: "USER" } });

// Add custom styles for scrollbar
const scrollbarStyles = {
  scrollbar: `
    ::-webkit-scrollbar {
      width: 6px;
      height: 6px;
    }
    ::-webkit-scrollbar-track {
      background: #f1f1f1;
      border-radius: 8px;
    }
    ::-webkit-scrollbar-thumb {
      background: #888;
      border-radius: 8px;
    }
    ::-webkit-scrollbar-thumb:hover {
      background: #555;
    }
  `,
};

interface MenuItemProps {
  icon: React.ReactNode;
  label: string;
  count?: number;
  active?: boolean;
  onClick?: () => void;
  textColor?: string;
}

// This interface is used for the CollapsibleSection component which is 
// kept as a reference for future sidebar enhancements
/* eslint-disable @typescript-eslint/no-unused-vars */
interface CollapsibleSectionProps {
  title: string;
  items: MenuItemProps[];
  defaultExpanded?: boolean;
}
/* eslint-enable @typescript-eslint/no-unused-vars */

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

// This component is currently not used but kept for future sidebar enhancements
/* eslint-disable @typescript-eslint/no-unused-vars */
const CollapsibleSection = ({
  title,
  items,
  defaultExpanded = true,
}: CollapsibleSectionProps) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className="mb-3">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full px-4 py-2 text-left font-medium hover:bg-gray-100"
      >
        <span>{title} {isExpanded ? "▾" : "▸"}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`w-4 h-4 transition-transform ${
            isExpanded ? "transform rotate-90" : ""
          }`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="9 18 15 12 9 6"></polyline>
        </svg>
      </button>
      {isExpanded && (
        <ul className="mt-1 pl-2">
          {items.map((item, index) => (
            <MenuItem key={index} {...item} />
          ))}
        </ul>
      )}
    </div>
  );
};
/* eslint-enable @typescript-eslint/no-unused-vars */

interface SidebarProps {
  onStatusSelect?: (statusId: string) => void;
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
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({});
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const dispatch = useDispatch();
  const { userRole, token } = useAuthSync();
  const [roleConfig, setRoleConfig] = useState(getRoleConfig(userRole || "SHO"));
  const router = useRouter();
  const { user } = useUserContext();
  // Define RootState type or import it from your store typings
  interface RootState {
    ui: {
      isInboxOpen: boolean;
    };
    // ...other state slices
  }
  const isInboxOpen = useSelector((state: RootState) => state.ui.isInboxOpen); // Get inbox state from Redux

  useEffect(() => {
    setRoleConfig(getRoleConfig(userRole || "SHO"));
  }, [userRole]);

  useEffect(() => {
    if (showSidebar) setVisible(true);
    else setTimeout(() => setVisible(false), 400);
  }, [showSidebar]);

  const handleMenuClick = useCallback((item: { name: string; childs?: { name: string }[] }) => {
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

  const handleInboxSubItemClick = useCallback((subItem: string) => {
    setActiveItem(`inbox-${subItem}`);
    localStorage.setItem("activeNavItem", `inbox-${subItem}`);
    router.replace(`/inbox/${subItem}`); // Use replace to avoid full page refresh
    dispatch(openInbox()); // Ensure the inbox menu remains open
  }, [router, dispatch]);

  const handleLogout = useCallback(async () => {
    if (token) {
      await dispatch(logoutUser() as any);
      document.cookie = 'auth=; Max-Age=0; path=/'; // Remove the auth cookie
    }
    router.push("/login");
  }, [dispatch, router, token]);

  // Update menuItems logic with type casting
  const menuItems = useMemo(() => {
    return (roleConfig.menuItems || []).map((item) => {
      const key = item.name as MenuMetaKey; // Cast to MenuMetaKey
      return {
        name: item.name,
        label: menuMeta[key]?.label || item.name,
        icon: menuMeta[key]?.icon,
      };
    });
  }, [roleConfig]);

  // Define inbox sub-items
  const inboxSubItems = [
    { name: "forwarded", label: "Forwarded", icon: <CornerUpRight className="w-6 h-6 mr-2" aria-label="Forwarded" /> },
    { name: "returned", label: "Returned", icon: <Undo2 className="w-6 h-6 mr-2" aria-label="Returned" /> },
    { name: "redFlagged", label: "Red Flagged", icon: <Flag className="w-6 h-6 mr-2" aria-label="Red Flagged" /> },
    { name: "disposed", label: "Disposed", icon: <FolderCheck className="w-6 h-6 mr-2" aria-label="Disposed" /> },
  ];

  if (!visible && !showSidebar) return null;
  // Only render sidebar if allowed role
  if (!userRole) return null;

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
          <span className="font-bold">{roleConfig.dashboardTitle}</span>
        </div>
        <nav className="flex-1 overflow-y-auto py-2 px-2">
          <ul className="space-y-1">
            {/* Collapsible Inbox Section */}
            {userRole !== 'ADMIN' && (
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
            {user.role === "ADMIN" && (
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
