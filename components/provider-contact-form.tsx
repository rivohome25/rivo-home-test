"use client"

import { useEffect } from "react"

export function ProviderContactForm() {
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
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">Get Early Access</h3>
      <p className="text-gray-600 mb-6">
        Join our waitlist to be among the first service providers on RivoHome.
      </p>
      
      <form
        action="https://rivohome.us5.list-manage.com/subscribe/post?u=fa369b4510f97d8cd57991776&amp;id=ceb106b932&amp;f_id=0090f6e0f0"
        method="post"
        id="mc-embedded-subscribe-form"
        name="mc-embedded-subscribe-form"
        className="validate"
        target="_blank"
        noValidate
      >
        <div id="mc_embed_signup_scroll" className="space-y-4">
          <div className="indicates-required text-gray-600 text-sm">
            <span className="asterisk text-red-500">*</span> indicates required
          </div>
          
          <div className="mc-field-group">
            <label htmlFor="mce-EMAIL" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address <span className="asterisk text-red-500">*</span>
            </label>
            <input
              type="email"
              name="EMAIL"
              className="required email w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rivo-base focus:border-transparent"
              id="mce-EMAIL"
              required
              placeholder="your@email.com"
            />
          </div>
          
          <div className="mc-field-group">
            <label htmlFor="mce-MMERGE8" className="block text-sm font-medium text-gray-700 mb-1">
              Select One <span className="asterisk text-red-500">*</span>
            </label>
            <select
              name="MMERGE8"
              className="required w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rivo-base focus:border-transparent"
              id="mce-MMERGE8"
              required
            >
              <option value="">Please select one</option>
              <option value="Homeowner">Homeowner</option>
              <option value="Service Provider">Service Provider</option>
              <option value="Realtor">Realtor</option>
              <option value="Other">Other</option>
            </select>
          </div>
          
          <div className="mc-field-group">
            <label htmlFor="mce-MESSAGE" className="block text-sm font-medium text-gray-700 mb-1">
              If Other selected, please indicate who you are:
            </label>
            <input
              type="text"
              name="MESSAGE"
              className="text w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rivo-base focus:border-transparent"
              id="mce-MESSAGE"
              placeholder="Please specify..."
            />
          </div>
          
          <div id="mce-responses" className="clear">
            <div className="response" id="mce-error-response" style={{ display: 'none' }}></div>
            <div className="response" id="mce-success-response" style={{ display: 'none' }}></div>
          </div>
          
          <div aria-hidden="true" style={{ position: 'absolute', left: '-5000px' }}>
            <input type="text" name="b_fa369b4510f97d8cd57991776_ceb106b932" tabIndex={-1} value="" readOnly />
          </div>

          <div className="clear">
            <button
              type="submit"
              name="subscribe"
              id="mc-embedded-subscribe"
              className="button w-full bg-rivo-base text-white px-4 py-2 rounded-md font-medium hover:bg-rivo-dark transition-colors"
            >
              <div className="space-y-2">
                <label htmlFor="FNAME" className="text-sm font-medium text-gray-700">
                  First Name
                </label>
                <input
                  type="text"
                  name="FNAME"
                  id="mce-FNAME"
                  placeholder="First Name"
                  className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-sm text-gray-800 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="LNAME" className="text-sm font-medium text-gray-700">
                  Last Name
                </label>
                <input
                  type="text"
                  name="LNAME"
                  id="mce-LNAME"
                  placeholder="Last Name"
                  className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-sm text-gray-800 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="EMAIL" className="text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <input
                  type="email"
                  name="EMAIL"
                  id="mce-EMAIL"
                  placeholder="your@email.com"
                  className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-sm text-gray-800 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="PHONE" className="text-sm font-medium text-gray-700">
                  Phone Number (Optional)
                </label>
                <input
                  type="tel"
                  name="PHONE"
                  id="mce-PHONE"
                  placeholder="(555) 555-5555"
                  className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-sm text-gray-800 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label htmlFor="COMPANY" className="text-sm font-medium text-gray-700">
                  Company Name
                </label>
                <input
                  type="text"
                  name="COMPANY"
                  id="mce-COMPANY"
                  placeholder="Your Company"
                  className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-sm text-gray-800 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label htmlFor="mce-MMERGE8" className="text-sm font-medium text-gray-700">
                  I am a <span className="text-red-500">*</span>
                </label>
                <select
                  name="MMERGE8"
                  id="mce-MMERGE8"
                  required
                  className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="">Select One</option>
                  <option value="Homeowner">Homeowner</option>
                  <option value="Service Provider">Service Provider</option>
                  <option value="Realtor">Realtor</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Required for Mailchimp bot protection */}
              <div style={{ position: 'absolute', left: '-5000px' }} aria-hidden="true">
                <input type="text" name="b_fa369b4510f97d8cd57991776_ceb106b932" tabIndex={-1} />
              </div>

              <div className="md:col-span-2 mt-4">
                <button
                  type="submit"
                  name="subscribe"
                  id="mc-embedded-subscribe"
                  className="w-full rounded-md bg-gradient-to-r from-teal-500 to-blue-600 px-6 py-3 text-white font-semibold hover:from-teal-600 hover:to-blue-700 transition duration-200"
                >
                  Apply to Join
                </button>
              </div>

              <div className="md:col-span-2 text-center text-sm text-gray-500 mt-2">
                By applying, you agree to our{" "}
                <a href="/terms" className="underline hover:text-teal-600 transition">
                  Terms of Service
                </a>{" "}
                and{" "}
                <a href="/privacy" className="underline hover:text-teal-600 transition">
                  Privacy Policy
                </a>
                .
              </div>
            </form>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

