"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Mail, Shield, User, KeyRound, Save } from "lucide-react";

import {
  useGetUserProfileQuery,
  useUpdateUserProfileMutation,
} from "@/store/slices/userProfileApiSlice";
import { toastHandler } from "@/lib/toast";

export default function UserProfilePage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.user_id as string; // ✅ only for UI

  const { data: user, isLoading, isError, refetch } = useGetUserProfileQuery();

  const [updateUserProfile, { isLoading: isUpdating }] =
    useUpdateUserProfileMutation();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // ✅ preload form
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        name: user.name || "",
        email: user.email || "",
      }));
    }
  }, [user]);

  // ✅ input handler
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError("");
    setSuccessMessage("");

    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ✅ submit handler
  const handleSubmit = async () => {
    setError("");
    setSuccessMessage("");

    if (!formData.name.trim()) {
      setError("Name is required.");
      return;
    }

    if (!formData.email.trim()) {
      setError("Email is required.");
      return;
    }

    if (formData.password && formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      const payload: {
        name?: string;
        email?: string;
        password?: string;
      } = {
        name: formData.name.trim(),
        email: formData.email.trim(),
      };

      if (formData.password.trim()) {
        payload.password = formData.password.trim();
      }

      await toastHandler({
        action: async () => {
          await updateUserProfile(payload).unwrap();
          await refetch();
        },
        loading: "Updating profile...",
        success: "Profile updated successfully",
      });

      // clear passwords after success
      setFormData((prev) => ({
        ...prev,
        password: "",
        confirmPassword: "",
      }));
    } catch (err: any) {
      console.error(err);
    }
  };

  // 🔄 loading
  if (isLoading) {
    return (
      <DashboardLayout title="Loading profile...">
        <p className="py-10 text-sm text-muted-foreground">
          Fetching profile...
        </p>
      </DashboardLayout>
    );
  }

  // ❌ error
  if (isError || !user) {
    return (
      <DashboardLayout title="Profile Not Found">
        <div className="flex flex-col items-center py-12">
          <p className="text-muted-foreground">Unable to load profile.</p>
          <Button
            className="mt-4"
            variant="outline"
            onClick={() => router.push("/dashboard")}
          >
            Back
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="My Profile" subtitle="Manage your account">
      {/* 🔙 Back */}
      <div className="mb-6 flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => router.push("/dashboard")}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>

        {/* ✅ Route debug */}
        <span className="text-xs text-muted-foreground">
          Profile ID: {userId}
        </span>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        {/* 👤 LEFT PANEL */}
        <div className="xl:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Profile Overview
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="flex flex-col items-center text-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-2xl font-semibold text-primary">
                  {user.name?.charAt(0)?.toUpperCase()}
                </div>

                <h2 className="mt-4 text-lg font-semibold">{user.name}</h2>

                <p className="text-sm text-muted-foreground">{user.email}</p>

                <span className="mt-2 rounded-full border px-3 py-1 text-xs capitalize">
                  {user.role}
                </span>
              </div>

              <div className="space-y-4 border-t pt-4">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{user.email}</span>
                </div>

                <div className="flex items-center gap-3">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <span className="capitalize">{user.role}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ✏️ RIGHT PANEL */}
        <div className="xl:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Save className="h-5 w-5 text-primary" />
                Update Profile
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-6">
              {error && <div className="text-sm text-red-600">{error}</div>}

              {successMessage && (
                <div className="text-sm text-green-600">{successMessage}</div>
              )}

              <div className="grid gap-5 md:grid-cols-2">
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Full Name"
                  className="input"
                />

                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Email"
                  className="input"
                />

                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="New Password"
                  className="input"
                />

                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm Password"
                  className="input"
                />
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSubmit} disabled={isUpdating}>
                  <Save className="mr-2 h-4 w-4" />
                  {isUpdating ? "Updating..." : "Save Changes"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
