import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { UserPlus, Trash2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useBusiness } from "@/contexts/BusinessContext";
import { useToast } from "@/hooks/use-toast";
import { Database } from "@/integrations/supabase/types";

type BusinessModule = Database["public"]["Enums"]["business_module"];

interface StaffMember {
  id: string;
  user_id: string;
  status: string;
  job_title: string | null;
  module_permissions: Record<string, { read?: boolean; write?: boolean }>;
  invited_at: string;
  accepted_at: string | null;
  profile?: {
    email: string | null;
    full_name: string | null;
  };
}

const moduleLabels: Record<BusinessModule, string> = {
  slips: "Slips",
  service: "Service",
  fuel: "Fuel",
  ship_store: "Store",
  store: "Store",
};

export function StaffManager() {
  const { business, enabledModules, isOwner } = useBusiness();
  const { toast } = useToast();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    if (business?.id) {
      fetchStaff();
    }
  }, [business?.id]);

  const fetchStaff = async () => {
    if (!business) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("business_staff")
        .select("*")
        .eq("business_id", business.id);

      if (error) throw error;
      
      // Cast the data to handle JSONB type
      const typedData = (data || []).map((item) => ({
        ...item,
        module_permissions: (item.module_permissions || {}) as Record<string, { read?: boolean; write?: boolean }>,
      }));
      setStaff(typedData);
    } catch (error) {
      console.error("Error fetching staff:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async () => {
    if (!business || !inviteEmail.trim()) return;

    setInviting(true);
    try {
      // For now, create a pending staff record
      // In production, you'd send an email invite
      const { error } = await supabase.from("business_staff").insert({
        business_id: business.id,
        user_id: crypto.randomUUID(), // Placeholder - would be resolved when user accepts
        status: "pending",
        module_permissions: {},
      });

      if (error) throw error;

      toast({
        title: "Invite Sent",
        description: `Invitation sent to ${inviteEmail}`,
      });
      setInviteEmail("");
      fetchStaff();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send invite",
        variant: "destructive",
      });
    } finally {
      setInviting(false);
    }
  };

  const updatePermission = async (
    staffId: string,
    module: BusinessModule,
    permission: "read" | "write",
    value: boolean
  ) => {
    const member = staff.find((s) => s.id === staffId);
    if (!member) return;

    const newPermissions = {
      ...member.module_permissions,
      [module]: {
        ...member.module_permissions[module],
        [permission]: value,
      },
    };

    try {
      const { error } = await supabase
        .from("business_staff")
        .update({ module_permissions: newPermissions })
        .eq("id", staffId);

      if (error) throw error;

      setStaff((prev) =>
        prev.map((s) =>
          s.id === staffId ? { ...s, module_permissions: newPermissions } : s
        )
      );
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update permissions",
        variant: "destructive",
      });
    }
  };

  const removeStaff = async (staffId: string) => {
    try {
      const { error } = await supabase
        .from("business_staff")
        .delete()
        .eq("id", staffId);

      if (error) throw error;

      setStaff((prev) => prev.filter((s) => s.id !== staffId));
      toast({
        title: "Staff Removed",
        description: "Staff member has been removed.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to remove staff",
        variant: "destructive",
      });
    }
  };

  if (!isOwner) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Staff Management</CardTitle>
          <CardDescription>Only business owners can manage staff.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Staff Management</CardTitle>
        <CardDescription>
          Invite team members and configure their module access permissions.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Invite Form */}
        <div className="flex gap-2">
          <Input
            placeholder="staff@example.com"
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
          />
          <Button onClick={handleInvite} disabled={inviting || !inviteEmail.trim()}>
            {inviting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <UserPlus className="w-4 h-4" />
            )}
            <span className="ml-2">Invite</span>
          </Button>
        </div>

        {/* Staff List */}
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : staff.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No staff members yet. Invite your first team member above.
          </p>
        ) : (
          <div className="space-y-4">
            {staff.map((member) => (
              <div key={member.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">
                      {member.profile?.full_name || member.profile?.email || "Pending User"}
                    </p>
                    <Badge variant={member.status === "active" ? "default" : "secondary"}>
                      {member.status}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeStaff(member.id)}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>

                {/* Module Permissions */}
                <div className="grid grid-cols-2 gap-2 pt-2">
                  {enabledModules.map((module) => (
                    <div key={module} className="flex items-center gap-4 text-sm">
                      <span className="w-16 font-medium">{moduleLabels[module]}</span>
                      <label className="flex items-center gap-1">
                        <Checkbox
                          checked={member.module_permissions[module]?.read || false}
                          onCheckedChange={(checked) =>
                            updatePermission(member.id, module, "read", !!checked)
                          }
                        />
                        <span>Read</span>
                      </label>
                      <label className="flex items-center gap-1">
                        <Checkbox
                          checked={member.module_permissions[module]?.write || false}
                          onCheckedChange={(checked) =>
                            updatePermission(member.id, module, "write", !!checked)
                          }
                        />
                        <span>Write</span>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
