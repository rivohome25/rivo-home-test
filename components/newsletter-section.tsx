"use client"

import { useRef, useEffect, useState } from 'react'
import { motion, useInView } from 'framer-motion'

interface NewsletterSectionProps {
  headline?: string
  description?: string
}

export function NewsletterSection({
  headline = "Be the first to know when we launch",
  description = "Join our waitlist to get early access to RivoHome and never miss a home maintenance task again.",
}: NewsletterSectionProps) {
  const sectionRef = useRef(null)
  const isInView = useInView(sectionRef, { once: false, amount: 0.3 })
  const [hasAnimated, setHasAnimated] = useState(false)
  
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
        (window as any).fnames[6] = 'MESSAGE';
        (window as any).ftypes[6] = 'text';
        (window as any).$mcj = $.noConflict(true);
      }
    }

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script)
      }
    }
  }, [])

  return (
    <section
      ref={sectionRef}
      id="notify"
      className="bg-gradient-to-r from-rivo-light to-rivo-dark text-white py-20"
    >
      <div className="max-w-4xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <form
            action="https://rivohome.us5.list-manage.com/subscribe/post?u=fa369b4510f97d8cd57991776&amp;id=ceb106b932&amp;f_id=0090f6e0f0"
            method="post"
            id="mc-embedded-subscribe-form"
            name="mc-embedded-subscribe-form"
            target="_blank"
            className="flex flex-col items-center gap-4 justify-center max-w-md mx-auto"
            noValidate
          >
            <input
              type="email"
              name="EMAIL"
              id="mce-EMAIL"
              placeholder="Your email address"
              required
              className="w-full px-4 py-2 rounded-md text-gray-800 focus:outline-none focus:ring-2 focus:ring-white"
            />
            
            <select
              name="MMERGE8"
              id="mce-MMERGE8"
              required
              className="w-full px-4 py-2 rounded-md text-gray-800 focus:outline-none focus:ring-2 focus:ring-white"
            >
              <option value="">Select One *</option>
              <option value="Homeowner">Homeowner</option>
              <option value="Service Provider">Service Provider</option>
              <option value="Realtor">Realtor</option>
              <option value="Other">Other</option>
            </select>
            
            {/* Required for Mailchimp bot protection */}
            <div style={{ position: 'absolute', left: '-5000px' }} aria-hidden="true">
              <input type="text" name="b_fa369b4510f97d8cd57991776_ceb106b932" tabIndex={-1} />
            </div>

            <button
              type="submit"
              name="subscribe"
              id="mc-embedded-subscribe"
              className="w-full bg-white text-rivo-base px-6 py-2 rounded-md font-medium hover:bg-gray-100 transition"
            >
              <div id="mc_embed_signup_scroll" className="space-y-6">
                <div className="indicates-required text-white/80 text-sm mb-6">
                  <span className="asterisk text-white">*</span> indicates required
                </div>
                
                <div className="mc-field-group">
                  <label htmlFor="mce-EMAIL" className="block text-white font-medium mb-2 text-left">
                    Email Address <span className="asterisk text-white">*</span>
                  </label>
                  <input
                    type="email"
                    name="EMAIL"
                    className="required email w-full px-4 py-3 rounded-lg text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-rivo-base transition-all duration-200 text-base"
                    id="mce-EMAIL"
                    required
                    placeholder="Enter your email address"
                  />
                </div>
                
                <div className="mc-field-group">
                  <label htmlFor="mce-MMERGE8" className="block text-white font-medium mb-2 text-left">
                    Select One <span className="asterisk text-white">*</span>
                  </label>
                  <select
                    name="MMERGE8"
                    className="required w-full px-4 py-3 rounded-lg text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-rivo-base appearance-none bg-no-repeat bg-right bg-[length:16px_16px] pr-12 transition-all duration-200 text-base"
                    id="mce-MMERGE8"
                    required
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                      backgroundPosition: 'right 16px center'
                    }}
                  >
                    <option value="">Please select one</option>
                    <option value="Homeowner">Homeowner</option>
                    <option value="Service Provider">Service Provider</option>
                    <option value="Realtor">Realtor</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                
                <div className="mc-field-group">
                  <label htmlFor="mce-MESSAGE" className="block text-white font-medium mb-2 text-left">
                    If Other selected, please indicate who you are:
                  </label>
                  <input
                    type="text"
                    name="MESSAGE"
                    className="text w-full px-4 py-3 rounded-lg text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-rivo-base transition-all duration-200 text-base"
                    id="mce-MESSAGE"
                    placeholder="Please specify your role or profession"
                  />
                </div>
                
                <div id="mce-responses" className="clear">
                  <div className="response" id="mce-error-response" style={{ display: 'none' }}></div>
                  <div className="response" id="mce-success-response" style={{ display: 'none' }}></div>
                </div>
                
                <div aria-hidden="true" style={{ position: 'absolute', left: '-5000px' }}>
                  <input type="text" name="b_fa369b4510f97d8cd57991776_ceb106b932" tabIndex={-1} value="" readOnly />
                </div>
                
                <div className="clear pt-4 flex justify-center">
                  <motion.button
                    type="submit"
                    name="subscribe"
                    id="mc-embedded-subscribe"
                    className="button w-full bg-white text-rivo-base px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-50 hover:shadow-lg transition-all duration-200 transform hover:scale-[1.02]"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Sign Up
                  </motion.button>
                </div>
              </div>
            </form>
            
            <p className="mt-6 text-sm text-white/80">
              By signing up, you agree to our{" "}
              <a href="/terms" className="underline hover:text-white transition-colors">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="/privacy" className="underline hover:text-white transition-colors">
                Privacy Policy
              </a>
              .
            </p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

