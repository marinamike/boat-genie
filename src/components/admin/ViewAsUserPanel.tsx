import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Eye, X } from "lucide-react";
import type { UserWithRole } from "@/hooks/useAdminDashboard";
import type { AppRole } from "@/contexts/AuthContext";

interface ViewAsUserPanelProps {
  users: UserWithRole[];
  viewAsUserId: string | null;
  onViewAsUser: (userId: string | null) => void;
}

const ROLE_LABELS: Record<AppRole, string> = {
  boat_owner: "Customer",
  provider: "Service Provider",
  admin: "Business",
  marina_staff: "Staff",
};

export function ViewAsUserPanel({ users, viewAsUserId, onViewAsUser }: ViewAsUserPanelProps) {
  const [selectedUserId, setSelectedUserId] = useState<string>("");

  const selectedUser = users.find(u => u.id === viewAsUserId);
  const previewUser = users.find(u => u.id === selectedUserId);

  const handleViewAs = () => {
    if (selectedUserId) {
      onViewAsUser(selectedUserId);
    }
  };

  const handleExitViewAs = () => {
    onViewAsUser(null);
    setSelectedUserId("");
  };

  if (viewAsUserId && selectedUser) {
    return (
      <Card className="border-2 border-yellow-500 bg-yellow-500/10">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Eye className="w-5 h-5 text-yellow-600" />
              <div>
                <p className="font-semibold text-yellow-700 dark:text-yellow-500">
                  Viewing as: {selectedUser.full_name || selectedUser.email}
                </p>
                <p className="text-sm text-muted-foreground">
                  Role: {ROLE_LABELS[selectedUser.role]}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExitViewAs}
              className="border-yellow-500 text-yellow-700 hover:bg-yellow-500/20"
            >
              <X className="w-4 h-4 mr-1" />
              Exit View
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Eye className="w-5 h-5" />
          View App As...
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-3">
          <Select value={selectedUserId} onValueChange={setSelectedUserId}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Select a user to impersonate..." />
            </SelectTrigger>
            <SelectContent>
              {users.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  <div className="flex items-center gap-2">
                    <span>{user.full_name || user.email || "Unknown"}</span>
                    <span className="text-xs text-muted-foreground">
                      ({ROLE_LABELS[user.role]})
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={handleViewAs}
            disabled={!selectedUserId}
            className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
          >
            <Eye className="w-4 h-4 mr-2" />
            View
          </Button>
        </div>
        {previewUser && (
          <p className="text-sm text-muted-foreground mt-2">
            Preview: You'll see the app as {previewUser.full_name || previewUser.email} 
            with the {ROLE_LABELS[previewUser.role]} role
          </p>
        )}
      </CardContent>
    </Card>
  );
}
