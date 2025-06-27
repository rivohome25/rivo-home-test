'use client';

import { useState, useEffect } from 'react';
import { User, Briefcase, FileText, Star, Building, Save, Eye, EyeOff } from 'lucide-react';

type ProviderProfile = {
  user_id?: string;
  full_name: string;
  business_name: string;
  email: string;
  phone: string;
  zip_code: string;
  bio?: string;
  logo_url?: string;
  services_offered?: string[];
  service_radius?: number;
  license_number?: string;
  license_state?: string;
  insurance_path?: string;
  portfolio_urls?: string[];
  social_links?: any;
  google_link?: string;
  yelp_link?: string;
  angi_link?: string;
  bbb_link?: string;
  facebook_link?: string;
  testimonials?: any;
  background_check?: boolean;
  agreements?: any;
  status?: string;
  provider_services?: any[];
  provider_external_reviews?: any[];
  provider_documents?: any[];
};

type TabType = 'basic' | 'services' | 'docs' | 'bio' | 'reviews';

interface ProviderProfileFormProps {
  data: ProviderProfile;
  onChange?: (profile: ProviderProfile) => void;
}

export default function ProviderProfileForm({ data, onChange }: ProviderProfileFormProps) {
  const [profile, setProfile] = useState<ProviderProfile>(data || {
    full_name: '',
    business_name: '',
    email: '',
    phone: '',
    zip_code: '',
    bio: '',
    logo_url: '',
    services_offered: [],
    service_radius: 25,
    license_number: '',
    license_state: '',
    portfolio_urls: [],
    google_link: '',
    yelp_link: '',
    testimonials: []
  });
  
  const [activeTab, setActiveTab] = useState<TabType>('basic');
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Update parent component when profile changes
  useEffect(() => {
    if (onChange) {
      onChange(profile);
    }
  }, [profile, onChange]);

  const updateProfile = (field: string, value: any) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/provider-profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile)
      });
      
      if (!res.ok) {
        throw new Error('Failed to save profile');
      }
      
      alert('Profile saved successfully!');
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'basic', label: 'Basic Info', icon: User },
    { id: 'services', label: 'Services', icon: Briefcase },
    { id: 'docs', label: 'Documents', icon: FileText },
    { id: 'bio', label: 'Business Profile', icon: Building },
    { id: 'reviews', label: 'Reviews', icon: Star },
  ];

  const serviceOptions = [
    'plumbing', 'hvac', 'electrical', 'roofing', 'landscaping', 
    'painting', 'flooring', 'appliance-repair', 'handyman', 'cleaning'
  ];

  return (
    <div className="space-y-6">
      {/* Header with Save and Preview buttons */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">My Provider Profile</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {showPreview ? 'Edit Mode' : 'Preview'}
          </button>
          
          {!showPreview && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <Save className="h-4 w-4" />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          )}
        </div>
      </div>

      <div className="flex space-x-8">
        {/* Form Section */}
        <div className={showPreview ? "w-1/2" : "w-full"}>
          <div className="bg-white rounded-lg shadow">
            {/* Tabs */}
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-6">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as TabType)}
                      className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                        activeTab === tab.id
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {activeTab === 'basic' && (
                <BasicInfoTab profile={profile} updateProfile={updateProfile} />
              )}
              {activeTab === 'services' && (
                <ServicesTab profile={profile} updateProfile={updateProfile} serviceOptions={serviceOptions} />
              )}
              {activeTab === 'docs' && (
                <DocumentsTab profile={profile} updateProfile={updateProfile} />
              )}
              {activeTab === 'bio' && (
                <BusinessProfileTab profile={profile} updateProfile={updateProfile} />
              )}
              {activeTab === 'reviews' && (
                <ReviewsTab profile={profile} updateProfile={updateProfile} />
              )}
            </div>
          </div>
        </div>

        {/* Preview Section */}
        {showPreview && (
          <div className="w-1/2">
            <ProfilePreview profile={profile} />
          </div>
        )}
      </div>
    </div>
  );
}

// Basic Info Tab Component
function BasicInfoTab({ profile, updateProfile }: { profile: ProviderProfile, updateProfile: (field: string, value: any) => void }) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Full Name
          </label>
          <input
            type="text"
            value={profile.full_name || ''}
            onChange={(e) => updateProfile('full_name', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Business Name
          </label>
          <input
            type="text"
            value={profile.business_name || ''}
            onChange={(e) => updateProfile('business_name', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email
          </label>
          <input
            type="email"
            value={profile.email || ''}
            onChange={(e) => updateProfile('email', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Phone
          </label>
          <input
            type="tel"
            value={profile.phone || ''}
            onChange={(e) => updateProfile('phone', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Zip Code
          </label>
          <input
            type="text"
            value={profile.zip_code || ''}
            onChange={(e) => updateProfile('zip_code', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    </div>
  );
}

// Services Tab Component
function ServicesTab({ profile, updateProfile, serviceOptions }: { 
  profile: ProviderProfile, 
  updateProfile: (field: string, value: any) => void,
  serviceOptions: string[]
}) {
  const handleServiceToggle = (service: string) => {
    const currentServices = profile.services_offered || [];
    const newServices = currentServices.includes(service)
      ? currentServices.filter(s => s !== service)
      : [...currentServices, service];
    updateProfile('services_offered', newServices);
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">Services Offered</h3>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Select Services You Offer
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {serviceOptions.map((service) => (
            <label key={service} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={(profile.services_offered || []).includes(service)}
                onChange={() => handleServiceToggle(service)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 capitalize">
                {service.replace('-', ' ')}
              </span>
            </label>
          ))}
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Service Radius (miles)
        </label>
        <input
          type="number"
          min="1"
          max="100"
          value={profile.service_radius || 25}
          onChange={(e) => updateProfile('service_radius', parseInt(e.target.value))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>
  );
}

// Documents Tab Component
function DocumentsTab({ profile, updateProfile }: { profile: ProviderProfile, updateProfile: (field: string, value: any) => void }) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">License & Insurance</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            License Number
          </label>
          <input
            type="text"
            value={profile.license_number || ''}
            onChange={(e) => updateProfile('license_number', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            License State
          </label>
          <input
            type="text"
            value={profile.license_state || ''}
            onChange={(e) => updateProfile('license_state', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
      
      {/* Display uploaded documents if available */}
      {profile.provider_documents && profile.provider_documents.length > 0 && (
        <div>
          <h4 className="text-md font-medium text-gray-900 mb-3">Uploaded Documents</h4>
          <div className="space-y-2">
            {profile.provider_documents.map((doc: any, index: number) => (
              <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-md">
                <div>
                  <p className="font-medium text-gray-900 capitalize">{doc.doc_type}</p>
                  <p className="text-sm text-gray-600">
                    Uploaded: {new Date(doc.uploaded_at).toLocaleDateString()}
                  </p>
                </div>
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                  Verified
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Business Profile Tab Component
function BusinessProfileTab({ profile, updateProfile }: { profile: ProviderProfile, updateProfile: (field: string, value: any) => void }) {
  const handlePortfolioUpdate = (index: number, value: string) => {
    const newPortfolio = [...(profile.portfolio_urls || [])];
    newPortfolio[index] = value;
    updateProfile('portfolio_urls', newPortfolio);
  };

  const addPortfolioItem = () => {
    const newPortfolio = [...(profile.portfolio_urls || []), ''];
    updateProfile('portfolio_urls', newPortfolio);
  };

  const removePortfolioItem = (index: number) => {
    const newPortfolio = (profile.portfolio_urls || []).filter((_, i) => i !== index);
    updateProfile('portfolio_urls', newPortfolio.length > 0 ? newPortfolio : ['']);
  };

  const handleSocialLinkUpdate = (index: number, value: string) => {
    const newSocialLinks = [...(Array.isArray(profile.social_links) ? profile.social_links : [])];
    newSocialLinks[index] = value;
    updateProfile('social_links', newSocialLinks);
  };

  const addSocialLink = () => {
    const newSocialLinks = [...(Array.isArray(profile.social_links) ? profile.social_links : []), ''];
    updateProfile('social_links', newSocialLinks);
  };

  const removeSocialLink = (index: number) => {
    const newSocialLinks = (Array.isArray(profile.social_links) ? profile.social_links : []).filter((_, i) => i !== index);
    updateProfile('social_links', newSocialLinks.length > 0 ? newSocialLinks : ['']);
  };

  const getSocialPlatformIcon = (url: string) => {
    if (!url) return '🔗';
    if (url.includes('facebook.com')) return '📘';
    if (url.includes('instagram.com')) return '📷';
    if (url.includes('twitter.com') || url.includes('x.com')) return '🐦';
    if (url.includes('linkedin.com')) return '💼';
    if (url.includes('tiktok.com')) return '🎵';
    if (url.includes('youtube.com')) return '📺';
    return '🌐';
  };

  const getSocialPlatformName = (url: string) => {
    if (!url) return 'Link';
    if (url.includes('facebook.com')) return 'Facebook';
    if (url.includes('instagram.com')) return 'Instagram';
    if (url.includes('twitter.com') || url.includes('x.com')) return 'Twitter/X';
    if (url.includes('linkedin.com')) return 'LinkedIn';
    if (url.includes('tiktok.com')) return 'TikTok';
    if (url.includes('youtube.com')) return 'YouTube';
    return 'Website';
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">Business Profile</h3>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Business Bio (max 250 characters)
        </label>
        <textarea
          value={profile.bio || ''}
          onChange={(e) => updateProfile('bio', e.target.value)}
          maxLength={250}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Tell potential customers about your business..."
        />
        <p className="text-sm text-gray-500 mt-1">
          {(profile.bio || '').length}/250 characters
        </p>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Logo URL
        </label>
        <input
          type="url"
          value={profile.logo_url || ''}
          onChange={(e) => updateProfile('logo_url', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="https://example.com/logo.png"
        />
        {profile.logo_url && (
          <div className="mt-2">
            <img 
              src={profile.logo_url} 
              alt="Logo preview" 
              className="h-16 w-16 object-cover rounded-md border border-gray-200"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
        )}
      </div>

      {/* Portfolio Section */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Portfolio URLs
        </label>
        <p className="text-sm text-gray-600 mb-3">
          Add links to your work, photo galleries, or project showcases
        </p>
        
        {(profile.portfolio_urls || ['']). map((url, index) => (
          <div key={index} className="flex items-center gap-2 mb-2">
            <input
              type="url"
              value={url}
              onChange={(e) => handlePortfolioUpdate(index, e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://example.com/portfolio"
            />
            {(profile.portfolio_urls || []).length > 1 && (
              <button
                type="button"
                onClick={() => removePortfolioItem(index)}
                className="px-3 py-2 text-red-600 hover:text-red-800 border border-red-300 rounded-md hover:bg-red-50"
              >
                ✕
              </button>
            )}
          </div>
        ))}
        
        <button
          type="button"
          onClick={addPortfolioItem}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          + Add Portfolio Link
        </button>
      </div>

      {/* Social Media Section */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Social Media & Website Links
        </label>
        <p className="text-sm text-gray-600 mb-3">
          Add your social media profiles and website to build trust with customers
        </p>
        
        {(Array.isArray(profile.social_links) ? profile.social_links : ['']).map((url, index) => (
          <div key={index} className="flex items-center gap-2 mb-2">
            <span className="text-lg" title={getSocialPlatformName(url)}>
              {getSocialPlatformIcon(url)}
            </span>
            <input
              type="url"
              value={url}
              onChange={(e) => handleSocialLinkUpdate(index, e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://facebook.com/yourpage or https://yourwebsite.com"
            />
            {(Array.isArray(profile.social_links) ? profile.social_links : []).length > 1 && (
              <button
                type="button"
                onClick={() => removeSocialLink(index)}
                className="px-3 py-2 text-red-600 hover:text-red-800 border border-red-300 rounded-md hover:bg-red-50"
              >
                ✕
              </button>
            )}
          </div>
        ))}
        
        <button
          type="button"
          onClick={addSocialLink}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          + Add Social Media Link
        </button>
      </div>
    </div>
  );
}

// Reviews Tab Component
function ReviewsTab({ profile, updateProfile }: { profile: ProviderProfile, updateProfile: (field: string, value: any) => void }) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">External Reviews</h3>
      
      <div className="grid grid-cols-1 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Google Business Profile URL
          </label>
          <input
            type="url"
            value={profile.google_link || ''}
            onChange={(e) => updateProfile('google_link', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="https://business.google.com/..."
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Yelp Business URL
          </label>
          <input
            type="url"
            value={profile.yelp_link || ''}
            onChange={(e) => updateProfile('yelp_link', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="https://yelp.com/biz/..."
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Angi Profile URL
          </label>
          <input
            type="url"
            value={profile.angi_link || ''}
            onChange={(e) => updateProfile('angi_link', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="https://angi.com/..."
          />
        </div>
      </div>
      
      {/* Display external reviews if available */}
      {profile.provider_external_reviews && profile.provider_external_reviews.length > 0 && (
        <div>
          <h4 className="text-md font-medium text-gray-900 mb-3">Current Reviews</h4>
          <div className="space-y-3">
            {profile.provider_external_reviews.map((review: any, index: number) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h5 className="font-medium text-gray-900 capitalize">{review.platform}</h5>
                    {review.url && (
                      <a 
                        href={review.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        View Profile
                      </a>
                    )}
                    {review.testimonial && (
                      <p className="text-gray-600 mt-2 text-sm">"{review.testimonial}"</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Profile Preview Component
function ProfilePreview({ profile }: { profile: ProviderProfile }) {
  const getSocialPlatformIcon = (url: string) => {
    if (!url) return '🔗';
    if (url.includes('facebook.com')) return '📘';
    if (url.includes('instagram.com')) return '📷';
    if (url.includes('twitter.com') || url.includes('x.com')) return '🐦';
    if (url.includes('linkedin.com')) return '💼';
    if (url.includes('tiktok.com')) return '🎵';
    if (url.includes('youtube.com')) return '📺';
    return '🌐';
  };

  const getSocialPlatformName = (url: string) => {
    if (!url) return 'Link';
    if (url.includes('facebook.com')) return 'Facebook';
    if (url.includes('instagram.com')) return 'Instagram';
    if (url.includes('twitter.com') || url.includes('x.com')) return 'Twitter/X';
    if (url.includes('linkedin.com')) return 'LinkedIn';
    if (url.includes('tiktok.com')) return 'TikTok';
    if (url.includes('youtube.com')) return 'YouTube';
    return 'Website';
  };

  return (
    <div className="w-full border border-gray-200 bg-white shadow rounded-lg">
      <div className="p-6">
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Profile Preview</h2>
          <p className="text-gray-600 text-sm">How homeowners see your profile</p>
        </div>
        
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white mb-6">
          <div className="flex items-center gap-4">
            {profile.logo_url ? (
              <img 
                src={profile.logo_url} 
                alt="Business Logo" 
                className="w-16 h-16 rounded-full object-cover bg-white"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-white bg-opacity-20 flex items-center justify-center">
                <span className="text-2xl font-bold">
                  {(profile.business_name || 'B').charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold">{profile.business_name || 'Your Business Name'}</h1>
              <p className="text-lg opacity-90">{profile.full_name || 'Your Name'}</p>
              <p className="opacity-75">{profile.zip_code || 'Your Location'}</p>
            </div>
          </div>
        </div>
        
        {/* Bio */}
        {profile.bio && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">About</h3>
            <p className="text-gray-700">{profile.bio}</p>
          </div>
        )}
        
        {/* Services */}
        {profile.services_offered && profile.services_offered.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Services</h3>
            <div className="flex flex-wrap gap-2">
              {profile.services_offered.map((service, index) => (
                <span 
                  key={index}
                  className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full capitalize"
                >
                  {service.replace('-', ' ')}
                </span>
              ))}
            </div>
            {profile.service_radius && (
              <p className="text-sm text-gray-600 mt-2">
                Service radius: {profile.service_radius} miles
              </p>
            )}
          </div>
        )}

        {/* Portfolio */}
        {profile.portfolio_urls && profile.portfolio_urls.length > 0 && profile.portfolio_urls.some(url => url.trim() !== '') && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Portfolio</h3>
            <div className="space-y-2">
              {profile.portfolio_urls.filter(url => url.trim() !== '').map((url, index) => (
                <a
                  key={index}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-blue-600">🔗</span>
                    <span className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                      View Portfolio {index + 1}
                    </span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Social Media */}
        {Array.isArray(profile.social_links) && profile.social_links.length > 0 && profile.social_links.some(url => url.trim() !== '') && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Connect With Us</h3>
            <div className="flex flex-wrap gap-2">
              {profile.social_links.filter(url => url.trim() !== '').map((url, index) => (
                <a
                  key={index}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  title={getSocialPlatformName(url)}
                >
                  <span className="text-lg">{getSocialPlatformIcon(url)}</span>
                  <span className="text-sm font-medium text-gray-700">
                    {getSocialPlatformName(url)}
                  </span>
                </a>
              ))}
            </div>
          </div>
        )}
        
        {/* Contact */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Contact</h3>
          <div className="space-y-1 text-sm">
            {profile.email && <p className="text-gray-700">📧 {profile.email}</p>}
            {profile.phone && <p className="text-gray-700">📞 {profile.phone}</p>}
            {profile.zip_code && <p className="text-gray-700">📍 {profile.zip_code}</p>}
          </div>
        </div>
      </div>
    </div>
  );
} 