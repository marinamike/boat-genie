import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Anchor, Clock, Sailboat, MapPin } from "lucide-react";
import { format } from "date-fns";
import type { useServiceManagement } from "@/hooks/useServiceManagement";

type ServiceManagementProps = ReturnType<typeof useServiceManagement>;

export function BoatsOnBlocksList({ boatsOnBlocks, recordLaunch, loading }: ServiceManagementProps) {
  if (loading) {
    return <div className="flex items-center justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  }

  const getDaysColor = (days: number) => {
    if (days <= 7) return "bg-green-100 text-green-800";
    if (days <= 30) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Anchor className="w-5 h-5" />
            Boats on Blocks
          </CardTitle>
          <CardDescription>
            {boatsOnBlocks.length} vessels currently in the yard
          </CardDescription>
        </CardHeader>
        <CardContent>
          {boatsOnBlocks.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No boats currently on blocks</p>
          ) : (
            <div className="space-y-3">
              {boatsOnBlocks.map((record) => (
                <div key={record.id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                        <Sailboat className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium">{record.boat?.name || "Unknown Boat"}</p>
                        <p className="text-sm text-muted-foreground">
                          {record.boat?.make} {record.boat?.model}
                          {record.boat?.length_ft && ` • ${record.boat.length_ft} ft`}
                        </p>
                        {record.yard_location && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                            <MapPin className="w-3 h-3" />
                            {record.yard_location}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className={getDaysColor(record.daysInYard || 0)}>
                        <Clock className="w-3 h-3 mr-1" />
                        {record.daysInYard} days
                      </Badge>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      <span>Hauled: {format(new Date(record.hauled_at), "MMM d, yyyy")}</span>
                      {record.expected_launch && (
                        <span className="ml-3">
                          Expected: {format(new Date(record.expected_launch), "MMM d, yyyy")}
                        </span>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => recordLaunch(record.id)}
                    >
                      Record Launch
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{boatsOnBlocks.length}</p>
            <p className="text-sm text-muted-foreground">Total in Yard</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">
              {boatsOnBlocks.filter((b) => (b.daysInYard || 0) > 30).length}
            </p>
            <p className="text-sm text-muted-foreground">Over 30 Days</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">
              {boatsOnBlocks.length > 0
                ? Math.round(boatsOnBlocks.reduce((sum, b) => sum + (b.daysInYard || 0), 0) / boatsOnBlocks.length)
                : 0}
            </p>
            <p className="text-sm text-muted-foreground">Avg Days</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
