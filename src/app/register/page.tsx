"use client";

import { useState, useEffect } from "react";
import { FormButton } from "@/components/ui/form-button";
import { X, Save, Check, Copy, Info } from "lucide-react";
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
  
  // Page 2 (WayToHomeStay)
  directions?: string; // Optional written directions
  
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
    facebook?: string;
    email?: string;
    youtube?: string;
    instagram?: string;
    tiktok?: string;
    twitter?: string;
  }[];
};

// Registration success data
type RegistrationSuccess = {
  homestayId: string;
  password: string;
};

export default function RegisterPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [showValidationErrors, setShowValidationErrors] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [registrationSuccess, setRegistrationSuccess] = useState<RegistrationSuccess | null>(null);
  const [formData, setFormData] = useState<FormData>({
    homeStayName: "",
    villageName: "",
    homeCount: 1,
    roomCount: 1,
    bedCount: 1,
    homeStayType: "community", // Default to community
    directions: "", // Initialize directions as empty string
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
  
  // Validate form data before submission
  const validateForm = () => {
    const errors: string[] = [];
    
    // Helper to validate phone numbers
    const isValidPhoneNumber = (phoneNumber: string): boolean => {
      const phoneRegex = /^\+977\d{10}$/;
      return phoneRegex.test(phoneNumber);
    };
    
    // Check home stay introduction (step 1)
    if (!formData.homeStayName) errors.push("Home Stay Name is required");
    if (!formData.villageName) errors.push("Village Name is required");
    if (formData.homeCount < 1) errors.push("Home Count must be at least 1");
    if (formData.roomCount < 1) errors.push("Room Count must be at least 1");
    if (formData.bedCount < 1) errors.push("Bed Count must be at least 1");
    
    // Committee Officials (step 3)
    const hasCompleteOfficial = formData.officials.some(
      official => official.name && official.role && official.contactNo && isValidPhoneNumber(official.contactNo)
    );
    if (!hasCompleteOfficial) {
      errors.push("At least one official with complete and valid information is required");
    }
    
    // Check if any official has an invalid phone number format
    const invalidOfficialPhones = formData.officials.some(
      official => official.contactNo && official.contactNo !== "+977" && !isValidPhoneNumber(official.contactNo)
    );
    if (invalidOfficialPhones) {
      errors.push("One or more officials have invalid phone numbers (must be +977 followed by 10 digits)");
    }
    
    // Address Details (step 4)
    if (!formData.province) errors.push("Province is required");
    if (!formData.district) errors.push("District is required");
    if (!formData.municipality) errors.push("Municipality is required");
    if (!formData.ward) errors.push("Ward is required");
    if (!formData.city) errors.push("City is required");
    if (!formData.tole) errors.push("Tole is required");
    
    // Homestay Features (step 5)
    if (!formData.localAttractions?.length) errors.push("At least one Local Attraction is required");
    if (!formData.tourismServices?.length) errors.push("At least one Tourism Service is required");
    if (!formData.infrastructure?.length) errors.push("At least one Infrastructure item is required");
    
    // Contact Information (step 6)
    const hasCompleteContact = formData.contacts?.some(
      contact => contact.name && contact.mobile && isValidPhoneNumber(contact.mobile)
    );
    if (!hasCompleteContact) {
      errors.push("At least one contact with name and valid mobile number is required");
    }
    
    // Check if any contact has an invalid phone number format
    const invalidContactPhones = formData.contacts?.some(
      contact => contact.mobile && contact.mobile !== "+977" && !isValidPhoneNumber(contact.mobile)
    );
    if (invalidContactPhones) {
      errors.push("One or more contacts have invalid phone numbers (must be +977 followed by 10 digits)");
    }
    
    setValidationErrors(errors);
    return errors.length === 0;
  };

  // Handle previous step
  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setShowValidationErrors(false);
    }
  };

  // Handle next step
  const handleNext = () => {
    if (currentStep < 6) {
      setCurrentStep(currentStep + 1);
      setShowValidationErrors(false);
    } else {
      // Validate all form data before submission
      if (validateForm()) {
        // Form is complete - submit data
        submitForm();
      } else {
        // Show validation errors
        setShowValidationErrors(true);
        
        // Scroll to top to show errors
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  // Copy text to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    
    // Show a notification
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 rounded shadow-md z-50';
    notification.innerHTML = `
      <div class="flex items-center">
        <div class="py-1"><svg class="h-6 w-6 text-blue-500 mr-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg></div>
        <div>
          <p class="font-bold">Copied to clipboard</p>
        </div>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 2000);
  };

  // Submit form to database
  const submitForm = async () => {
    try {
      setIsSubmitting(true);
      setSubmitError(null);
      
      console.log('Submitting form data...');
      
      const response = await fetch('/api/homestays', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      // Check if the response is ok before trying to parse JSON
      if (!response.ok) {
        let errorMessage = `Server error (${response.status})`;
        
        // Try to parse error JSON but don't fail if it's not valid JSON
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (jsonError) {
          console.error('Could not parse error response:', jsonError);
        }
        
        throw new Error(errorMessage);
      }
      
      // Now we know the response is ok, try to parse it
      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error('Could not parse successful response:', jsonError);
        throw new Error('Invalid response from server. Please try again.');
      }
      
      // Clear form data from localStorage
      localStorage.removeItem("homeStayRegistrationForm");
      
      // Store credentials for display
      setRegistrationSuccess({
        homestayId: data.homestayId,
        password: data.password
      });
      
    } catch (error) {
      console.error('Form submission error:', error);
      setSubmitError(error instanceof Error ? error.message : 'An unknown error occurred');
      setShowValidationErrors(true);
      
      // Scroll to top to show errors
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update form data
  const updateFormData = (data: Partial<FormData>) => {
    setFormData(prev => ({ ...prev, ...data }));
  };

  // Render appropriate step component
  const renderStep = () => {
    // If registration was successful, show success screen
    if (registrationSuccess) {
      return (
        <div className="text-center py-8 space-y-6">
          <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
            <Check className="w-10 h-10 text-green-600" />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-800">Registration Successful!</h2>
          <p className="text-gray-600 max-w-md mx-auto">
            Your homestay has been registered successfully. Please save your login credentials below:
          </p>
          
          <div className="bg-blue-50 border border-blue-200 rounded-md p-6 max-w-md mx-auto">
            <div className="flex items-start mb-2">
              <Info className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
              <p className="text-sm text-blue-700 text-left">
                Please save these credentials in a secure place. You will need them to log in to your homestay portal.
              </p>
            </div>
            
            <div className="space-y-4 mt-4">
              <div className="bg-white rounded-md p-3 border border-gray-200">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-500">Homestay ID</p>
                    <p className="font-mono font-medium">{registrationSuccess.homestayId}</p>
                  </div>
                  <button 
                    onClick={() => copyToClipboard(registrationSuccess.homestayId)}
                    className="p-2 text-gray-500 hover:text-blue-500 hover:bg-blue-50 rounded-md"
                  >
                    <Copy className="h-5 w-5" />
                  </button>
                </div>
              </div>
              
              <div className="bg-white rounded-md p-3 border border-gray-200">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-500">Password</p>
                    <p className="font-mono font-medium">{registrationSuccess.password}</p>
                  </div>
                  <button 
                    onClick={() => copyToClipboard(registrationSuccess.password)}
                    className="p-2 text-gray-500 hover:text-blue-500 hover:bg-blue-50 rounded-md"
                  >
                    <Copy className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <div className="pt-4">
            <div className="flex justify-center space-x-4">
              <Link href="/">
                <button 
                  className="mt-4 px-6 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Return to Home Page
                </button>
              </Link>
              <Link href="/login">
                <button 
                  className="mt-4 px-6 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors"
                >
                  Login Now
                </button>
              </Link>
            </div>
          </div>
        </div>
      );
    }
    
    // Otherwise show form steps
    switch (currentStep) {
      case 1:
        return <HomeStayIntroduction formData={formData} updateFormData={updateFormData} />;
      case 2:
        return <WayToHomeStay formData={formData} updateFormData={updateFormData} />;
      case 3:
        return <CommitteeOfficials formData={formData} updateFormData={updateFormData} />;
      case 4:
        return <AddressDetails formData={formData} updateFormData={updateFormData} />;
      case 5:
        return <HomestayFeaturesForm formData={formData} updateFormData={updateFormData} />;
      case 6:
        return <ContactInfo 
          formData={formData} 
          updateFormData={updateFormData}
        />;
      default:
        return <HomeStayIntroduction formData={formData} updateFormData={updateFormData} />;
    }
  };
  
  // Get step title
  const getStepTitle = () => {
    if (registrationSuccess) {
      return "Registration Complete";
    }
    
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
          {!registrationSuccess && (
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
          )}
        </div>
        
        {/* Validation and Submission Errors */}
        {!registrationSuccess && ((showValidationErrors && validationErrors.length > 0) || submitError) && (
          <div className="px-6 py-4 bg-red-50 border-b border-red-200">
            {submitError && (
              <div className="mb-3">
                <h3 className="text-red-700 font-medium">Submission Error:</h3>
                <p className="text-red-600">{submitError}</p>
              </div>
            )}
            
            {showValidationErrors && validationErrors.length > 0 && (
              <>
                <h3 className="text-red-700 font-medium mb-2">Please fix the following errors before submitting:</h3>
                <ul className="list-disc list-inside text-red-600 text-sm">
                  {validationErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </>
            )}
          </div>
        )}
        
        {/* Progress indicator (hide on success) */}
        {!registrationSuccess && (
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
        )}
        
        {/* Form title */}
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-medium text-gray-900">{getStepTitle()}</h2>
        </div>

        {/* Form content */}
        <div className="px-6 py-6">
          {renderStep()}
        </div>
        
        {/* Navigation buttons (hide on success) */}
        {!registrationSuccess && (
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
                disabled={isSubmitting}
                style={{
                  backgroundColor: isSubmitting ? '#ccc' : '#1877F2',
                  color: 'white',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  height: '40px',
                  minWidth: '80px'
                }}
                onMouseOver={(e) => {if (!isSubmitting) e.currentTarget.style.backgroundColor = '#166FE5'}}
                onMouseOut={(e) => {if (!isSubmitting) e.currentTarget.style.backgroundColor = '#1877F2'}}
              >
                {isSubmitting ? 'Submitting...' : 'Submit'}
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
        )}
      </div>
    </div>
  );
} 