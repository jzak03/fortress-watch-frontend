
'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { User, Bell, Shield, Palette, KeyRound } from 'lucide-react';

export default function SettingsPage() {
  const [userSettings, setUserSettings] = useState({
    name: 'Demo User',
    email: 'demo@example.com',
    emailNotifications: true,
    pushNotifications: false,
  });

  const handleSwitchChange = (field: keyof typeof userSettings) => (checked: boolean) => {
    setUserSettings(prev => ({ ...prev, [field]: checked }));
  };
  
  // Placeholder for save functionality
  const handleSaveChanges = () => {
    console.log("Saving settings:", userSettings);
    // Here you would typically call an API to save the settings
    // For now, we'll just log to console.
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
      <CardDescription>Manage your account settings, notification preferences, and security options.</CardDescription>
      
      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general"><User className="mr-2 h-4 w-4" />General</TabsTrigger>
          <TabsTrigger value="notifications"><Bell className="mr-2 h-4 w-4" />Notifications</TabsTrigger>
          <TabsTrigger value="security"><Shield className="mr-2 h-4 w-4" />Security</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your personal details.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="name">Name</Label>
                <Input id="name" defaultValue={userSettings.name} placeholder="Your Name" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" defaultValue={userSettings.email} placeholder="your@email.com" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Palette className="h-5 w-5 text-primary"/>Theme Preferences</CardTitle>
              <CardDescription>Customize the look and feel of the application.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Theme customization options will be available here. (e.g., Light/Dark mode toggle)</p>
              {/* Example:
              <div className="flex items-center space-x-2 mt-2">
                <Switch id="dark-mode" />
                <Label htmlFor="dark-mode">Dark Mode</Label>
              </div>
              */}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>Choose how you want to be notified.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                <div className="space-y-0.5">
                  <Label htmlFor="emailNotifications" className="text-base">Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">Receive important updates and alerts via email.</p>
                </div>
                <Switch
                  id="emailNotifications"
                  checked={userSettings.emailNotifications}
                  onCheckedChange={handleSwitchChange('emailNotifications')}
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                <div className="space-y-0.5">
                  <Label htmlFor="pushNotifications" className="text-base">Push Notifications</Label>
                  <p className="text-sm text-muted-foreground">Get real-time alerts directly on your device (if supported).</p>
                </div>
                <Switch
                  id="pushNotifications"
                  checked={userSettings.pushNotifications}
                  onCheckedChange={handleSwitchChange('pushNotifications')}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><KeyRound className="h-5 w-5 text-primary"/>Password Management</CardTitle>
              <CardDescription>Change your password regularly to keep your account secure.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="current-password">Current Password</Label>
                <Input id="current-password" type="password" placeholder="Enter current password" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="new-password">New Password</Label>
                <Input id="new-password" type="password" placeholder="Enter new password" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <Input id="confirm-password" type="password" placeholder="Confirm new password" />
              </div>
              <Button>Change Password</Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Two-Factor Authentication (2FA)</CardTitle>
              <CardDescription>Add an extra layer of security to your account.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">Two-Factor Authentication is currently <span className="font-semibold">Disabled</span>.</p>
              <Button variant="outline">Enable 2FA</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <Separator />
      
      <div className="flex justify-end">
        <Button onClick={handleSaveChanges}>Save Changes</Button>
      </div>
    </div>
  );
}
