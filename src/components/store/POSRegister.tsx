import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useStoreInventory, CartItem, CustomerLookup, StoreItem } from "@/hooks/useStoreInventory";
import { useFuelManagement } from "@/hooks/useFuelManagement";
import { useFuelPricing } from "@/hooks/useFuelPricing";
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  Search, 
  User, 
  Fuel,
  Package,
  CreditCard,
  Banknote,
  X,
  Check
} from "lucide-react";
import { cn } from "@/lib/utils";

export function POSRegister() {
  const { inventory, searchCustomers, processSale } = useStoreInventory();
  const { tanks, pumps } = useFuelManagement();
  const { prices } = useFuelPricing();

  const [cart, setCart] = useState<CartItem[]>([]);
  const [customer, setCustomer] = useState<CustomerLookup | null>(null);
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerResults, setCustomerResults] = useState<CustomerLookup[]>([]);
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [taxRate, setTaxRate] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [showFuelAdd, setShowFuelAdd] = useState(false);
  const [fuelGallons, setFuelGallons] = useState("");
  const [selectedFuelType, setSelectedFuelType] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Filter inventory by search
  const filteredInventory = inventory.filter(
    item => item.is_active && (
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.barcode?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  // Customer search debounce
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (customerSearch.length >= 2) {
        const results = await searchCustomers(customerSearch);
        setCustomerResults(results);
      } else {
        setCustomerResults([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [customerSearch, searchCustomers]);

  // Add item to cart
  const addToCart = (item: StoreItem) => {
    const existing = cart.find(c => c.type === "inventory" && c.item_id === item.id);
    if (existing) {
      setCart(cart.map(c => 
        c.id === existing.id 
          ? { ...c, quantity: c.quantity + 1, line_total: (c.quantity + 1) * c.unit_price }
          : c
      ));
    } else {
      setCart([...cart, {
        id: `inv-${item.id}-${Date.now()}`,
        type: "inventory",
        item_id: item.id,
        name: item.name,
        quantity: 1,
        unit_price: item.retail_price,
        line_total: item.retail_price,
      }]);
    }
  };

  // Add fuel to cart
  const addFuelToCart = () => {
    if (!selectedFuelType || !fuelGallons) return;
    
    const price = prices.find(p => p.fuel_type === selectedFuelType);
    if (!price) return;

    const gallons = parseFloat(fuelGallons);
    if (isNaN(gallons) || gallons <= 0) return;

    const unitPrice = price.retail_price;
    const lineTotal = gallons * unitPrice;
    const fuelLabel = selectedFuelType.charAt(0).toUpperCase() + selectedFuelType.slice(1);

    setCart([...cart, {
      id: `fuel-${Date.now()}`,
      type: "fuel",
      name: `${fuelLabel} Fuel (${gallons.toFixed(2)} gal)`,
      quantity: gallons,
      unit_price: unitPrice,
      line_total: lineTotal,
    }]);

    setShowFuelAdd(false);
    setFuelGallons("");
    setSelectedFuelType("");
  };

  // Update cart quantity
  const updateQuantity = (cartId: string, delta: number) => {
    setCart(cart.map(item => {
      if (item.id === cartId) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty, line_total: newQty * item.unit_price };
      }
      return item;
    }));
  };

  // Remove from cart
  const removeFromCart = (cartId: string) => {
    setCart(cart.filter(c => c.id !== cartId));
  };

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + item.line_total, 0);
  const taxAmount = subtotal * taxRate;
  const total = subtotal + taxAmount;

  // Process checkout
  const handleCheckout = async () => {
    if (cart.length === 0) return;
    
    setIsProcessing(true);
    const receipt = await processSale(cart, customer, taxRate, paymentMethod);
    setIsProcessing(false);

    if (receipt) {
      // Clear cart after successful sale
      setCart([]);
      setCustomer(null);
      setCustomerSearch("");
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Product Search & Selection */}
      <div className="lg:col-span-2 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search items by name, SKU, or barcode..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowFuelAdd(true)}
            className="flex-1"
          >
            <Fuel className="h-4 w-4 mr-2" />
            Add Fuel
          </Button>
        </div>

        {/* Fuel Add Form */}
        {showFuelAdd && (
          <Card className="border-primary/30">
            <CardContent className="pt-4">
              <div className="flex items-end gap-3">
                <div className="flex-1">
                  <Label>Fuel Type</Label>
                  <Select value={selectedFuelType} onValueChange={setSelectedFuelType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select fuel" />
                    </SelectTrigger>
                    <SelectContent>
                      {prices.map(p => (
                        <SelectItem key={p.fuel_type} value={p.fuel_type}>
                          {p.fuel_type.charAt(0).toUpperCase() + p.fuel_type.slice(1)} - ${p.retail_price.toFixed(3)}/gal
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1">
                  <Label>Gallons</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={fuelGallons}
                    onChange={(e) => setFuelGallons(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <Button onClick={addFuelToCart} disabled={!selectedFuelType || !fuelGallons}>
                  <Plus className="h-4 w-4" />
                </Button>
                <Button variant="ghost" onClick={() => setShowFuelAdd(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Product Grid */}
        <ScrollArea className="h-[400px]">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {filteredInventory.map(item => (
              <Card 
                key={item.id}
                className={cn(
                  "cursor-pointer transition-all hover:border-primary/50",
                  item.current_quantity === 0 && "opacity-50"
                )}
                onClick={() => item.current_quantity > 0 && addToCart(item)}
              >
                <CardContent className="p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.sku || "No SKU"}</p>
                    </div>
                    <Badge variant={item.is_part ? "default" : "secondary"} className="text-[10px] ml-1">
                      {item.category}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="font-bold text-primary">${item.retail_price.toFixed(2)}</span>
                    <span className={cn(
                      "text-xs",
                      item.current_quantity <= item.reorder_point ? "text-destructive" : "text-muted-foreground"
                    )}>
                      {item.current_quantity} in stock
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Cart & Checkout */}
      <div className="space-y-4">
        {/* Customer Selection */}
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <User className="h-4 w-4" />
              Customer
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {customer ? (
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{customer.name}</p>
                  {customer.boat_name && (
                    <p className="text-xs text-muted-foreground">{customer.boat_name}</p>
                  )}
                </div>
                <Button variant="ghost" size="sm" onClick={() => setCustomer(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="relative">
                  <Input
                    placeholder="Search customer or boat..."
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    onFocus={() => setShowCustomerSearch(true)}
                  />
                </div>
                {showCustomerSearch && customerResults.length > 0 && (
                  <div className="border rounded-md max-h-32 overflow-y-auto">
                    {customerResults.map(c => (
                      <div
                        key={`${c.id}-${c.boat_id || "no-boat"}`}
                        className="p-2 hover:bg-muted cursor-pointer text-sm"
                        onClick={() => {
                          setCustomer(c);
                          setCustomerSearch("");
                          setShowCustomerSearch(false);
                        }}
                      >
                        <p className="font-medium">{c.name}</p>
                        {c.boat_name && (
                          <p className="text-xs text-muted-foreground">{c.boat_name}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => {
                    setCustomer(null);
                    setShowCustomerSearch(false);
                  }}
                >
                  Guest Checkout
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cart */}
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Cart ({cart.length} items)
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {cart.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-4">
                Cart is empty
              </p>
            ) : (
              <ScrollArea className="h-48">
                <div className="space-y-2">
                  {cart.map(item => (
                    <div key={item.id} className="flex items-center justify-between p-2 rounded border">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.name}</p>
                        <p className="text-xs text-muted-foreground">
                          ${item.unit_price.toFixed(2)} × {item.quantity}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        {item.type === "inventory" && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => updateQuantity(item.id, -1)}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="text-sm w-6 text-center">{item.quantity}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => updateQuantity(item.id, 1)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-destructive"
                          onClick={() => removeFromCart(item.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        {/* Totals & Checkout */}
        <Card>
          <CardContent className="pt-4 space-y-3">
            {/* Tax Rate */}
            <div className="flex items-center justify-between">
              <Label className="text-sm">Tax Rate</Label>
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  step="0.01"
                  value={(taxRate * 100).toFixed(2)}
                  onChange={(e) => setTaxRate(parseFloat(e.target.value) / 100 || 0)}
                  className="w-20 h-8 text-right"
                />
                <span className="text-sm text-muted-foreground">%</span>
              </div>
            </div>

            <Separator />

            {/* Totals */}
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Tax</span>
                <span>${taxAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span className="text-primary">${total.toFixed(2)}</span>
              </div>
            </div>

            <Separator />

            {/* Payment Method */}
            <div className="flex gap-2">
              <Button
                variant={paymentMethod === "card" ? "default" : "outline"}
                size="sm"
                className="flex-1"
                onClick={() => setPaymentMethod("card")}
              >
                <CreditCard className="h-4 w-4 mr-1" />
                Card
              </Button>
              <Button
                variant={paymentMethod === "cash" ? "default" : "outline"}
                size="sm"
                className="flex-1"
                onClick={() => setPaymentMethod("cash")}
              >
                <Banknote className="h-4 w-4 mr-1" />
                Cash
              </Button>
            </div>

            {/* Checkout Button */}
            <Button 
              className="w-full" 
              size="lg"
              onClick={handleCheckout}
              disabled={cart.length === 0 || isProcessing}
            >
              {isProcessing ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-foreground border-t-transparent mr-2" />
              ) : (
                <Check className="h-4 w-4 mr-2" />
              )}
              Complete Sale
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
