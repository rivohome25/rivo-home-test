-- Add image support to provider_bookings table
ALTER TABLE public.provider_bookings 
ADD COLUMN IF NOT EXISTS image_urls TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS image_count INTEGER DEFAULT 0;

-- Update existing records to have empty image arrays
UPDATE public.provider_bookings 
SET image_urls = '{}', image_count = 0 
WHERE image_urls IS NULL;

-- Create storage bucket for booking images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('booking-images', 'booking-images', false)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for booking-images bucket
-- Allow homeowners to upload images for their own bookings
CREATE POLICY "Homeowners can upload booking images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'booking-images' AND 
    auth.uid()::text = (storage.foldername(name))[1] AND
    EXISTS (
      SELECT 1 FROM public.provider_bookings 
      WHERE id::text = (storage.foldername(name))[2] 
      AND homeowner_id = auth.uid()
    )
  );

-- Allow homeowners and providers to view images for their bookings
CREATE POLICY "Users can view booking images" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'booking-images' AND (
      -- Homeowner can view their own booking images
      auth.uid()::text = (storage.foldername(name))[1] OR
      -- Provider can view images for their bookings
      EXISTS (
        SELECT 1 FROM public.provider_bookings 
        WHERE id::text = (storage.foldername(name))[2] 
        AND provider_id = auth.uid()
      )
    )
  );

-- Allow homeowners to delete their own booking images
CREATE POLICY "Homeowners can delete booking images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'booking-images' AND 
    auth.uid()::text = (storage.foldername(name))[1] AND
    EXISTS (
      SELECT 1 FROM public.provider_bookings 
      WHERE id::text = (storage.foldername(name))[2] 
      AND homeowner_id = auth.uid()
    )
  ); 