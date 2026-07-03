import {
  FilePlus,
  Inbox,
  Send,
  FolderCheck,
  Archive,
  FileEdit,
  BarChart2,
  LogOut,
  Users,
  Shield,
  GitBranch,
  RefreshCcw,
  MapPin,
  FileText,
  List,
  XCircle,
} from 'lucide-react';

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
const RefreshCcwFixed = RefreshCcw as any;
const MapPinFixed = MapPin as any;
const FileTextFixed = FileText as any;
const ListFixed = List as any;
const XCircleFixed = XCircle as any;

// Fix: Add a type-safe mapping for menuMeta keys
export type MenuMetaKey =
  | 'freshform'
  | 'inbox'
  | 'sent'
  | 'closed'
  | 'final'
  | 'applications'
  | 'drafts'
  | 'reports'
  | 'analytics' // New analytics tab
  | 'cancelform' // Cancel Form workflow
  | 'logout'
  | 'userManagement'
  | 'roleManagement'
  | 'roleMapping'
  | 'flowMapping'
  | 'locationsManagement'
  | 'actionMapping'
  | 'rejected';

export const menuMeta: Record<MenuMetaKey, { label: string; icon: () => React.ReactNode }> = {
  // use the `*Fixed` any-casted aliases above to avoid React type mismatch errors
  freshform: {
    label: 'New Forms',
    icon: () => <FilePlusFixed className='w-5 h-5' aria-label='New Forms' />,
  },
  inbox: { label: 'Inbox', icon: () => <InboxFixed className='w-5 h-5' aria-label='Inbox' /> },
  sent: { label: 'Sent', icon: () => <SendFixed className='w-5 h-5' aria-label='Sent' /> },
  closed: {
    label: 'Closed',
    icon: () => <FolderCheckFixed className='w-5 h-5' aria-label='Closed' />,
  },
  final: {
    label: 'Final Disposal',
    icon: () => <ArchiveFixed className='w-5 h-5' aria-label='Final Disposal' />,
  },
  applications: {
    label: 'Applications',
    icon: () => <ListFixed className='w-5 h-5' aria-label='Applications' />,
  },
  rejected: {
    label: 'Rejected',
    icon: () => <ArchiveFixed className='w-5 h-5' aria-label='Rejected' />,
  },
  drafts: {
    label: 'Drafts',
    icon: () => <FileEditFixed className='w-5 h-5' aria-label='Drafts' />,
  },
  reports: {
    label: 'My Reports',
    icon: () => <BarChart2Fixed className='w-5 h-5' aria-label='My Reports' />,
  },
  analytics: {
    label: 'Analytics',
    icon: () => <BarChart2Fixed className='w-5 h-5' aria-label='Analytics' />,
  },
  cancelform: {
    label: 'Cancel Form',
    icon: () => <XCircleFixed className='w-5 h-5' aria-label='Cancel Form' />,
  },
  logout: {
    label: 'Log Out',
    icon: () => <LogOutFixed className='w-5 h-5' aria-label='Log Out' />,
  },
  userManagement: {
    label: 'User Management',
    icon: () => <UsersFixed className='w-5 h-5' aria-label='User Management' />,
  },
  roleManagement: {
    label: 'Role Management',
    icon: () => <ShieldFixed className='w-5 h-5' aria-label='Role Management' />,
  },
  roleMapping: {
    label: 'Role Management',
    icon: () => <ShieldFixed className='w-5 h-5' aria-label='Role Management' />,
  },
  flowMapping: {
    label: 'Flow Mapping',
    icon: () => <GitBranchFixed className='w-5 h-5' aria-label='Flow Mapping' />,
  },
  locationsManagement: {
    label: 'Locations Management',
    icon: () => <MapPinFixed className='w-5 h-5' aria-label='Locations Management' />,
  },
  actionMapping: {
    label: 'Action Mapping',
    icon: () => <ShieldFixed className='w-5 h-5' aria-label='Action Mapping' />,
  },
};
