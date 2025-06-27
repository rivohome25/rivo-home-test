import { Badge } from "@/components/ui/badge";
import { Check, X, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

export type PlanName = "Free" | "Core" | "Premium";

export interface PlanFeature {
  name: string;
  free: boolean | string;
  core: boolean | string;
  premium: boolean | string;
}

export const planFeatures: PlanFeature[] = [
  {
    name: "Home Profiles",
    free: "1 home",
    core: "Up to 3 homes",
    premium: "Unlimited homes",
  },
  {
    name: "Document Storage",
    free: "3 documents",
    core: "50 documents",
    premium: "Unlimited documents",
  },
  {
    name: "Maintenance Reminders",
    free: "Up to 10",
    core: "Unlimited",
    premium: "Unlimited",
  },
  {
    name: "DIY Video Library",
    free: true,
    core: true,
    premium: true,
  },
  {
    name: "Seasonal Maintenance Checklist",
    free: "Basic guide",
    core: "Complete regional checklist",
    premium: "Complete regional checklist",
  },
  {
    name: "Home Maintenance Calendar",
    free: false,
    core: true,
    premium: true,
  },
  {
    name: "Provider Search & Messaging",
    free: false,
    core: true,
    premium: true,
  },
  {
    name: "Rivo Reports",
    free: false,
    core: "Non-shareable",
    premium: "Shareable PDF",
  },
  {
    name: "Direct Provider Booking",
    free: false,
    core: false,
    premium: true,
  },
  {
    name: "Priority Support",
    free: false,
    core: false,
    premium: true,
  },
  {
    name: "Beta Features Access",
    free: false,
    core: false,
    premium: true,
  },
];

interface PlanFeatureListProps {
  currentPlan: PlanName;
  showAllPlans?: boolean;
  className?: string;
}

export function PlanFeatureList({ 
  currentPlan, 
  showAllPlans = false,
  className 
}: PlanFeatureListProps) {
  const planKey = currentPlan.toLowerCase() as "free" | "core" | "premium";

  return (
    <div className={cn("space-y-3", className)}>
      {planFeatures.map((feature) => {
        const value = feature[planKey];
        const isAvailable = value !== false;
        const displayValue = typeof value === "string" ? value : null;

        return (
          <div key={feature.name} className="flex items-center justify-between">
            <span className="text-sm">{feature.name}</span>
            <div className="flex items-center gap-2">
              {displayValue ? (
                <span className="text-sm font-medium">{displayValue}</span>
              ) : isAvailable ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <X className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

interface PlanComparisonProps {
  currentPlan: PlanName;
  onUpgrade?: (plan: "core" | "premium") => void;
}

export function PlanComparison({ currentPlan, onUpgrade }: PlanComparisonProps) {
  const plans = [
    { name: "Free", price: "$0", priceDetail: "forever" },
    { name: "Core", price: "$7", priceDetail: "per month" },
    { name: "Premium", price: "$20", priceDetail: "per month" },
  ];

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {plans.map((plan) => {
        const planKey = plan.name.toLowerCase() as "free" | "core" | "premium";
        const isCurrent = plan.name === currentPlan;
        const isUpgrade = 
          (currentPlan === "Free" && (plan.name === "Core" || plan.name === "Premium")) ||
          (currentPlan === "Core" && plan.name === "Premium");

        return (
          <div
            key={plan.name}
            className={cn(
              "relative rounded-lg border p-6",
              isCurrent && "border-primary shadow-sm",
              isUpgrade && "border-muted-foreground/50"
            )}
          >
            {isCurrent && (
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                Current Plan
              </Badge>
            )}
            
            <div className="mb-6">
              <h3 className="text-lg font-semibold">{plan.name}</h3>
              <div className="mt-2">
                <span className="text-3xl font-bold">{plan.price}</span>
                <span className="text-muted-foreground ml-1">{plan.priceDetail}</span>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              {planFeatures.map((feature) => {
                const value = feature[planKey];
                const isAvailable = value !== false;
                const displayValue = typeof value === "string" ? value : null;

                return (
                  <div key={feature.name} className="flex items-start gap-2">
                    {isAvailable ? (
                      <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    ) : (
                      <X className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    )}
                    <span className="text-sm">
                      {feature.name}
                      {displayValue && (
                        <span className="text-muted-foreground ml-1">({displayValue})</span>
                      )}
                    </span>
                  </div>
                );
              })}
            </div>

            {isUpgrade && onUpgrade && (
              <button
                onClick={() => onUpgrade(planKey as "core" | "premium")}
                className="w-full rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Upgrade to {plan.name}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

interface FeatureGateProps {
  feature: string;
  currentPlan: PlanName;
  requiredPlan: PlanName;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function FeatureGate({ 
  feature, 
  currentPlan, 
  requiredPlan, 
  children, 
  fallback 
}: FeatureGateProps) {
  const planHierarchy = { Free: 0, Core: 1, Premium: 2 };
  const hasAccess = planHierarchy[currentPlan] >= planHierarchy[requiredPlan];

  if (hasAccess) {
    return <>{children}</>;
  }

  return (
    <>
      {fallback || (
        <div className="rounded-lg border border-dashed p-6 text-center">
          <Lock className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-sm font-medium mb-1">{feature} is not available on your plan</p>
          <p className="text-sm text-muted-foreground">
            Upgrade to {requiredPlan} to unlock this feature
          </p>
        </div>
      )}
    </>
  );
} 