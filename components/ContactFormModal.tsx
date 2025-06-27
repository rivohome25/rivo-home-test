"use client"

import { useEffect } from "react"
import { X } from "lucide-react"

interface ContactFormModalProps {
  isOpen: boolean
  onClose: () => void
}

export function ContactFormModal({ isOpen, onClose }: ContactFormModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  useEffect(() => {
    // Load Mailchimp validation script
    const script = document.createElement('script')
    script.src = '//s3.amazonaws.com/downloads.mailchimp.com/js/mc-validate.js'
    script.async = true
    document.body.appendChild(script)

    // Initialize Mailchimp validation after script loads
    script.onload = () => {
      if (typeof window !== 'undefined' && (window as any).jQuery) {
        const $ = (window as any).jQuery;
        (window as any).fnames = new Array();
        (window as any).ftypes = new Array();
        (window as any).fnames[0] = 'EMAIL';
        (window as any).ftypes[0] = 'email';
        (window as any).fnames[8] = 'MMERGE8';
        (window as any).ftypes[8] = 'dropdown';
        (window as any).fnames[6] = 'MESSAGE';
        (window as any).ftypes[6] = 'text';
        (window as any).fnames[1] = 'FNAME';
        (window as any).ftypes[1] = 'text';
        (window as any).fnames[2] = 'LNAME';
        (window as any).ftypes[2] = 'text';
        (window as any).fnames[3] = 'PHONE';
        (window as any).ftypes[3] = 'number';
        (window as any).fnames[4] = 'COMPANY';
        (window as any).ftypes[4] = 'text';
        (window as any).fnames[5] = 'SUBJECT';
        (window as any).ftypes[5] = 'dropdown';
        (window as any).fnames[7] = 'FULLNAME';
        (window as any).ftypes[7] = 'text';
        (window as any).fnames[9] = 'MMERGE9';
        (window as any).ftypes[9] = 'text';
        (window as any).$mcj = $.noConflict(true);
      }
    }

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script)
      }
    }
  }, [])

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-x-0 top-[5vh] z-50 flex justify-center p-4"
        style={{ maxHeight: '90vh' }}
      >
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full overflow-y-auto" style={{ maxHeight: 'calc(90vh - 40px)' }}>
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Contact Us</h2>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700"
                aria-label="Close"
                type="button"
              >
                <svg
                  className="w-6 h-6"
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
            <div id="mc_embed_signup" className="w-full">
              <form
                action="https://rivohome.us5.list-manage.com/subscribe/post?u=fa369b4510f97d8cd57991776&amp;id=ceb106b932&amp;f_id=0091f6e0f0"
                method="post"
                id="mc-embedded-subscribe-form"
                name="mc-embedded-subscribe-form"
                className="validate"
                target="_blank"
                onSubmit={handleSubmit}
              >
                <div id="mc_embed_signup_scroll">
                  <div className="indicates-required mb-4 text-gray-600">
                    <span className="asterisk text-rivo-base">*</span> indicates required
                  </div>
                  <div className="mc-field-group mb-4">
                    <label htmlFor="mce-FULLNAME" className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name <span className="text-rivo-base">*</span>
                    </label>
                    <input
                      type="text"
                      name="FULLNAME"
                      className={`required text w-full px-3 py-2 border ${formErrors.fullName ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-rivo-base text-gray-900 bg-white`}
                      id="mce-FULLNAME"
                      required
                      value={formData.fullName}
                      onChange={handleInputChange}
                    />
                    {formErrors.fullName && (
                      <p className="mt-1 text-sm text-red-500">{formErrors.fullName}</p>
                    )}
                  </div>
                  <div className="mc-field-group mb-4">
                    <label htmlFor="mce-EMAIL" className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address <span className="text-rivo-base">*</span>
                    </label>
                    <input
                      type="email"
                      name="EMAIL"
                      className={`required email w-full px-3 py-2 border ${formErrors.email ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-rivo-base text-gray-900 bg-white`}
                      id="mce-EMAIL"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                    />
                    {formErrors.email && (
                      <p className="mt-1 text-sm text-red-500">{formErrors.email}</p>
                    )}
                  </div>
                  <div className="mc-field-group mb-4">
                    <label htmlFor="mce-PHONE" className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="PHONE"
                      className={`w-full px-3 py-2 border ${formErrors.phone ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-rivo-base text-gray-900 bg-white`}
                      id="mce-PHONE"
                      value={formData.phone}
                      onChange={handleInputChange}
                    />
                    {formErrors.phone && (
                      <p className="mt-1 text-sm text-red-500">{formErrors.phone}</p>
                    )}
                  </div>
                  <div className="mc-field-group mb-4">
                    <label htmlFor="mce-SUBJECT" className="block text-sm font-medium text-gray-700 mb-1">
                      Subject <span className="text-rivo-base">*</span>
                    </label>
                    <select
                      name="SUBJECT"
                      className={`required w-full px-3 py-2 border ${formErrors.subject ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-rivo-base text-gray-900 bg-white`}
                      id="mce-SUBJECT"
                      required
                      value={formData.subject}
                      onChange={handleInputChange}
                    >
                      <option value="">Select a subject</option>
                      <option value="General Inquiry">General Inquiry</option>
                      <option value="Press/Media">Press/Media</option>
                      <option value="Partnerships">Partnerships</option>
                      <option value="Support">Support</option>
                      <option value="Other">Other</option>
                    </select>
                    {formErrors.subject && (
                      <p className="mt-1 text-sm text-red-500">{formErrors.subject}</p>
                    )}
                  </div>
                  <div className="mc-field-group mb-4">
                    <label htmlFor="mce-MMERGE8" className="block text-sm font-medium text-gray-700 mb-1">
                      I am a <span className="text-rivo-base">*</span>
                    </label>
                    <select
                      name="MMERGE8"
                      className="required w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rivo-base text-gray-900 bg-white"
                      id="mce-MMERGE8"
                      required
                    >
                      <option value="">Select One</option>
                      <option value="Homeowner">Homeowner</option>
                      <option value="Service Provider">Service Provider</option>
                      <option value="Realtor">Realtor</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="mc-field-group mb-4">
                    <label htmlFor="mce-MESSAGE" className="block text-sm font-medium text-gray-700 mb-1">
                      Message <span className="text-rivo-base">*</span>
                    </label>
                    <textarea
                      name="MESSAGE"
                      className={`required text w-full px-3 py-2 border ${formErrors.message ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-rivo-base text-gray-900 bg-white`}
                      id="mce-MESSAGE"
                      required
                      rows={4}
                      value={formData.message}
                      onChange={handleInputChange}
                    ></textarea>
                    {formErrors.message && (
                      <p className="mt-1 text-sm text-red-500">{formErrors.message}</p>
                    )}
                  </div>
                  <div id="mce-responses" className="clear mb-4">
                    <div className="response" id="mce-error-response" style={{ display: "none" }} />
                    <div className="response" id="mce-success-response" style={{ display: "none" }} />
                  </div>
                  <div aria-hidden="true" style={{ position: "absolute", left: "-5000px" }}>
                    <input
                      type="text"
                      name="b_fa369b4510f97d8cd57991776_ceb106b932"
                      tabIndex={-1}
                      readOnly
                    />
                  </div>
                  <div className="clear">
                    <button
                      type="submit"
                      name="subscribe"
                      id="mc-embedded-subscribe"
                      className="button bg-gradient-to-r from-rivo-light via-rivo-base to-rivo-dark text-white px-6 py-3 rounded-md font-medium hover:opacity-90 transition w-full"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Sending...' : 'Send Message'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </motion.div>
      <Script 
        src="https://s3.amazonaws.com/downloads.mailchimp.com/js/mc-validate.js"
        strategy="lazyOnload"
      />
      <Script id="mailchimp-config" strategy="afterInteractive">
        {`
          (function($) {
            window.fnames = new Array();
            window.ftypes = new Array();
            fnames[7]='FULLNAME';ftypes[7]='text';
            fnames[0]='EMAIL';ftypes[0]='email';
            fnames[3]='PHONE';ftypes[3]='phone';
            fnames[5]='SUBJECT';ftypes[5]='dropdown';
            fnames[8]='MMERGE8';ftypes[8]='dropdown';
            fnames[6]='MESSAGE';ftypes[6]='text';
            fnames[1]='FNAME';ftypes[1]='text';
            fnames[2]='LNAME';ftypes[2]='text';
            fnames[4]='COMPANY';ftypes[4]='text';
          }(jQuery));
          var $mcj = jQuery.noConflict(true);
        `}
      </Script>
    </>
  )
}