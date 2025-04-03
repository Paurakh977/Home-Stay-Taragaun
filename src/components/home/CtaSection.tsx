import Link from "next/link";

const CtaSection = () => {
  return (
    <section className="py-20 bg-[#0a1428]">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Ready to Experience Authentic Nepali Hospitality?</h2>
          <p className="text-white/90 text-lg mb-10 leading-relaxed">
            Book your stay now and immerse yourself in the rich culture and breathtaking landscapes of Nepal.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-5">
            <Link 
              href="/register" 
              className="bg-primary hover:bg-opacity-90 text-white font-medium px-8 py-3.5 rounded-md transition-all duration-300 text-center shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
            >
              Book Now
            </Link>
            <Link 
              href="/contact" 
              className="bg-white/95 text-[#0a1428] font-medium px-8 py-3.5 rounded-md hover:bg-white transition-all duration-300 text-center shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
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