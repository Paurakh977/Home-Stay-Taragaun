"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { HomeIcon, UserIcon, CalendarIcon, MapPinIcon, HomeModernIcon } from "lucide-react";

interface HomeStay {
  _id: string;
  homeStayName: string;
  villageName: string;
  province: string;
  district: string;
  municipality: string;
  homeStayType: string;
  status: string;
  createdAt: string;
}

export default function DashboardPage() {
  const [homestays, setHomestays] = useState<HomeStay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Fetch homestays
  useEffect(() => {
    const fetchHomestays = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`/api/homestays?page=${currentPage}&limit=10`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch homestays');
        }
        
        const data = await response.json();
        setHomestays(data.data);
        setTotalPages(data.pagination.totalPages);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        console.error('Error fetching homestays:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchHomestays();
  }, [currentPage]);
  
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  // Handle pagination
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };
  
  // Status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Homestay Dashboard</h1>
        
        {/* Error message */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
            <div className="flex">
              <div>
                <p className="text-red-700 font-medium">Error</p>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Homestay list */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : homestays.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <HomeModernIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No homestays found</h3>
            <p className="text-gray-600 mb-4">No homestays have been registered yet.</p>
            <Link href="/register">
              <button className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-dark transition">
                Register a Homestay
              </button>
            </Link>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white rounded-lg overflow-hidden shadow-md">
                <thead className="bg-gray-50 text-gray-700">
                  <tr>
                    <th className="py-3 px-4 text-left">Homestay</th>
                    <th className="py-3 px-4 text-left">Location</th>
                    <th className="py-3 px-4 text-left">Type</th>
                    <th className="py-3 px-4 text-left">Status</th>
                    <th className="py-3 px-4 text-left">Registered</th>
                    <th className="py-3 px-4 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {homestays.map((homestay) => (
                    <tr key={homestay._id} className="hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <HomeIcon className="h-5 w-5 text-gray-500 mr-2" />
                          <div>
                            <p className="font-medium text-gray-900">{homestay.homeStayName}</p>
                            <p className="text-sm text-gray-500">{homestay.villageName}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <MapPinIcon className="h-5 w-5 text-gray-500 mr-2" />
                          <div>
                            <p className="text-gray-900">{homestay.municipality}</p>
                            <p className="text-sm text-gray-500">{homestay.district}, {homestay.province}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {homestay.homeStayType === 'community' ? 'Community' : 'Private'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(homestay.status)}`}>
                          {homestay.status.charAt(0).toUpperCase() + homestay.status.slice(1)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <CalendarIcon className="h-5 w-5 text-gray-500 mr-2" />
                          <span className="text-gray-900">{formatDate(homestay.createdAt)}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Link href={`/homestays/${homestay._id}`}>
                          <button className="text-primary hover:text-primary-dark font-medium">
                            View
                          </button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-6">
                <nav className="flex items-center">
                  <button
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`mx-1 px-3 py-1 rounded ${
                      currentPage === 1
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Previous
                  </button>
                  
                  {[...Array(totalPages)].map((_, index) => (
                    <button
                      key={index + 1}
                      onClick={() => goToPage(index + 1)}
                      className={`mx-1 px-3 py-1 rounded ${
                        currentPage === index + 1
                          ? 'bg-primary text-white'
                          : 'bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {index + 1}
                    </button>
                  ))}
                  
                  <button
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`mx-1 px-3 py-1 rounded ${
                      currentPage === totalPages
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Next
                  </button>
                </nav>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
} 