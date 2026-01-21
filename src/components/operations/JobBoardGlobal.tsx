import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Briefcase, 
  Clock, 
  PlayCircle, 
  Calendar,
  AlertTriangle,
  CheckCircle,
  User
} from "lucide-react";
import { format } from "date-fns";
import type { ActiveWorkOrder } from "@/hooks/useQCQueue";

interface JobBoardGlobalProps {
  activeJobs: ActiveWorkOrder[];
  upcomingJobs: ActiveWorkOrder[];
  loading: boolean;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: "Pending", color: "bg-yellow-500/20 text-yellow-700", icon: Clock },
  assigned: { label: "Assigned", color: "bg-blue-500/20 text-blue-700", icon: User },
  in_progress: { label: "In Progress", color: "bg-purple-500/20 text-purple-700", icon: PlayCircle },
  completed: { label: "Completed", color: "bg-green-500/20 text-green-700", icon: CheckCircle },
};

function JobCard({ job }: { job: ActiveWorkOrder }) {
  const status = STATUS_CONFIG[job.status] || STATUS_CONFIG.pending;
  const StatusIcon = status.icon;

  return (
    <div className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold truncate">{job.title}</span>
            {job.is_emergency && (
              <Badge variant="destructive" className="text-xs">
                <AlertTriangle className="w-3 h-3" />
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{job.boat_name}</p>
          {job.provider_name && (
            <p className="text-xs text-muted-foreground mt-1">
              Provider: {job.provider_name}
            </p>
          )}
        </div>
        <Badge className={status.color}>
          <StatusIcon className="w-3 h-3 mr-1" />
          {status.label}
        </Badge>
      </div>
      
      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
        {job.scheduled_date && (
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {format(new Date(job.scheduled_date), "MMM d")}
          </span>
        )}
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {format(new Date(job.created_at), "MMM d")}
        </span>
      </div>
    </div>
  );
}

export function JobBoardGlobal({ activeJobs, upcomingJobs, loading }: JobBoardGlobalProps) {
  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="animate-pulse text-muted-foreground">Loading jobs...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Briefcase className="w-5 h-5" />
          Platform Job Board
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="active" className="space-y-4">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="active" className="flex items-center gap-2">
              <PlayCircle className="w-4 h-4" />
              Active ({activeJobs.length})
            </TabsTrigger>
            <TabsTrigger value="upcoming" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Upcoming ({upcomingJobs.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active">
            <ScrollArea className="h-[400px]">
              {activeJobs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Briefcase className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No active jobs</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {activeJobs.map((job) => (
                    <JobCard key={job.id} job={job} />
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="upcoming">
            <ScrollArea className="h-[400px]">
              {upcomingJobs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No upcoming jobs scheduled</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingJobs.map((job) => (
                    <JobCard key={job.id} job={job} />
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
