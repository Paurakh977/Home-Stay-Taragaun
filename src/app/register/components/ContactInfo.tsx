"use client";

import React from "react";

// Contact person type
type Contact = {
  name: string;
  mobile: string;
  facebook: string;
  youtube: string;
  instagram: string;
  tiktok: string;
  twitter: string;
  email: string;
};

interface ContactFormData {
  contacts: Contact[];
}

type ContactInfoProps = {
  formData: ContactFormData;
  updateFormData: (data: Partial<ContactFormData>) => void;
};

const ContactInfo: React.FC<ContactInfoProps> = ({ formData, updateFormData }) => {
  // Add a new empty contact
  const handleAddContact = () => {
    updateFormData({
      contacts: [
        ...(formData.contacts || []),
        { name: "", mobile: "+977", facebook: "", youtube: "", instagram: "", tiktok: "", twitter: "", email: "" }
      ]
    });
  };

  // Remove a contact at specified index
  const handleRemoveContact = (index: number) => {
    // Don't allow removing the last contact
    if ((formData.contacts || []).length <= 1) return;

    updateFormData({
      contacts: (formData.contacts || []).filter((_, i) => i !== index)
    });
  };

  // Update a specific field of a contact
  const handleContactChange = (index: number, field: keyof Contact, value: string) => {
    const updatedContacts = [...(formData.contacts || [])];
    updatedContacts[index] = {
      ...updatedContacts[index],
      [field]: value
    };

    updateFormData({ contacts: updatedContacts });
  };

  // Ensure at least one contact exists
  React.useEffect(() => {
    if (!formData.contacts || formData.contacts.length === 0) {
      updateFormData({
        contacts: [{ name: "", mobile: "+977", facebook: "", youtube: "", instagram: "", tiktok: "", twitter: "", email: "" }]
      });
    }
  }, [formData.contacts, updateFormData]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-md font-medium text-gray-800">
          Contact Information / सम्पर्क जानकारी
        </h3>
        <button
          type="button"
          onClick={handleAddContact}
          className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
        >
          Add Contact / सम्पर्क थप्नुहोस्
        </button>
      </div>

      {(formData.contacts || []).map((contact, index) => (
        <div key={index} className="p-4 border border-gray-200 rounded-md space-y-4">
          <div className="flex justify-between items-center border-b pb-2 mb-2">
            <h4 className="font-medium">Contact #{index + 1}</h4>
            {(formData.contacts || []).length > 1 && (
              <button
                type="button"
                onClick={() => handleRemoveContact(index)}
                className="text-red-500 hover:text-red-700"
              >
                Remove / हटाउनुहोस्
              </button>
            )}
          </div>
          
          {/* Contact Name */}
          <div>
            <label htmlFor={`contact-name-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
              Contact Person Name / सम्पर्क व्यक्तिको नाम
            </label>
            <input
              type="text"
              id={`contact-name-${index}`}
              value={contact.name}
              onChange={(e) => handleContactChange(index, "name", e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
              required
            />
          </div>
          
          {/* Mobile Number */}
          <div>
            <label htmlFor={`contact-mobile-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
              Mobile No. / मोबाइल नं.
            </label>
            <input
              type="tel"
              id={`contact-mobile-${index}`}
              value={contact.mobile}
              onChange={(e) => handleContactChange(index, "mobile", e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
              required
              placeholder="+977 98XXXXXXXX"
            />
          </div>
          
          {/* Social Media Section */}
          <div className="border-t border-gray-200 pt-3 mt-3">
            <h5 className="text-sm font-medium text-gray-700 mb-3">Social Media / सामाजिक संजाल</h5>
            
            {/* Facebook Page */}
            <div className="mb-3">
              <label htmlFor={`contact-facebook-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
                Facebook Page / फेसबुक पेज
              </label>
              <input
                type="text"
                id={`contact-facebook-${index}`}
                value={contact.facebook}
                onChange={(e) => handleContactChange(index, "facebook", e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                placeholder="https://facebook.com/your-page"
              />
            </div>
            
            {/* YouTube Channel */}
            <div className="mb-3">
              <label htmlFor={`contact-youtube-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
                YouTube Channel / युट्युब च्यानल
              </label>
              <input
                type="text"
                id={`contact-youtube-${index}`}
                value={contact.youtube}
                onChange={(e) => handleContactChange(index, "youtube", e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                placeholder="https://youtube.com/@channel"
              />
            </div>
            
            {/* Instagram */}
            <div className="mb-3">
              <label htmlFor={`contact-instagram-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
                Instagram / इन्स्टाग्राम
              </label>
              <input
                type="text"
                id={`contact-instagram-${index}`}
                value={contact.instagram}
                onChange={(e) => handleContactChange(index, "instagram", e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                placeholder="https://instagram.com/username"
              />
            </div>
            
            {/* TikTok */}
            <div className="mb-3">
              <label htmlFor={`contact-tiktok-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
                TikTok / टिकटक
              </label>
              <input
                type="text"
                id={`contact-tiktok-${index}`}
                value={contact.tiktok}
                onChange={(e) => handleContactChange(index, "tiktok", e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                placeholder="https://tiktok.com/@username"
              />
            </div>
            
            {/* Twitter */}
            <div className="mb-3">
              <label htmlFor={`contact-twitter-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
                Twitter / ट्विटर
              </label>
              <input
                type="text"
                id={`contact-twitter-${index}`}
                value={contact.twitter}
                onChange={(e) => handleContactChange(index, "twitter", e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                placeholder="https://twitter.com/username"
              />
            </div>
          </div>
          
          {/* Email */}
          <div>
            <label htmlFor={`contact-email-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
              Email / इमेल
            </label>
            <input
              type="email"
              id={`contact-email-${index}`}
              value={contact.email}
              onChange={(e) => handleContactChange(index, "email", e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
              placeholder="example@email.com"
            />
          </div>
        </div>
      ))}
    </div>
  );
};

export default ContactInfo; 