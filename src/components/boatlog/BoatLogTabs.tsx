import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Book, FileText, Shield } from "lucide-react";
import { ReactNode } from "react";

interface BoatLogTabsProps {
  serviceContent: ReactNode;
  vaultContent: ReactNode;
  specsWarrantyContent: ReactNode;
}

export function BoatLogTabs({ serviceContent, vaultContent, specsWarrantyContent }: BoatLogTabsProps) {
  return (
    <Tabs defaultValue="service" className="w-full">
      <TabsList className="grid w-full grid-cols-3 mb-4">
        <TabsTrigger value="service" className="flex items-center gap-1.5 text-xs sm:text-sm">
          <Book className="w-4 h-4" />
          <span className="hidden sm:inline">Service Log</span>
          <span className="sm:hidden">Service</span>
        </TabsTrigger>
        <TabsTrigger value="vault" className="flex items-center gap-1.5 text-xs sm:text-sm">
          <FileText className="w-4 h-4" />
          <span className="hidden sm:inline">Digital Vault</span>
          <span className="sm:hidden">Vault</span>
        </TabsTrigger>
        <TabsTrigger value="specs" className="flex items-center gap-1.5 text-xs sm:text-sm">
          <Shield className="w-4 h-4" />
          <span className="hidden sm:inline">Specs & Warranty</span>
          <span className="sm:hidden">Specs</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="service">
        {serviceContent}
      </TabsContent>

      <TabsContent value="vault">
        {vaultContent}
      </TabsContent>

      <TabsContent value="specs">
        {specsWarrantyContent}
      </TabsContent>
    </Tabs>
  );
}
