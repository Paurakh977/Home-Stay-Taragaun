export default function News() {
  return (
    <div className="container mx-auto py-16 px-4">
      <h1 className="text-4xl font-bold mb-8 text-center">Latest News</h1>
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-2">New Homestay Location Opening Soon</h2>
          <p className="text-gray-500 mb-4">Posted on April 15, 2023</p>
          <p className="text-gray-700">
            We&apos;re excited to announce that we&apos;ll be opening a new homestay location in Pokhara next month! 
            This beautiful property offers stunning views of the Annapurna range and is just a short walk from Phewa Lake.
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-2">Cultural Experience Program Launched</h2>
          <p className="text-gray-500 mb-4">Posted on March 22, 2023</p>
          <p className="text-gray-700">
            Our new cultural experience program allows guests to participate in traditional Nepali cooking classes, 
            crafts workshops, and local festivals during their stay.
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-semibold mb-2">Early Booking Discounts Available</h2>
          <p className="text-gray-500 mb-4">Posted on February 10, 2023</p>
          <p className="text-gray-700">
            Book your stay at least 3 months in advance and receive a 15% discount on your entire booking. 
            This limited-time offer is available for all our homestay locations.
          </p>
        </div>
      </div>
    </div>
  );
} 