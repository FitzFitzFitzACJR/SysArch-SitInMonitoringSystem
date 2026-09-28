import { CircleAlert, CircleCheck } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function FormAlert({ message, variant = "error" }: { message?: string; variant?: "error" | "success" }) {
  if (!message) return null;
  return (
    <Alert variant={variant === "error" ? "destructive" : "default"} role={variant === "error" ? "alert" : "status"}>
      {variant === "error" ? <CircleAlert /> : <CircleCheck />}
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}
