
import type { Metadata } from 'next';
import Link from 'next/link';
import { Shield, LayoutDashboard, List, History, ScanSearch, Settings2, LogOut, CircleUser, Search, Bell, FileText, PanelLeft } from 'lucide-react';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  SidebarInset,
} from '@/components/ui/sidebar';
import { Button, buttonVariants } from '@/components/ui/button'; // Added buttonVariants
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { NavLinks } from '@/config/nav';
import { cn } from '@/lib/utils'; // Added cn
import { ThemeProvider } from '@/components/providers/ThemeProvider';

export const metadata: Metadata = {
  title: 'Vulntrack',
  description: 'Comprehensive Vulnerability Management Platform',
  icons: null,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SidebarProvider defaultOpen>
            <Sidebar>
              <SidebarHeader className="p-4">
                <Link href="/dashboard" className="flex items-center gap-2 text-xl font-semibold text-sidebar-foreground">
                  <Shield className="h-7 w-7 text-primary" suppressHydrationWarning />
                  <span className="group-data-[collapsible=icon]:hidden">Vulntrack</span>
                </Link>
              </SidebarHeader>
              <SidebarContent>
                <SidebarMenu>
                  {NavLinks.map((item) => (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton asChild tooltip={item.label}>
                        <Link href={item.href}>
                          <item.icon suppressHydrationWarning />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarContent>
              <SidebarFooter className="p-4">
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="Settings">
                      <Link href="/settings">
                        <Settings2 suppressHydrationWarning />
                        <span>Settings</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                      <SidebarMenuButton tooltip="Logout">
                        <LogOut suppressHydrationWarning />
                        <span>Logout</span>
                      </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarFooter>
            </Sidebar>
            <SidebarInset>
              <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 sm:px-6 shadow-sm">
                <SidebarTrigger className="md:hidden">
                  <PanelLeft suppressHydrationWarning />
                </SidebarTrigger>
                <div className="flex-1">
                  {/* Search can be added here if needed globally */}
                </div>
                <div className="flex items-center gap-4">
                  <DropdownMenu>
                    <DropdownMenuTrigger 
                      className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}
                      aria-label="Notifications"
                    >
                      <Bell className="h-5 w-5" suppressHydrationWarning />
                      <span className="sr-only">Notifications</span>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-80 sm:w-96">
                      <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-medium">New Scan Completed</p>
                          <p className="text-xs text-muted-foreground">Device FW-101 scan finished successfully.</p>
                          <p className="text-xs text-blue-500">2 minutes ago</p>
                        </div>
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-medium text-destructive">Critical Alert</p>
                          <p className="text-xs text-muted-foreground">High severity vulnerability found on Main-Router.</p>
                          <p className="text-xs text-destructive">15 minutes ago</p>
                        </div>
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-medium">Report Ready</p>
                          <p className="text-xs text-muted-foreground">Your 'Quarterly Summary' report is ready for download.</p>
                          <p className="text-xs text-blue-500">1 hour ago</p>
                        </div>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="justify-center">
                        <Button variant="link" size="sm" className="p-0 h-auto">View all notifications</Button>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <DropdownMenu>
                    <DropdownMenuTrigger 
                      className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "rounded-full")}
                      aria-label="User Menu"
                    >
                      <CircleUser className="h-6 w-6" suppressHydrationWarning />
                      <span className="sr-only">User Menu</span>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>My Account</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/profile">Profile</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/settings">Settings</Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>Logout</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </header>
              <main className="flex-1 p-4 sm:p-6 md:p-8">
                {children}
              </main>
            </SidebarInset>
          </SidebarProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
