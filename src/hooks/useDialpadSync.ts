import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function useDialpadSync() {
  const [syncing, setSyncing] = useState(false);
  const { toast } = useToast();

  const syncCalls = async (options?: {
    limit?: number;
    startTime?: string;
    endTime?: string;
  }) => {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('dialpad-sync', {
        body: {
          limit: options?.limit || 100,
          start_time: options?.startTime || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          end_time: options?.endTime,
        },
      });

      if (error) throw error;

      toast({
        title: "Sync Complete",
        description: `Successfully synced ${data.synced} calls from Dialpad`,
      });

      return { success: true, data };
    } catch (error) {
      console.error('Error syncing calls:', error);
      toast({
        title: "Sync Failed",
        description: "Failed to sync calls from Dialpad. Please try again.",
        variant: "destructive",
      });
      return { success: false, error };
    } finally {
      setSyncing(false);
    }
  };

  const makeCall = async (
    phoneNumber: string,
    options?: {
      contactId?: string;
      dealId?: string;
      companyId?: string;
    }
  ) => {
    try {
      const { data, error } = await supabase.functions.invoke('dialpad-make-call', {
        body: {
          to_number: phoneNumber,
          contact_id: options?.contactId,
          deal_id: options?.dealId,
          company_id: options?.companyId,
        },
      });

      if (error) throw error;

      toast({
        title: "Call Initiated",
        description: `Calling ${phoneNumber}...`,
      });

      return { success: true, data };
    } catch (error) {
      console.error('Error making call:', error);
      toast({
        title: "Call Failed",
        description: "Failed to initiate call. Please try again.",
        variant: "destructive",
      });
      return { success: false, error };
    }
  };

  return {
    syncing,
    syncCalls,
    makeCall,
  };
}
