import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, CheckCircle2, Clock, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { CompletedJob } from "@/hooks/useProviderMetrics";

interface EarningsTabProps {
  completedJobs: CompletedJob[];
  totalEarnings: number;
}

export function EarningsTab({ completedJobs, totalEarnings }: EarningsTabProps) {
  if (completedJobs.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <DollarSign className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="font-semibold text-lg">No Completed Jobs Yet</h3>
          <p className="text-muted-foreground text-center">
            Your completed jobs and earnings will appear here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Earnings Summary */}
      <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Lifetime Earnings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-green-500" />
            <span className="text-3xl font-bold text-green-600">
              ${totalEarnings.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            After 5% lead fee deduction • {completedJobs.length} completed job{completedJobs.length !== 1 ? "s" : ""}
          </p>
        </CardContent>
      </Card>

      {/* Job List */}
      <div className="space-y-3">
        <h3 className="font-semibold text-lg flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5" />
          Completed Jobs
        </h3>

        {completedJobs.map((job) => {
          const grossAmount = job.wholesale_price || 0;
          const leadFee = job.lead_fee || grossAmount * 0.05;
          const netPayout = grossAmount - leadFee;
          const isPaid = !!job.funds_released_at;

          return (
            <Card key={job.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h4 className="font-medium">{job.title}</h4>
                    <p className="text-sm text-muted-foreground">{job.boat_name}</p>
                    {job.completed_at && (
                      <p className="text-xs text-muted-foreground">
                        Completed {format(new Date(job.completed_at), "MMM d, yyyy")}
                      </p>
                    )}
                  </div>
                  <Badge 
                    variant="outline" 
                    className={isPaid 
                      ? "bg-green-500/10 text-green-600 border-green-500/20" 
                      : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                    }
                  >
                    {isPaid ? (
                      <>
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Paid
                      </>
                    ) : (
                      <>
                        <Clock className="w-3 h-3 mr-1" />
                        Processing
                      </>
                    )}
                  </Badge>
                </div>

                {/* Earnings Breakdown */}
                <div className="mt-4 bg-muted rounded-lg p-3 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Gross Amount</span>
                    <span>${grossAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-destructive">
                    <span>Lead Fee (5%)</span>
                    <span>-${leadFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-semibold pt-2 border-t text-green-600">
                    <span>Net Payout</span>
                    <span>${netPayout.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
