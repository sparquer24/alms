import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { getRoleConfig } from "../config/roles";
import { useAuth } from "../config/auth";
import { useRouter } from "next/navigation";
import { useLayout } from "../config/layoutContext";

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
  icon: string;
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

const MenuItem = ({ icon, label, count, active, onClick, textColor }: MenuItemProps) => {
  return (
    <li>
      <button
        onClick={onClick}
        className={`flex items-center w-full px-4 py-2 rounded-md text-left ${
          active
            ? "bg-[#001F54] text-white"
            : textColor 
              ? `hover:bg-gray-100 text-[${textColor}]`
              : "hover:bg-gray-100 text-gray-800"
        }`}
      >
        <span className="inline-flex items-center justify-center w-5 h-5 mr-3">
          {icon === "inbox" && (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <path d="M22 12h-6l-2 3h-4l-2-3H2"/>
              <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>
            </svg>
          )}
          {icon === "forward" && (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <polyline points="15 17 20 12 15 7"/>
              <path d="M4 18v-2a4 4 0 0 1 4-4h12"/>
            </svg>
          )}
          {icon === "return" && (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <polyline points="9 17 4 12 9 7"/>
              <path d="M20 18v-2a4 4 0 0 0-4-4H4"/>
            </svg>
          )}
          {icon === "flag" && (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
              <line x1="4" y1="22" x2="4" y2="15"/>
            </svg>
          )}
          {icon === "bin" && (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
          )}
          {icon === "send" && (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          )}
          {icon === "folder" && (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
            </svg>
          )}
          {icon === "chart" && (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <line x1="18" y1="20" x2="18" y2="10"/>
              <line x1="12" y1="20" x2="12" y2="4"/>
              <line x1="6" y1="20" x2="6" y2="14"/>
            </svg>
          )}
          {icon === "settings" && (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
          )}
          {icon === "logout" && (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          )}          {icon === "user" && (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          )}
          {icon === "form" && (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10 9 9 9 8 9"/>
            </svg>
          )}
        </span>
        <span className="flex-grow">{label}</span>
        {count !== undefined && (
          <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-medium text-white bg-[#6366F1] rounded-full">
            {count}
          </span>
        )}
      </button>
    </li>
  );
};

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

export const Sidebar = () => {
  const { showSidebar } = useLayout();
  const [visible, setVisible] = useState(false);
  const [activeItem, setActiveItem] = useState(() => {
    // Get the active item from localStorage or default to "freshform"
    if (typeof window !== 'undefined') {
      return localStorage.getItem('activeNavItem') || "freshform";
    }
    return "freshform";
  });  const [isInboxExpanded, setIsInboxExpanded] = useState(true);
  const { userRole, logout } = useAuth();
  const [roleConfig, setRoleConfig] = useState(getRoleConfig(userRole));
  const router = useRouter();

  // Control visibility with animation
  useEffect(() => {
    if (showSidebar) {
      setVisible(true);
    } else {
      setTimeout(() => setVisible(false), 400); // Match transition duration
    }
  }, [showSidebar]);
  useEffect(() => {
    setRoleConfig(getRoleConfig(userRole));
  }, [userRole]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };  const handleItemClick = (itemId: string) => {
    setActiveItem(itemId);
    
    // Store the active item in localStorage
    localStorage.setItem('activeNavItem', itemId);
    
    // Navigate to the appropriate page based on the selected item
    switch(itemId) {
      case 'forwarded':
      case 'returned':
      case 'flagged':
      case 'disposed':
        router.push(`/inbox/${itemId}`);
        break;
      case 'freshform':
        router.push('/freshform');
        break;
      case 'sent':
        router.push('/sent');
        break;
      case 'final':
        router.push('/final');
        break;
      case 'reports':
        router.push('/reports');
        break;
      case 'settings':
        router.push('/settings');
        break;
      default:
        router.push('/');
        break;
    }
  };

  // Define all possible inbox items
  const allInboxItems = [
    {
      id: "forwarded",
      icon: "forward",
      label: "Forwarded",
      count: 10,
      permissionKey: "canViewForwarded" as const
    },
    {
      id: "returned",
      icon: "return",
      label: "Returned",
      count: 25,
      permissionKey: "canViewReturned" as const
    },
    {
      id: "flagged",
      icon: "flag",
      label: "Red Flagged",
      count: 10,
      permissionKey: "canViewRedFlagged" as const
    },
    {
      id: "disposed",
      icon: "bin",
      label: "Disposed",
      count: 10,
      permissionKey: "canViewDisposed" as const
    },
  ];

  // Filter inbox items based on role permissions
  const inboxSubItems = allInboxItems
    .filter(item => roleConfig.permissions[item.permissionKey])
    .map(item => ({
      icon: item.icon,
      label: item.label,
      count: item.count,
      active: activeItem === item.id,
      onClick: () => handleItemClick(item.id),
      textColor: "#64748B"
    }));
  
  // Calculate the total count for inbox (sum of all subitems)
  const totalInboxCount = inboxSubItems.reduce((total, item) => total + (item.count || 0), 0);

  // Define all possible other items
  const allOtherItems = [
    {
      id: "freshform",
      icon: "form",
      label: "Fresh Form",
      count: 15,
      permissionKey: "canViewFreshForm" as const
    },
    {
      id: "sent",
      icon: "send",
      label: "Sent",
      count: 65,
      permissionKey: "canViewSent" as const
    },
    {
      id: "final",
      icon: "folder",
      label: "Final Disposal",
      count: 35,
      permissionKey: "canViewFinalDisposal" as const
    },
    {
      id: "reports",
      icon: "chart",
      label: "My Reports",
      count: 115,
      permissionKey: "canViewReports" as const
    },
  ];

  // Filter other items based on role permissions
  const otherItems = allOtherItems
    .filter(item => roleConfig.permissions[item.permissionKey])
    .map(item => ({
      icon: item.icon,
      label: item.label,
      count: item.count,
      active: activeItem === item.id,
      onClick: () => handleItemClick(item.id),
      textColor: "#64748B"
    }));  if (!visible && !showSidebar) return null;
  
  return (
    <aside className={`w-[18%] min-w-[250px] h-screen bg-white border-r border-gray-200 flex flex-col fixed left-0 top-0 transition-all duration-300 ${showSidebar ? 'opacity-100 transform translate-x-0' : 'opacity-0 transform -translate-x-full'}`}>      {/* Top Section */}
      <div className="p-4 flex items-center border-b border-gray-100">
        <Image
          src="/icon-alms.svg"
          alt="Arms License Icon"
          width={52}
          height={52}
          className="mr-2"
        />
        <h1 className="text-lg font-bold text-black">Arms License</h1>
      </div>      {/* Dashboard Section */}
      <div className="bg-[#001F54] text-white p-4 flex items-center">
        <span className="mr-3">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
        </span>
        <span className="font-bold">{roleConfig.dashboardTitle}</span>
      </div>{/* Menu Items */}
      <nav className="flex-1 overflow-y-auto py-2 px-2">
        <ul className="space-y-1 px-1 py-2">
          {/* Inbox with collapsible items */}
          <li>
            <div>
              <button
                onClick={() => setIsInboxExpanded(!isInboxExpanded)}
                className={`flex items-center w-full px-4 py-2 rounded-md text-left ${
                  activeItem === "inbox" ? "bg-[#001F54] text-white" : "text-[#64748B] hover:bg-gray-100"
                }`}
              >
                <span className="inline-flex items-center justify-center w-5 h-5 mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                    <path d="M22 12h-6l-2 3h-4l-2-3H2"/>
                    <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>
                  </svg>
                </span>                <span className="flex-grow">Inbox</span>
                <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-medium text-white bg-[#6366F1] rounded-full mr-2">
                  {totalInboxCount}
                </span>
                <span>{isInboxExpanded ? "▾" : "▸"}</span>
              </button>
              {isInboxExpanded && (
                <ul className="mt-1 pl-8">
                  {inboxSubItems.map((item, index) => (
                    <MenuItem key={index} {...item} />
                  ))}
                </ul>
              )}
            </div>
          </li>
          
          {/* Other menu items */}
          {otherItems.map((item, index) => (
            <MenuItem key={index} {...item} />
          ))}
        </ul>
      </nav>{/* Bottom Section */}<div className="p-2 border-t border-gray-200 mt-auto">
        <ul className="space-y-2">
          {roleConfig.permissions.canAccessSettings && (
            <li>
              <button
                onClick={() => handleItemClick("settings")}
                className="flex items-center w-full px-4 py-2 bg-[#001F54] text-white rounded-md text-left hover:bg-[#112a61]"
              >
                <span className="inline-flex items-center justify-center w-5 h-5 mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                    <circle cx="12" cy="12" r="3"/>
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                  </svg>
                </span>
                <span className="flex-grow">Settings</span>
              </button>
            </li>
          )}
          <li>
            <button              onClick={handleLogout}
              className="flex items-center w-full px-4 py-2 bg-[#001F54] text-white rounded-md text-left hover:bg-[#112a61]"
            >
              <span className="inline-flex items-center justify-center w-5 h-5 mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
              </span>
              <span className="flex-grow">Log Out</span>
            </button>
          </li>
        </ul>
      </div>
    </aside>
  );
};
