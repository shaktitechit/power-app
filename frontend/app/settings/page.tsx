'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  User,
  Bell,
  Shield,
  Palette,
  Database,
  Download,
  Save,
} from 'lucide-react';

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    name: 'Admin User',
    email: 'admin@poweraudit.com',
    notifications: {
      email: true,
      push: false,
      auditComplete: true,
      newFacility: true,
    },
    preferences: {
      theme: 'dark',
      language: 'en',
      timezone: 'IST',
    },
  });

  const handleSaveProfile = () => {
    console.log('Saving profile:', settings);
  };

  const handleExportData = () => {
    console.log('Exporting data...');
  };

  return (
    <DashboardLayout title="Settings" subtitle="Manage your account and preferences">
      <div className="max-w-3xl space-y-4 sm:space-y-6">
        {/* Profile Settings */}
        <Card className="border-border bg-card">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-base text-card-foreground sm:text-lg">
              <User className="h-5 w-5 text-primary" />
              Profile Settings
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Update your personal information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-4 pt-0 sm:p-6 sm:pt-0">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-foreground">Full Name</Label>
                <Input
                  id="name"
                  value={settings.name}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="bg-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={settings.email}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, email: e.target.value }))
                  }
                  className="bg-input"
                />
              </div>
            </div>
            <Button onClick={handleSaveProfile} className="w-full sm:w-auto">
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card className="border-border bg-card">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-base text-card-foreground sm:text-lg">
              <Bell className="h-5 w-5 text-primary" />
              Notifications
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Configure how you receive notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-4 pt-0 sm:p-6 sm:pt-0">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0 space-y-0.5">
                <Label className="text-sm text-foreground">Email Notifications</Label>
                <p className="text-xs text-muted-foreground sm:text-sm">
                  Receive notifications via email
                </p>
              </div>
              <Switch
                checked={settings.notifications.email}
                onCheckedChange={(checked) =>
                  setSettings((prev) => ({
                    ...prev,
                    notifications: { ...prev.notifications, email: checked },
                  }))
                }
              />
            </div>
            <Separator className="bg-border" />
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0 space-y-0.5">
                <Label className="text-sm text-foreground">Push Notifications</Label>
                <p className="text-xs text-muted-foreground sm:text-sm">
                  Receive push notifications in browser
                </p>
              </div>
              <Switch
                checked={settings.notifications.push}
                onCheckedChange={(checked) =>
                  setSettings((prev) => ({
                    ...prev,
                    notifications: { ...prev.notifications, push: checked },
                  }))
                }
              />
            </div>
            <Separator className="bg-border" />
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0 space-y-0.5">
                <Label className="text-sm text-foreground">Audit Completion Alerts</Label>
                <p className="text-xs text-muted-foreground sm:text-sm">
                  Notify when an audit is completed
                </p>
              </div>
              <Switch
                checked={settings.notifications.auditComplete}
                onCheckedChange={(checked) =>
                  setSettings((prev) => ({
                    ...prev,
                    notifications: {
                      ...prev.notifications,
                      auditComplete: checked,
                    },
                  }))
                }
              />
            </div>
            <Separator className="bg-border" />
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0 space-y-0.5">
                <Label className="text-sm text-foreground">New Facility Alerts</Label>
                <p className="text-xs text-muted-foreground sm:text-sm">
                  Notify when a new facility is added
                </p>
              </div>
              <Switch
                checked={settings.notifications.newFacility}
                onCheckedChange={(checked) =>
                  setSettings((prev) => ({
                    ...prev,
                    notifications: {
                      ...prev.notifications,
                      newFacility: checked,
                    },
                  }))
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Preferences */}
        <Card className="border-border bg-card">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-base text-card-foreground sm:text-lg">
              <Palette className="h-5 w-5 text-primary" />
              Preferences
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Customize your experience
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-4 pt-0 sm:p-6 sm:pt-0">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="theme" className="text-foreground">Theme</Label>
                <Select
                  value={settings.preferences.theme}
                  onValueChange={(value) =>
                    setSettings((prev) => ({
                      ...prev,
                      preferences: { ...prev.preferences, theme: value },
                    }))
                  }
                >
                  <SelectTrigger className="bg-input">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="language" className="text-foreground">Language</Label>
                <Select
                  value={settings.preferences.language}
                  onValueChange={(value) =>
                    setSettings((prev) => ({
                      ...prev,
                      preferences: { ...prev.preferences, language: value },
                    }))
                  }
                >
                  <SelectTrigger className="bg-input">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="hi">Hindi</SelectItem>
                    <SelectItem value="ta">Tamil</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="timezone" className="text-foreground">Timezone</Label>
                <Select
                  value={settings.preferences.timezone}
                  onValueChange={(value) =>
                    setSettings((prev) => ({
                      ...prev,
                      preferences: { ...prev.preferences, timezone: value },
                    }))
                  }
                >
                  <SelectTrigger className="bg-input">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="IST">IST (UTC+5:30)</SelectItem>
                    <SelectItem value="UTC">UTC</SelectItem>
                    <SelectItem value="EST">EST (UTC-5)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Management */}
        <Card className="border-border bg-card">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-base text-card-foreground sm:text-lg">
              <Database className="h-5 w-5 text-primary" />
              Data Management
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Export and manage your data
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
            <div className="flex flex-col gap-3 rounded-lg border border-border bg-muted/30 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">Export All Data</p>
                <p className="text-xs text-muted-foreground sm:text-sm">
                  Download all your facilities and audit data
                </p>
              </div>
              <Button variant="outline" onClick={handleExportData} className="w-full sm:w-auto">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card className="border-border bg-card">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-base text-card-foreground sm:text-lg">
              <Shield className="h-5 w-5 text-primary" />
              Security
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Manage your account security
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-4 pt-0 sm:p-6 sm:pt-0">
            <div className="flex flex-col gap-3 rounded-lg border border-border bg-muted/30 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">Change Password</p>
                <p className="text-xs text-muted-foreground sm:text-sm">
                  Update your account password
                </p>
              </div>
              <Button variant="outline" className="w-full sm:w-auto">Change</Button>
            </div>
            <div className="flex flex-col gap-3 rounded-lg border border-border bg-muted/30 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">
                  Two-Factor Authentication
                </p>
                <p className="text-xs text-muted-foreground sm:text-sm">
                  Add an extra layer of security
                </p>
              </div>
              <Button variant="outline" className="w-full sm:w-auto">Enable</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
