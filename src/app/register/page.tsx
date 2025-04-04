"use client";

import { useState, useEffect } from "react";
import { FormButton } from "@/components/ui/form-button";
import { X, Save } from "lucide-react";
import Link from "next/link";

// Form steps components
import HomeStayIntroduction from "@/app/register/components/HomeStayIntroduction";
import WayToHomeStay from "./components/WayToHomeStay";
import CommitteeOfficials from "./components/CommitteeOfficials";
import AddressDetails from "./components/AddressDetails";
import HomestayFeaturesForm from "./components/HomestayFeaturesForm";
import ContactInfo from "./components/ContactInfo";

// Form data type
type FormData = {
  // Page 1
  homeStayName: string;
  villageName: string;
  homeCount: number;
  roomCount: number;
  bedCount: number;
  homeStayType: string;
  
  // Page 2 (empty for now)
  
  // Page 3
  officials: {
    name: string;
    role: string;
    contactNo: string;
  }[];

  // Page 4 - Address
  province: string;
  district: string;
  municipality: string;
  ward: string;
  city: string;
  tole: string;

  // Page 5 - Homestay Features
  localAttractions: string[];
  tourismServices: string[];
  infrastructure: string[];
  
  // Page 6 - Contact Information
  contacts: {
    name: string;
    mobile: string;
    facebook: string;
    email: string;
    youtube: string;
    instagram: string;
    tiktok: string;
    twitter: string;
  }[];
};

export default function RegisterPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    homeStayName: "",
    villageName: "",
    homeCount: 1,
    roomCount: 1,
    bedCount: 1,
    homeStayType: "community", // Default to community
    officials: [{ name: "", role: "", contactNo: "+977" }],
    province: "",
    district: "",
    municipality: "",
    ward: "",
    city: "",
    tole: "",
    localAttractions: [],
    tourismServices: [],
    infrastructure: [],
    contacts: [{ 
      name: "", 
      mobile: "+977", 
      facebook: "", 
      email: "",
      youtube: "",
      instagram: "",
      tiktok: "",
      twitter: ""
    }]
  });

  // Load form data from localStorage on initial render
  useEffect(() => {
    const savedData = localStorage.getItem("homeStayRegistrationForm");
    if (savedData) {
      try {
       setFormData(JSON.parse(savedData));
      } catch {
        console.error("Failed to parse saved form data");
      }
    }
  }, []);

  // Save form data to localStorage
  const saveFormData = () => {
    try {
      // Use a replacer function to catch any circular references
      const stringified = JSON.stringify(formData, (key, value) => {
        // Convert undefined to null to avoid issues
        if (value === undefined) return null;
        return value;
      });
      
      localStorage.setItem("homeStayRegistrationForm", stringified);
      
      // Show success notification
      const notification = document.createElement('div');
      notification.className = 'fixed top-4 right-4 bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded shadow-md z-50';
      notification.innerHTML = `
        <div class="flex items-center">
          <div class="py-1"><svg class="h-6 w-6 text-green-500 mr-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg></div>
          <div>
            <p class="font-bold">Success</p>
            <p class="text-sm">Form data saved successfully.</p>
          </div>
        </div>
      `;
      
      document.body.appendChild(notification);
      
      // Remove notification after 3 seconds
      setTimeout(() => {
        notification.remove();
      }, 3000);
      
    } catch (e) {
      console.error("Failed to save form data", e);
      alert("Failed to save form data. Please try again.");
    }
  };
  
  // Handle next step
  const handleNext = () => {
    if (currentStep < 6) {
      setCurrentStep(currentStep + 1);
    } else {
      // Form is complete - submit data
      alert("Form submitted successfully!");
      
      // You would typically send the data to your server here
      console.log("Form submitted:", formData);
      
      // Clear form data from localStorage
      localStorage.removeItem("homeStayRegistrationForm");
      
      // Redirect to homepage or confirmation page
      window.location.href = "/";
    }
  };
  
  // Handle previous step
  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  // Handle form data changes
  const updateFormData = (newData: Partial<FormData>) => {
    setFormData(prevData => ({ ...prevData, ...newData }));
  };
  
  // Render the current step
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <HomeStayIntroduction formData={formData} updateFormData={updateFormData} />;
      case 2:
        return <WayToHomeStay />;
      case 3:
        return <CommitteeOfficials formData={formData} updateFormData={updateFormData} />;
      case 4:
        return <AddressDetails formData={formData} updateFormData={updateFormData} />;
      case 5:
        // Fix: Create a stable reference to the arrays to prevent unnecessary re-renders
        const featuresFormData = {
          localAttractions: formData.localAttractions || [],
          tourismServices: formData.tourismServices || [],
          infrastructure: formData.infrastructure || []
        };
        return <HomestayFeaturesForm 
          formData={featuresFormData}
          updateFormData={updateFormData} 
        />;
      case 6:
        // Fix: Create a stable reference for contacts
        const contactsFormData = {
          contacts: formData.contacts || []
        };
        return <ContactInfo
          formData={contactsFormData}
          updateFormData={updateFormData}
        />;
      default:
        return <HomeStayIntroduction formData={formData} updateFormData={updateFormData} />;
    }
  };
  
  // Get step title
  const getStepTitle = () => {
    switch (currentStep) {
      case 1:
        return "Home stay's introduction/होमस्टेको परिचय";
      case 2:
        return "Way to home stay/होमस्टे गाउँ कसरी पुग्ने (पहुँच)/साधन";
      case 3:
        return "Names of the officials of the Homestay Management Committee/होमस्टे व्यवस्थापन समितिका पदाधिकारीहरुको नाम";
      case 4:
        return "Address Details/ठेगाना विवरण";
      case 5:
        return "Homestay Features and Attractions / होमस्टे सुविधा र आकर्षणहरू";
      case 6:
        return "Contact Information / सम्पर्क जानकारी";
      default:
        return "";
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-md overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-gray-50 border-b flex justify-between items-center">
          <h1 className="text-xl font-semibold text-gray-900">Register Your Home Stay</h1>
          <div className="flex gap-2">
            <FormButton 
              variant="save" 
              size="sm" 
              onClick={saveFormData}
              className="flex items-center gap-1"
            >
              <Save className="h-4 w-4" />
              Save
            </FormButton>
            <Link href="/">
              <FormButton 
                variant="dismiss" 
                size="sm"
                className="flex items-center gap-1"
              >
                <X className="h-4 w-4" />
                Dismiss
              </FormButton>
            </Link>
          </div>
        </div>
        
        {/* Progress indicator */}
        <div className="px-6 py-4 border-b">
          <div className="flex justify-between">
            {[1, 2, 3, 4, 5, 6].map((step) => (
              <div key={step} className="flex flex-col items-center">
                <div 
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-medium ${
                    step === currentStep 
                      ? 'bg-primary text-white' 
                      : step < currentStep 
                        ? 'bg-green-500 text-white' 
                        : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {step}
                </div>
                <span className="text-xs mt-1 text-gray-500">Step {step}</span>
              </div>
            ))}
          </div>
          <div className="relative mt-2">
            <div className="absolute top-0 left-0 h-1 bg-gray-200 w-full"></div>
            <div 
              className="absolute top-0 left-0 h-1 bg-primary transition-all duration-300"
              style={{ width: `${(currentStep / 6) * 100}%` }}
            ></div>
          </div>
        </div>
        
        {/* Form title */}
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-medium text-gray-900">{getStepTitle()}</h2>
        </div>

        {/* Form content */}
        <div className="px-6 py-6">
          {renderStep()}
        </div>
        
        {/* Navigation buttons */}
        <div className="px-6 py-4 bg-gray-50 border-t flex justify-between">
          <FormButton
            variant="navigation"
            size="default"
            onClick={handlePrevious}
            disabled={currentStep === 1}
          >
            ← Previous
          </FormButton>
          
          {currentStep === 6 ? (
            <button
              type="button"
              onClick={handleNext}
              disabled={formData.contacts && formData.contacts.some(c => !c.name || !c.mobile)}
              style={{
                backgroundColor: '#1877F2',
                color: 'white',
                padding: '8px 16px',
                borderRadius: '6px',
                border: 'none',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                height: '40px',
                minWidth: '80px'
              }}
              onMouseOver={(e) => {e.currentTarget.style.backgroundColor = '#166FE5'}}
              onMouseOut={(e) => {e.currentTarget.style.backgroundColor = '#1877F2'}}
            >
              Submit
            </button>
          ) : (
            <FormButton
              variant="navigation"
              size="default"
              onClick={handleNext}
            >
              Next →
            </FormButton>
          )}
        </div>
      </div>
    </div>
  );
} 