import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StoreItem } from "@/hooks/useStoreInventory";
import { Package, Search, Wrench, ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";

interface InventoryManagerProps {
  inventory: StoreItem[];
  onAddToCart?: (item: StoreItem) => void;
}

export function InventoryManager({ inventory, onAddToCart }: InventoryManagerProps) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = 
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.sku?.toLowerCase().includes(search.toLowerCase()) ||
      item.barcode?.toLowerCase().includes(search.toLowerCase());
    
    const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg flex items-center gap-2">
          <Package className="h-5 w-5" />
          Inventory ({inventory.length} items)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, SKU, or barcode..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="parts">Parts</SelectItem>
              <SelectItem value="retail">Retail</SelectItem>
              <SelectItem value="consumables">Consumables</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        {filteredInventory.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No items found</p>
          </div>
        ) : (
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  {onAddToCart && <TableHead className="w-24">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInventory.map(item => (
                  <TableRow key={item.id} className={!item.is_active ? "opacity-50" : ""}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{item.name}</span>
                        {item.is_part && (
                          <Wrench className="h-3 w-3 text-primary" />
                        )}
                      </div>
                      {item.description && (
                        <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                          {item.description}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {item.sku || "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {item.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      ${item.retail_price.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={cn(
                        "font-medium",
                        item.current_quantity <= item.reorder_point 
                          ? "text-destructive" 
                          : "text-foreground"
                      )}>
                        {item.current_quantity}
                      </span>
                      <span className="text-xs text-muted-foreground ml-1">
                        / {item.reorder_point} min
                      </span>
                    </TableCell>
                    {onAddToCart && (
                      <TableCell>
                        <div className="flex gap-1">
                          {onAddToCart && item.is_active && item.current_quantity > 0 && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-primary hover:text-primary"
                              onClick={() => onAddToCart(item)}
                            >
                              <ShoppingCart className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
