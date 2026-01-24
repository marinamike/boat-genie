import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Package, ClipboardList, CheckCircle, AlertCircle, Clock } from "lucide-react";
import { BusinessProfileForm } from "./BusinessProfileForm";
import { ServiceCatalogManager } from "./ServiceCatalogManager";
import { OnboardingChecklist } from "./OnboardingChecklist";
import { InsuranceVaultForm } from "./InsuranceVaultForm";
import { TaxInfoForm } from "./TaxInfoForm";
import { BankSetupForm } from "./BankSetupForm";
import { TermsAcceptanceForm } from "./TermsAcceptanceForm";
import { useProviderOnboarding } from "@/hooks/useProviderOnboarding";

interface ProfileManagementProps {
  onNavigateToSection?: (section: string) => void;
}

export function ProfileManagement({ onNavigateToSection }: ProfileManagementProps) {
  const [activeSubSection, setActiveSubSection] = useState<string | null>(null);
  const { profile, isChecklistComplete, refetch } = useProviderOnboarding();

  const onboardingStatus = profile?.onboarding_status || "pending_setup";
  const isActive = onboardingStatus === "active";
  const isPendingReview = onboardingStatus === "pending_review";
  const isRejected = onboardingStatus === "rejected";
  const needsSetup = !isActive && !isPendingReview;

  const handleSectionComplete = () => {
    setActiveSubSection(null);
    refetch();
  };

  const handleNavigateToSection = (section: string) => {
    setActiveSubSection(section);
  };

  // Render detailed section forms when drilling into onboarding items
  if (activeSubSection) {
    const renderSubSection = () => {
      switch (activeSubSection) {
        case "business_profile":
          return <BusinessProfileForm onComplete={handleSectionComplete} />;
        case "service_menu":
          return <ServiceCatalogManager />;
        case "insurance":
          return <InsuranceVaultForm onComplete={handleSectionComplete} />;
        case "tax_info":
          return <TaxInfoForm onComplete={handleSectionComplete} />;
        case "bank_setup":
          return <BankSetupForm onComplete={handleSectionComplete} />;
        case "terms":
          return <TermsAcceptanceForm onComplete={handleSectionComplete} />;
        default:
          return null;
      }
    };

    return (
      <div className="space-y-4">
        <button
          onClick={() => setActiveSubSection(null)}
          className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
        >
          ← Back to Profile
        </button>
        {renderSubSection()}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Banner */}
      {isPendingReview && (
        <Card className="border-yellow-500/50 bg-yellow-500/5">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-yellow-600" />
              <div>
                <p className="font-medium">Application Under Review</p>
                <p className="text-sm text-muted-foreground">
                  Your application is being reviewed. You'll be notified once approved.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {isRejected && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-destructive" />
              <div>
                <p className="font-medium">Application Rejected</p>
                <p className="text-sm text-muted-foreground">
                  {profile?.rejection_reason || "Please contact support for more information."}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {isActive && (
        <Card className="border-green-500/50 bg-green-500/5">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <p className="font-medium">Account Active</p>
                <p className="text-sm text-muted-foreground">
                  Your provider account is fully active.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Profile Tabs */}
      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile" className="flex items-center gap-1.5">
            <Building2 className="w-4 h-4" />
            <span>Profile</span>
          </TabsTrigger>
          <TabsTrigger value="services" className="flex items-center gap-1.5">
            <Package className="w-4 h-4" />
            <span>Services</span>
          </TabsTrigger>
          {needsSetup && (
            <TabsTrigger value="setup" className="flex items-center gap-1.5">
              <ClipboardList className="w-4 h-4" />
              <span>Setup</span>
              {!isChecklistComplete() && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">!</Badge>
              )}
            </TabsTrigger>
          )}
          {!needsSetup && (
            <TabsTrigger value="documents" className="flex items-center gap-1.5">
              <ClipboardList className="w-4 h-4" />
              <span>Documents</span>
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="profile">
          <BusinessProfileForm />
        </TabsContent>

        <TabsContent value="services">
          <ServiceCatalogManager />
        </TabsContent>

        <TabsContent value="setup">
          <OnboardingChecklist onNavigateToSection={handleNavigateToSection} />
        </TabsContent>

        <TabsContent value="documents">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Insurance & Documents</CardTitle>
                <CardDescription>
                  Manage your insurance and tax documents
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <button
                  onClick={() => setActiveSubSection("insurance")}
                  className="w-full flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors text-left"
                >
                  <span className="font-medium">Insurance Documents</span>
                  <span className="text-sm text-muted-foreground">Edit →</span>
                </button>
                <button
                  onClick={() => setActiveSubSection("tax_info")}
                  className="w-full flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors text-left"
                >
                  <span className="font-medium">Tax Information</span>
                  <span className="text-sm text-muted-foreground">Edit →</span>
                </button>
                <button
                  onClick={() => setActiveSubSection("bank_setup")}
                  className="w-full flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors text-left"
                >
                  <span className="font-medium">Bank & Payout Setup</span>
                  <span className="text-sm text-muted-foreground">Edit →</span>
                </button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
