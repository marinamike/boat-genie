import { Ship, Building2, HardHat, Wrench } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { AppRole } from "@/hooks/useUserRole";

interface RoleSelectorProps {
  selectedRole: AppRole | null;
  onSelect: (role: AppRole) => void;
  disabled?: boolean;
}

// Three-profile architecture: Customer, Business, Staff
const roles = [
  {
    id: "boat_owner" as AppRole,
    title: "Customer",
    description: "Manage your vessel, request services, and track maintenance",
    icon: Ship,
  },
  {
    id: "provider" as AppRole,
    title: "Service Provider",
    description: "Offer marine services, manage jobs, and grow your business",
    icon: Wrench,
  },
  {
    id: "admin" as AppRole,
    title: "Business",
    description: "Manage marina operations, services, fuel, and retail",
    icon: Building2,
  },
  {
    id: "marina_staff" as AppRole,
    title: "Staff",
    description: "Work under a Business with assigned module permissions",
    icon: HardHat,
  },
];

export function RoleSelector({ selectedRole, onSelect, disabled }: RoleSelectorProps) {
  return (
    <div className="grid gap-3">
      {roles.map((role) => {
        const Icon = role.icon;
        const isSelected = selectedRole === role.id;

        return (
          <Card
            key={role.id}
            className={cn(
              "cursor-pointer transition-all hover:shadow-md",
              isSelected
                ? "ring-2 ring-primary border-primary bg-primary/5"
                : "hover:border-primary/50",
              disabled && "opacity-50 cursor-not-allowed"
            )}
            onClick={() => !disabled && onSelect(role.id)}
          >
            <CardContent className="flex items-center gap-4 p-4">
              <div
                className={cn(
                  "w-12 h-12 rounded-lg flex items-center justify-center",
                  isSelected ? "bg-primary text-primary-foreground" : "bg-secondary"
                )}
              >
                <Icon className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">{role.title}</h3>
                <p className="text-sm text-muted-foreground">{role.description}</p>
              </div>
              <div
                className={cn(
                  "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                  isSelected ? "border-primary bg-primary" : "border-muted-foreground"
                )}
              >
                {isSelected && <div className="w-2 h-2 rounded-full bg-primary-foreground" />}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
