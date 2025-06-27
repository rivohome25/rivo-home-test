# **RivoHome User Testing Guide** 🏠

**Welcome to RivoHome Testing!** Please complete this comprehensive testing guide to help us improve our home maintenance platform. Your feedback is invaluable.

---

## **Section 1: User Registration & Onboarding** 📝

### **1.1 Account Creation**
- [ ] Navigate to `/sign-up` and create a new account
- [ ] Test with both **Homeowner** and **Provider** roles
- [ ] Verify email/password validation works properly
- [ ] Confirm you're redirected to the appropriate onboarding flow
- **Issues found:** ________________

### **1.2 Homeowner Onboarding (7 Steps)**
- [ ] **Step 1:** Welcome screen loads correctly
- [ ] **Step 2:** Plan selection (Free, Core $7/mo, Premium $20/mo)
  - [ ] Test Free plan (continues without payment)
  - [ ] Test paid plans (redirects to Stripe checkout)
  - [ ] Test payment cancellation handling
- [ ] **Step 3:** Property information entry
  - [ ] Address input and validation
  - [ ] Year built, property type selection
  - [ ] Region auto-detection works
- [ ] **Step 4:** Region confirmation
- [ ] **Step 5:** Task selection preview
- [ ] **Step 6:** Upsell step (skips for Premium users)
- [ ] **Step 7:** Newsletter signup and completion
- **Issues found:** ________________

### **1.3 Provider Onboarding (7 Steps)**
- [ ] **Step 1:** Basic information (name, business, phone, zip)
- [ ] **Step 2:** Services offered selection
- [ ] **Step 3:** Document uploads (license, insurance)
- [ ] **Step 4:** Business profile (bio, logo)
- [ ] **Step 5:** External reviews import
- [ ] **Step 6:** Background check consent
- [ ] **Step 7:** Agreements and terms
- [ ] **Final:** Pending approval page shows correctly
- **Issues found:** ________________

---

## **Section 2: Authentication & Security** 🔐

### **2.1 Sign In/Out**
- [ ] Sign in with valid credentials
- [ ] Test invalid email/password handling
- [ ] Sign out functionality works
- [ ] Session persistence across browser refresh
- **Issues found:** ________________

### **2.2 Password Reset**
- [ ] Click "Forgot your password?" link
- [ ] Enter email and submit
- [ ] Check email for reset link
- [ ] Complete password reset process
- [ ] Sign in with new password
- **Issues found:** ________________

### **2.3 Role-Based Access**
- [ ] Homeowners redirect to `/dashboard` after login
- [ ] Providers redirect to provider dashboard
- [ ] Admin users redirect to `/admin`
- [ ] Unauthorized pages redirect appropriately
- **Issues found:** ________________

---

## **Section 3: Homeowner Dashboard Features** 🏡

### **3.1 Main Dashboard**
- [ ] Dashboard loads without errors
- [ ] Property cards display correctly
- [ ] Quick actions (Add Property, Find Providers) work
- [ ] Recent activity widget shows data
- [ ] Upcoming tasks widget functions
- [ ] Maintenance schedule displays
- **Issues found:** ________________

### **3.2 Property Management**
- [ ] Add new property functionality
- [ ] Edit property details
- [ ] Delete property (if allowed by plan)
- [ ] Property nickname feature
  - [ ] Click edit icon beside property name
  - [ ] Add/edit custom nickname
  - [ ] Save with Enter or click outside
- [ ] Multiple properties (Core/Premium plans)
- **Issues found:** ________________

### **3.3 Task Management**
- [ ] View upcoming maintenance tasks
- [ ] Mark tasks as complete
- [ ] Complete task modal appears
- [ ] Select "DIY" vs "Professional" completion
- [ ] Task completion creates history record
- [ ] Add custom tasks
- [ ] Task calendar view
- **Issues found:** ________________

### **3.4 Document Management**
- [ ] Upload documents to vault
- [ ] View uploaded documents
- [ ] Delete documents
- [ ] File type restrictions work
- [ ] Storage limits enforced by plan
- **Issues found:** ________________

---

## **Section 4: Provider Features** 🔧

### **4.1 Provider Dashboard**
- [ ] Dashboard shows job summary
- [ ] Upcoming jobs widget displays bookings
- [ ] Lead management interface
- [ ] Recent reviews section
- [ ] Earnings overview
- **Issues found:** ________________

### **4.2 Schedule Management**
- [ ] Access `/dashboard/manage-availability`
- [ ] Set weekly availability slots
- [ ] Use quick templates (weekdays, weekends, full week)
- [ ] Add custom time slots
- [ ] Set buffer times between appointments
- [ ] View and edit existing availability
- **Issues found:** ________________

### **4.3 Booking Management**
- [ ] View pending bookings
- [ ] Accept/decline booking requests
- [ ] View confirmed appointments
- [ ] Cancel appointments with reason
  - [ ] Test cancellation dialog
  - [ ] Select from predefined reasons
  - [ ] Provide detailed explanation (required)
  - [ ] Confirm cancellation stores reason
- [ ] Update booking status
- **Issues found:** ________________

### **4.4 Provider Schedule View**
- [ ] Weekly calendar view
- [ ] List view toggle
- [ ] Navigate between weeks
- [ ] Color-coded booking statuses
- [ ] Customer contact information display
- **Issues found:** ________________

---

## **Section 5: Booking System** 📅

### **5.1 Homeowner Booking Flow**
- [ ] Find providers (`/dashboard/find-providers`)
- [ ] Search by service type and location
- [ ] View provider profiles
- [ ] Check provider availability
- [ ] Select time slot
- [ ] Fill booking form (service type, description, notes)
- [ ] Submit booking request
- [ ] View booking in "My Bookings"
- **Issues found:** ________________

### **5.2 Provider Booking Management**
- [ ] Receive booking notifications
- [ ] View booking details
- [ ] Accept/decline with reasons
- [ ] Manage confirmed appointments
- [ ] Cancel with transparency requirements
- **Issues found:** ________________

### **5.3 Appointment Cancellation System**
- [ ] **Homeowner cancellation:**
  - [ ] Cancel button appears for confirmed bookings
  - [ ] Cancellation dialog with reason selection
  - [ ] Required detailed explanation (50+ chars)
  - [ ] Reason stored and visible to provider
- [ ] **Provider cancellation:**
  - [ ] Same transparent cancellation system
  - [ ] Professional reason templates
  - [ ] Mandatory explanations for trust building
- **Issues found:** ________________

---

## **Section 6: Billing & Subscriptions** 💳

### **6.1 Plan Features**
- [ ] **Free Plan:** 1 home, 3 docs, 10 reminders
- [ ] **Core Plan ($7/mo):** 3 homes, 50 docs, unlimited reminders
- [ ] **Premium Plan ($20/mo):** Unlimited homes/docs, direct booking
- [ ] Plan limits enforced correctly
- [ ] Upgrade prompts when limits reached
- **Issues found:** ________________

### **6.2 Billing Management**
- [ ] Access `/settings/billing`
- [ ] View current plan details
- [ ] Upgrade/downgrade plans
- [ ] Stripe checkout process
- [ ] Subscription management
- [ ] Cancellation handling
- **Issues found:** ________________

### **6.3 Premium Features**
- [ ] Direct provider booking (Premium only)
- [ ] Rivo Reports generation
- [ ] PDF export functionality
- [ ] Beta features access
- [ ] Priority support access
- **Issues found:** ________________

---

## **Section 7: Reports & Analytics** 📊

### **7.1 Rivo Reports**
- [ ] Generate property report
- [ ] View maintenance history
- [ ] Trust score breakdown
- [ ] Task verification sources
- [ ] PDF export (Premium feature)
- [ ] Shareable report links
- **Issues found:** ________________

### **7.2 Task Completion Tracking**
- [ ] DIY vs Professional completion tracking
- [ ] Completion method modal
- [ ] Data stored for analytics
- [ ] Report generation includes completion data
- **Issues found:** ________________

---

## **Section 8: Admin Features** 👨‍💼

### **8.1 Admin Dashboard**
- [ ] Enterprise-style admin interface
- [ ] Animated KPI metrics
- [ ] Real-time activity feed
- [ ] System performance dashboard
- [ ] User management interface
- **Issues found:** ________________

### **8.2 Provider Management**
- [ ] Review provider applications
- [ ] Approve/reject providers
- [ ] Manage provider status
- [ ] View provider details
- **Issues found:** ________________

---

## **Section 9: Regional Features** 🗺️

### **9.1 Regional Task Lists**
- [ ] Task lists match selected region
- [ ] Region-specific maintenance schedules
- [ ] Climate-appropriate tasks
- [ ] Seasonal reminders work
- **Test regions:** Northeast, Southeast, Midwest, Southwest, Mountain States, Pacific Northwest, West Coast, Alaska, Hawaii
- **Issues found:** ________________

---

## **Section 10: Mobile Responsiveness** 📱

### **10.1 Mobile Experience**
- [ ] All pages render correctly on mobile
- [ ] Navigation menus work on small screens
- [ ] Forms are usable on mobile devices
- [ ] Calendars and date pickers function
- [ ] Image uploads work on mobile
- [ ] Touch interactions are responsive
- **Test devices:** Phone, Tablet, Desktop
- **Issues found:** ________________

---

## **Section 11: Performance & Reliability** ⚡

### **11.1 Page Load Times**
- [ ] Dashboard loads within 3 seconds
- [ ] Navigation between pages is smooth
- [ ] Large forms (onboarding) load quickly
- [ ] Image uploads complete successfully
- [ ] No console errors in browser
- **Issues found:** ________________

### **11.2 Error Handling**
- [ ] Network errors display user-friendly messages
- [ ] Form validation provides clear feedback
- [ ] Invalid data submissions handled gracefully
- [ ] 404 pages display correctly
- [ ] Authentication errors redirect properly
- **Issues found:** ________________

---

## **Section 12: Integration Testing** 🔗

### **12.1 Email Notifications**
- [ ] Welcome emails sent after registration
- [ ] Booking confirmation emails
- [ ] Password reset emails
- [ ] Reminder notifications
- **Issues found:** ________________

### **12.2 Payment Processing**
- [ ] Stripe checkout flows work
- [ ] Payment confirmations received
- [ ] Subscription updates reflected
- [ ] Failed payments handled
- **Issues found:** ________________

---

## **Testing Scenarios by User Type**

### **For Homeowners:**
1. **New User Journey:**
   - Sign up → Onboarding → Add property → Complete first task → Upgrade plan
2. **Regular Usage:**
   - Check tasks → Upload document → Find provider → Book service
3. **Advanced Features:**
   - Generate Rivo Report → Export PDF → Manage multiple properties

### **For Providers:**
1. **Application Process:**
   - Sign up → Complete onboarding → Upload documents → Wait for approval
2. **Daily Operations:**
   - Set availability → Receive booking → Accept/decline → Manage schedule
3. **Customer Service:**
   - Cancel appointment with reason → Update booking status → Manage reviews

### **For Admins:**
1. **User Management:**
   - Review provider applications → Approve/reject → Monitor platform activity
2. **System Oversight:**
   - Check KPI metrics → Review user feedback → Manage system settings

---

## **Browser Testing Matrix**

Test on the following browsers:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

---

## **Critical Path Testing**

### **Priority 1 (Must Work):**
- [ ] User registration and login
- [ ] Onboarding flows
- [ ] Basic dashboard functionality
- [ ] Task completion
- [ ] Payment processing

### **Priority 2 (Important):**
- [ ] Provider booking system
- [ ] Document management
- [ ] Property management
- [ ] Billing management

### **Priority 3 (Nice to Have):**
- [ ] Advanced reporting
- [ ] Admin features
- [ ] Beta features
- [ ] Mobile optimization

---

## **Bug Report Template**

When reporting issues, please include:

**Bug Title:** Brief description
**Priority:** High/Medium/Low
**Steps to Reproduce:**
1. 
2. 
3. 

**Expected Result:** 
**Actual Result:** 
**Browser/Device:** 
**Screenshot/Video:** (if applicable)
**User Role:** Homeowner/Provider/Admin

---

## **Final Feedback** 💭

**Overall Experience Rating:** ⭐⭐⭐⭐⭐ (1-5 stars)

**Most Impressive Feature:**
_______________________________

**Biggest Pain Point:**
_______________________________

**Feature Requests:**
_______________________________

**General Comments:**
_______________________________

**Would you recommend RivoHome to other homeowners/providers?**
□ Definitely  □ Probably  □ Maybe  □ Probably Not  □ Definitely Not

**Contact Information (optional):**
- Email: _______________________________
- Role: □ Homeowner  □ Provider  □ Other: _______

---

## **Test Data for Testing**

### **Sample User Accounts:**
- **Homeowner:** test-homeowner@rivohome.com
- **Provider:** test-provider@rivohome.com
- **Admin:** test-admin@rivohome.com

### **Sample Property Data:**
- **Address:** 123 Main St, Anytown, CA 90210
- **Year Built:** 2010
- **Property Type:** Single Family Home
- **Region:** West Coast

### **Sample Service Types:**
- General Handyman
- HVAC Service
- Plumbing
- Electrical
- Landscaping

---

## **Testing the Watermark Protection System 🛡️**

### **PDF Watermark Testing**
1. **Open Property Reports**:
   - Navigate to a property in your dashboard
   - Click "View Report" to open the PropertyReportModal
   - Notice the subtle watermarks in the modal background

2. **Download PDF Test**:
   - Click "Download PDF" in the report modal
   - The generated PDF should include:
     - Diagonal "CONFIDENTIAL" watermark with your email
     - Corner watermarks with property ID and timestamp
     - Subtle background pattern
     - Legal disclaimer with your user information

3. **Protection Features**:
   - Try right-clicking in the modal (should be disabled)
   - Try selecting text (should be prevented)
   - PDF will include print-safe watermarks

### **Shared Report Watermarks**
1. **Generate Shared Link**:
   - In a property report modal, click "Share Report"
   - Copy the generated link and open in a new browser/incognito tab

2. **Verify Shared Protection**:
   - Shared reports should show "SHARED RIVO REPORT" watermarks
   - Expiration date visible in watermarks
   - "EXTERNAL ACCESS" indicators
   - Orange warning banner about temporary access

### **Watermark Elements to Verify**:
- ✅ User email/name in watermarks
- ✅ Property Rivo ID displayed
- ✅ Timestamp of generation
- ✅ "CONFIDENTIAL" marking
- ✅ Legal disclaimer text
- ✅ Disabled text selection
- ✅ Disabled right-click menu

---

**Thank you for testing RivoHome!** 🎉 Your feedback helps us build a better platform for homeowners and service providers.

**Submit completed form to:** testing@rivohome.com

---

*Document Version: 1.0*  
*Last Updated: January 2025*  
*Testing Duration: 2-4 hours (full comprehensive test)* 