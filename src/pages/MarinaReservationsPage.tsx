import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Anchor, ArrowLeft } from "lucide-react";
import { ReservationManager } from "@/components/marina/ReservationManager";

const MarinaReservationsPage = () => {
  const navigate = useNavigate();

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
            <h1 className="font-bold text-lg">Reservations</h1>
            <p className="text-sm text-primary-foreground/80">Manage Bookings</p>
          </div>
        </div>
      </header>

      <main className="px-4 py-6">
        <ReservationManager />
      </main>
    </div>
  );
};

export default MarinaReservationsPage;
