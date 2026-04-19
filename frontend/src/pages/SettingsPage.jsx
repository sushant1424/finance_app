import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { usersApi } from "@/api/endpoints";
import { useAuth } from "@/store/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

export default function SettingsPage() {
  const { user, refetchUser, logout } = useAuth();
  
  const [profile, setProfile] = useState({ name: user?.name || "", email: user?.email || "", currency: user?.currency || "USD" });
  const [passwords, setPasswords] = useState({ current_password: "", new_password: "", confirm_password: "" });

  const profileMutation = useMutation({
    mutationFn: usersApi.updateProfile,
    onSuccess: () => {
      toast.success("Profile updated");
      refetchUser();
    },
    onError: () => toast.error("Failed to update profile")
  });

  const passwordMutation = useMutation({
    mutationFn: usersApi.changePassword,
    onSuccess: () => {
      toast.success("Password changed successfully");
      setPasswords({ current_password: "", new_password: "", confirm_password: "" });
    },
    onError: (err) => toast.error(err.response?.data?.detail || "Failed to change password")
  });

  const deleteMutation = useMutation({
    mutationFn: usersApi.deleteProfile,
    onSuccess: () => {
      toast.success("Account deleted");
      logout();
    }
  });

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account settings and preferences.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile Details</CardTitle>
          <CardDescription>Update your personal information and currency.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); profileMutation.mutate(profile); }}>
            <div className="grid gap-2">
              <Label>Full Name</Label>
              <Input required value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} />
            </div>
            <div className="grid gap-2">
              <Label>Email</Label>
              <Input disabled value={profile.email} />
              <p className="text-xs text-muted-foreground">Email cannot be changed.</p>
            </div>
            <div className="grid gap-2">
              <Label>Preferred Currency</Label>
              <Input required value={profile.currency} onChange={e => setProfile({...profile, currency: e.target.value})} maxLength={5}/>
            </div>
            <Button type="submit" disabled={profileMutation.isPending}>Save Profile</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>Update your password to keep your account secure.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); passwordMutation.mutate(passwords); }}>
            <div className="grid gap-2">
              <Label>Current Password</Label>
              <Input required type="password" value={passwords.current_password} onChange={e => setPasswords({...passwords, current_password: e.target.value})} />
            </div>
            <div className="grid gap-2">
              <Label>New Password</Label>
              <Input required type="password" value={passwords.new_password} onChange={e => setPasswords({...passwords, new_password: e.target.value})} />
            </div>
            <div className="grid gap-2">
              <Label>Confirm New Password</Label>
              <Input required type="password" value={passwords.confirm_password} onChange={e => setPasswords({...passwords, confirm_password: e.target.value})} />
            </div>
            <Button type="submit" disabled={passwordMutation.isPending}>Change Password</Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-destructive/50">
        <CardHeader className="bg-destructive/5">
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>Permanently delete your account and all financial data.</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <Button variant="destructive" onClick={() => { if(window.confirm("Are you ABSOLUTELY sure? This will delete ALL your data and cannot be undone.")) deleteMutation.mutate(); }}>
            Delete Account
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
