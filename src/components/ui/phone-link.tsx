import * as React from "react";
import { cn } from "@/lib/utils";
import { Phone } from "lucide-react";

interface PhoneLinkProps {
  phone: string | null | undefined;
  className?: string;
  showIcon?: boolean;
  fallbackText?: string;
}

function formatPhoneForTel(phone: string): string {
  // Remove all non-digits for the tel: link
  return phone.replace(/\D/g, "");
}

export function PhoneLink({ phone, className, showIcon = true, fallbackText = "Not provided" }: PhoneLinkProps) {
  if (!phone) {
    return <span className={cn("text-muted-foreground", className)}>{fallbackText}</span>;
  }

  const telNumber = formatPhoneForTel(phone);

  return (
    <a
      href={`tel:+1${telNumber}`}
      className={cn(
        "inline-flex items-center gap-1.5 text-primary hover:underline font-medium",
        className
      )}
    >
      {showIcon && <Phone className="w-4 h-4" />}
      {phone}
    </a>
  );
}
