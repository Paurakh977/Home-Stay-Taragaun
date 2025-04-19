"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'sonner';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { Loader2, User, Mail, Phone, Shield, Trash2, KeyRound, EyeOff, Eye } from 'lucide-react';

interface OfficerData {
  _id: string;
  username: string;
  email: string;
  contactNumber: string;
  isActive: boolean;
  permissions: Record<string, boolean>;
  parentAdmin?: string;
  createdAt: string;
}

export default function ManageOfficersPage() {
  const router = useRouter();
  const params = useParams();
  const adminUsername = params.adminUsername as string;
  
  const [loading, setLoading] = useState(true);
  const [officers, setOfficers] = useState<OfficerData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOfficer, setSelectedOfficer] = useState<OfficerData | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [resetPasswordConfirmOpen, setResetPasswordConfirmOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  
  useEffect(() => {
    fetchOfficers();
  }, [adminUsername]);
  
  const fetchOfficers = async () => {
    try {
      setLoading(true);
      
      const response = await fetch(`/api/admin/officer/list?adminUsername=${adminUsername}`);
      
      if (!response.ok) {
        if (response.status === 401) {
          toast.error('Authentication failed. Please log in again.');
          router.push(`/admin/${adminUsername}/login`);
          return;
        }
        throw new Error('Failed to fetch officers');
      }
      
      const data = await response.json();
      
      if (data.success && Array.isArray(data.officers)) {
        setOfficers(data.officers);
      } else {
        toast.error(data.message || 'Failed to load officers');
      }
    } catch (error) {
      console.error('Error fetching officers:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };
  
  const filteredOfficers = officers.filter(officer => {
    const searchLower = searchTerm.toLowerCase();
    return (
      officer.username.toLowerCase().includes(searchLower) ||
      officer.email.toLowerCase().includes(searchLower) ||
      officer.contactNumber.includes(searchTerm)
    );
  });
  
  const handleToggleStatus = async (officerId: string, currentStatus: boolean) => {
    try {
      setActionLoading(true);
      
      const response = await fetch('/api/admin/officer/update-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          officerId,
          isActive: !currentStatus,
          adminUsername,
        }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        toast.success(`Officer ${currentStatus ? 'deactivated' : 'activated'} successfully`);
        // Update officer in state
        setOfficers(prev => 
          prev.map(officer => 
            officer._id === officerId 
              ? { ...officer, isActive: !currentStatus } 
              : officer
          )
        );
      } else {
        toast.error(data.message || 'Failed to update officer status');
      }
    } catch (error) {
      console.error('Error updating officer status:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setActionLoading(false);
    }
  };
  
  const openDeleteConfirmation = (officer: OfficerData) => {
    setSelectedOfficer(officer);
    setDeleteConfirmOpen(true);
  };
  
  const closeDeleteConfirmation = () => {
    setDeleteConfirmOpen(false);
    setSelectedOfficer(null);
  };
  
  const handleDelete = async () => {
    if (!selectedOfficer) return;
    
    try {
      setActionLoading(true);
      
      const response = await fetch('/api/admin/officer/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          officerId: selectedOfficer._id,
          adminUsername,
          _method: 'DELETE',
        }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        toast.success('Officer deleted successfully');
        // Remove officer from state
        setOfficers(prev => prev.filter(officer => officer._id !== selectedOfficer._id));
        closeDeleteConfirmation();
      } else {
        toast.error(data.message || 'Failed to delete officer');
      }
    } catch (error) {
      console.error('Error deleting officer:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setActionLoading(false);
    }
  };
  
  const openResetPasswordConfirmation = (officer: OfficerData) => {
    setSelectedOfficer(officer);
    setResetPasswordConfirmOpen(true);
    // Generate a random password
    const randomPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).toUpperCase().slice(-4);
    setNewPassword(randomPassword);
  };
  
  const closeResetPasswordConfirmation = () => {
    setResetPasswordConfirmOpen(false);
    setSelectedOfficer(null);
    setNewPassword('');
  };
  
  const handleResetPassword = async () => {
    if (!selectedOfficer || !newPassword) return;
    
    try {
      setActionLoading(true);
      
      const response = await fetch('/api/admin/officer/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          officerId: selectedOfficer._id,
          newPassword,
          adminUsername,
        }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        toast.success('Password reset successfully');
        closeResetPasswordConfirmation();
      } else {
        toast.error(data.message || 'Failed to reset password');
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setActionLoading(false);
    }
  };
  
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
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Manage Officers</h1>
            <button
              onClick={() => router.push(`/admin/${adminUsername}/officer/create`)}
              className="text-sm px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
            >
              Create New Officer
            </button>
          </div>
          
          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <input
                type="text"
                placeholder="Search by username, email or contact number..."
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                value={searchTerm}
                onChange={handleSearch}
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>
          
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2 text-gray-600">Loading officers...</span>
            </div>
          ) : officers.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-6 text-center">
              <User className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-900">No Officers Found</h3>
              <p className="mt-1 text-sm text-gray-500">
                You haven't created any officers yet. Create your first officer to delegate administrative tasks.
              </p>
              <button
                onClick={() => router.push(`/admin/${adminUsername}/officer/create`)}
                className="mt-4 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
              >
                Create Officer
              </button>
            </div>
          ) : (
            <>
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Officer
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Contact
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Created On
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredOfficers.map((officer) => (
                        <tr key={officer._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                                <User className="h-5 w-5 text-primary" />
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{officer.username}</div>
                                <div className="text-sm text-gray-500 flex items-center">
                                  <Shield className="h-3 w-3 mr-1" />
                                  Officer
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 flex items-center">
                              <Mail className="h-4 w-4 mr-1 text-gray-400" />
                              {officer.email}
                            </div>
                            <div className="text-sm text-gray-500 flex items-center">
                              <Phone className="h-4 w-4 mr-1 text-gray-400" />
                              {officer.contactNumber}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(officer.createdAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                              ${officer.isActive 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'}`}>
                              {officer.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleToggleStatus(officer._id, officer.isActive)}
                                className={`${officer.isActive ? 'text-amber-600 hover:text-amber-900' : 'text-green-600 hover:text-green-900'}`}
                                title={officer.isActive ? 'Deactivate' : 'Activate'}
                                disabled={actionLoading}
                              >
                                {officer.isActive ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                              </button>
                              <button
                                onClick={() => openResetPasswordConfirmation(officer)}
                                className="text-blue-600 hover:text-blue-900"
                                title="Reset Password"
                                disabled={actionLoading}
                              >
                                <KeyRound className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() => openDeleteConfirmation(officer)}
                                className="text-red-600 hover:text-red-900"
                                title="Delete Officer"
                                disabled={actionLoading}
                              >
                                <Trash2 className="h-5 w-5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              
              {/* Pagination can be added here */}
            </>
          )}
        </div>
      </div>
      
      {/* Delete Confirmation Modal */}
      {deleteConfirmOpen && selectedOfficer && (
        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <Trash2 className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Delete Officer</h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Are you sure you want to delete the officer <span className="font-semibold">{selectedOfficer.username}</span>? This action cannot be undone.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={handleDelete}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm disabled:bg-gray-400"
                >
                  {actionLoading ? (
                    <>
                      <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                      Deleting...
                    </>
                  ) : 'Delete'}
                </button>
                <button
                  type="button"
                  onClick={closeDeleteConfirmation}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Reset Password Confirmation Modal */}
      {resetPasswordConfirmOpen && selectedOfficer && (
        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                    <KeyRound className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Reset Password</h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Are you sure you want to reset the password for <span className="font-semibold">{selectedOfficer.username}</span>?
                      </p>
                      <div className="mt-3">
                        <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">New Password</label>
                        <div className="mt-1 relative rounded-md shadow-sm">
                          <input
                            type="text"
                            id="newPassword"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md"
                          />
                        </div>
                        <p className="mt-1 text-xs text-gray-500">
                          Please save this password securely. You won't be able to see it again after closing this dialog.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  disabled={actionLoading || !newPassword}
                  onClick={handleResetPassword}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:bg-gray-400"
                >
                  {actionLoading ? (
                    <>
                      <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                      Resetting...
                    </>
                  ) : 'Reset Password'}
                </button>
                <button
                  type="button"
                  onClick={closeResetPasswordConfirmation}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 