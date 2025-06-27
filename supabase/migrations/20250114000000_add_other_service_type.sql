-- Add "Other" service type to provider_services_master table
INSERT INTO public.provider_services_master (name) 
VALUES ('Other') 
ON CONFLICT (name) DO NOTHING; 