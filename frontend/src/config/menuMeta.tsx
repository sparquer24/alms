import {
  FilePlus, Inbox, Send, FolderCheck, Archive, FileEdit, BarChart2, LogOut
} from "lucide-react";

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
  | 'logout';

export const menuMeta: Record<MenuMetaKey, { label: string; icon: React.ReactNode }> = {
  freshform: { label: "Fresh Form", icon: <FilePlus className="w-6 h-6 mr-2" aria-label="Fresh Form" /> },
  inbox: { label: "Inbox", icon: <Inbox className="w-6 h-6 mr-2" aria-label="Inbox" /> },
  sent: { label: "Sent", icon: <Send className="w-6 h-6 mr-2" aria-label="Sent" /> },
  closed: { label: "Closed", icon: <FolderCheck className="w-6 h-6 mr-2" aria-label="Closed" /> },
  final: { label: "Final Disposal", icon: <Archive className="w-6 h-6 mr-2" aria-label="Final Disposal" /> },
  finaldisposal: { label: "Final Disposal", icon: <Archive className="w-6 h-6 mr-2" aria-label="Final Disposal" /> },
  drafts: { label: "Drafts", icon: <FileEdit className="w-6 h-6 mr-2" aria-label="Drafts" /> },
  reports: { label: "My Reports", icon: <BarChart2 className="w-6 h-6 mr-2" aria-label="My Reports" /> },
  analytics: { label: "Analytics", icon: <BarChart2 className="w-6 h-6 mr-2" aria-label="Analytics" /> },
  logout: { label: "Log Out", icon: <LogOut className="w-6 h-6 mr-2" aria-label="Log Out" /> },
};
