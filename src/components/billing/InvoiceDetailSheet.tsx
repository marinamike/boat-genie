import { useState, useEffect } from "react";
import { format } from "date-fns";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Wrench, 
  Ship, 
  Fuel, 
  ShoppingBag,
  Calendar,
  Building2,
  CheckCircle2,
  Clock
} from "lucide-react";
import { 
  useCustomerInvoices, 
  CustomerInvoice,
  ServiceInvoiceDetails,
  SlipInvoiceDetails,
  LeaseInvoiceDetails,
  StoreReceiptDetails
} from "@/hooks/useCustomerInvoices";

const formatCurrency = (amount: number | null | undefined) => {
  if (amount == null) return "$0.00";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
};

interface InvoiceDetailSheetProps {
  invoice: CustomerInvoice | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPayNow?: (invoice: CustomerInvoice) => void;
}

export function InvoiceDetailSheet({ invoice, open, onOpenChange, onPayNow }: InvoiceDetailSheetProps) {
  const { getServiceInvoiceDetails, getSlipInvoiceDetails, getLeaseInvoiceDetails, getStoreReceiptDetails } = useCustomerInvoices();
  const [details, setDetails] = useState<ServiceInvoiceDetails | SlipInvoiceDetails | LeaseInvoiceDetails | StoreReceiptDetails | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!invoice || !open) {
      setDetails(null);
      return;
    }

    const fetchDetails = async () => {
      setLoading(true);
      try {
        switch (invoice.source_type) {
          case "service":
            setDetails(await getServiceInvoiceDetails(invoice.source_id));
            break;
          case "slip_transient":
            setDetails(await getSlipInvoiceDetails(invoice.source_id));
            break;
          case "slip_lease":
            setDetails(await getLeaseInvoiceDetails(invoice.source_id));
            break;
          case "store":
          case "fuel":
            setDetails(await getStoreReceiptDetails(invoice.source_id));
            break;
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [invoice, open]);

  if (!invoice) return null;

  const isPending = invoice.status === "pending";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="space-y-1">
          <div className="flex items-center gap-2">
            {getSourceIcon(invoice.source_type)}
            <SheetTitle>Invoice Details</SheetTitle>
          </div>
          <SheetDescription>
            {invoice.source_reference || `Invoice #${invoice.invoice_number || invoice.id.slice(0, 8)}`}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Status & Amount */}
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground">Total Amount</p>
              <p className="text-2xl font-bold">{formatCurrency(Number(invoice.amount))}</p>
            </div>
            <div className="text-right">
              {isPending ? (
                <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
                  <Clock className="w-3 h-3 mr-1" />
                  Pending
                </Badge>
              ) : (
                <Badge className="bg-success/10 text-success border-success/20">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Paid
                </Badge>
              )}
              {invoice.paid_at && (
                <p className="text-xs text-muted-foreground mt-1">
                  Paid {format(new Date(invoice.paid_at), "MMM d, yyyy")}
                </p>
              )}
            </div>
          </div>

          {/* Invoice Metadata */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Building2 className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Business:</span>
              <span className="font-medium">{invoice.business?.business_name || "N/A"}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Date:</span>
              <span className="font-medium">{format(new Date(invoice.created_at), "MMMM d, yyyy")}</span>
            </div>
            {invoice.due_date && (
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Due:</span>
                <span className="font-medium">{format(new Date(invoice.due_date), "MMMM d, yyyy")}</span>
              </div>
            )}
          </div>

          <Separator />

          {/* Dynamic Line Items based on source type */}
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : (
            <InvoiceLineItems 
              sourceType={invoice.source_type} 
              details={details} 
            />
          )}

          {/* Pay Now Button */}
          {isPending && onPayNow && (
            <div className="pt-4">
              <Button 
                className="w-full h-12 text-lg font-semibold"
                onClick={() => onPayNow(invoice)}
              >
                Pay {formatCurrency(Number(invoice.amount))}
              </Button>
              <p className="text-xs text-muted-foreground text-center mt-2">
                Secure payment processing
              </p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function getSourceIcon(sourceType: string) {
  switch (sourceType) {
    case "service":
      return <Wrench className="w-5 h-5 text-primary" />;
    case "slip_transient":
    case "slip_lease":
      return <Ship className="w-5 h-5 text-primary" />;
    case "fuel":
      return <Fuel className="w-5 h-5 text-primary" />;
    case "store":
      return <ShoppingBag className="w-5 h-5 text-primary" />;
    default:
      return null;
  }
}

interface InvoiceLineItemsProps {
  sourceType: string;
  details: ServiceInvoiceDetails | SlipInvoiceDetails | LeaseInvoiceDetails | StoreReceiptDetails | null;
}

function InvoiceLineItems({ sourceType, details }: InvoiceLineItemsProps) {
  if (!details) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        <p>Unable to load invoice details</p>
      </div>
    );
  }

  switch (sourceType) {
    case "service":
      return <ServiceInvoiceLineItems details={details as ServiceInvoiceDetails} />;
    case "slip_transient":
      return <SlipInvoiceLineItems details={details as SlipInvoiceDetails} />;
    case "slip_lease":
      return <LeaseInvoiceLineItems details={details as LeaseInvoiceDetails} />;
    case "store":
    case "fuel":
      return <StoreReceiptLineItems details={details as StoreReceiptDetails} />;
    default:
      return null;
  }
}

function ServiceInvoiceLineItems({ details }: { details: ServiceInvoiceDetails }) {
  return (
    <div className="space-y-4">
      <h4 className="font-semibold">Service Breakdown</h4>
      
      {details.work_order && (
        <div className="p-3 bg-muted/50 rounded-lg">
          <p className="font-medium">{details.work_order.title}</p>
          {details.work_order.description && (
            <p className="text-sm text-muted-foreground mt-1">{details.work_order.description}</p>
          )}
        </div>
      )}

      <div className="space-y-2">
        {details.labor_total > 0 && (
          <LineItem 
            label={`Labor (${details.labor_hours}h × ${formatCurrency(details.labor_rate)}/hr)`} 
            value={details.labor_total} 
          />
        )}
        {details.parts_total > 0 && (
          <LineItem label="Parts & Materials" value={details.parts_total} />
        )}
        {details.haul_fee > 0 && (
          <LineItem label="Haul-Out Fee" value={details.haul_fee} />
        )}
        {details.launch_fee > 0 && (
          <LineItem label="Launch Fee" value={details.launch_fee} />
        )}
        {details.storage_total > 0 && (
          <LineItem 
            label={`Storage (${details.storage_days} days × ${formatCurrency(details.storage_daily_rate)}/day)`} 
            value={details.storage_total} 
          />
        )}
        {details.other_fees > 0 && (
          <LineItem 
            label={details.other_fees_description || "Other Fees"} 
            value={details.other_fees} 
          />
        )}
        
        <Separator className="my-2" />
        <LineItem label="Subtotal" value={details.subtotal} />
        {details.tax_amount > 0 && (
          <LineItem label={`Tax (${(details.tax_rate * 100).toFixed(1)}%)`} value={details.tax_amount} />
        )}
        <LineItem label="Total" value={details.total_amount} bold />
      </div>
    </div>
  );
}

function SlipInvoiceLineItems({ details }: { details: SlipInvoiceDetails }) {
  return (
    <div className="space-y-4">
      <h4 className="font-semibold">Stay Details</h4>
      
      <div className="p-3 bg-muted/50 rounded-lg space-y-1">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Check-In</span>
          <span>{format(new Date(details.check_in_at), "MMM d, yyyy h:mm a")}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Check-Out</span>
          <span>{format(new Date(details.check_out_at), "MMM d, yyyy h:mm a")}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Duration</span>
          <span>{details.stay_days} day{details.stay_days !== 1 ? "s" : ""}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Vessel Length</span>
          <span>{details.vessel_length_ft} ft</span>
        </div>
      </div>

      <div className="space-y-2">
        <LineItem 
          label={`Slip Fee (${details.rate_tier} @ ${formatCurrency(details.rate_per_day)}/day × ${details.stay_days} days × ${details.vessel_length_ft}ft)`} 
          value={details.stay_subtotal} 
        />
        
        {details.power_usage != null && details.power_usage > 0 && (
          <LineItem 
            label={`Power (${details.power_usage.toFixed(1)} kWh × ${formatCurrency(details.power_rate || 0)}/kWh)`}
            value={details.power_total || 0} 
          />
        )}
        
        {details.water_usage != null && details.water_usage > 0 && (
          <LineItem 
            label={`Water (${details.water_usage.toFixed(1)} gal × ${formatCurrency(details.water_rate || 0)}/gal)`}
            value={details.water_total || 0} 
          />
        )}
        
        <Separator className="my-2" />
        <LineItem label="Total" value={details.grand_total} bold />
      </div>
    </div>
  );
}

function LeaseInvoiceLineItems({ details }: { details: LeaseInvoiceDetails }) {
  return (
    <div className="space-y-4">
      <h4 className="font-semibold">Monthly Statement</h4>
      
      <div className="p-3 bg-muted/50 rounded-lg">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Billing Period</span>
          <span>
            {format(new Date(details.billing_period_start), "MMM d")} - {format(new Date(details.billing_period_end), "MMM d, yyyy")}
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <LineItem label="Base Rent" value={details.base_rent} />
        
        {details.power_usage != null && details.power_usage > 0 && (
          <LineItem 
            label={`Power (${details.power_usage.toFixed(1)} kWh × ${formatCurrency(details.power_rate || 0)}/kWh)`}
            value={details.power_total || 0} 
          />
        )}
        
        {details.water_usage != null && details.water_usage > 0 && (
          <LineItem 
            label={`Water (${details.water_usage.toFixed(1)} gal × ${formatCurrency(details.water_rate || 0)}/gal)`}
            value={details.water_total || 0} 
          />
        )}
        
        {details.additional_charges && Object.entries(details.additional_charges).map(([label, value]) => (
          <LineItem key={label} label={label} value={value as number} />
        ))}
        
        <Separator className="my-2" />
        <LineItem label="Total Due" value={details.grand_total} bold />
      </div>
    </div>
  );
}

function StoreReceiptLineItems({ details }: { details: StoreReceiptDetails }) {
  return (
    <div className="space-y-4">
      <h4 className="font-semibold">Receipt #{details.receipt_number}</h4>
      
      <div className="p-3 bg-muted/50 rounded-lg">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Date</span>
          <span>{format(new Date(details.recorded_at), "MMM d, yyyy h:mm a")}</span>
        </div>
        {details.payment_method && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Payment</span>
            <span className="capitalize">{details.payment_method}</span>
          </div>
        )}
      </div>

      <div className="space-y-2">
        {details.items.map((item) => (
          <div key={item.id} className="flex justify-between text-sm">
            <span>
              {item.quantity > 1 ? `${item.quantity}× ` : ""}{item.description}
            </span>
            <span className="font-medium">{formatCurrency(item.line_total)}</span>
          </div>
        ))}
        
        <Separator className="my-2" />
        <LineItem label="Subtotal" value={details.subtotal} />
        {details.tax_amount > 0 && (
          <LineItem label={`Tax (${(details.tax_rate * 100).toFixed(1)}%)`} value={details.tax_amount} />
        )}
        <LineItem label="Total" value={details.total_amount} bold />
      </div>
    </div>
  );
}

function LineItem({ label, value, bold }: { label: string; value: number; bold?: boolean }) {
  return (
    <div className={`flex justify-between text-sm ${bold ? "font-semibold text-base" : ""}`}>
      <span className={bold ? "" : "text-muted-foreground"}>{label}</span>
      <span className={bold ? "" : "font-medium"}>{formatCurrency(value)}</span>
    </div>
  );
}
