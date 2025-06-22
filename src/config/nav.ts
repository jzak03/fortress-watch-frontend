
import { LayoutDashboard, List, History, ScanSearch, FileText, CalendarClock, Bell, type LucideIcon } from 'lucide-react';

interface NavLink {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const NavLinks: NavLink[] = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
  },
  {
    href: '/devices',
    label: 'Devices',
    icon: List,
  },
  {
    href: '/scan-history',
    label: 'Scan History',
    icon: History,
  },
  {
    href: '/bulk-scan',
    label: 'Bulk Scan',
    icon: ScanSearch,
  },
  {
    href: '/scheduled-scans',
    label: 'Scheduled Scans',
    icon: CalendarClock,
  },
  {
    href: '/notifications',
    label: 'Notifications',
    icon: Bell,
  },
  {
    href: '/reports',
    label: 'Reports',
    icon: FileText,
  },
];
