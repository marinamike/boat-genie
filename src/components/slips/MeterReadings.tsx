import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Zap, Droplets, Plus, TrendingUp, History } from "lucide-react";
import { UtilityMeter, MeterReading, YardAsset } from "@/hooks/useYardAssets";
import { format } from "date-fns";

interface MeterReadingsProps {
  assets: YardAsset[];
  meters: UtilityMeter[];
  meterReadings: MeterReading[];
  loading: boolean;
  recordMeterReading: (
    meterId: string,
    currentReading: number,
    boatId?: string,
    notes?: string
  ) => Promise<any>;
}

export function MeterReadings({
  assets,
  meters,
  meterReadings,
  loading,
  recordMeterReading,
}: MeterReadingsProps) {
  const [showReadingForm, setShowReadingForm] = useState(false);
  const [selectedMeterId, setSelectedMeterId] = useState("");
  const [newReading, setNewReading] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const selectedMeter = meters.find((m) => m.id === selectedMeterId);
  const selectedAsset = selectedMeter
    ? assets.find((a) => a.id === selectedMeter.yard_asset_id)
    : null;

  const handleSubmit = async () => {
    if (!selectedMeterId || !newReading) return;
    setSubmitting(true);

    try {
      await recordMeterReading(
        selectedMeterId,
        parseFloat(newReading),
        selectedAsset?.current_boat_id || undefined,
        notes || undefined
      );
      setShowReadingForm(false);
      setSelectedMeterId("");
      setNewReading("");
      setNotes("");
    } finally {
      setSubmitting(false);
    }
  };

  const getUsagePreview = () => {
    if (!selectedMeter || !newReading) return null;
    const usage = parseFloat(newReading) - selectedMeter.current_reading;
    const charge = usage * selectedMeter.rate_per_unit;
    return { usage, charge };
  };

  const usagePreview = getUsagePreview();

  // Calculate totals
  const totalUnbilledCharges = meterReadings
    .filter((r) => !r.is_billed)
    .reduce((sum, r) => sum + r.total_charge, 0);

  const thisMonthReadings = meterReadings.filter((r) => {
    const readingDate = new Date(r.reading_date);
    const now = new Date();
    return (
      readingDate.getMonth() === now.getMonth() &&
      readingDate.getFullYear() === now.getFullYear()
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Zap className="w-8 h-8 animate-pulse text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Utility Meters</h2>
          <p className="text-sm text-muted-foreground">
            Track power and water usage
          </p>
        </div>
        <Button onClick={() => setShowReadingForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Record Reading
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="py-4">
            <div className="text-2xl font-bold">
              {meters.filter((m) => m.meter_type === "power").length}
            </div>
            <p className="text-sm text-muted-foreground">Power Meters</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="text-2xl font-bold">
              {meters.filter((m) => m.meter_type === "water").length}
            </div>
            <p className="text-sm text-muted-foreground">Water Meters</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="text-2xl font-bold">{thisMonthReadings.length}</div>
            <p className="text-sm text-muted-foreground">This Month</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="text-2xl font-bold text-orange-600">
              ${totalUnbilledCharges.toFixed(2)}
            </div>
            <p className="text-sm text-muted-foreground">Unbilled Charges</p>
          </CardContent>
        </Card>
      </div>

      {/* Meters List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Active Meters
          </CardTitle>
        </CardHeader>
        <CardContent>
          {meters.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No meters configured. Add meters in the Settings tab.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {meters.map((meter) => {
                const asset = assets.find((a) => a.id === meter.yard_asset_id);
                const recentReadings = meterReadings
                  .filter((r) => r.meter_id === meter.id)
                  .slice(0, 3);

                return (
                  <Card key={meter.id} className="border">
                    <CardContent className="py-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {meter.meter_type === "power" ? (
                            <Zap className="w-5 h-5 text-yellow-600" />
                          ) : (
                            <Droplets className="w-5 h-5 text-blue-600" />
                          )}
                          <div>
                            <div className="font-semibold">{meter.meter_name}</div>
                            <div className="text-xs text-muted-foreground">
                              {asset?.asset_name || "Unassigned"}
                              {meter.meter_number && ` • #${meter.meter_number}`}
                            </div>
                          </div>
                        </div>
                        <Badge variant={meter.is_active ? "default" : "secondary"}>
                          {meter.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <div className="text-muted-foreground">Current Reading</div>
                          <div className="font-mono text-lg">
                            {meter.current_reading.toLocaleString()}
                            <span className="text-xs text-muted-foreground ml-1">
                              {meter.meter_type === "power" ? "kWh" : "gal"}
                            </span>
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Rate</div>
                          <div className="font-mono text-lg">
                            ${meter.rate_per_unit}
                            <span className="text-xs text-muted-foreground ml-1">
                              /{meter.meter_type === "power" ? "kWh" : "gal"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {meter.last_reading_date && (
                        <div className="mt-2 text-xs text-muted-foreground">
                          Last read: {format(new Date(meter.last_reading_date), "MMM d, yyyy")}
                        </div>
                      )}

                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-3"
                        onClick={() => {
                          setSelectedMeterId(meter.id);
                          setShowReadingForm(true);
                        }}
                      >
                        <TrendingUp className="w-4 h-4 mr-2" />
                        Record Reading
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Readings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <History className="w-5 h-5" />
            Recent Readings
          </CardTitle>
        </CardHeader>
        <CardContent>
          {meterReadings.length === 0 ? (
            <p className="text-muted-foreground text-sm">No readings recorded yet</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Meter</TableHead>
                    <TableHead className="text-right">Usage</TableHead>
                    <TableHead className="text-right">Charge</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {meterReadings.slice(0, 20).map((reading) => {
                    const meter = meters.find((m) => m.id === reading.meter_id);
                    return (
                      <TableRow key={reading.id}>
                        <TableCell className="font-medium">
                          {format(new Date(reading.reading_date), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {meter?.meter_type === "power" ? (
                              <Zap className="w-4 h-4 text-yellow-600" />
                            ) : (
                              <Droplets className="w-4 h-4 text-blue-600" />
                            )}
                            {meter?.meter_name || "Unknown"}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {reading.usage_amount.toLocaleString()}{" "}
                          {meter?.meter_type === "power" ? "kWh" : "gal"}
                        </TableCell>
                        <TableCell className="text-right font-mono font-semibold">
                          ${reading.total_charge.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={reading.is_billed ? "default" : "outline"}>
                            {reading.is_billed ? "Billed" : "Pending"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recording Sheet */}
      <Sheet open={showReadingForm} onOpenChange={setShowReadingForm}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Record Meter Reading</SheetTitle>
          </SheetHeader>

          <div className="space-y-4 mt-6">
            <div className="space-y-2">
              <Label>Select Meter *</Label>
              <Select value={selectedMeterId} onValueChange={setSelectedMeterId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a meter" />
                </SelectTrigger>
                <SelectContent>
                  {meters.map((meter) => {
                    const asset = assets.find((a) => a.id === meter.yard_asset_id);
                    return (
                      <SelectItem key={meter.id} value={meter.id}>
                        <div className="flex items-center gap-2">
                          {meter.meter_type === "power" ? (
                            <Zap className="w-4 h-4 text-yellow-600" />
                          ) : (
                            <Droplets className="w-4 h-4 text-blue-600" />
                          )}
                          {meter.meter_name}
                          {asset && ` (${asset.asset_name})`}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {selectedMeter && (
              <Card className="bg-muted/50">
                <CardContent className="py-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Previous Reading</span>
                    <span className="font-mono">
                      {selectedMeter.current_reading.toLocaleString()}{" "}
                      {selectedMeter.meter_type === "power" ? "kWh" : "gal"}
                    </span>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-muted-foreground">Rate</span>
                    <span className="font-mono">
                      ${selectedMeter.rate_per_unit}/{selectedMeter.meter_type === "power" ? "kWh" : "gal"}
                    </span>
                  </div>
                  {selectedAsset?.current_boat_id && selectedAsset.boat && (
                    <div className="flex justify-between mt-1">
                      <span className="text-muted-foreground">Vessel</span>
                      <span>{selectedAsset.boat.name}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            <div className="space-y-2">
              <Label>Current Reading *</Label>
              <Input
                type="number"
                step="0.01"
                placeholder={selectedMeter ? `e.g., ${selectedMeter.current_reading + 100}` : "Enter reading"}
                value={newReading}
                onChange={(e) => setNewReading(e.target.value)}
              />
            </div>

            {usagePreview && usagePreview.usage > 0 && (
              <Card className="bg-green-500/10 border-green-500">
                <CardContent className="py-3">
                  <div className="flex justify-between text-sm">
                    <span>Usage</span>
                    <span className="font-mono">
                      {usagePreview.usage.toFixed(2)}{" "}
                      {selectedMeter?.meter_type === "power" ? "kWh" : "gal"}
                    </span>
                  </div>
                  <div className="flex justify-between text-lg font-semibold mt-1">
                    <span>Charge</span>
                    <span className="text-green-700">${usagePreview.charge.toFixed(2)}</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {usagePreview && usagePreview.usage < 0 && (
              <Card className="bg-destructive/10 border-destructive">
                <CardContent className="py-3 text-sm text-destructive">
                  Reading cannot be less than previous reading
                </CardContent>
              </Card>
            )}

            <div className="space-y-2">
              <Label>Notes (Optional)</Label>
              <Textarea
                placeholder="Any notes about this reading..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowReadingForm(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={
                  !selectedMeterId ||
                  !newReading ||
                  (usagePreview && usagePreview.usage < 0) ||
                  submitting
                }
                className="flex-1"
              >
                {submitting ? "Recording..." : "Record Reading"}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
