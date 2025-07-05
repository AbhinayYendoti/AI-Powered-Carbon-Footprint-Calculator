import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-image.jpg";
import { Leaf, Calculator, TrendingDown } from "lucide-react";

interface HeroSectionProps {
  onGetStarted: () => void;
}

export const HeroSection = ({ onGetStarted }: HeroSectionProps) => {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url(${heroImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/80 to-background/60" />
      </div>
      
      {/* Content */}
      <div className="container relative z-10 px-4 py-20">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
            <Leaf className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Track Your Environmental Impact</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold leading-tight">
            Calculate Your{" "}
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              Carbon Footprint
            </span>
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Discover your environmental impact and get personalized AI-powered recommendations 
            to reduce your carbon footprint and help save our planet.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              variant="eco" 
              size="lg" 
              className="px-8 py-6 text-lg"
              onClick={onGetStarted}
            >
              <Calculator className="w-5 h-5" />
              Start Calculator
            </Button>
            <Button variant="outline" size="lg" className="px-8 py-6 text-lg">
              <TrendingDown className="w-5 h-5" />
              Learn More
            </Button>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">16.5</div>
              <div className="text-sm text-muted-foreground">Average tons CO₂ per person/year</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-accent">30%</div>
              <div className="text-sm text-muted-foreground">Reduction potential with changes</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-leaf">2030</div>
              <div className="text-sm text-muted-foreground">Climate action deadline</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};