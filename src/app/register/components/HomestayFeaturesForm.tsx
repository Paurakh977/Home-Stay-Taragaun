"use client";

import React, { useState, useEffect } from "react";

interface HomestayFeaturesData {
  localAttractions: string[];
  tourismServices: string[];
  infrastructure: string[];
}

type HomestayFeaturesFormProps = {
  formData: HomestayFeaturesData;
  updateFormData: (data: Partial<HomestayFeaturesData>) => void;
};

// Categorized local attractions with English/Nepali translations
export const attractionsCategories = [
  {
    id: 'natural',
    name: 'Natural Attractions / प्राकृतिक सम्पदा',
    options: [
      { value: "National Parks & Conservation Areas/राष्ट्रिय निकुञ्ज तथा संरक्षित क्षेत्र", checked: false },
      { value: "Major Rivers & Lakes/प्रमुख नदी तथा तालहरू", checked: false },
      { value: "Ponds/पोखरी", checked: false },
      { value: "Viewpoint Tower/दृश्यावलोकन स्थल (भ्यू टावर)", checked: false },
      { value: "Watchtowers, wetlands, and grasslands/मचान तथा सिमसार क्षेत्र, घासे मैदान", checked: false },
    ]
  },
  {
    id: 'cultural',
    name: 'Ethnic & Cultural Heritage / जातीय/सांस्कृतिक सम्पदा',
    options: [
      { value: "Museums & Cultural Centers/आदिवासी संग्रहालय तथा संस्कृति केन्द्रहरू", checked: false },
      { value: "Traditional Festivals, Dances & Rituals/परम्परागत पर्व, नाच तथा विधिहरू", checked: false },
      { value: "Local Community Lifestyle & Architecture/स्थानीय जीवनशैली तथा वास्तुकला", checked: false },
    ]
  },
  {
    id: 'products',
    name: 'Organic & Local Products / जैविक उत्पादन तथा स्थानीय भोजन',
    options: [
      { value: "Organic Food/Organic खाना", checked: false },
      { value: "Traditional Dishes & Recipes/परम्परागत परिकारहरू", checked: false },
    ]
  },
  {
    id: 'forest',
    name: 'Community Forest & Trails / सामुदायिक वन तथा पदयात्रा',
    options: [
      { value: "Community-managed Forests/सामुदायिक वन क्षेत्रहरू", checked: false },
      { value: "Nature Walks & Eco Trails/प्रकृति पदमार्ग तथा पदयात्रा", checked: false },
    ]
  },
  {
    id: 'wildlife',
    name: 'Wildlife & Birdwatching / वन्यजन्तु तथा चराचुरुङ्गी',
    options: [
      { value: "Iconic & Endangered Wildlife/प्रमुख तथा लोपोन्मुख जनावरहरू", checked: false },
      { value: "Birdwatching Hotspots/चराचुरुङ्गी हेर्ने स्थानहरू", checked: false },
      { value: "Community-led Wildlife Conservation/सामुदायिक वन्यजन्तु संरक्षण प्रयासहरू", checked: false },
      { value: "Other endangered wildlife and birds/अन्य लोपोन्मुख वन्यजन्तु तथा चराचुरुङ्गी", checked: false },
    ]
  },
  {
    id: 'adventure',
    name: 'Adventure & Eco-tourism Activities / साहसिक तथा पारिस्थितिक पर्यटन',
    options: [
      { value: "Trekking, Climbing & Hiking Routes/ट्रेकिङ, आरोहण तथा हाइकिङ मार्गहरू", checked: false },
      { value: "Eco-tourism based exploration/Eco-tourism based exploration", checked: false },
      { value: "Adventure Sports like: Boating, Hiking, Jungle Walk, Elephant Safari, Jeep Safari/साहसिक खेलहरू (जस्तै: बोटिङ, हाइकिङ, जंगल वाक, हात्ती सफारी, जीप सफारी)", checked: false },
      { value: "Fishing in the fish pond/माछा पोखरीमा फिसिङ", checked: false },
      { value: "Jungle Walks & Wildlife Safaris/जंगल पदयात्रा तथा सफारी", checked: false },
      { value: "Sunset/Sunrise Viewing Points/सूर्यास्त/सूर्योदय हेर्ने स्थानहरू", checked: false },
      { value: "Cultural Village Tours, Cycling & Local Mobility/गाउँ सयर, साइकल यात्रा, स्थानीय सवारी अनुभव", checked: false },
    ]
  }
];

// Common tourism services with English/Nepali translations
const commonTourismServices = [
  { value: "Welcome and Farewell/स्वागत तथा विदाई", checked: false },
  { value: "Comfortable Accommodation/आरामदायी आवास", checked: false },
  { value: "Gift or Souvenir/मायाको चिनो (उपहार)", checked: false },
  { value: "Traditional Cultural Program/परम्परागत सांस्कृतिक कार्यक्रम", checked: false },
  { value: "Local Dishes/स्थानीय परिकारहरू", checked: false },
];

// Common infrastructure with English/Nepali translations
const commonInfrastructure = [
  { value: "Community Building/सामुदायिक भवन", checked: false },
  { value: "Guest Room, Toilet, Bathroom/पाहुना कोठा, शौचालय, स्नानघर", checked: false },
  { value: "Transportation Facility/यातायात सुविधा", checked: false },
  { value: "Drinking Water and Solar Lighting/खानेपानी तथा सोलार बत्ती", checked: false },
  { value: "Security Post (Nepaltar)/सुरक्षा चौकी (नेपालटार)", checked: false },
  { value: "Health Post (Udayapurgadhi)/स्वास्थ्य चौकी (उदयपुरगढी)", checked: false },
  { value: "Communication Facility (Mobile)/सञ्चार सुविधा (मोबाइल)", checked: false },
];

const HomestayFeaturesForm: React.FC<HomestayFeaturesFormProps> = ({ formData, updateFormData }) => {
  // State for new items
  const [newAttraction, setNewAttraction] = useState("");
  const [categoryNewAttractions, setCategoryNewAttractions] = useState<{[key: string]: string}>(
    Object.fromEntries(attractionsCategories.map(cat => [cat.id, ""]))
  );
  const [newService, setNewService] = useState("");
  const [newInfrastructure, setNewInfrastructure] = useState("");
  
  // State for checkboxes
  const [attractionCheckboxesByCategory, setAttractionCheckboxesByCategory] = useState(
    attractionsCategories.map(category => ({
      ...category,
      options: category.options.map(option => ({
        ...option,
        checked: formData.localAttractions.includes(option.value)
      }))
    }))
  );
  
  const [tourismServiceCheckboxes, setTourismServiceCheckboxes] = useState(
    commonTourismServices.map(service => ({
      ...service,
      checked: formData.tourismServices.includes(service.value)
    }))
  );
  
  const [infrastructureCheckboxes, setInfrastructureCheckboxes] = useState(
    commonInfrastructure.map(infra => ({
      ...infra,
      checked: formData.infrastructure.includes(infra.value)
    }))
  );
  
  // Update checkbox states when formData changes
  useEffect(() => {
    setAttractionCheckboxesByCategory(
      attractionsCategories.map(category => ({
        ...category,
        options: category.options.map(option => ({
          ...option,
          checked: formData.localAttractions.includes(option.value)
        }))
      }))
    );
    
    setTourismServiceCheckboxes(
      commonTourismServices.map(service => ({
        ...service,
        checked: formData.tourismServices.includes(service.value)
      }))
    );
    
    setInfrastructureCheckboxes(
      commonInfrastructure.map(infra => ({
        ...infra,
        checked: formData.infrastructure.includes(infra.value)
      }))
    );
  }, [formData.tourismServices, formData.infrastructure, formData.localAttractions]);

  // Make sure arrays exist
  const attractions = Array.isArray(formData.localAttractions) ? formData.localAttractions : [];
  const services = Array.isArray(formData.tourismServices) ? formData.tourismServices : [];
  const infrastructures = Array.isArray(formData.infrastructure) ? formData.infrastructure : [];

  // Handle adding attractions
  const handleAddAttraction = () => {
    if (newAttraction.trim() === "") return;
    updateFormData({
      localAttractions: [...attractions, newAttraction]
    });
    setNewAttraction("");
  };

  // Handle adding category-specific attraction
  const handleAddCategoryAttraction = (categoryId: string) => {
    const customValue = categoryNewAttractions[categoryId];
    if (customValue.trim() === "") return;
    
    // Create a prefixed value that includes the category for easier filtering later
    const categorizedValue = `${categoryId}:${customValue}`;
    
    updateFormData({
      localAttractions: [...attractions, categorizedValue]
    });
    
    // Reset the input field
    setCategoryNewAttractions({
      ...categoryNewAttractions,
      [categoryId]: ""
    });
  };

  // Handle adding services
  const handleAddService = () => {
    if (newService.trim() === "") return;
    updateFormData({
      tourismServices: [...services, newService]
    });
    setNewService("");
  };

  // Handle adding infrastructure
  const handleAddInfrastructure = () => {
    if (newInfrastructure.trim() === "") return;
    updateFormData({
      infrastructure: [...infrastructures, newInfrastructure]
    });
    setNewInfrastructure("");
  };

  // Handle removing items
  const handleRemoveAttraction = (index: number) => {
    updateFormData({
      localAttractions: attractions.filter((_, i) => i !== index)
    });
  };

  const handleRemoveService = (index: number) => {
    updateFormData({
      tourismServices: services.filter((_, i) => i !== index)
    });
  };

  const handleRemoveInfrastructure = (index: number) => {
    updateFormData({
      infrastructure: infrastructures.filter((_, i) => i !== index)
    });
  };

  // Handle keydown for enter key
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, addFunction: () => void) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addFunction();
    }
  };
  
  // Handle checkbox change for tourism services
  const handleTourismServiceCheckboxChange = (index: number) => {
    const updatedCheckboxes = [...tourismServiceCheckboxes];
    updatedCheckboxes[index].checked = !updatedCheckboxes[index].checked;
    setTourismServiceCheckboxes(updatedCheckboxes);
    
    // Update form data based on checked boxes
    const checkedValues = updatedCheckboxes
      .filter(item => item.checked)
      .map(item => item.value);
      
    // Combine checked values with custom entries (excluding common ones)
    const customServices = services.filter(
      service => !commonTourismServices.some(common => common.value === service)
    );
    
    updateFormData({
      tourismServices: [...checkedValues, ...customServices]
    });
  };
  
  // Handle checkbox change for infrastructure
  const handleInfrastructureCheckboxChange = (index: number) => {
    const updatedCheckboxes = [...infrastructureCheckboxes];
    updatedCheckboxes[index].checked = !updatedCheckboxes[index].checked;
    setInfrastructureCheckboxes(updatedCheckboxes);
    
    // Update form data based on checked boxes
    const checkedValues = updatedCheckboxes
      .filter(item => item.checked)
      .map(item => item.value);
      
    // Combine checked values with custom entries (excluding common ones)
    const customInfrastructure = infrastructures.filter(
      infra => !commonInfrastructure.some(common => common.value === infra)
    );
    
    updateFormData({
      infrastructure: [...checkedValues, ...customInfrastructure]
    });
  };

  // Handle checkbox change for attractions
  const handleAttractionCheckboxChange = (categoryIndex: number, optionIndex: number) => {
    const updatedCategories = [...attractionCheckboxesByCategory];
    updatedCategories[categoryIndex].options[optionIndex].checked = 
      !updatedCategories[categoryIndex].options[optionIndex].checked;
    setAttractionCheckboxesByCategory(updatedCategories);
    
    // Update form data based on checked boxes
    const checkedValues = updatedCategories.flatMap(category => 
      category.options
        .filter(option => option.checked)
        .map(option => option.value)
    );
    
    // Combine checked values with custom entries (excluding common ones)
    const allCommonValues = attractionsCategories.flatMap(category => 
      category.options.map(option => option.value)
    );
    
    const customAttractions = attractions.filter(
      attraction => !allCommonValues.includes(attraction)
    );
    
    updateFormData({
      localAttractions: [...checkedValues, ...customAttractions]
    });
  };

  return (
    <div className="space-y-8">
      {/* Local Tourism Attractions/Products */}
      <div className="space-y-4">
        <h3 className="text-md font-medium text-gray-800">
          1. Local Tourism Attractions/Products / स्थानिय पर्यटकीय आकर्षण/उत्पादनहरु
          <span className="text-red-500 ml-1">*</span>
        </h3>
        <p className="text-sm text-gray-600">At least one attraction is required.</p>
        
        {/* Categories and their checkboxes */}
        <div className="space-y-6 mb-4">
          {attractionCheckboxesByCategory.map((category, categoryIndex) => (
            <div key={category.id} className="space-y-2 border-l-4 border-primary pl-4 py-2">
              <h4 className="text-sm font-medium text-gray-700">{category.name}</h4>
              <div className="grid grid-cols-1 gap-2">
                {category.options.map((option, optionIndex) => (
                  <div key={optionIndex} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`attraction-${category.id}-${optionIndex}`}
                      checked={option.checked}
                      onChange={() => handleAttractionCheckboxChange(categoryIndex, optionIndex)}
                      className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
                    />
                    <label 
                      htmlFor={`attraction-${category.id}-${optionIndex}`} 
                      className="ml-2 text-sm text-gray-700"
                    >
                      {option.value.split('/')[0]} / {option.value.split('/')[1]}
                    </label>
                  </div>
                ))}
              </div>
              
              {/* Custom entry field for this category */}
              <div className="mt-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={categoryNewAttractions[category.id]}
                    onChange={(e) => setCategoryNewAttractions({
                      ...categoryNewAttractions,
                      [category.id]: e.target.value
                    })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCategoryAttraction(category.id);
                      }
                    }}
                    placeholder={`Add custom ${category.name.split('/')[0].toLowerCase()} / कस्टम ${category.name.split('/')[1].toLowerCase()} थप्नुहोस्`}
                    className="flex-grow px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddCategoryAttraction(category.id)}
                    className="px-3 py-2 bg-primary text-white rounded-md hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary text-sm"
                  >
                    Add / थप्नुहोस्
                  </button>
                </div>
              </div>
              
              {/* List of custom entries for this category */}
              <div className="space-y-2 mt-2">
                {attractions
                  .filter(attraction => attraction.startsWith(`${category.id}:`))
                  .map((attraction, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border border-gray-200 rounded-md bg-gray-50">
                      <span className="text-sm">{attraction.substring(attraction.indexOf(':') + 1)}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveAttraction(attractions.indexOf(attraction))}
                        className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
        
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={newAttraction}
            onChange={(e) => setNewAttraction(e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, handleAddAttraction)}
            placeholder="Add general attraction / सामान्य आकर्षण थप्नुहोस्"
            className="flex-grow px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
          />
          <button
            type="button"
            onClick={handleAddAttraction}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            Add / थप्नुहोस्
          </button>
        </div>
        
        {/* List of added custom attractions (general) */}
        <div className="space-y-2">
          {attractions
            .filter(attraction => 
              !attractionsCategories.flatMap(cat => cat.options.map(opt => opt.value)).includes(attraction) && 
              !attraction.includes(':')
            )
            .map((attraction, index) => (
              <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-md">
                <span>{attraction}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveAttraction(attractions.indexOf(attraction))}
                  className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50"
                >
                  ✕
                </button>
              </div>
            ))}
          {attractions.length === 0 && (
            <p className="text-sm text-red-500 italic">No attractions added yet. Please add at least one.</p>
          )}
        </div>
      </div>

      {/* Available Tourism Services and Facilities */}
      <div className="space-y-4">
        <h3 className="text-md font-medium text-gray-800">
          2. Available Tourism Services and Facilities / उपलब्ध पर्यटकीय सेवा सुविधाहरु
          <span className="text-red-500 ml-1">*</span>
        </h3>
        <p className="text-sm text-gray-600">At least one service is required.</p>
        
        {/* Common tourism services checkboxes */}
        <div className="space-y-2 mb-4">
          <p className="text-sm font-medium text-gray-700">Common services (check all that apply):</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {tourismServiceCheckboxes.map((service, index) => (
              <div key={index} className="flex items-center">
                <input
                  type="checkbox"
                  id={`tourism-service-${index}`}
                  checked={service.checked}
                  onChange={() => handleTourismServiceCheckboxChange(index)}
                  className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
                />
                <label htmlFor={`tourism-service-${index}`} className="ml-2 text-sm text-gray-700">
                  {service.value.split('/')[0]} / {service.value.split('/')[1]}
                </label>
              </div>
            ))}
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={newService}
            onChange={(e) => setNewService(e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, handleAddService)}
            placeholder="Add additional service or facility / अतिरिक्त सेवा वा सुविधा थप्नुहोस्"
            className="flex-grow px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
          />
          <button
            type="button"
            onClick={handleAddService}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            Add / थप्नुहोस्
          </button>
        </div>
        
        {/* List of added custom services */}
        <div className="space-y-2">
          {services
            .filter(service => !commonTourismServices.some(common => common.value === service))
            .map((service, index) => (
              <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-md">
                <span>{service}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveService(services.indexOf(service))}
                  className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50"
                >
                  ✕
                </button>
              </div>
            ))}
          {services.length === 0 && (
            <p className="text-sm text-red-500 italic">No services added yet. Please add at least one.</p>
          )}
        </div>
      </div>

      {/* Infrastructure Available in the Homestay Village */}
      <div className="space-y-4">
        <h3 className="text-md font-medium text-gray-800">
          3. Infrastructure Available in the Homestay Village / होमस्टे गाउँमा भएका पूर्वाधारहरु
          <span className="text-red-500 ml-1">*</span>
        </h3>
        <p className="text-sm text-gray-600">At least one infrastructure item is required.</p>
        
        {/* Common infrastructure checkboxes */}
        <div className="space-y-2 mb-4">
          <p className="text-sm font-medium text-gray-700">Common infrastructure (check all that apply):</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {infrastructureCheckboxes.map((infra, index) => (
              <div key={index} className="flex items-center">
                <input
                  type="checkbox"
                  id={`infrastructure-${index}`}
                  checked={infra.checked}
                  onChange={() => handleInfrastructureCheckboxChange(index)}
                  className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
                />
                <label htmlFor={`infrastructure-${index}`} className="ml-2 text-sm text-gray-700">
                  {infra.value.split('/')[0]} / {infra.value.split('/')[1]}
                </label>
              </div>
            ))}
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={newInfrastructure}
            onChange={(e) => setNewInfrastructure(e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, handleAddInfrastructure)}
            placeholder="Add additional infrastructure / अतिरिक्त पूर्वाधार थप्नुहोस्"
            className="flex-grow px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
          />
          <button
            type="button"
            onClick={handleAddInfrastructure}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            Add / थप्नुहोस्
          </button>
        </div>
        
        {/* List of added custom infrastructure */}
        <div className="space-y-2">
          {infrastructures
            .filter(infra => !commonInfrastructure.some(common => common.value === infra))
            .map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-md">
                <span>{item}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveInfrastructure(infrastructures.indexOf(item))}
                  className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50"
                >
                  ✕
                </button>
              </div>
            ))}
          {infrastructures.length === 0 && (
            <p className="text-sm text-red-500 italic">No infrastructure added yet. Please add at least one.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomestayFeaturesForm; 