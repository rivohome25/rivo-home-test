'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function ProviderIntake() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [createAccount, setCreateAccount] = useState(true);
  
  // Form state
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [experienceYears, setExperienceYears] = useState<number | null>(null);
  const [serviceTypes, setServiceTypes] = useState<string[]>([]);
  const [serviceArea, setServiceArea] = useState('');
  const [hourlyRate, setHourlyRate] = useState<number | null>(null);
  const [licenseNumber, setLicenseNumber] = useState('');
  const [insuranceFile, setInsuranceFile] = useState<File | null>(null);
  const [insuranceUrl, setInsuranceUrl] = useState('');
  const [licenseFile, setLicenseFile] = useState<File | null>(null);
  const [licenseUrl, setLicenseUrl] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [references, setReferences] = useState<{name: string, contact: string, relationship: string}[]>([]);
  const [availability, setAvailability] = useState<string[]>([]);
  const [onCall, setOnCall] = useState(false);
  const [subscribe, setSubscribe] = useState(false);

  useEffect(() => {
    async function checkAuthStatus() {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          setIsAuthenticated(true);
          
          // Fetch existing profile data if user is authenticated
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
          
          if (error) throw error;
          
          if (profile) {
            // Populate state with existing profile data
            setFullName(profile.full_name || '');
            setPhone(profile.phone || '');
            setCompanyName(profile.company_name || '');
            setExperienceYears(profile.experience_years || null);
            setServiceTypes(profile.service_types || []);
            setServiceArea(profile.service_area || '');
            setHourlyRate(profile.hourly_rate || null);
            setLicenseNumber(profile.license_number || '');
            setInsuranceUrl(profile.insurance_url || '');
            setLicenseUrl(profile.license_url || '');
            setPortfolioUrl(profile.portfolio_url || '');
            setReferences(profile.references || []);
            setAvailability(profile.availability || []);
            setOnCall(profile.on_call || false);
            setEmail(profile.email || '');
          }
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
      } finally {
        setLoading(false);
      }
    }
    
    checkAuthStatus();
  }, []);

  const addReference = () => {
    setReferences([...references, { name: '', contact: '', relationship: '' }]);
  };

  const updateReference = (index: number, field: string, value: string) => {
    const updatedReferences = [...references];
    updatedReferences[index] = { ...updatedReferences[index], [field]: value };
    setReferences(updatedReferences);
  };

  const removeReference = (index: number) => {
    setReferences(references.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      let userId;
      
      // If not authenticated and wants to create account
      if (!isAuthenticated && createAccount) {
        // Create a new account
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              role: 'provider',
              full_name: fullName
            }
          }
        });
        
        if (authError) throw authError;
        if (!authData.user) throw new Error('Failed to create account');
        
        userId = authData.user.id;
        setIsAuthenticated(true);
      } else if (isAuthenticated) {
        // Get current user ID if already authenticated
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not found');
        userId = user.id;
      } else {
        // For users who don't want to create an account yet
        // Just save the form data to a leads table or similar
        // This is a simplified example - you would need to implement a leads table
        alert('Your application has been saved. We will contact you shortly at ' + email);
        setLoading(false);
        return;
      }
      
      // Upload insurance document if provided
      let finalInsuranceUrl = insuranceUrl;
      if (insuranceFile) {
        const fileName = `${userId}_insurance_${Date.now()}`;
        const { data: insuranceData, error: insuranceError } = await supabase.storage
          .from('documents')
          .upload(fileName, insuranceFile, {
            upsert: true,
            metadata: { user_id: userId }
          });
        
        if (insuranceError) throw insuranceError;
        
        const { data: { publicUrl } } = supabase.storage
          .from('documents')
          .getPublicUrl(fileName);
        
        finalInsuranceUrl = publicUrl;
      }
      
      // Upload license document if provided
      let finalLicenseUrl = licenseUrl;
      if (licenseFile) {
        const fileName = `${userId}_license_${Date.now()}`;
        const { data: licenseData, error: licenseError } = await supabase.storage
          .from('documents')
          .upload(fileName, licenseFile, {
            upsert: true,
            metadata: { user_id: userId }
          });
        
        if (licenseError) throw licenseError;
        
        const { data: { publicUrl } } = supabase.storage
          .from('documents')
          .getPublicUrl(fileName);
        
        finalLicenseUrl = publicUrl;
      }
      
      // Update profile
      const { data, error: updateError } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          phone,
          company_name: companyName,
          experience_years: experienceYears,
          service_types: serviceTypes,
          service_area: serviceArea,
          hourly_rate: hourlyRate,
          license_number: licenseNumber,
          insurance_url: finalInsuranceUrl,
          license_url: finalLicenseUrl,
          portfolio_url: portfolioUrl,
          references,
          availability,
          on_call: onCall,
          role: 'provider',
          email,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);
      
      if (updateError) throw updateError;
      
      // Subscribe to newsletter if checked
      if (subscribe) {
        const subscribeRes = await fetch('/api/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });
        
        if (!subscribeRes.ok) {
          console.error('Failed to subscribe to newsletter');
        }
      }
      
      // Success notification
      alert('Profile saved!');
      
      // Redirect based on authentication state
      if (isAuthenticated) {
        router.push('/dashboard');
      } else {
        router.push('/sign-in');
      }
    } catch (error: any) {
      console.error('Error updating profile:', error);
      setError(error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Service Provider Application</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Account Info (shown only if not authenticated) */}
        {!isAuthenticated && (
          <div className="bg-white p-6 rounded-lg shadow space-y-6">
            <h2 className="text-xl font-semibold">Account Information</h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="create-account"
                  checked={createAccount}
                  onChange={(e) => setCreateAccount(e.target.checked)}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded mr-2"
                />
                <label htmlFor="create-account" className="text-sm text-gray-700">
                  Create an account to track your application
                </label>
              </div>
              
              {createAccount && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required={createAccount}
                    minLength={6}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Minimum 6 characters required
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Basic Info Section */}
        <div className="bg-white p-6 rounded-lg shadow space-y-6">
          <h2 className="text-xl font-semibold">Basic Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>
          </div>
        </div>
        
        {/* Business Profile Section */}
        <div className="bg-white p-6 rounded-lg shadow space-y-6">
          <h2 className="text-xl font-semibold">Business Profile</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Company Name (Optional)
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Years of Experience
              </label>
              <input
                type="number"
                value={experienceYears || ''}
                onChange={(e) => setExperienceYears(e.target.value ? Number(e.target.value) : null)}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Service Types
              </label>
              <select
                multiple
                value={serviceTypes}
                onChange={(e) => {
                  const options = Array.from(e.target.selectedOptions, option => option.value);
                  setServiceTypes(options);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              >
                <option value="plumbing">Plumbing</option>
                <option value="electrical">Electrical</option>
                <option value="hvac">HVAC</option>
                <option value="carpentry">Carpentry</option>
                <option value="painting">Painting</option>
                <option value="landscaping">Landscaping</option>
                <option value="cleaning">Cleaning</option>
                <option value="roofing">Roofing</option>
                <option value="general">General Handyman</option>
              </select>
              <p className="text-sm text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Service Area (City, State or Radius)
              </label>
              <input
                type="text"
                value={serviceArea}
                onChange={(e) => setServiceArea(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hourly Rate ($)
              </label>
              <input
                type="number"
                value={hourlyRate || ''}
                onChange={(e) => setHourlyRate(e.target.value ? Number(e.target.value) : null)}
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>
          </div>
        </div>
        
        {/* Credentials & Compliance Section */}
        <div className="bg-white p-6 rounded-lg shadow space-y-6">
          <h2 className="text-xl font-semibold">Credentials & Compliance</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                License Number (if applicable)
              </label>
              <input
                type="text"
                value={licenseNumber}
                onChange={(e) => setLicenseNumber(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Insurance Document
              </label>
              <input
                type="file"
                onChange={(e) => e.target.files && setInsuranceFile(e.target.files[0])}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
              {insuranceUrl && (
                <a href={insuranceUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 text-sm">
                  View Existing Document
                </a>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                License Document (if applicable)
              </label>
              <input
                type="file"
                onChange={(e) => e.target.files && setLicenseFile(e.target.files[0])}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
              {licenseUrl && (
                <a href={licenseUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 text-sm">
                  View Existing Document
                </a>
              )}
            </div>
          </div>
        </div>
        
        {/* Portfolio & References Section */}
        <div className="bg-white p-6 rounded-lg shadow space-y-6">
          <h2 className="text-xl font-semibold">Portfolio & References</h2>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Portfolio URL (Optional)
            </label>
            <input
              type="url"
              value={portfolioUrl}
              onChange={(e) => setPortfolioUrl(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">
                References
              </label>
              <button
                type="button"
                onClick={addReference}
                className="text-sm bg-blue-500 hover:bg-blue-600 text-white py-1 px-3 rounded"
              >
                Add Reference
              </button>
            </div>
            
            {references.length === 0 && (
              <p className="text-sm text-gray-500">No references added yet</p>
            )}
            
            {references.map((ref, index) => (
              <div key={index} className="p-4 border border-gray-200 rounded-md mb-4">
                <div className="flex justify-between mb-2">
                  <h4 className="font-medium">Reference #{index + 1}</h4>
                  <button
                    type="button"
                    onClick={() => removeReference(index)}
                    className="text-sm text-red-500"
                  >
                    Remove
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name
                    </label>
                    <input
                      type="text"
                      value={ref.name}
                      onChange={(e) => updateReference(index, 'name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contact Info
                    </label>
                    <input
                      type="text"
                      value={ref.contact}
                      onChange={(e) => updateReference(index, 'contact', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Relationship
                    </label>
                    <input
                      type="text"
                      value={ref.relationship}
                      onChange={(e) => updateReference(index, 'relationship', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Availability & On-Call Section */}
        <div className="bg-white p-6 rounded-lg shadow space-y-6">
          <h2 className="text-xl font-semibold">Availability & On-Call</h2>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Available Days
            </label>
            <div className="flex flex-wrap gap-4">
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                <label key={day} className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={availability.includes(day)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setAvailability([...availability, day]);
                      } else {
                        setAvailability(availability.filter(d => d !== day));
                      }
                    }}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">{day}</span>
                </label>
              ))}
            </div>
          </div>
          
          <div>
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                checked={onCall}
                onChange={(e) => setOnCall(e.target.checked)}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">
                Available for emergency/on-call work
              </span>
            </label>
          </div>
        </div>
        
        {/* Newsletter Signup Section */}
        <div className="bg-white p-6 rounded-lg shadow">
          <label className="inline-flex items-center">
            <input
              type="checkbox"
              checked={subscribe}
              onChange={(e) => setSubscribe(e.target.checked)}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-700">
              Subscribe to our newsletter for service provider tips and opportunities
            </span>
          </label>
        </div>
        
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className={`px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 ${
              loading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {loading ? 'Saving...' : 'Submit Application'}
          </button>
        </div>
      </form>
    </div>
  );
} 