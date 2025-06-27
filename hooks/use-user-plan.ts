import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useUser } from "@supabase/auth-helpers-react";
import type { PlanName } from "@/components/plan-features";

interface UserPlan {
  id: number;
  name: PlanName;
  maxHomes: number | null;
  maxDocs: number | null;
  unlimitedReminders: boolean;
  reportAccess: boolean;
  prioritySupport: boolean;
}

interface UserPlanData {
  plan: UserPlan | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useUserPlan(): UserPlanData {
  const supabase = createClientComponentClient();
  const user = useUser();
  const [plan, setPlan] = useState<UserPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserPlan = async () => {
    if (!user) {
      setPlan(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch user's plan
      const { data: userPlanData, error: userPlanError } = await supabase
        .from("user_plans")
        .select("plan_id")
        .eq("user_id", user.id)
        .single();

      if (userPlanError) {
        throw userPlanError;
      }

      // Fetch plan details
      const { data: planData, error: planError } = await supabase
        .from("plans")
        .select("*")
        .eq("id", userPlanData.plan_id)
        .single();

      if (planError) {
        throw planError;
      }

      setPlan({
        id: planData.id,
        name: planData.name as PlanName,
        maxHomes: planData.max_homes,
        maxDocs: planData.max_docs,
        unlimitedReminders: planData.unlimited_reminders,
        reportAccess: planData.report_access,
        prioritySupport: planData.priority_support,
      });
    } catch (err) {
      console.error("Error fetching user plan:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch plan");
      setPlan(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserPlan();
  }, [user?.id]);

  return {
    plan,
    loading,
    error,
    refetch: fetchUserPlan,
  };
}

// Helper functions for plan-based logic
export function canAddProperty(plan: UserPlan | null, currentPropertyCount: number): boolean {
  if (!plan) return false;
  if (plan.maxHomes === null) return true; // Premium - unlimited
  return currentPropertyCount < plan.maxHomes;
}

export function canUploadDocument(plan: UserPlan | null, currentDocCount: number): boolean {
  if (!plan) return false;
  if (plan.maxDocs === null) return true; // Premium - unlimited
  return currentDocCount < plan.maxDocs;
}

export function canCreateBooking(plan: UserPlan | null): boolean {
  if (!plan) return false;
  return plan.name === "Premium";
}

export function hasReportAccess(plan: UserPlan | null): boolean {
  if (!plan) return false;
  return plan.reportAccess;
}

export function hasUnlimitedReminders(plan: UserPlan | null): boolean {
  if (!plan) return false;
  return plan.unlimitedReminders;
}

export function hasPrioritySupport(plan: UserPlan | null): boolean {
  if (!plan) return false;
  return plan.prioritySupport;
} 