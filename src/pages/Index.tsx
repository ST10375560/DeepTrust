import { Hero } from "@/components/Hero";
import { Architecture } from "@/components/Architecture";
import { VerificationDemo } from "@/components/VerificationDemo";
import { TechStack } from "@/components/TechStack";
import { Footer } from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Hero />
      <Architecture />
      <VerificationDemo />
      <TechStack />
      <Footer />
    </div>
  );
};

export default Index;
