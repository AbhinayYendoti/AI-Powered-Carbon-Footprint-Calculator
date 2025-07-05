import { useState } from "react";
import { HeroSection } from "@/components/HeroSection";
import { CarbonCalculator } from "@/components/CarbonCalculator";
import { ResultsDashboard } from "@/components/ResultsDashboard";

type AppState = 'hero' | 'calculator' | 'results';

interface CarbonData {
  transport: {
    carKm: number;
    flightHours: number;
    publicTransport: number;
  };
  home: {
    electricity: number;
    gas: number;
    heating: string;
  };
  diet: {
    type: string;
    meatServings: number;
  };
  shopping: {
    clothing: number;
    electronics: number;
  };
}

const Index = () => {
  const [appState, setAppState] = useState<AppState>('hero');
  const [carbonData, setCarbonData] = useState<CarbonData | null>(null);

  const handleGetStarted = () => {
    setAppState('calculator');
  };

  const handleCalculatorComplete = (data: CarbonData) => {
    setCarbonData(data);
    setAppState('results');
  };

  const handleRestart = () => {
    setAppState('hero');
    setCarbonData(null);
  };

  return (
    <div className="min-h-screen bg-background">
      {appState === 'hero' && (
        <HeroSection onGetStarted={handleGetStarted} />
      )}
      
      {appState === 'calculator' && (
        <div className="container mx-auto px-4 py-12">
          <CarbonCalculator onComplete={handleCalculatorComplete} />
        </div>
      )}
      
      {appState === 'results' && carbonData && (
        <div className="container mx-auto px-4 py-12">
          <ResultsDashboard data={carbonData} onRestart={handleRestart} />
        </div>
      )}
    </div>
  );
};

export default Index;
