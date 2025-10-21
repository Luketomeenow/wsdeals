import { Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDialpadSync } from "@/hooks/useDialpadSync";

interface CallsSyncButtonProps {
  onSyncComplete?: () => void;
  variant?: "default" | "outline" | "ghost";
}

export function CallsSyncButton({ onSyncComplete, variant = "outline" }: CallsSyncButtonProps) {
  const { syncing, syncCalls } = useDialpadSync();

  const handleSync = async () => {
    const result = await syncCalls();
    if (result.success && onSyncComplete) {
      onSyncComplete();
    }
  };

  return (
    <Button onClick={handleSync} disabled={syncing} variant={variant}>
      <Phone className="mr-2 h-4 w-4" />
      {syncing ? 'Syncing...' : 'Sync Dialpad'}
    </Button>
  );
}
