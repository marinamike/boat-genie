import { useState } from "react";
import { useBusiness } from "@/contexts/BusinessContext";
import { useStoreInventory, StoreItem } from "@/hooks/useStoreInventory";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { POSRegister } from "@/components/store/POSRegister";
import { InventoryManager } from "@/components/store/InventoryManager";
import { InventoryItemForm } from "@/components/store/InventoryItemForm";
import { TransactionHistory } from "@/components/store/TransactionHistory";
import { 
  Store, 
  ShoppingCart, 
  Package, 
  Receipt, 
  AlertTriangle,
  Plus,
  DollarSign,
  TrendingUp
} from "lucide-react";
import { format } from "date-fns";

export default function StoreDashboard() {
  const { business, isOwner, hasModuleAccess } = useBusiness();
  const { 
    inventory, 
    receipts, 
    lowStockItems,
    loading,
    createItem,
    updateItem,
    deleteItem,
  } = useStoreInventory();

  const [showInventoryForm, setShowInventoryForm] = useState(false);
  const [editingItem, setEditingItem] = useState<StoreItem | null>(null);

  const canWrite = isOwner || hasModuleAccess("store", "write");

  // Calculate stats
  const todaysSales = receipts
    .filter(r => new Date(r.recorded_at).toDateString() === new Date().toDateString())
    .reduce((sum, r) => sum + r.total_amount, 0);

  const todaysTransactions = receipts.filter(
    r => new Date(r.recorded_at).toDateString() === new Date().toDateString()
  ).length;

  const totalInventoryValue = inventory.reduce(
    (sum, item) => sum + (item.current_quantity * item.unit_cost), 
    0
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="container max-w-6xl mx-auto p-4 pb-24 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Store className="h-6 w-6" />
            Ship Store & POS
          </h1>
          <p className="text-muted-foreground">
            {business?.business_name}
          </p>
        </div>
        
        {canWrite && (
          <Button onClick={() => setShowInventoryForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-primary" />
              <span className="text-sm text-muted-foreground">Today's Sales</span>
            </div>
            <p className="text-2xl font-bold mt-1">${todaysSales.toFixed(2)}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="text-sm text-muted-foreground">Transactions</span>
            </div>
            <p className="text-2xl font-bold mt-1">{todaysTransactions}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-primary" />
              <span className="text-sm text-muted-foreground">Inventory Value</span>
            </div>
            <p className="text-2xl font-bold mt-1">${totalInventoryValue.toFixed(2)}</p>
          </CardContent>
        </Card>
        
        <Card className={lowStockItems.length > 0 ? "border-destructive/50" : ""}>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className={`h-4 w-4 ${lowStockItems.length > 0 ? "text-destructive" : "text-muted-foreground"}`} />
              <span className="text-sm text-muted-foreground">Low Stock</span>
            </div>
            <p className={`text-2xl font-bold mt-1 ${lowStockItems.length > 0 ? "text-destructive" : ""}`}>
              {lowStockItems.length}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="register" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="register" className="flex items-center gap-1">
            <ShoppingCart className="h-4 w-4" />
            <span className="hidden sm:inline">Register</span>
          </TabsTrigger>
          <TabsTrigger value="inventory" className="flex items-center gap-1">
            <Package className="h-4 w-4" />
            <span className="hidden sm:inline">Inventory</span>
          </TabsTrigger>
          <TabsTrigger value="transactions" className="flex items-center gap-1">
            <Receipt className="h-4 w-4" />
            <span className="hidden sm:inline">Sales</span>
          </TabsTrigger>
          <TabsTrigger value="lowstock" className="flex items-center gap-1">
            <AlertTriangle className="h-4 w-4" />
            <span className="hidden sm:inline">Restock</span>
            {lowStockItems.length > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 justify-center">
                {lowStockItems.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="register" className="mt-4">
          <POSRegister />
        </TabsContent>

        <TabsContent value="inventory" className="mt-4">
          <InventoryManager
            inventory={inventory}
            onEdit={(item) => {
              setEditingItem(item);
              setShowInventoryForm(true);
            }}
            onDelete={deleteItem}
            canWrite={canWrite}
          />
        </TabsContent>

        <TabsContent value="transactions" className="mt-4">
          <TransactionHistory receipts={receipts} />
        </TabsContent>

        <TabsContent value="lowstock" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Restock Needed
              </CardTitle>
            </CardHeader>
            <CardContent>
              {lowStockItems.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-8">
                  All items are above reorder point 🎉
                </p>
              ) : (
                <div className="space-y-3">
                  {lowStockItems.map(item => (
                    <div 
                      key={item.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-destructive/30 bg-destructive/5"
                    >
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-xs text-muted-foreground">
                          SKU: {item.sku || "N/A"} • Category: {item.category}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-destructive">
                          {item.current_quantity} left
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Reorder at {item.reorder_point}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Inventory Form Sheet */}
      <InventoryItemForm
        open={showInventoryForm}
        onOpenChange={(open) => {
          setShowInventoryForm(open);
          if (!open) setEditingItem(null);
        }}
        item={editingItem}
        onSave={async (data) => {
          if (editingItem) {
            await updateItem(editingItem.id, data);
          } else {
            await createItem(data as any);
          }
          setShowInventoryForm(false);
          setEditingItem(null);
        }}
      />
    </div>
  );
}
