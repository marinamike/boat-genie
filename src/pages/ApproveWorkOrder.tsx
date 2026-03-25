import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle, Loader2, AlertCircle, Anchor } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ApproveWorkOrder() {
  const { token } = useParams<{ token: string }>();
  const [status, setStatus] = useState<"loading" | "confirming" | "approved" | "already_approved" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setErrorMsg("Invalid approval link.");
      return;
    }
    // Just show the confirm button, don't auto-approve
    setStatus("confirming");
  }, [token]);

  const handleApprove = async () => {
    setStatus("loading");
    try {
      const { data, error } = await supabase.functions.invoke("approve-work-order", {
        body: { token },
      });

      if (error) throw error;

      if (data?.already_approved) {
        setStatus("already_approved");
      } else if (data?.success) {
        setStatus("approved");
      } else {
        throw new Error(data?.error || "Unexpected response");
      }
    } catch (err: any) {
      setStatus("error");
      setErrorMsg(err.message || "Something went wrong. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <Anchor className="w-10 h-10 text-sky-600" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Boat Genie</h1>

        {status === "loading" && (
          <div className="space-y-4 py-8">
            <Loader2 className="w-12 h-12 text-sky-500 animate-spin mx-auto" />
            <p className="text-slate-500">Processing approval…</p>
          </div>
        )}

        {status === "confirming" && (
          <div className="space-y-6 py-4">
            <p className="text-slate-600 text-lg">
              Tap the button below to approve this work order. Your service center will be notified immediately.
            </p>
            <Button
              size="lg"
              onClick={handleApprove}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 text-lg font-semibold"
            >
              <CheckCircle className="w-5 h-5 mr-2" />
              Approve Work Order
            </Button>
          </div>
        )}

        {(status === "approved" || status === "already_approved") && (
          <div className="space-y-4 py-4">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-10 h-10 text-emerald-600" />
            </div>
            <p className="text-slate-700 text-lg font-medium">
              {status === "already_approved"
                ? "This work order has already been approved."
                : "Work order approved. Your service center has been notified."}
            </p>
            {status === "approved" && (
              <p className="text-slate-400 text-sm pt-4">
                Want to track your boat's full service history?{" "}
                <a href="/" className="text-sky-600 underline hover:text-sky-700">
                  Download Boat Genie
                </a>
                .
              </p>
            )}
          </div>
        )}

        {status === "error" && (
          <div className="space-y-4 py-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="w-10 h-10 text-red-500" />
            </div>
            <p className="text-red-600 font-medium">{errorMsg}</p>
          </div>
        )}
      </div>
    </div>
  );
}
