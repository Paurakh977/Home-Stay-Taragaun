import ImageSlider from "@/components/home/ImageSlider";
import FeaturedSection from "@/components/home/FeaturedSection";
import TestimonialsSection from "@/components/home/TestimonialsSection";
import CtaSection from "@/components/home/CtaSection";
import ScrollPopup from "@/components/ui/ScrollPopup";

export default function Home() {
  return (
    <main>
      <ImageSlider />
      <FeaturedSection />
      <TestimonialsSection />
      <CtaSection />
      <ScrollPopup />
    </main>
  );
}
