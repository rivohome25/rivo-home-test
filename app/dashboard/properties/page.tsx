'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, Home, Calendar, MapPin, Trash2, Crown, FileText, Edit3 } from 'lucide-react';
import HomeownerNavigationClient from '@/components/HomeownerNavigationClient';
import PropertyReportModal from '@/components/PropertyReportModal';
import { 
  getUserPlan, 
  canUserPerformAction, 
  getUserUsage,
  getPlanLimits,
  getUpgradeMessage,
  type UserPlan 
} from '@/lib/getUserPlan';

interface Property {
  id: string;
  address: string;
  year_built: number;
  property_type: string;
  region: string;
  square_footage: number | null;
  purchase_date: string | null;
  rivo_id: string;
  nickname?: string;
  created_at: string;
}

export default function PropertiesPage() {
  const supabase = createClientComponentClient();
  const router = useRouter();
  const { toast } = useToast();

  const [properties, setProperties] = useState<Property[]>([]);
  const [userPlan, setUserPlan] = useState<UserPlan | null>(null);
  const [canAdd, setCanAdd] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [saving, setSaving] = useState(false);

  // Modal state for Rivo Report
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');

  // Form state for adding new property
  const [newProperty, setNewProperty] = useState({
    address: '',
    year_built: new Date().getFullYear(),
    property_type: 'single_family',
    region: 'Northeast',
    square_footage: '',
    purchase_date: '',
    nickname: ''
  });

  // State for nickname editing
  const [editingNickname, setEditingNickname] = useState<string | null>(null);
  const [tempNickname, setTempNickname] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  // Handle download trigger from success page
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const downloadPropertyId = params.get('download_report');
    const reportId = params.get('report_id');

    if (downloadPropertyId && reportId) {
      // Find the property and trigger download
      const property = properties.find(p => p.id === downloadPropertyId);
      if (property) {
        // Open the report modal
        setSelectedPropertyId(downloadPropertyId);
        setShowReportModal(true);
        
        // Clean up URL
        window.history.replaceState({}, document.title, '/dashboard/properties');
      }
    }
  }, [properties]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load user's plan, properties, and check permissions in parallel
      const [planData, propertiesResult, canAddProperty] = await Promise.all([
        getUserPlan(),
        fetch('/api/properties').then(res => res.json()),
        canUserPerformAction('add_property')
      ]);

      setUserPlan(planData);
      setCanAdd(canAddProperty);
      
      if (propertiesResult.error) {
        console.error('Error loading properties:', propertiesResult.error);
        toast({
          title: "Error",
          description: "Failed to load properties",
          variant: "destructive",
        });
      } else {
        setProperties(propertiesResult.properties || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Double-check permission before adding
    const canAddNow = await canUserPerformAction('add_property');
    if (!canAddNow) {
      const upgradeMsg = userPlan ? getUpgradeMessage(userPlan.name, 'properties') : 'Upgrade your plan to add more properties.';
      toast({
        title: "Upgrade Required",
        description: upgradeMsg,
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      // SECURITY FIX: Use API endpoint instead of direct database operation
      const response = await fetch('/api/properties', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address: newProperty.address,
          year_built: newProperty.year_built,
          property_type: newProperty.property_type,
          region: newProperty.region,
          square_footage: newProperty.square_footage ? Number(newProperty.square_footage) : null,
          purchase_date: newProperty.purchase_date || null,
          nickname: newProperty.nickname || null,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('Error adding property:', result.error);
        toast({
          title: "Error",
          description: result.error || "Failed to add property",
          variant: "destructive",
        });
      } else {
        setProperties([result.property, ...properties]);
        setNewProperty({
          address: '',
          year_built: new Date().getFullYear(),
          property_type: 'single_family',
          region: 'Northeast',
          square_footage: '',
          purchase_date: '',
          nickname: ''
        });
        setShowAddForm(false);
        
        // Refresh permissions after adding
        const newCanAdd = await canUserPerformAction('add_property');
        setCanAdd(newCanAdd);
        
        toast({
          title: "Success",
          description: "Property added successfully",
        });
      }
    } catch (error) {
      console.error('Error adding property:', error);
      toast({
        title: "Error",
        description: "Failed to add property",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProperty = async (propertyId: string) => {
    if (!confirm('Are you sure you want to delete this property?')) return;

    try {
      // SECURITY FIX: Use API endpoint instead of direct database operation
      const response = await fetch(`/api/properties?id=${propertyId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('Error deleting property:', result.error);
        toast({
          title: "Error",
          description: result.error || "Failed to delete property",
          variant: "destructive",
        });
      } else {
        setProperties(properties.filter(p => p.id !== propertyId));
        
        // Refresh permissions after deleting
        const newCanAdd = await canUserPerformAction('add_property');
        setCanAdd(newCanAdd);
        
        toast({
          title: "Success",
          description: "Property deleted successfully",
        });
      }
    } catch (error) {
      console.error('Error deleting property:', error);
      toast({
        title: "Error",
        description: "Failed to delete property",
        variant: "destructive",
      });
    }
  };

  // Handle opening the report modal
  const handleViewReport = (propertyId: string) => {
    setSelectedPropertyId(propertyId);
    setShowReportModal(true);
  };

  // Handle closing the report modal
  const handleCloseReport = () => {
    setShowReportModal(false);
    setSelectedPropertyId('');
  };

  // Handle nickname editing
  const handleEditNickname = (propertyId: string, currentNickname: string) => {
    setEditingNickname(propertyId);
    setTempNickname(currentNickname || '');
  };

  const handleSaveNickname = async (propertyId: string) => {
    try {
      // Get current user to ensure proper authentication
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        toast({
          title: "Error",
          description: "Authentication required",
          variant: "destructive",
        });
        return;
      }

      // SECURITY FIX: Use API endpoint instead of direct database operation
      const property = properties.find(p => p.id === propertyId);
      if (!property) {
        toast({
          title: "Error",
          description: "Property not found",
          variant: "destructive",
        });
        return;
      }

      const response = await fetch('/api/properties', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: propertyId,
          address: property.address,
          property_type: property.property_type,
          year_built: property.year_built,
          region: property.region,
          square_footage: property.square_footage,
          purchase_date: property.purchase_date,
          nickname: tempNickname || null,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('Error updating nickname:', result.error);
        toast({
          title: "Error",
          description: result.error || "Failed to update nickname",
          variant: "destructive",
        });
      } else {
        // Update local state with the returned data
        setProperties(properties.map(p => 
          p.id === propertyId ? { ...p, nickname: result.property.nickname || undefined } : p
        ));
        setEditingNickname(null);
        setTempNickname('');
        
        toast({
          title: "Success",
          description: "Nickname updated successfully",
        });
      }
    } catch (error) {
      console.error('Error updating nickname:', error);
      toast({
        title: "Error",
        description: "Failed to update nickname",
        variant: "destructive",
      });
    }
  };

  const handleCancelNickname = () => {
    setEditingNickname(null);
    setTempNickname('');
  };

  const getPlanStatusText = () => {
    if (!userPlan) return '';
    
    const limits = getPlanLimits(userPlan);
    if (limits.properties === null) {
      return 'Unlimited properties';
    }
    return `${properties.length}/${limits.properties} properties used`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          <div className="animate-pulse">
            <div className="h-32 bg-gray-200 rounded-xl mb-6"></div>
            <div className="grid gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <HomeownerNavigationClient 
        title="My Properties" 
        currentPage="properties"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 space-y-8">
        {/* Properties Header with Plan Status */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">My Properties</h2>
              <p className="text-gray-600">Manage your properties and track maintenance</p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              {/* Plan Status */}
              <div className="flex items-center gap-2">
                <Crown className="h-4 w-4 text-yellow-500" />
                <span className="text-sm font-medium text-gray-700">
                  {getPlanStatusText()}
                </span>
              </div>
              
              {/* Add Property Button */}
              {canAdd ? (
                <Button 
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="rivo-button flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Property
                </Button>
              ) : (
                <div className="text-center">
                  <Button disabled className="flex items-center gap-2 mb-2">
                    <Plus className="h-4 w-4" />
                    Add Property
                  </Button>
                  <p className="text-xs text-gray-500">
                    {userPlan ? getUpgradeMessage(userPlan.name, 'properties') : 'Upgrade to add more properties'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Add Property Form */}
        {showAddForm && (
          <Card>
            <CardHeader>
              <CardTitle>Add New Property</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddProperty} className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="nickname">Property Nickname (optional)</Label>
                    <Input
                      id="nickname"
                      value={newProperty.nickname}
                      onChange={(e) => setNewProperty(prev => ({ ...prev, nickname: e.target.value }))}
                      placeholder="e.g., Beach House, Mom's Place"
                    />
                  </div>

                  <div>
                    <Label htmlFor="address">Property Address *</Label>
                    <Input
                      id="address"
                      value={newProperty.address}
                      onChange={(e) => setNewProperty(prev => ({ ...prev, address: e.target.value }))}
                      placeholder="123 Main St, City, State"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="property_type">Property Type</Label>
                    <Select 
                      value={newProperty.property_type} 
                      onValueChange={(value) => setNewProperty(prev => ({ ...prev, property_type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="single_family">Single Family Home</SelectItem>
                        <SelectItem value="condo">Condominium</SelectItem>
                        <SelectItem value="townhouse">Townhouse</SelectItem>
                        <SelectItem value="apartment">Apartment</SelectItem>
                        <SelectItem value="duplex">Duplex</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="year_built">Year Built</Label>
                    <Input
                      id="year_built"
                      type="number"
                      value={newProperty.year_built}
                      onChange={(e) => setNewProperty(prev => ({ ...prev, year_built: parseInt(e.target.value) || new Date().getFullYear() }))}
                      min="1800"
                      max={new Date().getFullYear()}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="region">Region</Label>
                    <Select 
                      value={newProperty.region} 
                      onValueChange={(value) => setNewProperty(prev => ({ ...prev, region: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Northeast">Northeast</SelectItem>
                        <SelectItem value="Southeast">Southeast</SelectItem>
                        <SelectItem value="Midwest">Midwest</SelectItem>
                        <SelectItem value="Southwest">Southwest</SelectItem>
                        <SelectItem value="West">West</SelectItem>
                        <SelectItem value="Pacific Northwest">Pacific Northwest</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="square_footage">Square Footage (optional)</Label>
                    <Input
                      id="square_footage"
                      type="number"
                      value={newProperty.square_footage}
                      onChange={(e) => setNewProperty(prev => ({ ...prev, square_footage: e.target.value }))}
                      placeholder="e.g., 2000"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="purchase_date">Purchase Date (optional)</Label>
                    <Input
                      id="purchase_date"
                      type="date"
                      value={newProperty.purchase_date}
                      onChange={(e) => setNewProperty(prev => ({ ...prev, purchase_date: e.target.value }))}
                    />
                  </div>
                </div>
                
                <div className="flex gap-4 pt-4">
                  <Button type="submit" disabled={saving} className="rivo-button">
                    {saving ? 'Adding...' : 'Add Property'}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowAddForm(false)}
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Properties Grid */}
        {properties.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Home className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No properties yet</h3>
              <p className="text-gray-600 mb-6">
                Add your first property to start tracking maintenance and tasks.
              </p>
              {canAdd && (
                <Button 
                  onClick={() => setShowAddForm(true)}
                  className="rivo-button"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Property
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {properties.map((property) => (
              <Card key={property.id} className="hover:shadow-lg transition-shadow duration-300">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      {/* Nickname section */}
                      {editingNickname === property.id ? (
                        <div className="mb-2">
                          <Input
                            value={tempNickname}
                            onChange={(e) => setTempNickname(e.target.value)}
                            placeholder="Enter nickname"
                            className="text-sm h-8"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleSaveNickname(property.id);
                              } else if (e.key === 'Escape') {
                                handleCancelNickname();
                              }
                            }}
                            onBlur={() => handleSaveNickname(property.id)}
                            autoFocus
                          />
                        </div>
                      ) : (
                        property.nickname && (
                          <div className="mb-1">
                            <p className="text-sm font-medium text-gray-800 truncate">
                              {property.nickname}
                            </p>
                          </div>
                        )
                      )}
                      
                      <CardTitle className="text-lg line-clamp-2">
                        {property.address}
                      </CardTitle>
                    </div>
                    
                    <div className="flex items-center gap-1 ml-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditNickname(property.id, property.nickname || '')}
                        className="text-gray-600 hover:text-gray-700 hover:bg-gray-50"
                        title="Edit nickname"
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteProperty(property.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        title="Delete property"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="h-4 w-4" />
                    <span>RivoID: {property.rivo_id}</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Type:</span>
                      <p className="text-gray-600 capitalize">
                        {property.property_type.replace('_', ' ')}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Built:</span>
                      <p className="text-gray-600">{property.year_built}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Region:</span>
                      <p className="text-gray-600">{property.region}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Size:</span>
                      <p className="text-gray-600">
                        {property.square_footage ? `${property.square_footage.toLocaleString()} sq ft` : 'Not specified'}
                      </p>
                    </div>
                  </div>
                  
                  {property.purchase_date && (
                    <div className="text-sm">
                      <span className="font-medium text-gray-700">Purchased:</span>
                      <p className="text-gray-600">
                        {new Date(property.purchase_date).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                  
                  <div className="pt-3 border-t space-y-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full flex items-center gap-2"
                      onClick={() => router.push(`/dashboard/properties/${property.id}`)}
                    >
                      <Calendar className="h-4 w-4" />
                      View Maintenance
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full flex items-center gap-2 bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                      onClick={() => handleViewReport(property.id)}
                    >
                      <FileText className="h-4 w-4" />
                      View Rivo Report
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Property Report Modal */}
      <PropertyReportModal
        propertyId={selectedPropertyId}
        isOpen={showReportModal}
        onClose={handleCloseReport}
      /></div>
  );
} 