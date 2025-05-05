"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { 
  Loader2, Search, Trash2, RefreshCw, UserPlus, MoreHorizontal, 
  CheckCircle, XCircle, AlertCircle, UserX, ShieldAlert, ToggleLeft, ToggleRight
} from 'lucide-react';

interface Officer {
  _id: string;
  username: string;
  email: string;
  contactNumber: string;
  permissions: {
    [key: string]: boolean;
  };
  isActive?: boolean;
  createdAt: string;
}

export default function ManageOfficersPage({ params }: { params: { adminUsername: string } }) {
  const router = useRouter();
  const { adminUsername } = params;
  
  // States
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [filteredOfficers, setFilteredOfficers] = useState<Officer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  
  // Fetch officers
  useEffect(() => {
    const fetchOfficers = async () => {
      try {
        const response = await fetch(`/api/admin/officer/list?adminUsername=${adminUsername}`);
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Failed to fetch officers');
        }
        
        const data = await response.json();
        if (data.success) {
          setOfficers(data.officers || []);
          setFilteredOfficers(data.officers || []);
        } else {
          throw new Error(data.message || 'Failed to fetch officers');
        }
      } catch (error) {
        console.error('Error fetching officers:', error);
        toast.error('Failed to load officers');
      } finally {
        setLoading(false);
      }
    };
    
    fetchOfficers();
  }, [adminUsername]);
  
  // Filter officers on search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredOfficers(officers);
      return;
    }
    
    const query = searchQuery.toLowerCase();
    const filtered = officers.filter(
      officer => 
        officer.username.toLowerCase().includes(query) ||
        officer.email.toLowerCase().includes(query) ||
        officer.contactNumber.includes(query)
    );
    
    setFilteredOfficers(filtered);
  }, [searchQuery, officers]);
  
  // Active/Inactive toggle
  const toggleActive = async (officerId: string, currentStatus: boolean) => {
    setActionLoading(officerId);
    
    try {
      const response = await fetch('/api/admin/officer/update-status', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          officerId,
          isActive: !currentStatus,
          adminUsername
        }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        // Update officers list
        setOfficers(prevOfficers => 
          prevOfficers.map(o => 
            o._id === officerId ? { ...o, isActive: !currentStatus } : o
          )
        );
        
        toast.success(`Officer ${currentStatus ? 'deactivated' : 'activated'} successfully`);
      } else {
        throw new Error(data.message || 'Failed to update officer status');
      }
    } catch (error) {
      console.error('Error updating officer status:', error);
      toast.error('Failed to update officer status');
    } finally {
      setActionLoading(null);
    }
  };
  
  // Reset password
  const resetPassword = async (officerId: string, username: string) => {
    setActionLoading(officerId);
    
    try {
      const response = await fetch('/api/admin/officer/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          officerId,
          adminUsername
        }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        toast.success(`Password reset to '${username}'`);
      } else {
        throw new Error(data.message || 'Failed to reset password');
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      toast.error('Failed to reset password');
    } finally {
      setActionLoading(null);
    }
  };
  
  // Delete officer
  const deleteOfficer = async (officerId: string) => {
    setActionLoading(officerId);
    
    try {
      const response = await fetch('/api/admin/officer/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          officerId,
          adminUsername
        }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        // Remove from list
        setOfficers(prevOfficers => prevOfficers.filter(o => o._id !== officerId));
        setConfirmDelete(null); // Reset confirm state
        toast.success('Officer deleted successfully');
      } else {
        throw new Error(data.message || 'Failed to delete officer');
      }
    } catch (error) {
      console.error('Error deleting officer:', error);
      toast.error('Failed to delete officer');
    } finally {
      setActionLoading(null);
    }
  };
  
  // Format permissions for display
  const getPermissionBadges = (permissions: {[key: string]: boolean}) => {
    const badges = [];
    
    // Get all enabled permissions
    const enabledPermissions = Object.entries(permissions)
      .filter(([_, value]) => value === true)
      .map(([key]) => key);
    
    // Simplified display of permissions
    if (enabledPermissions.includes('adminDashboardAccess')) {
      badges.push('Dashboard');
    }
    
    if (enabledPermissions.includes('homestayApproval')) {
      badges.push('Approval');
    }
    
    if (enabledPermissions.includes('homestayEdit')) {
      badges.push('Edit');
    }
    
    if (enabledPermissions.includes('homestayDelete')) {
      badges.push('Delete');
    }
    
    if (enabledPermissions.includes('documentUpload')) {
      badges.push('Documents');
    }
    
    if (enabledPermissions.includes('imageUpload')) {
      badges.push('Images');
    }
    
    return badges.length > 0 ? badges : ['No permissions'];
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  };
  
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Admin Sidebar */}
      <div className="hidden md:block w-64 flex-shrink-0">
        <AdminSidebar username={adminUsername} />
      </div>
      
      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
            <h1 className="text-2xl font-bold text-gray-900">Manage Officers</h1>
            
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                  <Search size={16} className="text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search officers..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>
              
              <button
                onClick={() => router.push(`/admin/${adminUsername}/create-officer`)}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors text-sm"
              >
                <UserPlus size={16} />
                <span>Add Officer</span>
              </button>
            </div>
          </div>
          
          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2 text-gray-600">Loading officers...</span>
            </div>
          )}
          
          {/* Empty State */}
          {!loading && filteredOfficers.length === 0 && (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-gray-100">
                <UserX className="h-6 w-6 text-gray-500" />
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">No officers found</h3>
              <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto">
                {searchQuery.trim() 
                  ? 'No officers match your search criteria.' 
                  : 'You haven\'t created any officers yet. Create an officer to help manage your homestays.'}
              </p>
              <div className="mt-6">
                <button 
                  onClick={() => router.push(`/admin/${adminUsername}/create-officer`)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Create Officer
                </button>
              </div>
            </div>
          )}
          
          {/* Officers List */}
          {!loading && filteredOfficers.length > 0 && (
            <div className="bg-white shadow-sm rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Username
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contact
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Permissions
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                      <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredOfficers.map((officer) => (
                      <tr key={officer._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                              {officer.username.charAt(0).toUpperCase()}
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900">
                                {officer.username}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{officer.email}</div>
                          <div className="text-xs text-gray-500">{officer.contactNumber}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-wrap gap-1">
                            {getPermissionBadges(officer.permissions).map((badge, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary"
                              >
                                {badge === 'No permissions' ? (
                                  <ShieldAlert className="mr-1 h-3 w-3" />
                                ) : null}
                                {badge}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {officer.isActive !== false ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <CheckCircle className="mr-1 h-3 w-3" />
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              <XCircle className="mr-1 h-3 w-3" />
                              Inactive
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(officer.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                          <div className="flex items-center justify-center space-x-2">
                            {/* Toggle active status */}
                            <button
                              onClick={() => toggleActive(officer._id, officer.isActive !== false)}
                              disabled={actionLoading === officer._id}
                              className="text-gray-600 hover:text-primary focus:outline-none"
                              title={officer.isActive !== false ? 'Deactivate' : 'Activate'}
                            >
                              {actionLoading === officer._id ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                              ) : officer.isActive !== false ? (
                                <ToggleRight className="h-5 w-5" />
                              ) : (
                                <ToggleLeft className="h-5 w-5" />
                              )}
                            </button>
                            
                            {/* Reset password */}
                            <button
                              onClick={() => resetPassword(officer._id, officer.username)}
                              disabled={actionLoading === officer._id}
                              className="text-gray-600 hover:text-yellow-500 focus:outline-none"
                              title="Reset password"
                            >
                              {actionLoading === officer._id ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                              ) : (
                                <RefreshCw className="h-5 w-5" />
                              )}
                            </button>
                            
                            {/* Delete - needs confirmation */}
                            {confirmDelete === officer._id ? (
                              <div className="flex items-center">
                                <button
                                  onClick={() => deleteOfficer(officer._id)}
                                  disabled={actionLoading === officer._id}
                                  className="text-red-600 hover:text-red-800 focus:outline-none"
                                  title="Confirm Delete"
                                >
                                  {actionLoading === officer._id ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                  ) : (
                                    <CheckCircle className="h-5 w-5" />
                                  )}
                                </button>
                                <button
                                  onClick={() => setConfirmDelete(null)}
                                  className="text-gray-600 hover:text-gray-800 focus:outline-none"
                                  title="Cancel"
                                >
                                  <XCircle className="h-5 w-5" />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setConfirmDelete(officer._id)}
                                className="text-gray-600 hover:text-red-600 focus:outline-none"
                                title="Delete"
                              >
                                <Trash2 className="h-5 w-5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 