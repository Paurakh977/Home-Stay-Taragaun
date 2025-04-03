export default function About() {
  return (
    <div className="container mx-auto py-16 px-4">
      <h1 className="text-4xl font-bold mb-8 text-center">About Us</h1>
      
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow p-8 mb-10">
          <h2 className="text-2xl font-semibold mb-6 text-primary">Our Story</h2>
          <p className="text-gray-700 mb-4">
            Hamro Home Stay was founded in 2018 with a simple mission: to provide authentic Nepali hospitality 
            experiences to travelers while supporting local communities.
          </p>
          <p className="text-gray-700 mb-4">
            What started as a single home in Kathmandu has grown into a network of carefully selected homestays 
            across Nepal, each offering unique cultural experiences and warm hospitality.
          </p>
          <p className="text-gray-700">
            We believe that travel should be more than just sightseeing—it should be about making meaningful 
            connections with local people and cultures. Our homestays provide an opportunity for cultural 
            exchange that benefits both our guests and our host families.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 text-primary">Our Mission</h2>
            <p className="text-gray-700">
              To connect travelers with authentic Nepali culture through homestay experiences 
              that support local communities and preserve traditional ways of life.
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 text-primary">Our Vision</h2>
            <p className="text-gray-700">
              To create a sustainable tourism model where cultural exchange enriches both 
              visitors and hosts, while contributing to the economic development of rural Nepal.
            </p>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-8">
          <h2 className="text-2xl font-semibold mb-6 text-primary">Our Team</h2>
          <p className="text-gray-700 mb-6">
            Hamro Home Stay is run by a dedicated team of tourism professionals who are passionate 
            about Nepali culture and sustainable tourism. We work closely with our host families to 
            ensure high standards of service while maintaining authenticity.
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="relative w-32 h-32 rounded-full overflow-hidden mx-auto mb-4 bg-gray-200">
                <div className="absolute inset-0 flex items-center justify-center text-gray-500">Photo</div>
              </div>
              <h3 className="font-semibold">Ram Sharma</h3>
              <p className="text-gray-600">Founder & CEO</p>
            </div>
            
            <div className="text-center">
              <div className="relative w-32 h-32 rounded-full overflow-hidden mx-auto mb-4 bg-gray-200">
                <div className="absolute inset-0 flex items-center justify-center text-gray-500">Photo</div>
              </div>
              <h3 className="font-semibold">Sita Thapa</h3>
              <p className="text-gray-600">Community Manager</p>
            </div>
            
            <div className="text-center">
              <div className="relative w-32 h-32 rounded-full overflow-hidden mx-auto mb-4 bg-gray-200">
                <div className="absolute inset-0 flex items-center justify-center text-gray-500">Photo</div>
              </div>
              <h3 className="font-semibold">Bijay Poudel</h3>
              <p className="text-gray-600">Operations Director</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 