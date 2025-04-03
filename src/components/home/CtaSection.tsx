import { Button } from "@/components/ui/button";

const CtaSection = () => {
  return (
    <section className="bg-primary py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:flex lg:items-center lg:justify-between">
          <div className="lg:w-3/5">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready for an authentic home stay experience?
            </h2>
            <p className="text-lg md:text-xl text-white/90 mb-6 max-w-2xl">
              Book your stay today and immerse yourself in Nepali culture, cuisine, and hospitality. 
              Special discounts available for early bookings!
            </p>
            <div className="flex flex-wrap gap-4">
              <button 
                className="h-11 px-8 rounded-md inline-flex items-center justify-center text-sm font-medium bg-[#1e40af] text-white hover:bg-[#1e3a8a] transition-colors duration-300"
              >
                Book Now
              </button>
              <button 
                className="h-11 px-8 rounded-md inline-flex items-center justify-center text-sm font-medium bg-white text-gray-800 hover:bg-gray-100 transition-colors duration-300"
              >
                Contact Us
              </button>
            </div>
          </div>
          <div className="hidden lg:block lg:w-2/5">
            <ul className="mt-8 lg:mt-0 text-white space-y-4 max-w-lg ml-auto">
              <li className="flex items-center">
                <span className="flex-shrink-0 rounded-full p-1 bg-white/20">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </span>
                <span className="ml-3 text-white">Free cancellation up to 7 days before check-in</span>
              </li>
              <li className="flex items-center">
                <span className="flex-shrink-0 rounded-full p-1 bg-white/20">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </span>
                <span className="ml-3 text-white">Genuine local experiences guaranteed</span>
              </li>
              <li className="flex items-center">
                <span className="flex-shrink-0 rounded-full p-1 bg-white/20">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </span>
                <span className="ml-3 text-white">24/7 customer support during your stay</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CtaSection; 