import { useState } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  FileText,
  Book,
  Shield,
  ScrollText,
  Plus,
  ExternalLink,
  Calendar,
  AlertCircle,
  Trash2,
  Loader2,
} from "lucide-react";
import { DocumentUploadSheet } from "./DocumentUploadSheet";
import { useVesselDocuments, VesselDocument } from "@/hooks/useVesselDocuments";
import { differenceInDays } from "date-fns";

interface DigitalVaultProps {
  boatId: string | null;
  boatName?: string;
}

const CATEGORY_CONFIG = {
  manuals: {
    label: "Manuals & Technical",
    icon: Book,
    description: "Engine manuals, electronics guides, technical specs",
  },
  warranty: {
    label: "Warranty & Insurance",
    icon: Shield,
    description: "Policy numbers, expiration dates, coverage details",
  },
  documentation: {
    label: "Documentation",
    icon: ScrollText,
    description: "Registration, Coast Guard docs, certifications",
  },
} as const;

type CategoryKey = keyof typeof CATEGORY_CONFIG;

export function DigitalVault({ boatId, boatName }: DigitalVaultProps) {
  const [uploadSheetOpen, setUploadSheetOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey | null>(null);
  const { documents, loading, deleteDocument, refetch } = useVesselDocuments(boatId);

  const handleAddDocument = (category: CategoryKey) => {
    setSelectedCategory(category);
    setUploadSheetOpen(true);
  };

  const getDocumentsByCategory = (category: CategoryKey) => {
    return documents.filter((doc) => doc.category === category);
  };

  const isExpiringSoon = (expiryDate: string | null) => {
    if (!expiryDate) return false;
    const daysUntilExpiry = differenceInDays(new Date(expiryDate), new Date());
    return daysUntilExpiry <= 30 && daysUntilExpiry >= 0;
  };

  const isExpired = (expiryDate: string | null) => {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
  };

  const handleViewDocument = async (doc: VesselDocument) => {
    window.open(doc.file_url, "_blank");
  };

  const handleDeleteDocument = async (docId: string) => {
    if (confirm("Are you sure you want to delete this document?")) {
      await deleteDocument(docId);
    }
  };

  if (!boatId) {
    return null;
  }

  return (
    <section className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          Vessel Documents
        </h2>
      </div>

      <Accordion type="multiple" className="space-y-2">
        {(Object.keys(CATEGORY_CONFIG) as CategoryKey[]).map((category) => {
          const config = CATEGORY_CONFIG[category];
          const Icon = config.icon;
          const categoryDocs = getDocumentsByCategory(category);
          const hasExpiring = categoryDocs.some(
            (d) => isExpiringSoon(d.expiry_date) || isExpired(d.expiry_date)
          );

          return (
            <AccordionItem
              key={category}
              value={category}
              className="border rounded-lg overflow-hidden bg-card"
            >
              <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/50">
                <div className="flex items-center gap-3 flex-1">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="text-left flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{config.label}</span>
                      {categoryDocs.length > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {categoryDocs.length}
                        </Badge>
                      )}
                      {hasExpiring && (
                        <AlertCircle className="w-4 h-4 text-amber-500" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {config.description}
                    </p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                {loading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  </div>
                ) : categoryDocs.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm mb-3">No documents yet</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddDocument(category)}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add Document
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {categoryDocs.map((doc) => (
                      <Card
                        key={doc.id}
                        className="overflow-hidden hover:shadow-sm transition-shadow"
                      >
                        <CardContent className="p-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-medium text-sm truncate">
                                  {doc.title}
                                </h4>
                                {isExpired(doc.expiry_date) && (
                                  <Badge variant="destructive" className="text-xs shrink-0">
                                    Expired
                                  </Badge>
                                )}
                                {isExpiringSoon(doc.expiry_date) && !isExpired(doc.expiry_date) && (
                                  <Badge variant="outline" className="text-amber-600 border-amber-600 text-xs shrink-0">
                                    Expiring Soon
                                  </Badge>
                                )}
                              </div>
                              {doc.description && (
                                <p className="text-xs text-muted-foreground mb-1 line-clamp-1">
                                  {doc.description}
                                </p>
                              )}
                              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                <span className="uppercase">{doc.file_type}</span>
                                {doc.expiry_date && (
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    Expires {format(new Date(doc.expiry_date), "MMM d, yyyy")}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleViewDocument(doc)}
                              >
                                <ExternalLink className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={() => handleDeleteDocument(doc.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full mt-2"
                      onClick={() => handleAddDocument(category)}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add Document
                    </Button>
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>

      <DocumentUploadSheet
        open={uploadSheetOpen}
        onOpenChange={setUploadSheetOpen}
        boatId={boatId}
        boatName={boatName}
        defaultCategory={selectedCategory || "documentation"}
        onSuccess={refetch}
      />
    </section>
  );
}
