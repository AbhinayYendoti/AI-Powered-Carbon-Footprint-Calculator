import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Leaf, 
  TrendingDown, 
  Globe, 
  Lightbulb, 
  Car, 
  Home, 
  Utensils, 
  ShoppingBag,
  ArrowLeft,
  Download
} from "lucide-react";
import { useRef, useState } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { toast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { type CalculationResult } from "@/services/carbonService";

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

interface ResultsDashboardProps {
  data: CarbonData;
  result: CalculationResult;
  onRestart: () => void;
}

export const ResultsDashboard = ({ data, result, onRestart }: ResultsDashboardProps) => {
  const [actionPlanOpen, setActionPlanOpen] = useState(false);
  const [actionPlan, setActionPlan] = useState<string[]>([]);
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const resultsRef = useRef<HTMLDivElement | null>(null);

  // Use backend-calculated results for consistency
  const emissions = result.emissions;
  const worldAverage = result.worldAverage;
  const comparisonPercent = result.comparison;
  const recommendationsFromBackend = result.recommendations || [];

  const getImpactLevel = (total: number) => {
    if (total < 3000) return { level: "Low", color: "bg-green-500", textColor: "text-green-700" };
    if (total < 6000) return { level: "Medium", color: "bg-yellow-500", textColor: "text-orange-700" };
    return { level: "High", color: "bg-red-500", textColor: "text-red-700" };
  };

  const impactLevel = getImpactLevel(emissions.total);

  const handleActionPlan = async () => {
    setLoadingPlan(true);
    setActionPlanOpen(true);
    try {
      const apiBase = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3002';
      const res = await fetch(`${apiBase}/api/actionplan/sampleuser`);
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      setActionPlan(data.actions || [
        'Use public transport twice a week instead of driving',
        'Switch to LED bulbs',
        'Reduce beef consumption to once a week',
        'Install a programmable thermostat',
        'Buy local and seasonal food',
        'Use reusable water bottles and coffee cups',
        'Unplug electronics when not in use',
        'Consider carpooling or biking for short trips'
      ]);
    } catch (e) {
      console.error('Action plan error:', e);
      // Fallback action plan if API fails
      setActionPlan([
        'Use public transport twice a week instead of driving',
        'Switch to LED bulbs',
        'Reduce beef consumption to once a week',
        'Install a programmable thermostat',
        'Buy local and seasonal food',
        'Use reusable water bottles and coffee cups',
        'Unplug electronics when not in use',
        'Consider carpooling or biking for short trips'
      ]);
      toast({ 
        title: 'Using offline recommendations', 
        description: 'Could not connect to server, showing default action plan.',
        variant: 'default'
      });
    } finally {
      setLoadingPlan(false);
    }
  };

  const handleDownload = async (format: 'pdf' | 'csv') => {
    setDownloading(true);
    try {
      const apiBase = (import.meta as any).env?.VITE_API_URL;
      if (apiBase) {
        const res = await fetch(`${apiBase}/api/report/sampleuser?format=${format}`);
        if (res.ok) {
          const blob = await res.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = format === 'pdf' ? 'carbon_report.pdf' : 'carbon_report.csv';
          document.body.appendChild(a);
          a.click();
          a.remove();
          window.URL.revokeObjectURL(url);
          toast({ title: 'Report downloaded successfully!' });
          return;
        }
      }

      // Fallback: client-side export
      if (format === 'csv') {
        const csv = [
          'Category,Value,Emissions (kg CO2)',
          `Transport - Car,${data.transport.carKm} km/week,${emissions.transport}`,
          `Transport - Flights,${data.transport.flightHours} hours/year,${emissions.transport}`,
          `Home - Electricity,${data.home.electricity} kWh/month,${emissions.home}`,
          `Diet - Type,${data.diet.type},${emissions.diet}`,
          `Shopping - Total,$${data.shopping.clothing + data.shopping.electronics},${emissions.shopping}`,
          `Total Carbon Footprint,,${emissions.total}`,
          `World Average Comparison,${comparisonPercent}%,4800 kg`
        ].join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'carbon_report.csv';
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        toast({ title: 'CSV downloaded successfully!' });
      } else {
        const node = resultsRef.current;
        if (!node) throw new Error('Results section not found');
        const canvas = await html2canvas(node, { scale: 2, useCORS: true });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const imgWidth = pageWidth - 40; // margins
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let y = 20;
        pdf.addImage(imgData, 'PNG', 20, y, imgWidth, imgHeight, undefined, 'FAST');
        pdf.save('carbon_report.pdf');
        toast({ title: 'PDF downloaded successfully!' });
      }
    } catch (e) {
      console.error('Download error:', e);
      toast({ 
        title: 'Download failed', 
        description: 'Could not connect to server. Please try again later.',
        variant: 'destructive' 
      });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6" ref={resultsRef}>
      {/* Header */}
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold">Your Carbon Footprint Results</h2>
        <p className="text-muted-foreground">Based on your lifestyle inputs, here's your environmental impact</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-4">
          <Button
            variant="eco"
            className="px-6 py-4 text-base shadow-md bg-gradient-to-r from-green-500 via-blue-400 to-green-400 hover:scale-105 hover:shadow-lg transition-transform duration-200"
            onClick={handleActionPlan}
            disabled={loadingPlan}
          >
            <Lightbulb className="w-5 h-5 mr-2" />
            Start Action Plan
          </Button>
          <Button
            variant="outline"
            className="px-6 py-4 text-base"
            onClick={() => handleDownload('pdf')}
            disabled={downloading}
          >
            <Download className="w-5 h-5 mr-2" />
            Download PDF
          </Button>
          <Button
            variant="outline"
            className="px-6 py-4 text-base"
            onClick={() => handleDownload('csv')}
            disabled={downloading}
          >
            <Download className="w-5 h-5 mr-2" />
            Download CSV
          </Button>
        </div>
      </div>

      {/* Main Results */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 shadow-card">
          <CardHeader className="text-center">
            <CardTitle className="text-4xl font-bold text-primary">
              {emissions.total.toLocaleString()} kg
            </CardTitle>
            <CardDescription className="text-lg">
              CO₂ equivalent per year
            </CardDescription>
            <Badge className={`${impactLevel.color} text-white mt-2`}>
              {impactLevel.level} Impact
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span>Compared to world average ({worldAverage.toLocaleString()} kg)</span>
                <span className={impactLevel.textColor}>
                  {comparisonPercent}%
                </span>
              </div>
              <Progress 
                value={Math.min(comparisonPercent, 200)} 
                className="h-3"
              />
              <p className="text-sm text-muted-foreground text-center">
                {comparisonPercent < 100 
                  ? `Great! You're below the world average` 
                  : `${comparisonPercent - 100}% above world average`
                }
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: "Transport", value: emissions.transport, icon: Car, color: "bg-sky" },
              { label: "Home Energy", value: emissions.home, icon: Home, color: "bg-earth" },
              { label: "Diet", value: emissions.diet, icon: Utensils, color: "bg-leaf" },
              { label: "Shopping", value: emissions.shopping, icon: ShoppingBag, color: "bg-warning" }
            ].map((item) => {
              const Icon = item.icon;
              const percentage = Math.round((item.value / emissions.total) * 100);
              
              return (
                <div key={item.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${item.color} text-white`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-medium">{item.label}</div>
                      <div className="text-sm text-muted-foreground">{percentage}%</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{item.value}</div>
                    <div className="text-xs text-muted-foreground">kg CO₂</div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Recommendations */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5" />
            AI-Powered Recommendations
          </CardTitle>
          <CardDescription>
            Personalized suggestions to reduce your carbon footprint
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recommendationsFromBackend.map((rec, index) => {
              const difficultyColor = rec.difficulty === 'easy' ? 'bg-gradient-success' : rec.difficulty === 'medium' ? 'bg-warning' : 'bg-destructive';
              const categoryIcon = rec.category?.toLowerCase() === 'transport' ? Car : rec.category?.toLowerCase() === 'home' ? Home : rec.category?.toLowerCase() === 'diet' ? Utensils : ShoppingBag;
              const Icon = categoryIcon;

              return (
                <Card key={index} className="border-l-4 border-l-primary">
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Icon className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold">{rec.title}</h4>
                          <Badge className={`${difficultyColor} text-white text-xs`}>
                            {rec.difficulty}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {rec.description}
                        </p>
                        <div className="flex items-center gap-2">
                          <TrendingDown className="w-4 h-4 text-accent" />
                          <span className="text-sm font-medium text-accent">
                            -{rec.impact.toLocaleString()} kg CO₂/year
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Action Plan Modal */}
      <Dialog open={actionPlanOpen} onOpenChange={setActionPlanOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Personalized Action Plan</DialogTitle>
            <DialogDescription>
              Steps you can take to reduce your carbon footprint
            </DialogDescription>
          </DialogHeader>
          {loadingPlan ? (
            <div className="text-center py-8">Loading...</div>
          ) : (
            <ul className="list-disc pl-6 space-y-2">
              {actionPlan.map((action, i) => (
                <li key={i} className="text-base text-foreground">{action}</li>
              ))}
            </ul>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};