/**
 * Onboarding Wizard for new RivoHome homeowners
 * 
 * This page is part of the user registration flow and guides homeowners through 
 * setting up their account preferences, property information, and maintenance tasks.
 * 
 * Flow:
 * 1. User completes sign-up at /sign-up
 * 2. User is automatically redirected to this onboarding wizard
 * 3. User completes all steps in the wizard
 * 4. User is redirected to dashboard when onboarding is complete
 * 
 * The wizard saves progress at each step, allowing users to continue
 * where they left off if they leave and return later.
 */

'use client';
import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import SignOutButton from '@/components/SignOutButton';

// Define interfaces for data types
interface Plan {
  id: string;
  name: string;
  price: number;
  max_homes: number;
  description: string;
  unlimited_reminders: boolean;
  report_access: boolean;
  priority_support: boolean;
}

interface Property {
  id?: string;
  address: string;
  year_built: number;
  property_type: string;
  region: string;
}

interface Task {
  id?: string;
  title: string;
  description: string;
  season?: string;
  priority: 'high' | 'medium' | 'low';
  frequency?: string;
  region?: string;
  plan_name?: string;
  completed?: boolean;
  status?: string;
  due_date?: string;
  completed_at?: string;
  created_at?: string;
  user_id?: string;
  property_id?: string;
}

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  
  // Main wizard state
  const [step, setStep] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  
  // Step-specific states
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [planError, setPlanError] = useState<string>();
  const [paymentCancelled, setPaymentCancelled] = useState(false);
  
  // Property info
  const [property, setProperty] = useState<Property>({
    address: '',
    year_built: new Date().getFullYear(),
    property_type: 'single_family',
    region: ''
  });
  
  // Task lists
  const [masterTasks, setMasterTasks] = useState<Task[]>([]);
  const [userTasks, setUserTasks] = useState<Task[]>([]);
  const [customTasks, setCustomTasks] = useState<Task[]>([]);
  
  // Newsletter subscription
  const [subscribe, setSubscribe] = useState<boolean>(false);
  
  // Check authentication status on load
  useEffect(() => {
    async function checkAuth() {
      try {
        setLoading(true);
        console.log("Checking auth in onboarding page");
        
        // Use getUser instead of getSession for better security
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error) {
          console.error("Auth error:", error);
          throw error;
        }
        
        console.log("Authenticated user:", user?.id);
        
        if (!user) {
          console.log("No user found, redirecting to sign-in");
          // Use direct window location to avoid router issues
          window.location.href = '/sign-in';
          return;
        }
        
        setUserId(user.id);
        
        // Check if onboarding already completed
        const { data: onboarding, error: onboardingError } = await supabase
          .from('user_onboarding')
          .select('current_step, completed')
          .eq('user_id', user.id)
          .single();
        
        if (onboardingError && onboardingError.code !== 'PGRST116') {
          console.error("Onboarding error:", onboardingError);
          throw onboardingError;
        }
        
        console.log("Onboarding data:", onboarding);
        
        // If onboarding exists and is complete, redirect to dashboard
        if (onboarding && onboarding.completed) {
          console.log("Onboarding complete, redirecting to dashboard");
          window.location.href = '/dashboard';
          return;
        }
        
        // If onboarding exists but isn't complete, resume from last step
        if (onboarding) {
          console.log("Resuming onboarding at step:", onboarding.current_step || 1);
          setStep(onboarding.current_step || 1);
          
          // If they had a plan selected, load it
          if (onboarding.plan_id) {
            setSelectedPlan(onboarding.plan_id);
          }
        } else {
          // Create onboarding record
          console.log("Creating new onboarding record");
          const { error: createErr } = await supabase
            .from('user_onboarding')
            .upsert({ 
              user_id: user.id, 
              current_step: 1, 
              completed: false 
            }, { 
              onConflict: ['user_id'], 
              ignoreDuplicates: false 
            });
            
          if (createErr) {
            console.error("Error creating onboarding record:", createErr);
            // If it's just a duplicate key error, we can safely ignore it
            if (createErr.code !== '23505') {
              setError(`Failed to initialize onboarding: ${createErr.message}`);
            }
          }
        }
      } catch (err: any) {
        console.error('Auth error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    
    checkAuth();
  }, []);
  
  // Load plans
  useEffect(() => {
    async function fetchPlans() {
      if (step === 2) {
        try {
          setLoading(true);
          const { data, error } = await supabase
            .from('plans')
            .select('*')
            .order('price');
          
          if (error) throw error;
          setPlans(data || []);
          
          // Check if user already has a plan
          if (userId) {
            const { data: userPlan, error: planError } = await supabase
              .from('user_plans')
              .select('plan_id')
              .eq('user_id', userId)
              .single();
            
            if (!planError && userPlan) {
              setSelectedPlan(userPlan.plan_id);
            }
          }
        } catch (err: any) {
          console.error('Error fetching plans:', err);
          setError(err.message);
        } finally {
          setLoading(false);
        }
      }
    }
    
    fetchPlans();
  }, [step, userId]);
  
  // Load master tasks when needed
  useEffect(() => {
    async function fetchMasterTasks() {
      if (step === 5) {
        try {
          setLoading(true);
          
          // First check if there are already seeded tasks for this user
          const { data: existingTasks, error: tasksError } = await supabase
            .from('view_user_tasks')
            .select('*');
          
          if (tasksError) {
            console.error('Error fetching existing tasks:', tasksError);
            throw tasksError;
          }
          
          if (existingTasks && existingTasks.length > 0) {
            // Use existing tasks if already seeded
            setUserTasks(existingTasks);
            setLoading(false);
            return;
          }
          
          // No tasks yet, so fetch master tasks to show preview
          if (selectedPlan && property.region) {
            // First get the plan name
            const { data: planData, error: planError } = await supabase
              .from('plans')
              .select('name')
              .eq('id', selectedPlan)
              .single();
            
            if (planError) throw planError;
            
            // Fetch tasks based on plan and region
            const { data, error } = await supabase
              .from('master_tasks')
              .select('*')
              .or(`plan_name.eq.${planData?.name},plan_name.is.null`)
              .eq('region', property.region);
            
            if (error) throw error;
            setMasterTasks(data || []);
            setUserTasks(data || []);
          }
        } catch (err: any) {
          console.error('Error fetching tasks:', err);
          setError(err.message);
        } finally {
          setLoading(false);
        }
      }
    }
    
    fetchMasterTasks();
  }, [step, selectedPlan, property.region]);
  
  // Check for payment cancellation or success on load
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentCancelled = urlParams.get('payment_cancelled');
    const stepParam = urlParams.get('step');
    
    if (paymentCancelled === 'true') {
      setPaymentCancelled(true);
      setError('Payment was cancelled. Please select a plan to continue.');
      if (stepParam === '2') {
        setStep(2);
      }
      // Clean up URL
      window.history.replaceState({}, document.title, '/onboarding');
    }
  }, []);
  
  // Function to update onboarding step
  async function updateOnboardingStep(newStep: number) {
    if (!userId) return;
    
    try {
      // Use upsert instead of separate insert/update logic to prevent race conditions
      const { error: upsertErr } = await supabase
        .from('user_onboarding')
        .upsert(
          { user_id: userId, current_step: newStep },
          { onConflict: ['user_id'] }
        );
        
      if (upsertErr) {
        console.error('Error updating onboarding step:', upsertErr);
        setError(upsertErr.message);
        return;
      }
      
      // Update UI state
      setStep(newStep);
    } catch (err: any) {
      console.error('Error updating step:', err);
      setError(err.message);
    }
  }
  
  // Handle steps
  async function handleNextStep() {
    // Handle step-specific logic
    switch (step) {
      case 1:
        // Welcome step - just move forward
        await updateOnboardingStep(2);
        break;
        
      case 2:
        // Plan selection
        if (!selectedPlan) {
          setError('Please select a plan to continue');
          return;
        }
        
        try {
          setLoading(true);
          setPlanError(undefined);
          
          // 1) Upsert the selected plan (user_plans should have user_id as a unique key)
          const { error: upsertErr } = await supabase
            .from('user_plans')
            .upsert(
              { user_id: userId, plan_id: selectedPlan },
              { onConflict: ['user_id'] }
            );
          
          if (upsertErr) {
            setPlanError(upsertErr.message);
            setLoading(false);
            return;
          }
          
          // Next step to advance to
          const nextStep = 3;
          
          // Update onboarding record with upsert
          const { error: onboardingErr } = await supabase
            .from('user_onboarding')
            .upsert(
              { user_id: userId, current_step: nextStep, plan_id: selectedPlan },
              { onConflict: ['user_id'] }
            );
              
          if (onboardingErr) {
            console.error(onboardingErr);
            setError(onboardingErr.message);
            setLoading(false);
            return;
          }
          
          // Move to step 3 in UI
          setStep(nextStep);
        } catch (err: any) {
          console.error('Error saving plan choice:', err);
          setError(err.message);
        } finally {
          setLoading(false);
        }
        break;
        
      case 3:
        // Property info
        if (!property.address || !property.year_built || !property.property_type) {
          setError('Please fill in all property details');
          return;
        }
        
        try {
          setLoading(true);
          setError(null);
          
          // Check authentication
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) {
            setError('Authentication error. Please try again.');
            setLoading(false);
            return;
          }
          
          // Get current user's plan with enhanced error handling
          const { data: userPlan, error: planError } = await supabase
            .from('user_plans')
            .select(`
              plan_id,
              plans (
                name,
                max_homes
              )
            `)
            .eq('user_id', user.id)
            .single();
            
          // If no plan found, fallback to using selectedPlan from state
          let effectivePlan = null;
          if (planError && planError.code === 'PGRST116') {
            // No plan found in user_plans, use selectedPlan from state
            console.log('No user plan found, using selectedPlan from state:', selectedPlan);
            if (selectedPlan) {
              const { data: planData, error: planFetchError } = await supabase
                .from('plans')
                .select('name, max_homes')
                .eq('id', selectedPlan)
                .single();
                
              if (planFetchError) {
                console.error('Error fetching plan data:', planFetchError);
                setError('Unable to verify your plan. Please try again.');
                setLoading(false);
                return;
              }
              effectivePlan = { plans: planData };
            } else {
              console.error('No plan selected and no user plan found');
              setError('No plan selected. Please go back and select a plan.');
              setLoading(false);
              return;
            }
          } else if (planError) {
            console.error('Error fetching user plan:', planError);
            setError('Unable to verify your plan. Please try again.');
            setLoading(false);
            return;
          } else {
            effectivePlan = userPlan;
          }
          
          // Get current property count
          const { count: currentProperties, error: countError } = await supabase
            .from('properties')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id);
            
          if (countError) {
            console.error('Error counting properties:', countError);
            setError('Unable to verify property limit. Please try again.');
            setLoading(false);
            return;
          }
          
          // Check if user can add another property
          const planMaxHomes = effectivePlan?.plans?.max_homes;
          console.log('Plan max homes:', planMaxHomes, 'Current properties:', currentProperties);
          
          if (planMaxHomes !== null && (currentProperties || 0) >= planMaxHomes) {
            setError(`You've reached your plan limit of ${planMaxHomes} property(ies). Please upgrade your plan to add more properties.`);
            setLoading(false);
            return;
          }
          
          // Infer region from address
          let region = 'Northeast';
          const addressLower = property.address.toLowerCase();
          if (addressLower.includes('ca') || addressLower.includes('california')) {
            region = 'West Coast';
          } else if (addressLower.includes('fl') || addressLower.includes('florida')) {
            region = 'Southeast';
          } else if (addressLower.includes('tx') || addressLower.includes('texas') || 
                    addressLower.includes('az') || addressLower.includes('arizona') ||
                    addressLower.includes('nm') || addressLower.includes('new mexico')) {
            region = 'Southwest';
          } else if (addressLower.includes('wa') || addressLower.includes('washington') ||
                    addressLower.includes('or') || addressLower.includes('oregon')) {
            region = 'Pacific Northwest';
          } else if (addressLower.includes('co') || addressLower.includes('colorado') ||
                    addressLower.includes('ut') || addressLower.includes('utah') ||
                    addressLower.includes('mt') || addressLower.includes('montana') ||
                    addressLower.includes('wy') || addressLower.includes('wyoming') ||
                    addressLower.includes('id') || addressLower.includes('idaho') ||
                    addressLower.includes('nv') || addressLower.includes('nevada')) {
            region = 'Mountain States';
          } else if (addressLower.includes('oh') || addressLower.includes('ohio') ||
                    addressLower.includes('mi') || addressLower.includes('michigan') ||
                    addressLower.includes('il') || addressLower.includes('illinois') ||
                    addressLower.includes('in') || addressLower.includes('indiana') ||
                    addressLower.includes('wi') || addressLower.includes('wisconsin') ||
                    addressLower.includes('mn') || addressLower.includes('minnesota') ||
                    addressLower.includes('ia') || addressLower.includes('iowa') ||
                    addressLower.includes('mo') || addressLower.includes('missouri') ||
                    addressLower.includes('nd') || addressLower.includes('north dakota') ||
                    addressLower.includes('sd') || addressLower.includes('south dakota') ||
                    addressLower.includes('ne') || addressLower.includes('nebraska') ||
                    addressLower.includes('ks') || addressLower.includes('kansas')) {
            region = 'Midwest';
          } else if (addressLower.includes('ok') || addressLower.includes('oklahoma') ||
                    addressLower.includes('ar') || addressLower.includes('arkansas') ||
                    addressLower.includes('la') || addressLower.includes('louisiana') ||
                    addressLower.includes('ms') || addressLower.includes('mississippi')) {
            region = 'South Central';
          } else if (addressLower.includes('ak') || addressLower.includes('alaska')) {
            region = 'Alaska';
          } else if (addressLower.includes('hi') || addressLower.includes('hawaii')) {
            region = 'Hawaii';
          }
          
          console.log('Inserting property with data:', {
            user_id: user.id,
            address: property.address,
            year_built: property.year_built,
            property_type: property.property_type,
            region: region
          });
          
          // Insert the property
          const { data: propData, error: propError } = await supabase
            .from('properties')
            .insert({
              user_id: user.id,
              address: property.address,
              year_built: property.year_built,
              property_type: property.property_type,
              region: region
            })
            .select();
          
          if (propError) {
            console.error('Error inserting property:', propError);
            setError(`Unable to save your property: ${propError.message || 'Unknown error'}. Please try again.`);
            setLoading(false);
            return;
          }
          
          console.log('Property inserted successfully:', propData);
          
          // Update property state with region
          setProperty({ ...property, region });
          
          // Update onboarding step
          const nextStep = 4;
          const { error: onboardingError } = await supabase
            .from('user_onboarding')
            .upsert({ 
              user_id: user.id, 
              current_step: nextStep
            }, { 
              onConflict: ['user_id'] 
            });
          
          if (onboardingError) {
            console.error('Error updating onboarding:', onboardingError);
            // Don't fail the whole flow for this, just log it
          }
          
          // Advance to next step
          setStep(nextStep);
        } catch (err: any) {
          console.error('Error saving property:', err);
          setError(`Error saving property: ${err.message || 'Unknown error'}`);
        } finally {
          setLoading(false);
        }
        break;
        
      case 4:
        // Confirm region - just move forward
        await updateOnboardingStep(5);
        break;
        
      case 5:
        // Starter tasks
        try {
          setLoading(true);
          
          // First call the RPC to seed tasks based on region and plan
          const { error: rpcError } = await supabase.rpc('seed_user_tasks_for_current_user');
          
          if (rpcError) {
            console.error('Error seeding tasks:', rpcError);
            setError(rpcError.message);
            setLoading(false);
            return;
          }
          
          // Then fetch the tasks from the view
          const { data: tasks, error: fetchError } = await supabase
            .from('view_user_tasks')
            .select('id, title, description, completed');
            
          if (fetchError) throw fetchError;
          setUserTasks(tasks || []);
          
          // Improved logic to check if user already has Premium plan
          console.log('Current selectedPlan:', selectedPlan);
          console.log('Available plans:', plans);
          
          // Find the current plan more robustly
          const currentPlan = plans.find(p => p.id === selectedPlan);
          console.log('Found current plan:', currentPlan);
          
          // Check if user already has Premium plan selected
          const hasPremiumPlan = currentPlan && currentPlan.name === 'Premium';
          console.log('Has Premium plan:', hasPremiumPlan);
          
          if (hasPremiumPlan) {
            console.log('User already has Premium - skipping upsell, going to step 7');
            await updateOnboardingStep(7); // Skip upsell for Premium users
          } else {
            console.log('User has Free/Core plan - showing upsell at step 6');
            await updateOnboardingStep(6); // Show upsell for Free/Core users
          }
        } catch (err: any) {
          console.error('Error processing tasks:', err);
          setError(err.message || 'Failed to load your tasks');
        } finally {
          setLoading(false);
        }
        break;
        
      case 6:
        // Upsell step - check if user already has Premium and handle accordingly
        const currentPlan = plans.find(p => p.id === selectedPlan);
        
        // If user already has Premium, auto-skip this step
        if (currentPlan && currentPlan.name === 'Premium') {
          console.log('Premium user reached upsell step - auto-skipping to step 7');
          await updateOnboardingStep(7);
        } else {
          // For Free/Core users, just move forward when they click continue
          await updateOnboardingStep(7);
        }
        break;
        
      case 7:
        // Complete onboarding
        try {
          setLoading(true);
          
          // 1) Fetch the onboarding row
          const {
            data: existingOnb,
            error: fetchErr
          } = await supabase
            .from('user_onboarding')
            .select('user_id')
            .eq('user_id', userId)
            .single();

          if (fetchErr && fetchErr.code !== 'PGRST116') {
            // some real error (not "no row found")
            console.error(fetchErr);
            setError(fetchErr.message);
            setLoading(false);
            return;
          }

          if (!existingOnb) {
            // no row yet → insert (unlikely at this point)
            const { error: insertErr } = await supabase
              .from('user_onboarding')
              .insert({ 
                user_id: userId, 
                current_step: 8, 
                completed: true 
              });
              
            if (insertErr) {
              console.error(insertErr);
              setError(insertErr.message);
              setLoading(false);
              return;
            }
          } else {
            // row exists → update
            const { error: updateErr } = await supabase
              .from('user_onboarding')
              .update({ 
                current_step: 8, 
                completed: true 
              })
              .eq('user_id', userId);
              
            if (updateErr) {
              console.error(updateErr);
              setError(updateErr.message);
              setLoading(false);
              return;
            }
          }
          
          // Handle newsletter subscription if checked
          if (subscribe) {
            // In a real app, send to newsletter service API
            console.log('User subscribed to newsletter:', userId);
          }
          
          // Advance UI to step 8
          setStep(8); // Move to redirect step
        } catch (err: any) {
          console.error('Error completing onboarding:', err);
          setError(err.message);
        } finally {
          setLoading(false);
        }
        break;
        
      case 8:
        // Redirect - should never be called directly
        router.push('/dashboard');
        break;
    }
  }
  
  // Handle going back a step
  async function handlePreviousStep() {
    if (step > 1 && userId) {
      const prevStep = step - 1;
      
      try {
        // 1) Fetch the onboarding row
        const {
          data: existingOnb,
          error: fetchErr
        } = await supabase
          .from('user_onboarding')
          .select('user_id')
          .eq('user_id', userId)
          .single();

        if (fetchErr && fetchErr.code !== 'PGRST116') {
          // some real error (not "no row found")
          console.error(fetchErr);
          setError(fetchErr.message);
          return;
        }

        if (!existingOnb) {
          // no row yet → insert (unlikely for back button)
          const { error: insertErr } = await supabase
            .from('user_onboarding')
            .insert({ user_id: userId, current_step: prevStep });
            
          if (insertErr) {
            console.error(insertErr);
            setError(insertErr.message);
            return;
          }
        } else {
          // row exists → update
          const { error: updateErr } = await supabase
            .from('user_onboarding')
            .update({ current_step: prevStep })
            .eq('user_id', userId);
            
          if (updateErr) {
            console.error(updateErr);
            setError(updateErr.message);
            return;
          }
        }
        
        // Update UI state
        setStep(prevStep);
      } catch (err: any) {
        console.error('Error updating step:', err);
        setError(err.message);
      }
    }
  }
  
  // Handle Stripe checkout for paid plans
  const handleStripeCheckout = async (planName: string) => {
    setLoadingPlan(true);
    setPlanError(undefined);
    setError(null);

    try {
      // Map plan names to Stripe plan identifiers
      let stripePlanId: string;
      if (planName === 'Core') {
        stripePlanId = 'core';
      } else if (planName === 'Premium') {
        stripePlanId = 'rivopro';
      } else {
        throw new Error('Invalid plan for checkout');
      }

      const response = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          plan: stripePlanId,
          return_to: 'onboarding'
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      // Redirect to Stripe checkout
      window.location.href = data.sessionUrl;
    } catch (err: any) {
      console.error('Stripe checkout error:', err);
      setPlanError(err.message || 'Failed to start checkout process');
      setLoadingPlan(false);
    }
  };

  // Handle plan selection and payment flow
  const handlePlanSelection = async () => {
    if (!selectedPlan) return;
    
    const selectedPlanData = plans.find(p => p.id === selectedPlan);
    if (!selectedPlanData) return;

    // If it's the Free plan, continue with normal flow
    if (selectedPlanData.name === 'Free' || selectedPlanData.price === 0) {
      setLoadingPlan(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      const userId = user!.id;

      // Save free plan to user_plans
      const { error: planErr } = await supabase
        .from('user_plans')
        .upsert(
          { user_id: userId, plan_id: selectedPlan },
          { onConflict: ['user_id'] }
        );
      if (planErr) {
        console.error(planErr);
        setPlanError(planErr.message);
        setLoadingPlan(false);
        return;
      }

      // Update onboarding step
      const nextStep = 3;
      const {
        data: existingOnb,
        error: fetchErr
      } = await supabase
        .from('user_onboarding')
        .select('user_id')
        .eq('user_id', userId)
        .single();

      if (fetchErr && fetchErr.code !== 'PGRST116') {
        console.error(fetchErr);
        setPlanError(fetchErr.message);
        setLoadingPlan(false);
        return;
      }

      if (!existingOnb) {
        const { error: insertErr } = await supabase
          .from('user_onboarding')
          .insert({ user_id: userId, current_step: nextStep });
          
        if (insertErr) {
          console.error(insertErr);
          setPlanError(insertErr.message);
          setLoadingPlan(false);
          return;
        }
      } else {
        const { error: updateErr } = await supabase
          .from('user_onboarding')
          .update({ current_step: nextStep })
          .eq('user_id', userId);
          
        if (updateErr) {
          console.error(updateErr);
          setPlanError(updateErr.message);
          setLoadingPlan(false);
          return;
        }
      }

      setStep(nextStep);
      setLoadingPlan(false);
    } else {
      // For paid plans, redirect to Stripe checkout
      await handleStripeCheckout(selectedPlanData.name);
    }
  };
  
  // Redirect to dashboard on final step
  useEffect(() => {
    if (step === 8) {
      router.push('/dashboard');
    }
  }, [step, router]);
  
  // Render appropriate step content
  function renderStepContent() {
    switch (step) {
      case 1:
        return (
          <div className="text-center space-y-6">
            <h1 className="text-3xl font-bold">Welcome to RivoHome</h1>
            <p className="text-lg">
              Let's get your home maintenance plan set up so you can keep your home in top shape.
            </p>
            <p>
              We'll guide you through a few simple steps to customize your experience.
            </p>
            <button
              onClick={handleNextStep}
              className="mt-8 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
              disabled={loading}
            >
              Let's Get Started
            </button>
          </div>
        );
        
      case 2:
        if (loading && plans.length === 0) {
          return <div className="text-center py-4">Loading plans...</div>;
        }
        
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Choose Your Plan</h2>
            <p>Select the plan that best fits your needs:</p>
            
            {paymentCancelled && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-yellow-800">
                  Payment was cancelled. Please select a plan to continue with your onboarding.
                </p>
              </div>
            )}
            
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8 max-w-7xl mx-auto">
              {plans.map(plan => {
                // Build features array from actual plan properties
                const features = [
                  plan.max_homes !== null
                    ? `Up to ${plan.max_homes} home${plan.max_homes > 1 ? 's' : ''}`
                    : 'Unlimited homes',
                  plan.unlimited_reminders ? 'Unlimited reminders' : 'Limited reminders',
                  plan.report_access ? 'Report access included' : 'No report access',
                  plan.priority_support ? 'Priority support' : 'Standard support',
                ];

                const isSelected = selectedPlan === plan.id;
                const isFree = plan.price === 0;
                
                return (
                  <div
                    key={plan.id}
                    onClick={() => setSelectedPlan(plan.id)}
                    className={`p-8 border rounded-lg cursor-pointer transition-all ${
                      isSelected ? 'border-blue-600 bg-blue-50 shadow-md' : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <div className="text-center">
                      <h4 className="text-xl font-semibold mb-2">{plan.name}</h4>
                      <div className="mb-4">
                        <span className="text-3xl font-bold">${plan.price}</span>
                        <span className="text-gray-600">/month</span>
                      </div>
                      {!isFree && (
                        <div className="mb-4">
                          <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                            Requires Payment
                          </span>
                        </div>
                      )}
                    </div>
                    <ul className="space-y-1 text-sm">
                      {features.map(feature => (
                        <li key={feature} className="flex items-center">
                          <span className="text-green-500 mr-2 flex-shrink-0">✓</span>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
            
            {planError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800">{planError}</p>
              </div>
            )}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800">{error}</p>
              </div>
            )}
            
            <div className="flex justify-between mt-8">
              <button
                onClick={handlePreviousStep}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                disabled={loading || loadingPlan}
              >
                Back
              </button>
              <button
                onClick={handlePlanSelection}
                disabled={!selectedPlan || loading || loadingPlan}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingPlan ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </span>
                ) : (
                  'Continue'
                )}
              </button>
            </div>
          </div>
        );
        
      case 3:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Add Your Property</h2>
            <p>Tell us about your home so we can customize your maintenance plan:</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Property Address
                </label>
                <input
                  type="text"
                  value={property.address}
                  onChange={(e) => setProperty({...property, address: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="123 Main St, City, State, Zip"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Year Built
                </label>
                <input
                  type="number"
                  value={property.year_built}
                  onChange={(e) => setProperty({...property, year_built: Number(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  min={1800}
                  max={new Date().getFullYear()}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Property Type
                </label>
                <select
                  value={property.property_type}
                  onChange={(e) => setProperty({...property, property_type: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                >
                  <option value="single_family">Single Family Home</option>
                  <option value="condo">Condominium</option>
                  <option value="townhouse">Townhouse</option>
                  <option value="multi_family">Multi-Family Home</option>
                  <option value="mobile">Mobile Home</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
            
            <div className="flex justify-between mt-8">
              <button
                onClick={handlePreviousStep}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                disabled={loading}
              >
                Back
              </button>
              <button
                onClick={handleNextStep}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                disabled={loading}
              >
                Next
              </button>
            </div>
          </div>
        );
        
      case 4:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Confirm Your Region</h2>
            <p>Based on your address, we've identified your region as:</p>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
              <span className="text-2xl font-semibold capitalize">{property.region}</span>
            </div>
            
            <p className="text-sm text-gray-600">
              Your region helps us customize maintenance tasks for your local climate and conditions.
            </p>
            
            <div className="flex justify-between mt-8">
              <button
                onClick={handlePreviousStep}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                disabled={loading}
              >
                Back
              </button>
              <button
                onClick={handleNextStep}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                disabled={loading}
              >
                Sounds Good
              </button>
            </div>
          </div>
        );
        
      case 5:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Your Starter Maintenance Tasks</h2>
            <p>
              Based on your home and plan, we've created a personalized set of maintenance tasks:
            </p>
            
            {loading ? (
              <div className="text-center py-4">Loading tasks...</div>
            ) : (
              <div className="space-y-4 max-h-80 overflow-y-auto border border-gray-200 rounded-lg p-4">
                {userTasks.length > 0 ? (
                  userTasks.map((task, index) => (
                    <div key={index} className="border-b border-gray-100 pb-3 last:border-b-0">
                      <h3 className="font-medium">{task.title}</h3>
                      <p className="text-sm text-gray-600">{task.description}</p>
                      <div className="flex items-center mt-1 text-xs">
                        <span className={`px-2 py-1 rounded-full ${
                          task.priority === 'high' ? 'bg-red-100 text-red-800' :
                          task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {task.priority} priority
                        </span>
                        {task.season && (
                          <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                            {task.season}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center py-4 text-gray-500">
                    No tasks found for your region and plan.
                  </p>
                )}
              </div>
            )}
            
            <div className="flex justify-between mt-8">
              <button
                onClick={handlePreviousStep}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                disabled={loading}
              >
                Back
              </button>
              <div className="space-x-4">
                <button
                  onClick={() => {
                    setCustomTasks([...userTasks]);
                    // In a real app, you'd navigate to a task customization screen
                    // For this example, we'll just continue
                    handleNextStep();
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                  disabled={loading}
                >
                  Customize
                </button>
                <button
                  onClick={handleNextStep}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  disabled={loading}
                >
                  Looks Good
                </button>
              </div>
            </div>
          </div>
        );
        
      case 6:
        // Get current plan for upsell step
        const currentPlanUpsell = plans.find(p => p.id === selectedPlan);
        const premiumPlanUpsell = plans.find(p => p.name === 'Premium');
        
        // If user already has Premium, they shouldn't see this step (but just in case)
        if (currentPlanUpsell && currentPlanUpsell.name === 'Premium') {
          return (
            <div className="space-y-6 text-center">
              <h2 className="text-2xl font-bold">You're All Set!</h2>
              <p>You already have the Premium plan with all features unlocked.</p>
              <button
                onClick={handleNextStep}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                disabled={loading}
              >
                Continue
              </button>
            </div>
          );
        }
        
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Upgrade to Premium</h2>
            <p>
              Unlock all features and get the most out of your home maintenance experience:
            </p>
            
            {/* Show current plan for context */}
            {currentPlanUpsell && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-yellow-800">
                  You're currently on the <strong>{currentPlanUpsell.name} Plan</strong> (${currentPlanUpsell.price}/month)
                </p>
              </div>
            )}
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-xl font-semibold">Premium Plan Benefits</h3>
              <ul className="mt-4 space-y-2">
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  Unlimited properties
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  Advanced seasonal reminders
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  Detailed maintenance history
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  Professional service provider connections
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  Priority support
                </li>
              </ul>
              
              <div className="mt-6 text-center">
                <p className="font-medium">
                  {premiumPlanUpsell ? `$${premiumPlanUpsell.price}/month` : 'Contact us for pricing'}
                </p>
              </div>
            </div>
            
            <div className="flex justify-between mt-8">
              <button
                onClick={handlePreviousStep}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                disabled={loading}
              >
                Back
              </button>
              <div className="space-x-4">
                <button
                  onClick={handleNextStep}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                  disabled={loading}
                >
                  {currentPlanUpsell?.name === 'Free' ? 'Stay with Free Plan' : 'Continue with Current Plan'}
                </button>
                <button
                  onClick={async () => {
                    // Set premium plan and continue onboarding
                    if (premiumPlanUpsell) {
                      setSelectedPlan(premiumPlanUpsell.id);
                      
                      // Save the plan selection to database
                      try {
                        setLoading(true);
                        const { data: { user } } = await supabase.auth.getUser();
                        if (user) {
                          const { error: planErr } = await supabase
                            .from('user_plans')
                            .upsert(
                              { user_id: user.id, plan_id: premiumPlanUpsell.id },
                              { onConflict: ['user_id'] }
                            );
                          if (planErr) {
                            console.error('Error updating plan:', planErr);
                            setError('Failed to upgrade plan. Please try again.');
                            setLoading(false);
                            return;
                          }
                          
                          // Move to step 7
                          await updateOnboardingStep(7);
                        }
                      } catch (err: any) {
                        console.error('Error upgrading plan:', err);
                        setError('Failed to upgrade plan. Please try again.');
                      } finally {
                        setLoading(false);
                      }
                    }
                  }}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  disabled={loading || !premiumPlanUpsell}
                >
                  {loading ? 'Upgrading...' : 'Upgrade to Premium'}
                </button>
              </div>
            </div>
          </div>
        );
        
      case 7:
        // Calculate real progress based on completed tasks
        const totalTasks = userTasks.length;
        const completedTasks = userTasks.filter(task => task.completed).length;
        const progressPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
        
        // Get upcoming tasks (not completed) for preview, limit to 3 most important
        const upcomingTasks = userTasks
          .filter(task => !task.completed)
          .sort((a, b) => {
            // Sort by priority (high first) then by title
            const priorityOrder = { 'high': 0, 'medium': 1, 'low': 2 };
            const aPriority = priorityOrder[a.priority] || 2;
            const bPriority = priorityOrder[b.priority] || 2;
            if (aPriority !== bPriority) return aPriority - bPriority;
            return (a.title || '').localeCompare(b.title || '');
          })
          .slice(0, 3);
        
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Your Home Maintenance Dashboard</h2>
            <p>
              You're all set! Your personalized dashboard is ready with your maintenance schedule.
            </p>
            
            <div className="bg-gray-100 border border-gray-200 rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4">Maintenance Progress</h3>
              <div className="w-full bg-gray-300 rounded-full h-4 mb-2">
                <div 
                  className="bg-green-500 h-4 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-600">
                {completedTasks} of {totalTasks} maintenance tasks completed ({Math.round(progressPercentage)}%)
              </p>
              
              <h3 className="text-xl font-semibold mt-6 mb-4">Your Upcoming Tasks</h3>
              <div className="space-y-2 pb-2">
                {upcomingTasks.length > 0 ? (
                  upcomingTasks.map((task, index) => (
                    <div key={index} className="p-3 bg-white rounded shadow-sm border-l-4 border-blue-500">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{task.title}</h4>
                          <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                          <div className="flex items-center mt-2 space-x-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              task.priority === 'high' ? 'bg-red-100 text-red-800' :
                              task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {task.priority} priority
                            </span>
                            {task.due_date && (
                              <span className="text-xs text-gray-500">
                                Due: {new Date(task.due_date).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={async () => {
                            try {
                              // Toggle task completion
                              const { error } = await supabase
                                .from('user_tasks')
                                .update({ 
                                  completed: !task.completed,
                                  completed_at: !task.completed ? new Date().toISOString() : null
                                })
                                .eq('id', task.id);
                              
                              if (error) throw error;
                              
                              // Update local state
                              setUserTasks(prevTasks => 
                                prevTasks.map(t => 
                                  t.id === task.id 
                                    ? { ...t, completed: !t.completed }
                                    : t
                                )
                              );
                            } catch (err) {
                              console.error('Error updating task:', err);
                            }
                          }}
                          className="ml-4 px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                        >
                          Mark Complete
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 bg-green-50 border border-green-200 rounded">
                    <p className="text-green-800 font-medium">🎉 All tasks completed!</p>
                    <p className="text-green-600 text-sm">Great job staying on top of your home maintenance.</p>
                  </div>
                )}
              </div>
              
              {userTasks.length > upcomingTasks.length && (
                <p className="text-sm text-gray-500 mt-3">
                  + {userTasks.length - upcomingTasks.length} more tasks in your full dashboard
                </p>
              )}
            </div>
            
            <div className="mt-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={subscribe}
                  onChange={(e) => setSubscribe(e.target.checked)}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Subscribe to our newsletter for maintenance tips and updates
                </span>
              </label>
            </div>
            
            <div className="flex justify-between mt-8">
              <button
                onClick={handlePreviousStep}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                disabled={loading}
              >
                Back
              </button>
              <button
                onClick={handleNextStep}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                disabled={loading}
              >
                Finish Onboarding
              </button>
            </div>
          </div>
        );
        
      case 8:
        // Redirect step - just show a loading message
        return (
          <div className="text-center py-8">
            <p>Redirecting to your dashboard...</p>
          </div>
        );
        
      default:
        return <div>Unknown step</div>;
    }
  }
  
  if (loading && step === 1) {
    return (
      <div className="max-w-xl mx-auto p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-lg">Loading your onboarding experience...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-xl mx-auto p-6 space-y-6 min-h-screen flex flex-col justify-center">
      {/* Header with sign out button */}
      <div className="absolute top-4 right-4">
        <SignOutButton variant="link" showIcon={true} className="text-gray-600 hover:text-gray-800" />
      </div>
      
      {/* Progress indicator */}
      {step < 8 && (
        <div className="w-full">
          <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(step / 7) * 100}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>Start</span>
            <span>Complete</span>
          </div>
        </div>
      )}
      
      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
      
      {/* Step content */}
      {renderStepContent()}
    </div>
  );
} 