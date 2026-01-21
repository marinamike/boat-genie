import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Users, Search, Loader2 } from "lucide-react";
import { format } from "date-fns";
import type { UserWithRole } from "@/hooks/useAdminDashboard";
import type { AppRole } from "@/contexts/AuthContext";

interface UserManagementProps {
  users: UserWithRole[];
  onUpdateRole: (userId: string, newRole: AppRole) => Promise<boolean>;
}

const ROLE_CONFIG: Record<AppRole, { label: string; color: string }> = {
  boat_owner: { label: "Owner", color: "bg-blue-500" },
  provider: { label: "Provider", color: "bg-green-500" },
  admin: { label: "Manager", color: "bg-purple-500" },
  marina_staff: { label: "Staff", color: "bg-orange-500" },
};

export function UserManagement({ users, onUpdateRole }: UserManagementProps) {
  const [search, setSearch] = useState("");
  const [updatingUser, setUpdatingUser] = useState<string | null>(null);

  const filteredUsers = users.filter((user) => {
    const searchLower = search.toLowerCase();
    return (
      user.email?.toLowerCase().includes(searchLower) ||
      user.full_name?.toLowerCase().includes(searchLower)
    );
  });

  const handleRoleChange = async (userId: string, newRole: AppRole) => {
    setUpdatingUser(userId);
    await onUpdateRole(userId, newRole);
    setUpdatingUser(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          User Management
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <ScrollArea className="h-[400px] pr-4">
          {filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No users found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredUsers.map((user) => {
                const roleConfig = ROLE_CONFIG[user.role];

                return (
                  <div
                    key={user.id}
                    className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">
                          {user.full_name || "Unnamed User"}
                        </p>
                        <p className="text-sm text-muted-foreground truncate">
                          {user.email}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Joined: {format(new Date(user.created_at), "PP")}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {updatingUser === user.id ? (
                          <Button variant="outline" size="sm" disabled>
                            <Loader2 className="w-4 h-4 animate-spin" />
                          </Button>
                        ) : (
                          <Select
                            value={user.role}
                            onValueChange={(value: AppRole) => handleRoleChange(user.id, value)}
                          >
                            <SelectTrigger className="w-[130px]">
                              <SelectValue>
                                <Badge className={`${roleConfig.color} text-white`}>
                                  {roleConfig.label}
                                </Badge>
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="boat_owner">Owner</SelectItem>
                              <SelectItem value="provider">Provider</SelectItem>
                              <SelectItem value="admin">Manager</SelectItem>
                              <SelectItem value="marina_staff">Staff</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
