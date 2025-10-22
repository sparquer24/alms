import {
  FilePlus, Inbox, Send, FolderCheck, Archive, FileEdit, BarChart2, LogOut, Users, Shield, GitBranch
} from "lucide-react";

// Fix: Add a type-safe mapping for menuMeta keys
export type MenuMetaKey =
  | 'freshform'
  | 'inbox'
  | 'sent'
  | 'closed'
  | 'final'
  | 'finaldisposal'
  | 'draft'
  | 'reports'
  | 'analytics' // New analytics tab
  | 'logout'
  | 'userManagement'
  | 'roleManagement'
  | 'flowMapping';

export const menuMeta: Record<MenuMetaKey, { label: string; icon: React.ReactNode }> = {
  freshform: { label: "Fresh Form", icon: <FilePlus className="w-6 h-6 mr-2" aria-label="Fresh Form" /> },
  inbox: { label: "Inbox", icon: <Inbox className="w-6 h-6 mr-2" aria-label="Inbox" /> },
  sent: { label: "Sent", icon: <Send className="w-6 h-6 mr-2" aria-label="Sent" /> },
  closed: { label: "Closed", icon: <FolderCheck className="w-6 h-6 mr-2" aria-label="Closed" /> },
  final: { label: "Final Disposal", icon: <Archive className="w-6 h-6 mr-2" aria-label="Final Disposal" /> },
  finaldisposal: { label: "Final Disposal", icon: <Archive className="w-6 h-6 mr-2" aria-label="Final Disposal" /> },
  draft: { label: "Draft", icon: <FileEdit className="w-6 h-6 mr-2" aria-label="Draft" /> },
  reports: { label: "My Reports", icon: <BarChart2 className="w-6 h-6 mr-2" aria-label="My Reports" /> },
  analytics: { label: "Analytics", icon: <BarChart2 className="w-6 h-6 mr-2" aria-label="Analytics" /> },
  logout: { label: "Log Out", icon: <LogOut className="w-6 h-6 mr-2" aria-label="Log Out" /> },
  userManagement: { label: "User Management", icon: <Users className="w-6 h-6 mr-2" aria-label="User Management" /> },
  roleManagement: { label: "Role Management", icon: <Shield className="w-6 h-6 mr-2" aria-label="Role Management" /> },
  flowMapping: { label: "Flow Mapping", icon: <GitBranch className="w-6 h-6 mr-2" aria-label="Flow Mapping" /> },
};
