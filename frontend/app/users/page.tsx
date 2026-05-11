"use client";

import { useMemo, useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { DataTable, Column } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

import {
  useAuditorsQuery,
  useRegisterMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
} from "@/store/slices/userApiSlice";

import {
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Shield,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  BarChart3
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PresenceStatusCell } from "@/components/presenceCellStatus";
import { usePresenceMap } from "@/hooks/presenceMap";
import { toastHandler } from "@/lib/toast";
import { useRouter } from "next/navigation";
import { useAppSelector } from "@/store/hooks";
import {
  ASSIGNABLE_USER_ROLES,
  formatRoleLabel,
  isPlatformAdmin,
  type AppUserRole,
} from "@/lib/authRoles";

type User = {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  status?: string;
  role?: AppUserRole;
  created_by?: {
    _id: string;
    name: string;
    email: string;
  } | string | null;
  appearance?: {
    status?: "online" | "away" | "offline" | string;
    lastSeen?: string | null;
  };
};

const ADMIN_MANAGEABLE_ROLES: AppUserRole[] = ["manager", "auditor"];
const PAGE_SIZE = 10;

const formatLastSeen = (value?: string | null) => {
  if (!value) return "No activity";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "No activity";

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();

  const minutes = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  if (hours < 24) return `${hours} hr ago`;
  if (days < 30) return `${days} day${days > 1 ? "s" : ""} ago`;

  return date.toLocaleDateString();
};

export default function UsersPage() {
  const router = useRouter();
  const currentUser = useAppSelector((state) => state.auth.user);
  const currentRole = currentUser?.role;
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const presenceMap = usePresenceMap();

  const [newUser, setNewUser] = useState<{
    name: string;
    email: string;
    password: string;
    role: AppUserRole;
  }>({
    name: "",
    email: "",
    password: "",
    role: "auditor",
  });

  const [editUser, setEditUser] = useState<{
    _id: string;
    name: string;
    email: string;
    password: string;
    role: AppUserRole;
  }>({
    _id: "",
    name: "",
    email: "",
    password: "",
    role: "auditor",
  });

  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const { data, isLoading, refetch } = useAuditorsQuery();
  const [registerUser, { isLoading: isCreating }] = useRegisterMutation();
  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation();
  const [deleteUser, { isLoading: isDeleting }] = useDeleteUserMutation();

  const users: User[] = data?.data || [];
  const canManageUsers = isPlatformAdmin(currentRole);
  const assignableRoles = useMemo(() => {
    if (currentRole === "super_admin") return ASSIGNABLE_USER_ROLES;
    if (currentRole === "admin") return ADMIN_MANAGEABLE_ROLES;
    return [];
  }, [currentRole]);
  const manageableRolesSet = useMemo(
    () => new Set(assignableRoles),
    [assignableRoles],
  );

  const visibleUsers = useMemo(() => {
    if (currentRole === "super_admin") return users;
    if (currentRole === "admin") {
      return users.filter((u) =>
        manageableRolesSet.has((u.role || "auditor") as AppUserRole),
      );
    }
    return [];
  }, [users, currentRole, manageableRolesSet]);

  const filteredUsers = useMemo(() => {
    return visibleUsers.filter(
      (user) =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [visibleUsers, searchQuery]);

  // Reset to page 1 whenever the search filter changes
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredUsers.slice(start, start + PAGE_SIZE);
  }, [filteredUsers, currentPage]);

  const isUserManageable = (user: User) => {
    if (currentRole === "super_admin") return true;
    if (currentRole === "admin") {
      return manageableRolesSet.has((user.role || "auditor") as AppUserRole);
    }
    return false;
  };

  const getMergedPresenceStatus = (user: User) => {
    return presenceMap[user._id] || user.appearance?.status || "offline";
  };

  const getMergedLastSeen = (user: User) => {
    const liveStatus = presenceMap[user._id];

    if (liveStatus === "online" || liveStatus === "away") {
      return "Live now";
    }

    return formatLastSeen(user.appearance?.lastSeen);
  };

  const handleOpenEdit = (user: User) => {
    if (!isUserManageable(user)) return;
    setEditUser({
      _id: user._id,
      name: user.name,
      email: user.email,
      password: "",
      role: user.role || "auditor",
    });
    setIsEditDialogOpen(true);
  };

  const handleOpenDelete = (user: User) => {
    if (!isUserManageable(user)) return;
    setSelectedUser(user);
    setIsDeleteDialogOpen(true);
  };

  const columns: Column<User>[] = [
    {
      key: "name",
      header: "User",
      render: (row) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-primary/10 text-primary">
              {row.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div>
            <p className="text-sm font-medium">{row.name}</p>
            <p className="text-xs text-muted-foreground">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "role",
      header: "Role",
      render: (row) => (
        <div className="flex items-center gap-2">
          {isPlatformAdmin(row.role) ? (
            <Shield className="h-4 w-4 text-primary" />
          ) : (
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          )}
          <span className="text-sm">{formatRoleLabel(row.role || "auditor")}</span>
        </div>
      ),
    },
    {
      key: "presence",
      header: "Presence",
      render: (row) => (
        <div className="space-y-1">
          <PresenceStatusCell status={getMergedPresenceStatus(row)} />
          <p className="text-xs text-muted-foreground">
            {getMergedLastSeen(row)}
          </p>
        </div>
      ),
    },
    {
      key: "created_by",
      header: "Created By",
      render: (row) => {
        const creator = row.created_by;
        if (!creator) {
          return <span className="text-xs text-muted-foreground">—</span>;
        }
        if (typeof creator === "string") {
          return <span className="text-xs text-muted-foreground">{creator}</span>;
        }
        return (
          <div>
            <p className="text-sm font-medium">{creator.name}</p>
            <p className="text-xs text-muted-foreground">{creator.email}</p>
          </div>
        );
      },
    },
    {
      key: "actions",
      header: "Actions",
      render: (row) => (
        <>
          <div className="hidden items-center gap-2 lg:flex">

            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={!isUserManageable(row)}
              onClick={() => handleOpenEdit(row)}
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
            <Button
              type="button"
              size="sm"
              variant="destructive"
              disabled={!isUserManageable(row)}
              onClick={() => handleOpenDelete(row)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>

          <div className="flex lg:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => router.push(`/users/${row._id}`)}>
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Performance
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={!isUserManageable(row)}
                  onClick={() => handleOpenEdit(row)}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={!isUserManageable(row)}
                  onClick={() => handleOpenDelete(row)}
                  className="text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </>
      ),
    },
  ];

  const handleAddUser = async () => {
    try {
      await toastHandler({
        action: async () => {
          await registerUser({
            name: newUser.name,
            email: newUser.email,
            password: newUser.password,
            role: newUser.role,
          }).unwrap();
        },
        loading: "Creating user...",
        success: "User created successfully",
      });

      setIsAddDialogOpen(false);
      setNewUser({
        name: "",
        email: "",
        password: "",
        role: "auditor",
      });

      refetch();
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditUser = async () => {
    try {
      await toastHandler({
        action: async () => {
          await updateUser({
            id: editUser._id,
            name: editUser.name,
            email: editUser.email,
            password: editUser.password || undefined,
            role: editUser.role,
          }).unwrap();
        },
        loading: "Updating user...",
        success: "User updated successfully",
      });

      setIsEditDialogOpen(false);
      setEditUser({
        _id: "",
        name: "",
        email: "",
        password: "",
        role: "auditor",
      });

      refetch();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser?._id) return;

    try {
      await toastHandler({
        action: async () => {
          await deleteUser(selectedUser._id).unwrap();
        },
        loading: "Deleting user...",
        success: "User deleted successfully",
      });

      setIsDeleteDialogOpen(false);
      setSelectedUser(null);
      refetch();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <DashboardLayout title="Users" subtitle="Manage system users and roles">
      <div className="mb-6 flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative min-w-0 w-full flex-1 sm:max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-9"
          />
        </div>

        <Button
          onClick={() => setIsAddDialogOpen(true)}
          className="w-full shrink-0 sm:w-auto"
          disabled={!canManageUsers || assignableRoles.length === 0}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add User
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={paginatedUsers}
        loading={isLoading}
        emptyMessage="No users found"
      />

      {/* Pagination controls */}
      <div className="mt-4 flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-sm text-muted-foreground">
          Showing {filteredUsers.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filteredUsers.length)} of {filteredUsers.length} user{filteredUsers.length !== 1 ? "s" : ""}
        </span>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0"
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <span className="min-w-[6rem] text-center text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0"
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            aria-label="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add User</DialogTitle>
            <DialogDescription>Create a new user account</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label>Name</Label>
              <Input
                value={newUser.name}
                onChange={(e) =>
                  setNewUser((p) => ({ ...p, name: e.target.value }))
                }
              />
            </div>

            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={newUser.email}
                onChange={(e) =>
                  setNewUser((p) => ({ ...p, email: e.target.value }))
                }
              />
            </div>

            <div>
              <Label>Password</Label>
              <Input
                type="password"
                value={newUser.password}
                onChange={(e) =>
                  setNewUser((p) => ({ ...p, password: e.target.value }))
                }
              />
            </div>

            <div>
              <Label>Role</Label>
              <Select
                value={newUser.role}
                onValueChange={(value: AppUserRole) =>
                  setNewUser((p) => ({
                    ...p,
                    role: value,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {assignableRoles.map((r) => (
                    <SelectItem key={r} value={r}>
                      {formatRoleLabel(r)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <p className="rounded-md border bg-muted/40 p-2 text-xs text-muted-foreground">
              Permissions are controlled by backend role policies.
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>

            <Button onClick={handleAddUser} disabled={isCreating}>
              {isCreating ? "Creating..." : "Add User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update user details</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label>Name</Label>
              <Input
                value={editUser.name}
                onChange={(e) =>
                  setEditUser((p) => ({ ...p, name: e.target.value }))
                }
              />
            </div>

            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={editUser.email}
                onChange={(e) =>
                  setEditUser((p) => ({ ...p, email: e.target.value }))
                }
              />
            </div>

            <div>
              <Label>Password</Label>
              <Input
                type="password"
                placeholder="Leave blank to keep current password"
                value={editUser.password}
                onChange={(e) =>
                  setEditUser((p) => ({ ...p, password: e.target.value }))
                }
              />
            </div>

            <div>
              <Label>Role</Label>
              <Select
                value={editUser.role}
                onValueChange={(value: AppUserRole) =>
                  setEditUser((p) => ({
                    ...p,
                    role: value,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {assignableRoles.map((r) => (
                    <SelectItem key={r} value={r}>
                      {formatRoleLabel(r)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <p className="rounded-md border bg-muted/40 p-2 text-xs text-muted-foreground">
              Permissions are controlled by backend role policies.
            </p>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancel
            </Button>

            <Button onClick={handleEditUser} disabled={isUpdating}>
              {isUpdating ? "Updating..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-medium">{selectedUser?.name}</span>? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>

            <Button
              variant="destructive"
              onClick={handleDeleteUser}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
