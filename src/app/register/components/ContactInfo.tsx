"use client";

import React from "react";

// Contact person type
type Contact = {
  name: string;
  mobile: string;
  facebook: string;
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
        { name: "", mobile: "+977", facebook: "", email: "" }
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
        contacts: [{ name: "", mobile: "+977", facebook: "", email: "" }]
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
          
          {/* Facebook Page */}
          <div>
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