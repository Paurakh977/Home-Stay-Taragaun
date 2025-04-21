'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface RegistrationFormProps {
  adminUsername: string;
}

export default function RegistrationForm({ adminUsername }: RegistrationFormProps) {
  const [formData, setFormData] = useState({
    homeStayName: '',
    villageName: '',
    homeCount: 1,
    roomCount: 1,
    bedCount: 1,
    homeStayType: 'private',
    province: '',
    district: '',
    municipality: '',
    ward: '',
    city: '',
    tole: '',
    officials: [{ name: '', role: '', contactNo: '', gender: 'male' }],
    contacts: [{ name: '', mobile: '', email: '' }],
    localAttractions: [],
    tourismServices: [],
    infrastructure: []
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };
  
  const handleOfficialChange = (index: number, field: string, value: string) => {
    const updatedOfficials = [...formData.officials];
    updatedOfficials[index] = { ...updatedOfficials[index], [field]: value };
    setFormData({ ...formData, officials: updatedOfficials });
  };
  
  const addOfficial = () => {
    setFormData({
      ...formData,
      officials: [...formData.officials, { name: '', role: '', contactNo: '', gender: 'male' }]
    });
  };
  
  const handleContactChange = (index: number, field: string, value: string) => {
    const updatedContacts = [...formData.contacts];
    updatedContacts[index] = { ...updatedContacts[index], [field]: value };
    setFormData({ ...formData, contacts: updatedContacts });
  };
  
  const addContact = () => {
    setFormData({
      ...formData,
      contacts: [...formData.contacts, { name: '', mobile: '', email: '' }]
    });
  };
  
  const handleFeatureChange = (e: React.ChangeEvent<HTMLInputElement>, category: 'localAttractions' | 'tourismServices' | 'infrastructure') => {
    const { value } = e.target;
    const features = value.split(',').map(item => item.trim()).filter(Boolean);
    setFormData({ ...formData, [category]: features });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    // Simple validation
    if (!formData.homeStayName || !formData.villageName || !formData.province || !formData.district) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/homestays', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          adminUsername // Include admin username in registration data
        }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        toast.success('Registration successful!');
        
        // Show credentials to user
        toast.info(`Your Homestay ID: ${data.homestayId}`);
        toast.info(`Your Password: ${data.password}`);
        
        // Redirect to login page after 3 seconds
        setTimeout(() => {
          router.push(`/${adminUsername}/login`);
        }, 3000);
      } else {
        toast.error(data.error || 'Registration failed');
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.');
      console.error('Registration error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-blue-50 p-4 rounded-lg mb-6">
        <h2 className="text-xl font-semibold text-blue-800 mb-2">Basic Information</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="homeStayName" className="block text-sm font-medium text-gray-700 mb-1">
              Homestay Name*
            </label>
            <input
              id="homeStayName"
              name="homeStayName"
              type="text"
              value={formData.homeStayName}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>
          
          <div>
            <label htmlFor="villageName" className="block text-sm font-medium text-gray-700 mb-1">
              Village Name*
            </label>
            <input
              id="villageName"
              name="villageName"
              type="text"
              value={formData.villageName}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>
          
          <div>
            <label htmlFor="homeCount" className="block text-sm font-medium text-gray-700 mb-1">
              Number of Homes*
            </label>
            <input
              id="homeCount"
              name="homeCount"
              type="number"
              min="1"
              value={formData.homeCount}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>
          
          <div>
            <label htmlFor="roomCount" className="block text-sm font-medium text-gray-700 mb-1">
              Number of Rooms*
            </label>
            <input
              id="roomCount"
              name="roomCount"
              type="number"
              min="1"
              value={formData.roomCount}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>
          
          <div>
            <label htmlFor="bedCount" className="block text-sm font-medium text-gray-700 mb-1">
              Number of Beds*
            </label>
            <input
              id="bedCount"
              name="bedCount"
              type="number"
              min="1"
              value={formData.bedCount}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>
          
          <div>
            <label htmlFor="homeStayType" className="block text-sm font-medium text-gray-700 mb-1">
              Homestay Type*
            </label>
            <select
              id="homeStayType"
              name="homeStayType"
              value={formData.homeStayType}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            >
              <option value="private">Private</option>
              <option value="community">Community</option>
            </select>
          </div>
        </div>
      </div>
      
      <div className="bg-green-50 p-4 rounded-lg">
        <h2 className="text-xl font-semibold text-green-800 mb-2">Location Information</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="province" className="block text-sm font-medium text-gray-700 mb-1">
              Province*
            </label>
            <input
              id="province"
              name="province"
              type="text"
              value={formData.province}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>
          
          <div>
            <label htmlFor="district" className="block text-sm font-medium text-gray-700 mb-1">
              District*
            </label>
            <input
              id="district"
              name="district"
              type="text"
              value={formData.district}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>
          
          <div>
            <label htmlFor="municipality" className="block text-sm font-medium text-gray-700 mb-1">
              Municipality*
            </label>
            <input
              id="municipality"
              name="municipality"
              type="text"
              value={formData.municipality}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>
          
          <div>
            <label htmlFor="ward" className="block text-sm font-medium text-gray-700 mb-1">
              Ward*
            </label>
            <input
              id="ward"
              name="ward"
              type="text"
              value={formData.ward}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>
          
          <div>
            <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
              City/Town*
            </label>
            <input
              id="city"
              name="city"
              type="text"
              value={formData.city}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>
          
          <div>
            <label htmlFor="tole" className="block text-sm font-medium text-gray-700 mb-1">
              Tole/Street*
            </label>
            <input
              id="tole"
              name="tole"
              type="text"
              value={formData.tole}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>
        </div>
      </div>
      
      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
      >
        {isLoading ? 'Registering...' : 'Register Homestay'}
      </button>
    </form>
  );
} 