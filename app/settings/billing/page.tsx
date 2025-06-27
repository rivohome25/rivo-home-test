"use client";

import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, CreditCard, Calendar, FileText, AlertCircle, Info, RefreshCw } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import HomeownerNavigationClient from "@/components/HomeownerNavigationClient";
import ProviderNavigationClient from "@/components/ProviderNavigationClient";
import SettingsNavigation from "@/components/SettingsNavigation";

// Import Stripe.js
import { loadStripe } from "@stripe/stripe-js";

const stripePublicKey = process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY;
const isStripeConfigured = !!stripePublicKey;

type BillingInfo = {
  plan_id: number | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  subscription_status: string | "free";
  current_period_end: string | null;
  upcoming_invoice: {
    id: string;
    amount_due: number;
    currency: string;
    due_date: number;
  } | null;
  invoices: Array<{
    id: string;
    amount_paid: number;
    currency: string;
    status: string;
    invoice_pdf: string;
    hosted_invoice_url: string;
    period_start: number;
    period_end: number;
    created: number;
  }>;
};

const stripePromise = isStripeConfigured ? loadStripe(stripePublicKey!) : null;

export default function BillingPage() {
  const supabase = createClientComponentClient();
  const router = useRouter();

  const [billingInfo, setBillingInfo] = useState<BillingInfo | null>(null);
  const [plansMap, setPlansMap] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<'homeowner' | 'provider' | 'admin'>('homeowner');

  // Fetch user role
  useEffect(() => {
    const fetchUserRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        
        if (profile?.role) {
          setUserRole(profile.role as 'homeowner' | 'provider' | 'admin');
        }
      }
    };
    
    fetchUserRole();
  }, [supabase]);

  // Fetch all plan names
  const fetchPlans = async () => {
    const { data, error } = await supabase.from("plans").select("id, name");
    if (error) {
      console.error("Error fetching plans:", error);
    } else if (data) {
      const map: Record<number, string> = {};
      data.forEach((p: { id: number; name: string }) => {
        map[p.id] = p.name;
      });
      setPlansMap(map);
    }
  };

  // Fetch billing info
  const fetchBillingInfo = async () => {
    if (!isStripeConfigured) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    const res = await fetch("/api/billing");
    const json = await res.json();
    if (!res.ok) {
      console.error("Error fetching billing info:", json.error);
      setErrorMsg(json.error || "Failed to load billing info");
    } else {
      setBillingInfo(json as BillingInfo);
    }

    setLoading(false);
  };

  // Check for session_id in URL (returning from Stripe)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get("session_id");
    
    if (sessionId) {
      setSuccessMsg("Payment successful! Your subscription has been updated.");
      // Clean up URL
      window.history.replaceState({}, document.title, "/settings/billing");
    }
  }, []);

  useEffect(() => {
    fetchPlans();
    fetchBillingInfo();
  }, []);

  // Handle Upgrade (redirect to Checkout)
  const handleCheckout = async (targetPlan: "core" | "rivopro") => {
    setActionLoading(true);
    setErrorMsg(null);

    const res = await fetch("/api/billing/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan: targetPlan }),
    });
    
    const json = await res.json();
    if (!res.ok) {
      console.error("Checkout error:", json.error);
      setErrorMsg(json.error || "Failed to create checkout session");
      setActionLoading(false);
      return;
    }

    // Redirect to Stripe Checkout
    window.location.href = json.sessionUrl;
  };

  // Handle Plan Change (including downgrades)
  const handlePlanChange = async (targetPlan: "free" | "core" | "rivopro") => {
    let confirmMessage = "";
    
    if (targetPlan === "free") {
      confirmMessage = "Are you sure you want to cancel your subscription? You'll continue to have access until the end of your billing period, then be moved to the Free plan.";
    } else if (targetPlan === "core" && (currentPlanName === 'Premium' || currentPlanName === 'RivoPro')) {
      confirmMessage = "Are you sure you want to downgrade to the Core plan? You'll be credited for unused time and charged the prorated amount. Some premium features will be removed immediately.";
    } else if (targetPlan === "rivopro" && currentPlanName === 'Core') {
      confirmMessage = "Are you sure you want to upgrade to the Premium plan? You'll be charged the prorated amount immediately.";
    } else {
      confirmMessage = "Are you sure you want to change your plan?";
    }

    if (!confirm(confirmMessage)) {
      return;
    }
    
    setActionLoading(true);
    setErrorMsg(null);

    const res = await fetch("/api/billing/change-plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ target_plan: targetPlan }),
    });
    
    const json = await res.json();
    if (!res.ok) {
      console.error("Plan change error:", json.error);
      setErrorMsg(json.error || "Failed to change plan");
    } else {
      setSuccessMsg(json.message || "Your plan has been updated successfully.");
      fetchBillingInfo();
    }

    setActionLoading(false);
  };

  // Handle Cancel Subscription (legacy - keeping for backwards compatibility)
  const handleCancel = async () => {
    return handlePlanChange("free");
  };

  // Handle Force Sync Subscription
  const handleSyncSubscription = async () => {
    setActionLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch("/api/debug/force-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      
      const json = await res.json();
      
      if (!res.ok) {
        setErrorMsg(json.error || "Failed to sync subscription");
      } else {
        setSuccessMsg(`Subscription synced successfully! You are now on the ${json.details.plan_name} plan.`);
        // Refresh billing info to show updated plan
        await fetchBillingInfo();
      }
    } catch (error) {
      console.error("Sync error:", error);
      setErrorMsg("Network error occurred while syncing subscription");
    }

    setActionLoading(false);
  };

  const currentPlanName = billingInfo?.plan_id ? plansMap[billingInfo.plan_id] : "Free";
  const isSubscriptionActive = billingInfo?.subscription_status === "active";
  const isCanceling = isSubscriptionActive && billingInfo?.stripe_subscription_id && 
    new Date(billingInfo.current_period_end!) > new Date();

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  const formatDate = (timestamp: number | string) => {
    const date = typeof timestamp === "number" ? new Date(timestamp * 1000) : new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      active: "default",
      past_due: "destructive",
      canceled: "secondary",
      free: "outline",
    };
    return <Badge variant={variants[status] || "outline"}>{status.replace("_", " ")}</Badge>;
  };

  // Show placeholder if Stripe is not configured
  if (!isStripeConfigured || !loadStripe) {
    return (
      <div className="min-h-screen bg-gray-50">
        {userRole === 'provider' ? (
          <ProviderNavigationClient 
            title="Settings" 
            currentPage="settings"
          />
        ) : (
          <HomeownerNavigationClient 
            title="Settings" 
            currentPage="settings"
          />
        )}
        
        <div className="max-w-[1600px] mx-auto px-2 sm:px-4 lg:px-6 pb-8 space-y-6">
          <SettingsNavigation userRole={userRole} />
          
          <div className="space-y-8">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Billing & Subscription</h1>
              <p className="text-muted-foreground">
                Manage your subscription plan and view billing history
              </p>
            </div>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Billing features are coming soon! We're currently setting up our payment system to provide you with the best subscription experience.
              </AlertDescription>
            </Alert>

            {/* Current Plan Status */}
            <Card>
              <CardHeader>
                <CardTitle>Current Plan</CardTitle>
                <CardDescription>Your active subscription details</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-2xl font-semibold">Free Plan (Starter)</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Perfect for first-time homeowners or home renters exploring home maintenance.
                    </p>
                  </div>
                  
                  <div className="rounded-lg bg-muted p-4">
                    <p className="text-sm font-medium mb-2">Current Features:</p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• $0/month</li>
                      <li>• 1 home profile</li>
                      <li>• Up to 10 maintenance reminders</li>
                      <li>• Basic maintenance guide</li>
                      <li>• Limited document storage (3 files)</li>
                      <li>• DIY video library</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Homeowner Plans */}
            {userRole === 'homeowner' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Homeowner Plans</h2>
                  <p className="text-muted-foreground">Choose the plan that fits your home maintenance needs</p>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                  {/* Free Plan */}
                  <Card className="relative">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-xl">Free Plan</CardTitle>
                        <Badge variant="outline">Current</Badge>
                      </div>
                      <CardDescription>Perfect for first-time homeowners or home renters</CardDescription>
                      <div className="pt-4">
                        <span className="text-3xl font-bold">$0</span>
                        <span className="text-muted-foreground">/month</span>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-start gap-2">
                          <span className="text-green-500 mt-1">✓</span>
                          <span>1 home profile</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-green-500 mt-1">✓</span>
                          <span>Up to 10 maintenance reminders</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-green-500 mt-1">✓</span>
                          <span>Basic maintenance guide</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-green-500 mt-1">✓</span>
                          <span>Limited document storage (3 files)</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-green-500 mt-1">✓</span>
                          <span>DIY video library</span>
                        </li>
                      </ul>
                      <div className="pt-4">
                        <Button disabled variant="outline" className="w-full">
                          Current Plan
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Core Plan */}
                  <Card className="relative border-blue-200 shadow-lg">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-xl">Core Plan</CardTitle>
                        <Badge className="bg-blue-600">Popular</Badge>
                      </div>
                      <CardDescription>Ideal for everyday homeowners who want to stay organized</CardDescription>
                      <div className="pt-4">
                        <span className="text-3xl font-bold">$7</span>
                        <span className="text-muted-foreground">/month</span>
                        <div className="text-sm text-muted-foreground">or $70/year</div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="text-sm font-medium text-muted-foreground">Everything in Free, plus:</div>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-start gap-2">
                          <span className="text-green-500 mt-1">✓</span>
                          <span>Up to 3 home profiles</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-green-500 mt-1">✓</span>
                          <span>Unlimited reminders & smart alerts</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-green-500 mt-1">✓</span>
                          <span>Complete seasonal maintenance checklist</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-green-500 mt-1">✓</span>
                          <span>Home maintenance calendar</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-green-500 mt-1">✓</span>
                          <span>Increased document storage (50 files)</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-green-500 mt-1">✓</span>
                          <span>Access to search and message providers</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-green-500 mt-1">✓</span>
                          <span>In-Platform Rivo Report (non-shareable)</span>
                        </li>
                      </ul>
                      <div className="pt-4">
                        <Button className="w-full bg-blue-600 hover:bg-blue-700" disabled>
                          Coming Soon
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Premium Plan */}
                  <Card className="relative border-blue-600 shadow-xl bg-gradient-to-br from-blue-50 to-indigo-50">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-xl">Premium Plan</CardTitle>
                        {(currentPlanName === 'Premium' || currentPlanName === 'RivoPro') ? 
                          <Badge className="bg-blue-600">Current</Badge> : 
                          <Badge className="bg-blue-600">RivoPro</Badge>
                        }
                      </div>
                      <CardDescription>Built for power homeowners, sellers, and realtors</CardDescription>
                      <div className="pt-4">
                        <span className="text-3xl font-bold">$20</span>
                        <span className="text-muted-foreground">/month</span>
                        <div className="text-sm text-muted-foreground">or $200/year</div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="text-sm font-medium text-muted-foreground">Everything in Core, plus:</div>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-start gap-2">
                          <span className="text-green-500 mt-1">✓</span>
                          <span>Unlimited home profiles</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-green-500 mt-1">✓</span>
                          <span>Unlimited document vault</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-green-500 mt-1">✓</span>
                          <span>Direct booking with verified providers</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-green-500 mt-1">✓</span>
                          <span>Shareable Rivo Report (PDF format)</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-green-500 mt-1">✓</span>
                          <span>Priority customer support</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-green-500 mt-1">✓</span>
                          <span>Early access to beta features</span>
                        </li>
                      </ul>
                      <div className="pt-4">
                        {(currentPlanName === 'Premium' || currentPlanName === 'RivoPro') ? (
                          <Button disabled variant="outline" className="w-full">
                            Current Plan
                          </Button>
                        ) : (
                          <Button 
                            className="w-full bg-blue-600 hover:bg-blue-700" 
                            onClick={() => handleCheckout("rivopro")}
                            disabled={actionLoading}
                          >
                            {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Upgrade to Premium"}
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* Provider Plans */}
            {userRole === 'provider' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Service Provider Plans</h2>
                  <p className="text-muted-foreground">Grow your business with RivoHome's provider network</p>
                </div>

                <div className="max-w-md mx-auto">
                  <Card className="relative border-orange-200 shadow-lg">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-xl">Founding Provider</CardTitle>
                        <Badge className="bg-orange-600">Early Access</Badge>
                      </div>
                      <CardDescription>Join the founding network of service providers</CardDescription>
                      <div className="pt-4">
                        <span className="text-3xl font-bold">$99</span>
                        <span className="text-muted-foreground">/month</span>
                        <div className="text-sm text-green-600 font-medium">First 3 months free</div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-start gap-2">
                          <span className="text-green-500 mt-1">✓</span>
                          <span>Local profile listing</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-green-500 mt-1">✓</span>
                          <span>Leads from homeowners in your area</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-green-500 mt-1">✓</span>
                          <span>Priority access to bookings</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-green-500 mt-1">✓</span>
                          <span>Reviews & ratings collection</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-green-500 mt-1">✓</span>
                          <span>Lifetime discount eligibility</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-green-500 mt-1">✓</span>
                          <span>'Founding Provider' badge</span>
                        </li>
                      </ul>
                      <div className="pt-4">
                        <Button className="w-full bg-orange-600 hover:bg-orange-700" disabled>
                          Contact Sales
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* Value Proposition */}
            <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 border-0">
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <h3 className="text-xl font-semibold">Why Choose RivoHome?</h3>
                  <div className="grid md:grid-cols-3 gap-6 text-sm">
                    <div className="space-y-2">
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center mx-auto">
                        <Calendar className="w-4 h-4 text-white" />
                      </div>
                      <h4 className="font-medium">Stay Organized</h4>
                      <p className="text-muted-foreground">Never miss important maintenance with smart reminders and seasonal checklists.</p>
                    </div>
                    <div className="space-y-2">
                      <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center mx-auto">
                        <FileText className="w-4 h-4 text-white" />
                      </div>
                      <h4 className="font-medium">Document Everything</h4>
                      <p className="text-muted-foreground">Store warranties, receipts, and maintenance records in one secure place.</p>
                    </div>
                    <div className="space-y-2">
                      <div className="w-8 h-8 bg-cyan-600 rounded-full flex items-center justify-center mx-auto">
                        <CreditCard className="w-4 h-4 text-white" />
                      </div>
                      <h4 className="font-medium">Increase Home Value</h4>
                      <p className="text-muted-foreground">Maintain detailed records that help with resale and insurance claims.</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        {userRole === 'provider' ? (
          <ProviderNavigationClient 
            title="Settings" 
            currentPage="settings"
          />
        ) : (
          <HomeownerNavigationClient 
            title="Settings" 
            currentPage="settings"
          />
        )}
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
          <div className="max-w-4xl mx-auto">
            <SettingsNavigation userRole={userRole} />
            
            <div className="flex items-center justify-center min-h-[400px]">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {userRole === 'provider' ? (
        <ProviderNavigationClient 
          title="Settings" 
          currentPage="settings"
        />
      ) : (
        <HomeownerNavigationClient 
          title="Settings" 
          currentPage="settings"
        />
      )}
      
      <div className="max-w-[1600px] mx-auto px-2 sm:px-4 lg:px-6 pb-8 space-y-6">
        <SettingsNavigation userRole={userRole} />
        
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Billing & Subscription</h1>
            <p className="text-muted-foreground">
              Manage your subscription plan and view billing history
            </p>
          </div>

          {errorMsg && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errorMsg}</AlertDescription>
            </Alert>
          )}

          {successMsg && (
            <Alert>
              <AlertDescription>{successMsg}</AlertDescription>
            </Alert>
          )}

          {billingInfo && (
            <>
              {/* Current Plan Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Current Plan</CardTitle>
                  <CardDescription>Your active subscription details</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <p className="text-2xl font-semibold">{currentPlanName}</p>
                        {getStatusBadge(billingInfo.subscription_status)}
                      </div>
                      
                      {isCanceling && (
                        <p className="text-amber-600 text-sm mb-2">
                          Your subscription will end on {formatDate(billingInfo.current_period_end!)}
                        </p>
                      )}
                      
                      {isSubscriptionActive && billingInfo.current_period_end && (
                        <p className="text-sm text-muted-foreground">
                          Next billing date: {formatDate(billingInfo.current_period_end)}
                        </p>
                      )}
                    </div>
                    
                    <div className="text-right">
                      {/* Free Plan - Show upgrade options */}
                      {currentPlanName === 'Free' && (
                        <div className="space-x-2">
                          <Button 
                            onClick={() => handleCheckout("core")} 
                            disabled={actionLoading}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                            Upgrade to Core ($7/mo)
                          </Button>
                          <Button 
                            onClick={() => handleCheckout("rivopro")} 
                            disabled={actionLoading}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                            Upgrade to Premium ($20/mo)
                          </Button>
                        </div>
                      )}
                      
                      {/* Core Plan - Show upgrade to Premium or downgrade to Free */}
                      {currentPlanName === 'Core' && isSubscriptionActive && !isCanceling && (
                        <div className="space-y-2">
                          <div className="space-x-2">
                            <Button 
                              onClick={() => handlePlanChange("rivopro")} 
                              disabled={actionLoading}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                              Upgrade to Premium
                            </Button>
                          </div>
                          <div>
                            <Button 
                              variant="outline" 
                              onClick={() => handlePlanChange("free")} 
                              disabled={actionLoading}
                              className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                            >
                              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                              Cancel to Free Plan
                            </Button>
                          </div>
                        </div>
                      )}
                      
                      {/* Premium Plan - Show downgrade options */}
                      {(currentPlanName === 'Premium' || currentPlanName === 'RivoPro') && isSubscriptionActive && !isCanceling && (
                        <div className="space-y-2">
                          <div>
                            <Button 
                              variant="outline" 
                              onClick={() => handlePlanChange("core")} 
                              disabled={actionLoading}
                              className="bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700"
                            >
                              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                              Downgrade to Core ($7/mo)
                            </Button>
                          </div>
                          <div>
                            <Button 
                              variant="outline" 
                              onClick={() => handlePlanChange("free")} 
                              disabled={actionLoading}
                              className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                            >
                              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                              Cancel to Free Plan
                            </Button>
                          </div>
                        </div>
                      )}
                      
                      {/* Subscription is canceling */}
                      {isCanceling && (
                        <div className="text-sm text-amber-600">
                          <p>Cancellation scheduled</p>
                          <p>Access until {formatDate(billingInfo.current_period_end!)}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Sync Subscription Button - for troubleshooting */}
                  {billingInfo.stripe_customer_id && (
                    <>
                      <Separator className="my-4" />
                      <div className="flex items-center justify-between bg-blue-50 p-4 rounded-lg">
                        <div>
                          <h4 className="font-medium text-sm">Payment Issues?</h4>
                          <p className="text-xs text-muted-foreground">
                            If you made a payment but your plan hasn't updated, click sync to manually update your subscription.
                          </p>
                        </div>
                        <Button 
                          variant="outline"
                          onClick={handleSyncSubscription}
                          disabled={actionLoading}
                          className="ml-4"
                        >
                          {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                          Sync Subscription
                        </Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Available Plans Section */}
              {userRole === 'homeowner' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">Available Plans</h2>
                    <p className="text-muted-foreground">Compare plans and upgrade anytime</p>
                  </div>

                  <div className="grid gap-6 lg:grid-cols-3">
                    {/* Free Plan */}
                    <Card className={`relative ${currentPlanName === 'Free' ? 'border-green-200 bg-green-50' : ''}`}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-xl">Free Plan</CardTitle>
                          {currentPlanName === 'Free' && <Badge variant="outline" className="border-green-600 text-green-600">Current</Badge>}
                        </div>
                        <CardDescription>Perfect for first-time homeowners or home renters</CardDescription>
                        <div className="pt-4">
                          <span className="text-3xl font-bold">$0</span>
                          <span className="text-muted-foreground">/month</span>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <ul className="space-y-2 text-sm">
                          <li className="flex items-start gap-2">
                            <span className="text-green-500 mt-1">✓</span>
                            <span>1 home profile</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-green-500 mt-1">✓</span>
                            <span>Up to 10 maintenance reminders</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-green-500 mt-1">✓</span>
                            <span>Basic maintenance guide</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-green-500 mt-1">✓</span>
                            <span>Limited document storage (3 files)</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-green-500 mt-1">✓</span>
                            <span>DIY video library</span>
                          </li>
                        </ul>
                        <div className="pt-4">
                          {currentPlanName === 'Free' ? (
                            <Button disabled variant="outline" className="w-full">
                              Current Plan
                            </Button>
                          ) : (
                            <Button 
                              variant="outline"
                              className="w-full text-red-600 hover:text-red-700 border-red-200 hover:border-red-300" 
                              onClick={() => handlePlanChange("free")}
                              disabled={actionLoading}
                            >
                              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Downgrade to Free"}
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Core Plan */}
                    <Card className={`relative border-blue-200 shadow-lg ${currentPlanName === 'Core' ? 'bg-blue-50' : ''}`}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-xl">Core Plan</CardTitle>
                          {currentPlanName === 'Core' ? 
                            <Badge className="bg-blue-600">Current</Badge> : 
                            <Badge className="bg-blue-600">Popular</Badge>
                          }
                        </div>
                        <CardDescription>Ideal for everyday homeowners who want to stay organized</CardDescription>
                        <div className="pt-4">
                          <span className="text-3xl font-bold">$7</span>
                          <span className="text-muted-foreground">/month</span>
                          <div className="text-sm text-muted-foreground">or $70/year</div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="text-sm font-medium text-muted-foreground">Everything in Free, plus:</div>
                        <ul className="space-y-2 text-sm">
                          <li className="flex items-start gap-2">
                            <span className="text-green-500 mt-1">✓</span>
                            <span>Up to 3 home profiles</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-green-500 mt-1">✓</span>
                            <span>Unlimited reminders & smart alerts</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-green-500 mt-1">✓</span>
                            <span>Complete seasonal maintenance checklist</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-green-500 mt-1">✓</span>
                            <span>Home maintenance calendar</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-green-500 mt-1">✓</span>
                            <span>Increased document storage (50 files)</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-green-500 mt-1">✓</span>
                            <span>Access to search and message providers</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-green-500 mt-1">✓</span>
                            <span>In-Platform Rivo Report (non-shareable)</span>
                          </li>
                        </ul>
                        <div className="pt-4">
                          {currentPlanName === 'Core' ? (
                            <Button disabled variant="outline" className="w-full">
                              Current Plan
                            </Button>
                          ) : currentPlanName === 'Free' ? (
                            <Button 
                              className="w-full bg-blue-600 hover:bg-blue-700" 
                              onClick={() => handleCheckout("core")}
                              disabled={actionLoading}
                            >
                              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Upgrade to Core"}
                            </Button>
                          ) : (
                            <Button 
                              variant="outline"
                              className="w-full bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700" 
                              onClick={() => handlePlanChange("core")}
                              disabled={actionLoading}
                            >
                              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Downgrade to Core"}
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Premium Plan */}
                    <Card className={`relative border-blue-600 shadow-xl bg-gradient-to-br from-blue-50 to-indigo-50 ${currentPlanName === 'Premium' || currentPlanName === 'RivoPro' ? 'bg-blue-50' : ''}`}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-xl">Premium Plan</CardTitle>
                          {(currentPlanName === 'Premium' || currentPlanName === 'RivoPro') ? 
                            <Badge className="bg-blue-600">Current</Badge> : 
                            <Badge className="bg-blue-600">RivoPro</Badge>
                          }
                        </div>
                        <CardDescription>Built for power homeowners, sellers, and realtors</CardDescription>
                        <div className="pt-4">
                          <span className="text-3xl font-bold">$20</span>
                          <span className="text-muted-foreground">/month</span>
                          <div className="text-sm text-muted-foreground">or $200/year</div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="text-sm font-medium text-muted-foreground">Everything in Core, plus:</div>
                        <ul className="space-y-2 text-sm">
                          <li className="flex items-start gap-2">
                            <span className="text-green-500 mt-1">✓</span>
                            <span>Unlimited home profiles</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-green-500 mt-1">✓</span>
                            <span>Unlimited document vault</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-green-500 mt-1">✓</span>
                            <span>Direct booking with verified providers</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-green-500 mt-1">✓</span>
                            <span>Shareable Rivo Report (PDF format)</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-green-500 mt-1">✓</span>
                            <span>Priority customer support</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-green-500 mt-1">✓</span>
                            <span>Early access to beta features</span>
                          </li>
                        </ul>
                        <div className="pt-4">
                          {(currentPlanName === 'Premium' || currentPlanName === 'RivoPro') ? (
                            <Button disabled variant="outline" className="w-full">
                              Current Plan
                            </Button>
                          ) : currentPlanName === 'Free' || currentPlanName === 'Core' ? (
                            <Button 
                              className="w-full bg-blue-600 hover:bg-blue-700" 
                              onClick={() => handleCheckout("rivopro")}
                              disabled={actionLoading}
                            >
                              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Upgrade to Premium"}
                            </Button>
                          ) : null}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}

              {/* Provider Plans for providers */}
              {userRole === 'provider' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">Service Provider Plans</h2>
                    <p className="text-muted-foreground">Grow your business with RivoHome's provider network</p>
                  </div>

                  <div className="max-w-md mx-auto">
                    <Card className="relative border-orange-200 shadow-lg">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-xl">Founding Provider</CardTitle>
                          <Badge className="bg-orange-600">Early Access</Badge>
                        </div>
                        <CardDescription>Join the founding network of service providers</CardDescription>
                        <div className="pt-4">
                          <span className="text-3xl font-bold">$99</span>
                          <span className="text-muted-foreground">/month</span>
                          <div className="text-sm text-green-600 font-medium">First 3 months free</div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <ul className="space-y-2 text-sm">
                          <li className="flex items-start gap-2">
                            <span className="text-green-500 mt-1">✓</span>
                            <span>Local profile listing</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-green-500 mt-1">✓</span>
                            <span>Leads from homeowners in your area</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-green-500 mt-1">✓</span>
                            <span>Priority access to bookings</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-green-500 mt-1">✓</span>
                            <span>Reviews & ratings collection</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-green-500 mt-1">✓</span>
                            <span>Lifetime discount eligibility</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-green-500 mt-1">✓</span>
                            <span>'Founding Provider' badge</span>
                          </li>
                        </ul>
                        <div className="pt-4">
                          <Button className="w-full bg-orange-600 hover:bg-orange-700" disabled>
                            Contact Sales
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}

              {/* Upcoming Invoice */}
              {billingInfo.upcoming_invoice && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Upcoming Invoice
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">
                          {formatCurrency(billingInfo.upcoming_invoice.amount_due, billingInfo.upcoming_invoice.currency)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Due on {formatDate(billingInfo.upcoming_invoice.due_date)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Invoice History */}
              {billingInfo.invoices && billingInfo.invoices.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Invoice History
                    </CardTitle>
                    <CardDescription>Download your past invoices for accounting</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {billingInfo.invoices.map((invoice) => (
                        <div key={invoice.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <p className="font-medium">
                              {formatCurrency(invoice.amount_paid, invoice.currency)}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {formatDate(invoice.period_start)} - {formatDate(invoice.period_end)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusBadge(invoice.status)}
                            <Button size="sm" variant="outline" asChild>
                              <a href={invoice.hosted_invoice_url} target="_blank" rel="noopener noreferrer">
                                View
                              </a>
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
} 