import Link from "next/link";

const CtaSection = () => {
  return (
    <section className="py-16 bg-gradient-to-br from-orange-400 to-orange-500">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Ready to Experience Authentic Nepali Hospitality?</h2>
          <p className="text-white/80 text-lg mb-8">
            Book your stay now and immerse yourself in the rich culture and breathtaking landscapes of Nepal.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link 
              href="/register" 
              className="bg-blue-800 hover:bg-blue-900 text-white font-medium px-6 py-3 rounded-md transition-colors duration-300 text-center"
            >
              Book Now
            </Link>
            <Link 
              href="/contact" 
              className="bg-white text-gray-800 font-medium px-6 py-3 rounded-md hover:bg-gray-100 transition-colors duration-300 text-center"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CtaSection; 