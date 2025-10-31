import {
  FilePlus, Inbox, Send, FolderCheck, Archive, FileEdit, BarChart2, LogOut, Users, Shield, GitBranch
} from "lucide-react";

// Type assertions for lucide-react icons to fix React 18 compatibility
const FilePlusFixed = FilePlus as any;
const InboxFixed = Inbox as any;
const SendFixed = Send as any;
const FolderCheckFixed = FolderCheck as any;
const ArchiveFixed = Archive as any;
const FileEditFixed = FileEdit as any;
const BarChart2Fixed = BarChart2 as any;
const LogOutFixed = LogOut as any;
const UsersFixed = Users as any;
const ShieldFixed = Shield as any;
const GitBranchFixed = GitBranch as any;

// Fix: Add a type-safe mapping for menuMeta keys
export type MenuMetaKey =
  | 'freshform'
  | 'inbox'
  | 'sent'
  | 'closed'
  | 'final'
  | 'finaldisposal'
  | 'drafts'
  | 'reports'
  | 'analytics' // New analytics tab
  | 'logout'
  | 'userManagement'
  | 'roleManagement'
  | 'flowMapping' 
  | "rejected";

export const menuMeta: Record<MenuMetaKey, { label: string; icon: () => React.ReactNode }> = {
  // use the `*Fixed` any-casted aliases above to avoid React type mismatch errors
  freshform: { label: "Fresh Form", icon: () => <FilePlusFixed className="w-6 h-6 mr-2" aria-label="Fresh Form" /> },
  inbox: { label: "Inbox", icon: () => <InboxFixed className="w-6 h-6 mr-2" aria-label="Inbox" /> },
  sent: { label: "Sent", icon: () => <SendFixed className="w-6 h-6 mr-2" aria-label="Sent" /> },
  closed: { label: "Closed", icon: () => <FolderCheckFixed className="w-6 h-6 mr-2" aria-label="Closed" /> },
  final: { label: "Final Disposal", icon: () => <ArchiveFixed className="w-6 h-6 mr-2" aria-label="Final Disposal" /> },
  finaldisposal: { label: "Final Disposal", icon: () => <ArchiveFixed className="w-6 h-6 mr-2" aria-label="Final Disposal" /> },
  rejected: { label: "Rejected", icon: () => <ArchiveFixed className="w-6 h-6 mr-2" aria-label="Rejected" /> },
  drafts: { label: "Drafts", icon: () => <FileEditFixed className="w-6 h-6 mr-2" aria-label="Drafts" /> },
  reports: { label: "My Reports", icon: () => <BarChart2Fixed className="w-6 h-6 mr-2" aria-label="My Reports" /> },
  analytics: { label: "Analytics", icon: () => <BarChart2Fixed className="w-6 h-6 mr-2" aria-label="Analytics" /> },
  logout: { label: "Log Out", icon: () => <LogOutFixed className="w-6 h-6 mr-2" aria-label="Log Out" /> },
  userManagement: { label: "User Management", icon: () => <UsersFixed className="w-6 h-6 mr-2" aria-label="User Management" /> },
  roleManagement: { label: "Role Management", icon: () => <ShieldFixed className="w-6 h-6 mr-2" aria-label="Role Management" /> },
  flowMapping: { label: "Flow Mapping", icon: () => <GitBranchFixed className="w-6 h-6 mr-2" aria-label="Flow Mapping" /> },
};
