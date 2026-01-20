import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FloatingActionButtonProps {
  onClick?: () => void;
  className?: string;
}

const FloatingActionButton = ({ onClick, className }: FloatingActionButtonProps) => {
  return (
    <Button
      onClick={onClick}
      className={cn(
        "fixed bottom-24 right-4 z-40 h-14 w-14 rounded-full shadow-lg",
        "bg-gradient-gold hover:opacity-90 transition-all",
        "flex items-center justify-center touch-target",
        "shadow-gold",
        className
      )}
      size="icon"
    >
      <Sparkles className="w-6 h-6 text-foreground" />
      <span className="sr-only">Make a Wish</span>
    </Button>
  );
};

export default FloatingActionButton;
