import HeroSection from "./HeroSection";
import ShowcaseSection from "./ShowcaseSection";
import FeatureGrid from "./FeatureGrid";
import HowItWorks from "./HowItWorks";
import CtaBand from "./CtaBand";
import Footer from "./Footer";
import "./landing.css";

export default function LandingView() {
  return (
    <main className="landing">
      <HeroSection />
      <ShowcaseSection />
      <FeatureGrid />
      <HowItWorks />
      <CtaBand />
      <Footer />
    </main>
  );
}
