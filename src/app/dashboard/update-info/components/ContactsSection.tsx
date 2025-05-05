import React from "react";
import { Plus, Trash2, User, Phone, Mail, Facebook, Instagram, Youtube, Twitter } from "lucide-react";

interface ContactInfo {
  _id?: string;
  name: string;
  mobile: string;
  email?: string;
  facebook?: string;
  youtube?: string;
  instagram?: string;
  tiktok?: string;
  twitter?: string;
}

interface OfficialInfo {
  _id?: string;
  name: string;
  role: string;
  contactNo: string;
}

interface ContactsSectionProps {
  formData: {
    contacts: ContactInfo[];
    officials: OfficialInfo[];
  };
  updateFormData: (data: any) => void;
  isEditing: boolean;
}

const ContactsSection: React.FC<ContactsSectionProps> = ({
  formData,
  updateFormData,
  isEditing
}) => {
  // Helper to validate phone numbers
  const isValidPhoneNumber = (phoneNumber: string): boolean => {
    const phoneRegex = /^\+977\d{10}$/;
    return phoneRegex.test(phoneNumber);
  };
  
  // Helper to validate email
  const isValidEmail = (email: string): boolean => {
    if (!email) return true; // Empty is valid since it's optional
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };
  
  // Helper to validate URLs
  const isValidUrl = (url: string): boolean => {
    if (!url) return true; // Empty is valid since it's optional
    try {
      new URL(url);
      return true;
    } catch (err) {
      return false;
    }
  };
  
  // Handle adding new contact
  const addContact = () => {
    const newContact: ContactInfo = {
      name: "",
      mobile: "+977",
      email: "",
      facebook: "",
      youtube: "",
      instagram: "",
      tiktok: "",
      twitter: ""
    };
    
    updateFormData({
      contacts: [...formData.contacts, newContact]
    });
  };
  
  // Handle adding new official
  const addOfficial = () => {
    const newOfficial: OfficialInfo = {
      name: "",
      role: "",
      contactNo: "+977"
    };
    
    updateFormData({
      officials: [...formData.officials, newOfficial]
    });
  };
  
  // Handle removing contact
  const removeContact = (index: number) => {
    const updatedContacts = [...formData.contacts];
    updatedContacts.splice(index, 1);
    updateFormData({ contacts: updatedContacts });
  };
  
  // Handle removing official
  const removeOfficial = (index: number) => {
    const updatedOfficials = [...formData.officials];
    updatedOfficials.splice(index, 1);
    updateFormData({ officials: updatedOfficials });
  };
  
  // Handle contact field changes
  const handleContactChange = (index: number, field: keyof ContactInfo, value: string) => {
    const updatedContacts = [...formData.contacts];
    updatedContacts[index] = {
      ...updatedContacts[index],
      [field]: value
    };
    updateFormData({ contacts: updatedContacts });
  };
  
  // Handle official field changes
  const handleOfficialChange = (index: number, field: keyof OfficialInfo, value: string) => {
    const updatedOfficials = [...formData.officials];
    updatedOfficials[index] = {
      ...updatedOfficials[index],
      [field]: value
    };
    updateFormData({ officials: updatedOfficials });
  };
  
  if (isEditing) {
    return (
      <div className="space-y-8">
        <div className="border-b border-gray-100 pb-5">
          <h3 className="text-lg font-medium leading-6 text-gray-900">Contact Information</h3>
          <p className="mt-1 text-sm text-gray-500">
            Manage contact details for your homestay
          </p>
        </div>
        
        {/* Officials */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="text-md font-medium text-gray-700">Homestay Officials</h4>
            <button
              type="button"
              onClick={addOfficial}
              className="text-sm flex items-center text-primary hover:text-primary-dark"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Official
            </button>
          </div>
          
          {formData.officials.length === 0 ? (
            <div className="bg-gray-50 p-4 rounded-md text-center text-gray-500">
              No officials added yet. Click "Add Official" to add one.
            </div>
          ) : (
            <div className="space-y-6">
              {formData.officials.map((official, index) => (
                <div key={official._id || index} className="border rounded-md p-4 relative">
                  <div className="absolute top-2 right-2">
                    <button
                      type="button"
                      onClick={() => removeOfficial(index)}
                      className="text-gray-400 hover:text-red-500"
                      aria-label="Remove official"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label htmlFor={`official-name-${index}`} className="block text-sm font-medium text-gray-700">
                        Name *
                      </label>
                      <input
                        type="text"
                        id={`official-name-${index}`}
                        value={official.name}
                        onChange={(e) => handleOfficialChange(index, 'name', e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2 border"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label htmlFor={`official-role-${index}`} className="block text-sm font-medium text-gray-700">
                        Role *
                      </label>
                      <input
                        type="text"
                        id={`official-role-${index}`}
                        value={official.role}
                        onChange={(e) => handleOfficialChange(index, 'role', e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2 border"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label htmlFor={`official-contact-${index}`} className="block text-sm font-medium text-gray-700">
                        Contact No. *
                      </label>
                      <input
                        type="tel"
                        id={`official-contact-${index}`}
                        value={official.contactNo}
                        onChange={(e) => handleOfficialChange(index, 'contactNo', e.target.value)}
                        className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2 border ${
                          official.contactNo && !isValidPhoneNumber(official.contactNo) ? 'border-red-300' : ''
                        }`}
                        placeholder="+977xxxxxxxxxx"
                        required
                      />
                      {official.contactNo && !isValidPhoneNumber(official.contactNo) && (
                        <p className="text-xs text-red-500 mt-1">
                          Phone number must be in format: +977 followed by 10 digits
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Contacts */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="text-md font-medium text-gray-700">Contact Information</h4>
            <button
              type="button"
              onClick={addContact}
              className="text-sm flex items-center text-primary hover:text-primary-dark"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Contact
            </button>
          </div>
          
          {formData.contacts.length === 0 ? (
            <div className="bg-gray-50 p-4 rounded-md text-center text-gray-500">
              No contacts added yet. Click "Add Contact" to add one.
            </div>
          ) : (
            <div className="space-y-6">
              {formData.contacts.map((contact, index) => (
                <div key={contact._id || index} className="border rounded-md p-4 relative">
                  <div className="absolute top-2 right-2">
                    <button
                      type="button"
                      onClick={() => removeContact(index)}
                      className="text-gray-400 hover:text-red-500"
                      aria-label="Remove contact"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor={`contact-name-${index}`} className="block text-sm font-medium text-gray-700">
                        Name *
                      </label>
                      <div className="flex">
                        <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500">
                          <User className="h-4 w-4" />
                        </span>
                        <input
                          type="text"
                          id={`contact-name-${index}`}
                          value={contact.name}
                          onChange={(e) => handleContactChange(index, 'name', e.target.value)}
                          className="flex-1 rounded-r-md border border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2"
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label htmlFor={`contact-mobile-${index}`} className="block text-sm font-medium text-gray-700">
                        Mobile *
                      </label>
                      <div className="flex">
                        <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500">
                          <Phone className="h-4 w-4" />
                        </span>
                        <input
                          type="tel"
                          id={`contact-mobile-${index}`}
                          value={contact.mobile}
                          onChange={(e) => handleContactChange(index, 'mobile', e.target.value)}
                          className={`flex-1 rounded-r-md border border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2 ${
                            contact.mobile && !isValidPhoneNumber(contact.mobile) ? 'border-red-300' : ''
                          }`}
                          placeholder="+977xxxxxxxxxx"
                          required
                        />
                      </div>
                      {contact.mobile && !isValidPhoneNumber(contact.mobile) && (
                        <p className="text-xs text-red-500 mt-1">
                          Phone number must be in format: +977 followed by 10 digits
                        </p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <label htmlFor={`contact-email-${index}`} className="block text-sm font-medium text-gray-700">
                        Email
                      </label>
                      <div className="flex">
                        <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500">
                          <Mail className="h-4 w-4" />
                        </span>
                        <input
                          type="email"
                          id={`contact-email-${index}`}
                          value={contact.email || ""}
                          onChange={(e) => handleContactChange(index, 'email', e.target.value)}
                          className={`flex-1 rounded-r-md border border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2 ${
                            contact.email && !isValidEmail(contact.email) ? 'border-red-300' : ''
                          }`}
                        />
                      </div>
                      {contact.email && !isValidEmail(contact.email) && (
                        <p className="text-xs text-red-500 mt-1">
                          Please enter a valid email address
                        </p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <label htmlFor={`contact-facebook-${index}`} className="block text-sm font-medium text-gray-700">
                        Facebook
                      </label>
                      <div className="flex">
                        <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500">
                          <Facebook className="h-4 w-4" />
                        </span>
                        <input
                          type="text"
                          id={`contact-facebook-${index}`}
                          value={contact.facebook || ""}
                          onChange={(e) => handleContactChange(index, 'facebook', e.target.value)}
                          className={`flex-1 rounded-r-md border border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2 ${
                            contact.facebook && !isValidUrl(contact.facebook) ? 'border-red-300' : ''
                          }`}
                          placeholder="https://facebook.com/..."
                        />
                      </div>
                      {contact.facebook && !isValidUrl(contact.facebook) && (
                        <p className="text-xs text-red-500 mt-1">
                          Please enter a valid URL (https://facebook.com/...)
                        </p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <label htmlFor={`contact-instagram-${index}`} className="block text-sm font-medium text-gray-700">
                        Instagram
                      </label>
                      <div className="flex">
                        <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500">
                          <Instagram className="h-4 w-4" />
                        </span>
                        <input
                          type="text"
                          id={`contact-instagram-${index}`}
                          value={contact.instagram || ""}
                          onChange={(e) => handleContactChange(index, 'instagram', e.target.value)}
                          className={`flex-1 rounded-r-md border border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2 ${
                            contact.instagram && !isValidUrl(contact.instagram) ? 'border-red-300' : ''
                          }`}
                          placeholder="https://instagram.com/..."
                        />
                      </div>
                      {contact.instagram && !isValidUrl(contact.instagram) && (
                        <p className="text-xs text-red-500 mt-1">
                          Please enter a valid URL (https://instagram.com/...)
                        </p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <label htmlFor={`contact-youtube-${index}`} className="block text-sm font-medium text-gray-700">
                        YouTube
                      </label>
                      <div className="flex">
                        <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500">
                          <Youtube className="h-4 w-4" />
                        </span>
                        <input
                          type="text"
                          id={`contact-youtube-${index}`}
                          value={contact.youtube || ""}
                          onChange={(e) => handleContactChange(index, 'youtube', e.target.value)}
                          className={`flex-1 rounded-r-md border border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2 ${
                            contact.youtube && !isValidUrl(contact.youtube) ? 'border-red-300' : ''
                          }`}
                          placeholder="https://youtube.com/c/..."
                        />
                      </div>
                      {contact.youtube && !isValidUrl(contact.youtube) && (
                        <p className="text-xs text-red-500 mt-1">
                          Please enter a valid URL (https://youtube.com/...)
                        </p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <label htmlFor={`contact-twitter-${index}`} className="block text-sm font-medium text-gray-700">
                        Twitter
                      </label>
                      <div className="flex">
                        <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500">
                          <Twitter className="h-4 w-4" />
                        </span>
                        <input
                          type="text"
                          id={`contact-twitter-${index}`}
                          value={contact.twitter || ""}
                          onChange={(e) => handleContactChange(index, 'twitter', e.target.value)}
                          className={`flex-1 rounded-r-md border border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2 ${
                            contact.twitter && !isValidUrl(contact.twitter) ? 'border-red-300' : ''
                          }`}
                          placeholder="https://twitter.com/..."
                        />
                      </div>
                      {contact.twitter && !isValidUrl(contact.twitter) && (
                        <p className="text-xs text-red-500 mt-1">
                          Please enter a valid URL (https://twitter.com/...)
                        </p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <label htmlFor={`contact-tiktok-${index}`} className="block text-sm font-medium text-gray-700">
                        TikTok
                      </label>
                      <div className="flex">
                        <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                          </svg>
                        </span>
                        <input
                          type="text"
                          id={`contact-tiktok-${index}`}
                          value={contact.tiktok || ""}
                          onChange={(e) => handleContactChange(index, 'tiktok', e.target.value)}
                          className={`flex-1 rounded-r-md border border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2 ${
                            contact.tiktok && !isValidUrl(contact.tiktok) ? 'border-red-300' : ''
                          }`}
                          placeholder="https://tiktok.com/@..."
                        />
                      </div>
                      {contact.tiktok && !isValidUrl(contact.tiktok) && (
                        <p className="text-xs text-red-500 mt-1">
                          Please enter a valid URL (https://tiktok.com/@...)
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }
  
  // Read-only view
  return (
    <div className="space-y-8">
      <div className="border-b border-gray-100 pb-5">
        <h3 className="text-lg font-medium leading-6 text-gray-900">Contact Information</h3>
        <p className="mt-1 text-sm text-gray-500">
          Contact details for your homestay
        </p>
      </div>
      
      {/* Officials */}
      {formData.officials.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-md font-medium text-gray-700">Homestay Officials</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {formData.officials.map((official, index) => (
              <div key={official._id || index} className="bg-white p-4 border rounded-md shadow-sm">
                <div className="flex flex-col space-y-2">
                  <div className="font-medium text-gray-900">{official.name}</div>
                  <div className="text-sm text-gray-500">{official.role}</div>
                  <div className="text-sm text-gray-700 flex items-center">
                    <Phone className="h-4 w-4 mr-2 text-gray-400" />
                    {official.contactNo}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Contacts */}
      {formData.contacts.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-md font-medium text-gray-700">Contact Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {formData.contacts.map((contact, index) => (
              <div key={contact._id || index} className="bg-white p-4 border rounded-md shadow-sm">
                <div className="flex flex-col space-y-3">
                  <div className="font-medium text-gray-900">{contact.name}</div>
                  
                  <div className="text-sm text-gray-700 flex items-center">
                    <Phone className="h-4 w-4 mr-2 text-gray-400" />
                    {contact.mobile}
                  </div>
                  
                  {contact.email && (
                    <div className="text-sm text-gray-700 flex items-center">
                      <Mail className="h-4 w-4 mr-2 text-gray-400" />
                      {contact.email}
                    </div>
                  )}
                  
                  <div className="flex flex-wrap gap-3 mt-2">
                    {contact.facebook && (
                      <a 
                        href={contact.facebook}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Facebook className="h-5 w-5" />
                      </a>
                    )}
                    
                    {contact.instagram && (
                      <a 
                        href={contact.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-pink-600 hover:text-pink-800"
                      >
                        <Instagram className="h-5 w-5" />
                      </a>
                    )}
                    
                    {contact.youtube && (
                      <a 
                        href={contact.youtube}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-red-600 hover:text-red-800"
                      >
                        <Youtube className="h-5 w-5" />
                      </a>
                    )}
                    
                    {contact.twitter && (
                      <a 
                        href={contact.twitter}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-600"
                      >
                        <Twitter className="h-5 w-5" />
                      </a>
                    )}

                    {contact.tiktok && (
                      <a 
                        href={contact.tiktok}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-black hover:text-gray-800"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                        </svg>
                      </a>
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
};

export default ContactsSection; 