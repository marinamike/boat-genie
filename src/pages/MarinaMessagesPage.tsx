import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Anchor, ArrowLeft } from "lucide-react";
import { MarinaChatSheet } from "@/components/marina/dashboard/MarinaChatSheet";

const MarinaMessagesPage = () => {
  const navigate = useNavigate();
  const [chatOpen, setChatOpen] = useState(true);

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 bg-primary text-primary-foreground">
        <div className="px-4 py-4 flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-primary-foreground" 
            onClick={() => navigate("/marina")}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="font-bold text-lg">Messages</h1>
            <p className="text-sm text-primary-foreground/80">Direct Communication</p>
          </div>
        </div>
      </header>

      <main className="px-4 py-6">
        <div className="text-center py-12">
          <Anchor className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground mb-4">
            Open the message panel to communicate with owners and providers
          </p>
          <Button onClick={() => setChatOpen(true)}>
            Open Messages
          </Button>
        </div>
      </main>

      <MarinaChatSheet
        open={chatOpen}
        onOpenChange={setChatOpen}
      />
    </div>
  );
};

export default MarinaMessagesPage;
