import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SalesReceipt } from "@/hooks/useStoreInventory";
import { Receipt, User, CreditCard, Banknote } from "lucide-react";
import { format } from "date-fns";
import { ReceiptDetailDialog } from "./ReceiptDetailDialog";

interface TransactionHistoryProps {
  receipts: SalesReceipt[];
}

export function TransactionHistory({ receipts }: TransactionHistoryProps) {
  const [selectedReceipt, setSelectedReceipt] = useState<SalesReceipt | null>(null);

  if (receipts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Sales History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm text-center py-8">
            No transactions yet
          </p>
        </CardContent>
      </Card>
    );
  }

  // Group by date
  const groupedByDate = receipts.reduce((acc, receipt) => {
    const date = format(new Date(receipt.recorded_at), "yyyy-MM-dd");
    if (!acc[date]) acc[date] = [];
    acc[date].push(receipt);
    return acc;
  }, {} as Record<string, SalesReceipt[]>);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Receipt className="h-5 w-5" />
          Sales History
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px]">
          <div className="space-y-6">
            {Object.entries(groupedByDate).slice(0, 14).map(([date, dayReceipts]) => (
              <div key={date}>
                <p className="font-medium text-sm mb-3 text-muted-foreground">
                  {format(new Date(date), "EEEE, MMMM d, yyyy")}
                </p>
                <div className="space-y-2">
                  {dayReceipts.map(receipt => (
                    <div
                      key={receipt.id}
                      className="p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm">{receipt.receipt_number}</span>
                            <Badge variant="outline" className="text-[10px]">
                              {format(new Date(receipt.recorded_at), "h:mm a")}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                            <User className="h-3 w-3" />
                            {receipt.is_guest_checkout ? (
                              <span>Guest</span>
                            ) : (
                              <span>{receipt.customer_name || "Unknown"}</span>
                            )}
                            {receipt.boat_name && (
                              <span className="text-xs">• {receipt.boat_name}</span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-primary">
                            ${receipt.total_amount.toFixed(2)}
                          </p>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            {receipt.payment_method === "card" ? (
                              <CreditCard className="h-3 w-3" />
                            ) : (
                              <Banknote className="h-3 w-3" />
                            )}
                            <span className="capitalize">{receipt.payment_method}</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Line items preview */}
                      {receipt.items && receipt.items.length > 0 && (
                        <div className="text-xs text-muted-foreground border-t pt-2 mt-2">
                          {receipt.items.slice(0, 3).map((item, idx) => (
                            <div key={idx} className="flex justify-between">
                              <span className="truncate max-w-[200px]">
                                {item.quantity}× {item.description}
                              </span>
                              <span>${item.line_total.toFixed(2)}</span>
                            </div>
                          ))}
                          {receipt.items.length > 3 && (
                            <p className="text-xs italic mt-1">
                              +{receipt.items.length - 3} more items
                            </p>
                          )}
                        </div>
                      )}

                      {/* Tax info */}
                      {receipt.tax_amount > 0 && (
                        <div className="text-xs text-muted-foreground mt-1">
                          Tax: ${receipt.tax_amount.toFixed(2)} ({(receipt.tax_rate * 100).toFixed(2)}%)
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
