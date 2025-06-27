"use client"

import { motion } from "framer-motion"
import { useEffect, useState, FormEvent } from "react"
import Script from "next/script"
import { sanitizeInput, isValidEmail } from "@/lib/utils"
import dynamic from 'next/dynamic'

interface DownloadChecklistModalProps {
  isOpen: boolean
  onClose: () => void
}

// Create a client-only version of the modal content
const ModalContent = ({ isOpen, onClose }: DownloadChecklistModalProps) => {
  const [email, setEmail] = useState('');
  const [region, setRegion] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [downloadReady, setDownloadReady] = useState(false);
  const [emailSubmitted, setEmailSubmitted] = useState(false);

  // Available regions for selection with detailed state information
  const regions = [
    { id: 'northeast', name: 'Northeast – ME, NH, VT, MA, RI, CT, NY, NJ, PA' },
    { id: 'mid-atlantic', name: 'Mid-Atlantic – DE, MD, DC' },
    { id: 'midwest', name: 'Midwest – OH, IN, IL, MI, WI, MN, IA, MO, ND, SD, NE, KS' },
    { id: 'southeast', name: 'Southeast – VA, WV, NC, SC, GA, FL, AL, MS, TN' },
    { id: 'south-central', name: 'South Central – TX, LA, OK, AR, KY' },
    { id: 'southwest', name: 'Southwest – AZ, NM, NV' },
    { id: 'mountain-states', name: 'Mountain States – CO, UT, ID, WY, MT' },
    { id: 'pacific-northwest', name: 'Pacific Northwest – WA, OR' },
    { id: 'west-coast', name: 'West Coast – CA' },
    { id: 'alaska', name: 'Alaska – AK' },
    { id: 'hawaii', name: 'Hawaii – HI' }
  ];

  // Define PDF file mapping
  const pdfMap: Record<string, string> = {
    'northeast': '/downloads/Northeast_Seasonal_Checklist.pdf',
    'mid-atlantic': '/downloads/Mid-Atlantic_Seasonal_Checklist.pdf',
    'midwest': '/downloads/Midwest_Seasonal_Checklist.pdf',
    'southeast': '/downloads/Southeast_Seasonal_Checklist.pdf',
    'south-central': '/downloads/South Central_Seasonal_Checklist.pdf',
    'southwest': '/downloads/Southwest_Seasonal_Checklist.pdf',
    'mountain-states': '/downloads/Mountain States_Seasonal_Checklist.pdf',
    'pacific-northwest': '/downloads/Pacific Northwest_Seasonal_Checklist.pdf',
    'west-coast': '/downloads/West Coast_Seasonal_Checklist.pdf',
    'alaska': '/downloads/Alaska_Seasonal_Checklist.pdf',
    'hawaii': '/downloads/Hawaii_Seasonal_Checklist.pdf'
  };

  // Handle email input change
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    setError('');
  };

  // Handle region selection change
  const handleRegionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRegion(e.target.value);
  };

  // Validate email step
  const validateEmail = () => {
    if (!email.trim()) {
      setError('Email is required');
      return false;
    }
    
    if (!isValidEmail(email)) {
      setError('Please enter a valid email address');
      return false;
    }
    
    return true;
  };

  // Handle email submission
  const handleEmailSubmit = (e: FormEvent) => {
    e.preventDefault();
    
    if (!validateEmail()) {
      return;
    }
    
    // Move to region selection
    setEmailSubmitted(true);
  };

  // Validate form before final submission
  const validateForm = () => {
    if (!region) {
      setError('Please select a region');
      return false;
    }
    
    return true;
  };

  // Handle form submission
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    // Since we're using Mailchimp, the actual submission happens via their script
    const form = e.target as HTMLFormElement;
    
    // Sanitize input before submission
    const emailInput = form.querySelector('#mce-EMAIL') as HTMLInputElement;
    if (emailInput) emailInput.value = email.trim().toLowerCase();
    
    // Add region to Mailchimp merge fields
    const regionInput = form.querySelector('#mce-MMERGE1') as HTMLInputElement;
    if (regionInput) regionInput.value = region;
    
    // Let the form submit normally to Mailchimp
    form.submit();
    
    // Show download link after successful submission
    setDownloadReady(true);
    setIsSubmitting(false);
    
    // Redirect to the PDF file for immediate download
    if (region && pdfMap[region]) {
      setTimeout(() => {
        window.open(pdfMap[region], '_blank');
      }, 1000); // Small delay to ensure form submission completes
    }
  };

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }

    if (isOpen) {
      document.addEventListener("keydown", handleEscape)
      document.body.style.overflow = "hidden"
      
      // Reset state when opening
      setDownloadReady(false);
      setEmailSubmitted(false);
      setEmail('');
      setRegion('');
      setError('');
    }

    return () => {
      document.removeEventListener("keydown", handleEscape)
      document.body.style.overflow = "unset"
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-x-0 top-[10vh] sm:top-[20vh] z-50 flex justify-center p-4"
      >
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-auto overflow-auto max-h-[80vh]">
          <div className="p-4 md:p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Download Maintenance Checklist</h2>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 ml-2"
                aria-label="Close"
                type="button"
              >
                <svg
                  className="w-5 h-5 sm:w-6 sm:h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            
            {!downloadReady ? (
              <div id="mc_embed_signup" className="w-full">
                {!emailSubmitted ? (
                  <>
                    <p className="mb-4 text-sm sm:text-base text-gray-600">
                      Enter your email to receive our home maintenance checklist plus exclusive tips.
                    </p>
                    
                    <form
                      onSubmit={handleEmailSubmit}
                      className="w-full"
                    >
                      <div className="mb-4">
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                          Email Address <span className="text-rivo-base">*</span>
                        </label>
                        <input
                          type="email"
                          name="email"
                          className={`w-full px-3 py-2 border ${error ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-rivo-base text-gray-900 text-sm`}
                          id="email"
                          required
                          value={email}
                          onChange={handleEmailChange}
                        />
                        {error && (
                          <p className="mt-1 text-xs sm:text-sm text-red-500">{error}</p>
                        )}
                      </div>
                      
                      <div className="flex justify-center w-full">
                        <button
                          type="submit"
                          className="w-full bg-gradient-to-r from-rivo-light to-rivo-dark text-white px-4 py-2 sm:px-6 sm:py-3 text-sm sm:text-base rounded-md font-medium hover:opacity-90 transition"
                        >
                          Continue
                        </button>
                      </div>
                    </form>
                  </>
                ) : (
                  <>
                    <p className="mb-4 text-sm sm:text-base text-gray-600">
                      Choose your region to get a maintenance checklist customized for your local climate.
                    </p>
                    
                    <form
                      action="https://rivohome.us5.list-manage.com/subscribe/post?u=fa369b4510f97d8cd57991776&amp;id=ceb106b932&amp;f_id=0090f6e0f0"
                      method="post"
                      id="mc-embedded-subscribe-form"
                      name="mc-embedded-subscribe-form"
                      target="_blank"
                      onSubmit={handleSubmit}
                      noValidate
                      className="validate w-full"
                    >
                      <div id="mc_embed_signup_scroll" className="w-full">
                        <div className="hidden">
                          <input 
                            type="text" 
                            name="b_fa369b4510f97d8cd57991776_ceb106b932" 
                            tabIndex={-1} 
                            value="" 
                            readOnly
                          />
                          
                          <input
                            type="email"
                            name="EMAIL"
                            id="mce-EMAIL"
                            value={email}
                            readOnly
                            aria-hidden
                          />
                          
                          <input
                            type="text"
                            name="MMERGE1"
                            id="mce-MMERGE1"
                            value={region}
                            readOnly
                            aria-hidden
                          />
                        </div>
                        
                        <div className="mb-4">
                          <label htmlFor="region-select" className="block text-sm font-medium text-gray-700 mb-1">
                            Your Region <span className="text-rivo-base">*</span>
                          </label>
                          <select
                            id="region-select"
                            value={region}
                            onChange={handleRegionChange}
                            className={`w-full px-3 py-2 border ${error ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-rivo-base text-gray-900 text-sm appearance-none bg-white`}
                            required
                          >
                            <option value="" disabled>Select your region</option>
                            {regions.map((reg) => (
                              <option key={reg.id} value={reg.id}>
                                {reg.name}
                              </option>
                            ))}
                          </select>
                          {error && (
                            <p className="mt-1 text-xs sm:text-sm text-red-500">{error}</p>
                          )}
                        </div>
                        
                        <div className="mb-4">
                          <label htmlFor="mce-MMERGE8" className="block text-sm font-medium text-gray-700 mb-1">
                            I am a <span className="text-rivo-base">*</span>
                          </label>
                          <select
                            name="MMERGE8"
                            id="mce-MMERGE8"
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rivo-base text-gray-900 text-sm appearance-none bg-white"
                          >
                            <option value="">Select One</option>
                            <option value="Homeowner">Homeowner</option>
                            <option value="Service Provider">Service Provider</option>
                            <option value="Realtor">Realtor</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                        
                        <div className="flex justify-center w-full">
                          <button
                            type="submit"
                            name="subscribe"
                            id="mc-embedded-subscribe"
                            className="w-full bg-gradient-to-r from-rivo-light to-rivo-dark text-white px-4 py-2 sm:px-6 sm:py-3 text-sm sm:text-base rounded-md font-medium hover:opacity-90 transition"
                            disabled={isSubmitting}
                          >
                            {isSubmitting ? 'Submitting...' : 'Get the Checklist'}
                          </button>
                        </div>
                        
                        <div className="mt-4 text-xs text-gray-500 text-center">
                          By submitting, you agree to our{" "}
                          <a href="/terms" className="underline hover:text-rivo-base">
                            Terms of Service
                          </a>{" "}
                          and{" "}
                          <a href="/privacy" className="underline hover:text-rivo-base">
                            Privacy Policy
                          </a>
                        </div>
                      </div>
                    </form>
                  </>
                )}
              </div>
            ) : (
              <div className="text-center">
                <div className="text-center mb-4">
                  <svg className="h-10 w-10 sm:h-12 sm:w-12 text-green-500 mx-auto mb-2 sm:mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Thanks for subscribing!</h3>
                  <p className="text-sm sm:text-base text-gray-600">
                    Thank you for subscribing! Your region-specific maintenance checklist is ready.
                  </p>
                </div>
                <div className="flex justify-center">
                  <a
                    href={pdfMap[region] || '/downloads/RivoHome_Maintenance_Checklist.pdf'}
                    download
                    className="bg-gradient-to-r from-rivo-light to-rivo-dark text-white px-4 py-2 sm:px-6 sm:py-3 text-sm sm:text-base rounded-md font-medium hover:opacity-90 transition inline-flex items-center"
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                    </svg>
                    Download Checklist
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
      
      <Script 
        src="https://s3.amazonaws.com/downloads.mailchimp.com/js/mc-validate.js" 
        strategy="lazyOnload" 
      />
    </>
  );
}

// Use dynamic import with ssr: false to avoid hydration issues
const ClientOnlyModal = dynamic(() => Promise.resolve(ModalContent), { ssr: false });

export function DownloadChecklistModal(props: DownloadChecklistModalProps) {
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  if (!isMounted) {
    return null;
  }
  
  return <ClientOnlyModal {...props} />;
} 