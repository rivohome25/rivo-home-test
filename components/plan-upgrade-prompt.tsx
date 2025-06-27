import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import type { PlanName } from "@/components/plan-features";

interface PlanUpgradePromptProps {
  currentPlan: PlanName;
  requiredPlan: PlanName;
  feature: string;
  description?: string;
  compact?: boolean;
}

export function PlanUpgradePrompt({
  currentPlan,
  requiredPlan,
  feature,
  description,
  compact = false,
}: PlanUpgradePromptProps) {
  const router = useRouter();

  const handleUpgrade = () => {
    router.push("/settings/billing");
  };

  if (compact) {
    return (
      <div className="rounded-lg border border-dashed p-4 text-center">
        <p className="text-sm text-muted-foreground mb-2">
          {feature} requires {requiredPlan} plan
        </p>
        <Button size="sm" variant="outline" onClick={handleUpgrade}>
          Upgrade Now
          <ArrowRight className="ml-2 h-3 w-3" />
        </Button>
      </div>
    );
  }

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <CardTitle>Upgrade to {requiredPlan}</CardTitle>
        </div>
        <CardDescription>
          {description || `Unlock ${feature} and more premium features`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="rounded-lg bg-muted p-3">
            <p className="text-sm font-medium mb-1">Why upgrade?</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              {requiredPlan === "Core" && (
                <>
                  <li>• Manage up to 3 properties</li>
                  <li>• Store up to 50 documents</li>
                  <li>• Unlimited maintenance reminders</li>
                  <li>• Access property reports</li>
                </>
              )}
              {requiredPlan === "Premium" && (
                <>
                  <li>• Unlimited properties</li>
                  <li>• Unlimited document storage</li>
                  <li>• Direct provider booking</li>
                  <li>• Priority support</li>
                </>
              )}
            </ul>
          </div>
          <Button className="w-full" onClick={handleUpgrade}>
            View Upgrade Options
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

interface InlineUpgradePromptProps {
  requiredPlan: PlanName;
  message?: string;
}

export function InlineUpgradePrompt({ 
  requiredPlan, 
  message 
}: InlineUpgradePromptProps) {
  const router = useRouter();

  return (
    <div className="inline-flex items-center gap-2 text-sm">
      <span className="text-muted-foreground">
        {message || `Requires ${requiredPlan} plan`}
      </span>
      <Button
        variant="link"
        size="sm"
        className="h-auto p-0 text-primary"
        onClick={() => router.push("/settings/billing")}
      >
        Upgrade
        <ArrowRight className="ml-1 h-3 w-3" />
      </Button>
    </div>
  );
} 