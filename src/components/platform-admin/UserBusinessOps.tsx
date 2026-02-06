import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Loader2, Search, User, Building2, KeyRound, ToggleRight, Ban, Mail, Phone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type BusinessModule = Database["public"]["Enums"]["business_module"];

interface SearchResult {
  type: "user" | "business";
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  is_banned?: boolean;
  enabled_modules?: BusinessModule[];
  is_verified?: boolean;
}

export function UserBusinessOps() {
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setSearching(true);
    setResults([]);
    
    try {
      // Search profiles
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, email, phone, is_banned")
        .or(`email.ilike.%${searchQuery}%,full_name.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%`)
        .limit(10);

      // Search businesses
      const { data: businesses } = await supabase
        .from("businesses")
        .select("id, business_name, contact_email, contact_phone, enabled_modules, is_verified")
        .or(`business_name.ilike.%${searchQuery}%,contact_email.ilike.%${searchQuery}%`)
        .limit(10);

      const combined: SearchResult[] = [
        ...(profiles || []).map(p => ({
          type: "user" as const,
          id: p.id,
          name: p.full_name || "Unknown User",
          email: p.email,
          phone: p.phone,
          is_banned: p.is_banned,
        })),
        ...(businesses || []).map(b => ({
          type: "business" as const,
          id: b.id,
          name: b.business_name,
          email: b.contact_email,
          phone: b.contact_phone,
          enabled_modules: b.enabled_modules,
          is_verified: b.is_verified,
        })),
      ];

      setResults(combined);
    } catch (error) {
      console.error("Search error:", error);
      toast({
        title: "Error",
        description: "Search failed",
        variant: "destructive",
      });
    } finally {
      setSearching(false);
    }
  };

  const handlePasswordReset = async (email: string) => {
    setActionLoading(`reset-${email}`);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      toast({
        title: "Password Reset Sent",
        description: `Reset email sent to ${email}`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send reset email",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleBanToggle = async (userId: string, currentlyBanned: boolean) => {
    setActionLoading(`ban-${userId}`);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ is_banned: !currentlyBanned })
        .eq("id", userId);

      if (error) throw error;

      toast({
        title: currentlyBanned ? "User Unbanned" : "User Banned",
        description: currentlyBanned ? "User access restored" : "User has been banned from the platform",
      });

      // Update local state
      setResults(prev => prev.map(r => 
        r.id === userId ? { ...r, is_banned: !currentlyBanned } : r
      ));
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update ban status",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleModuleToggle = async (businessId: string, module: BusinessModule, currentModules: BusinessModule[]) => {
    setActionLoading(`module-${businessId}-${module}`);
    try {
      const newModules: BusinessModule[] = currentModules.includes(module)
        ? currentModules.filter(m => m !== module)
        : [...currentModules, module];

      const { error } = await supabase
        .from("businesses")
        .update({ enabled_modules: newModules })
        .eq("id", businessId);

      if (error) throw error;

      toast({
        title: "Module Updated",
        description: `${module} has been ${newModules.includes(module) ? "enabled" : "disabled"}`,
      });

      // Update local state
      setResults(prev => prev.map(r => 
        r.id === businessId ? { ...r, enabled_modules: newModules } : r
      ));
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update module",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="w-5 h-5 text-primary" />
          User & Business Ops
        </CardTitle>
        <CardDescription>
          Search and manage users and businesses
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search Bar */}
        <div className="flex gap-2">
          <Input
            placeholder="Search by name, email, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="flex-1"
          />
          <Button onClick={handleSearch} disabled={searching}>
            {searching ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
          </Button>
        </div>

        {/* Results */}
        <div className="space-y-3">
          {results.map((result) => (
            <Card key={`${result.type}-${result.id}`} className={result.is_banned ? "border-destructive bg-destructive/5" : ""}>
              <CardContent className="pt-4">
                <div className="space-y-3">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {result.type === "user" ? (
                        <User className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <Building2 className="w-4 h-4 text-primary" />
                      )}
                      <div>
                        <h3 className="font-semibold">{result.name}</h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          {result.email && (
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {result.email}
                            </span>
                          )}
                          {result.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {result.phone}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <Badge variant={result.type === "user" ? "secondary" : "default"}>
                      {result.type === "user" ? "User" : "Business"}
                    </Badge>
                  </div>

                  {/* Status Badges */}
                  <div className="flex flex-wrap gap-2">
                    {result.is_banned && (
                      <Badge variant="destructive">Banned</Badge>
                    )}
                    {result.is_verified && (
                      <Badge variant="default">Verified</Badge>
                    )}
                  </div>

                  {/* User Actions */}
                  {result.type === "user" && (
                    <div className="flex flex-wrap gap-2">
                      {result.email && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handlePasswordReset(result.email!)}
                          disabled={actionLoading === `reset-${result.email}`}
                        >
                          {actionLoading === `reset-${result.email}` ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <KeyRound className="w-4 h-4 mr-1" />
                              Reset Password
                            </>
                          )}
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant={result.is_banned ? "default" : "destructive"}
                        onClick={() => handleBanToggle(result.id, result.is_banned || false)}
                        disabled={actionLoading === `ban-${result.id}`}
                      >
                        {actionLoading === `ban-${result.id}` ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Ban className="w-4 h-4 mr-1" />
                            {result.is_banned ? "Unban" : "Ban User"}
                          </>
                        )}
                      </Button>
                    </div>
                  )}

                  {/* Business Module Toggles */}
                  {result.type === "business" && (
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground flex items-center gap-1">
                        <ToggleRight className="w-3 h-3" />
                        Force Module Toggle
                      </Label>
                    <div className="flex flex-wrap gap-4">
                        {(["slips", "service", "fuel", "ship_store", "store"] as const).map((module) => {
                          const isEnabled = result.enabled_modules?.includes(module);
                          const isLoading = actionLoading === `module-${result.id}-${module}`;
                          
                          return (
                            <div key={module} className="flex items-center gap-2">
                              <Switch
                                checked={isEnabled || false}
                                onCheckedChange={() => handleModuleToggle(result.id, module, result.enabled_modules || [])}
                                disabled={isLoading}
                              />
                              <Label className="text-xs capitalize">
                                {module.replace("_", " ")}
                              </Label>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}

          {results.length === 0 && searchQuery && !searching && (
            <div className="text-center py-8 text-muted-foreground">
              <Search className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No results found for "{searchQuery}"</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
