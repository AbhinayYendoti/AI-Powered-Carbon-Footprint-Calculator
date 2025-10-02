import { useState } from "react";
import { HeroSection } from "@/components/HeroSection";
import { CarbonCalculator } from "@/components/CarbonCalculator";
import { ResultsDashboard } from "@/components/ResultsDashboard";
import { AIChatAssistant } from "@/components/AIChatAssistant";
import { CarbonCharts } from "@/components/CarbonCharts";
import { LearnMoreSection } from "@/components/LearnMoreSection";
import { carbonService, CarbonData, CalculationResult } from "@/services/carbonService";
import { toast } from "@/hooks/use-toast";

type AppState = 'hero' | 'calculator' | 'results' | 'learn';

const Index = () => {
  const [appState, setAppState] = useState<AppState>('hero');
  const [carbonData, setCarbonData] = useState<CarbonData | null>(null);
  const [calculationResult, setCalculationResult] = useState<CalculationResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const handleGetStarted = () => {
    setAppState('calculator');
  };

  const handleLearnMore = () => {
    setAppState('learn');
  };

  const handleCalculatorComplete = async (data: CarbonData) => {
    setIsCalculating(true);
    setCarbonData(data);

    try {
      // Use the ML-enhanced calculation service
      const result = await carbonService.calculateFootprint(data);
      setCalculationResult(result);
      setAppState('results');
      
      toast({
        title: "Calculation Complete!",
        description: `Your carbon footprint: ${result.emissions.total.toLocaleString()} kg CO₂/year`,
      });
    } catch (error) {
      console.error('Calculation error:', error);
      toast({
        title: "Calculation Error",
        description: "There was an issue calculating your carbon footprint. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCalculating(false);
    }
  };

  const handleRestart = () => {
    setAppState('hero');
    setCarbonData(null);
    setCalculationResult(null);
  };

  const handleChatSuggestion = (suggestion: string) => {
    // Handle suggestions from the AI chat assistant
    console.log('AI suggestion:', suggestion);
  };

  return (
    <div className="min-h-screen bg-background">
      {appState === 'hero' && (
        <HeroSection onGetStarted={handleGetStarted} onLearnMore={handleLearnMore} />
      )}
      
      {appState === 'calculator' && (
        <div className="container mx-auto px-4 py-12">
          <CarbonCalculator 
            onComplete={handleCalculatorComplete}
            isCalculating={isCalculating}
          />
        </div>
      )}
      
      {appState === 'results' && carbonData && calculationResult && (
        <div className="container mx-auto px-4 py-12">
          <ResultsDashboard 
            data={carbonData} 
            result={calculationResult}
            onRestart={handleRestart} 
          />
          
          {/* Enhanced Visualizations */}
          <div className="mt-12">
            <CarbonCharts 
              emissions={calculationResult.emissions}
              predictions={calculationResult.predictions}
              recommendations={calculationResult.recommendations}
              worldAverage={calculationResult.worldAverage}
            />
          </div>
        </div>
      )}

      {appState === 'learn' && (
        <LearnMoreSection onBack={handleRestart} />
      )}

      {/* AI Chat Assistant - Available on all pages */}
      <AIChatAssistant 
        onSuggestion={handleChatSuggestion}
        context={{
          currentState: appState,
          carbonData,
          calculationResult
        }}
        carbonData={calculationResult ? {
          total: calculationResult.emissions.total,
          breakdown: {
            transport: calculationResult.emissions.transport,
            home: calculationResult.emissions.home,
            diet: calculationResult.emissions.diet,
            shopping: calculationResult.emissions.shopping
          }
        } : undefined}
      />
    </div>
  );
};

export default Index;
