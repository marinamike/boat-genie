import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ClipboardCheck, 
  Briefcase, 
  UserCheck, 
  Loader2,
  Shield,
  HardHat
} from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";
import { useQCQueue } from "@/hooks/useQCQueue";
import { QCQueueList } from "@/components/operations/QCQueueList";
import { QCInspector } from "@/components/operations/QCInspector";
import { JobBoardGlobal } from "@/components/operations/JobBoardGlobal";
import { ProviderApprovalQueue } from "@/components/admin/ProviderApprovalQueue";
// BottomNav removed - handled by StaffLayout
import type { QCQueueItem } from "@/hooks/useQCQueue";

export default function Operations() {
  const navigate = useNavigate();
  const { isAdmin, isMarinaStaff, loading: roleLoading, marina } = useUserRole();
  const { qcQueue, activeJobs, upcomingJobs, loading: queueLoading, refetch } = useQCQueue();
  const [selectedItem, setSelectedItem] = useState<QCQueueItem | null>(null);

  // Role-based redirects are now handled by App.tsx RoleBasedRoutes

  if (roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading operations...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin && !isMarinaStaff) {
    return null;
  }

  const handleItemSelect = (item: QCQueueItem) => {
    setSelectedItem(item);
  };

  const handleBack = () => {
    setSelectedItem(null);
  };

  const handleComplete = () => {
    setSelectedItem(null);
    refetch();
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <HardHat className="w-8 h-8" />
            <h1 className="text-2xl font-bold">Operations</h1>
          </div>
          <p className="text-primary-foreground/80">
            {isMarinaStaff && marina 
              ? `${marina.marina_name} - Runner Dashboard`
              : "Platform-wide operations management"
            }
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4">
        {/* Access indicator */}
        <div className="flex items-center gap-2 p-3 bg-primary/10 border border-primary/20 rounded-lg text-sm mb-4">
          <Shield className="w-4 h-4 text-primary" />
          <span className="text-primary">
            {isAdmin 
              ? "Admin access - All regions visible" 
              : `Marina Staff access - ${marina?.marina_name || "Pending marina assignment"}`
            }
          </span>
        </div>

        {/* Inspector View (when item selected) */}
        {selectedItem ? (
          <QCInspector
            item={selectedItem}
            onBack={handleBack}
            onComplete={handleComplete}
          />
        ) : (
          /* Main Tabs */
          <Tabs defaultValue="qc" className="space-y-4">
            <TabsList className={`grid w-full ${isAdmin ? "grid-cols-3" : "grid-cols-2"}`}>
              <TabsTrigger value="qc" className="flex items-center gap-2 relative">
                <ClipboardCheck className="w-4 h-4" />
                <span>QC Queue</span>
                {qcQueue.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {qcQueue.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="jobs" className="flex items-center gap-2">
                <Briefcase className="w-4 h-4" />
                <span>Job Board</span>
              </TabsTrigger>
              {isAdmin && (
                <TabsTrigger value="approvals" className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4" />
                  <span>Approvals</span>
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="qc" className="mt-4">
              <QCQueueList
                items={qcQueue}
                loading={queueLoading}
                onSelectItem={handleItemSelect}
              />
            </TabsContent>

            <TabsContent value="jobs" className="mt-4">
              <JobBoardGlobal
                activeJobs={activeJobs}
                upcomingJobs={upcomingJobs}
                loading={queueLoading}
              />
            </TabsContent>

            {isAdmin && (
              <TabsContent value="approvals" className="mt-4">
                <ProviderApprovalQueue />
              </TabsContent>
            )}
          </Tabs>
        )}
      </div>

      {/* BottomNav handled by StaffLayout */}
    </div>
  );
}
