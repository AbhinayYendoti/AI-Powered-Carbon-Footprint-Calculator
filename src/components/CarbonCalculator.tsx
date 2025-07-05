import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Car, Home, Utensils, ShoppingBag, ArrowRight, ArrowLeft, Leaf } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";

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

interface CarbonCalculatorProps {
  onComplete: (data: CarbonData) => void;
  isCalculating?: boolean;
}

export const CarbonCalculator = ({ onComplete }: CarbonCalculatorProps) => {
  const [currentTab, setCurrentTab] = useState("transport");
  const [data, setData] = useState<CarbonData>({
    transport: { carKm: 0, flightHours: 0, publicTransport: 0 },
    home: { electricity: 0, gas: 0, heating: "gas" },
    diet: { type: "mixed", meatServings: 7 },
    shopping: { clothing: 500, electronics: 200 }
  });

  const tabs = [
    { id: "transport", label: "Transport", icon: Car },
    { id: "home", label: "Home Energy", icon: Home },
    { id: "diet", label: "Diet", icon: Utensils },
    { id: "shopping", label: "Shopping", icon: ShoppingBag }
  ];

  const currentIndex = tabs.findIndex(tab => tab.id === currentTab);
  const isLastTab = currentIndex === tabs.length - 1;

  const handleNext = () => {
    if (isLastTab) {
      onComplete(data);
      toast({
        title: "Calculation Complete!",
        description: "Your carbon footprint has been calculated.",
      });
    } else {
      setCurrentTab(tabs[currentIndex + 1].id);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentTab(tabs[currentIndex - 1].id);
    }
  };

  const updateData = (category: keyof CarbonData, field: string, value: any) => {
    setData(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value
      }
    }));
  };

  // Progress calculation
  const progress = ((currentIndex + 1) / tabs.length) * 100;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Gradient Header */}
      <div className="rounded-t-2xl bg-gradient-to-r from-green-100 via-blue-100 to-green-50 py-8 px-4 flex flex-col items-center shadow-md">
        <Leaf className="w-10 h-10 text-green-500 mb-2" />
        <h1 className="text-3xl font-bold text-foreground mb-1">Personal Carbon Footprint Calculator</h1>
        <p className="text-base text-muted-foreground mb-2">Answer a few quick questions to discover your environmental impact</p>
        <Progress value={progress} className="h-2 w-full max-w-lg bg-green-200" />
        <div className="text-xs text-muted-foreground mt-1">Step {currentIndex + 1} of {tabs.length}</div>
      </div>
      <Card className="rounded-b-2xl shadow-xl bg-white/90 backdrop-blur-md">
        <CardHeader className="text-center pb-6">
          <CardTitle className="text-2xl font-bold text-primary">{tabs[currentIndex].label}</CardTitle>
          <CardDescription>
            {tabs[currentIndex].label === 'Transport' && 'How do you usually get around?'}
            {tabs[currentIndex].label === 'Home Energy' && 'Tell us about your home energy use.'}
            {tabs[currentIndex].label === 'Diet' && 'Share your eating habits.'}
            {tabs[currentIndex].label === 'Shopping' && 'How much do you spend on shopping?'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={currentTab} onValueChange={setCurrentTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 mb-8 bg-green-50 rounded-lg">
              {tabs.map((tab, index) => {
                const Icon = tab.icon;
                const isCompleted = index < currentIndex;
                const isCurrent = tab.id === currentTab;
                return (
                  <TabsTrigger 
                    key={tab.id} 
                    value={tab.id}
                    className={`flex flex-col items-center gap-1 py-2 ${isCompleted ? 'bg-green-200 text-green-700' : ''} ${isCurrent ? 'bg-gradient-to-r from-green-400 via-blue-300 to-green-300 text-white shadow' : ''}`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-xs">{tab.label}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>
            {/* Transport Tab */}
            <TabsContent value="transport" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="carKm" className="flex items-center gap-2"><Car className="w-4 h-4 text-green-500" />Car driving (km per week)</Label>
                  <Input
                    id="carKm"
                    type="number"
                    value={data.transport.carKm}
                    onChange={(e) => updateData('transport', 'carKm', Number(e.target.value))}
                    className="rounded-lg border-green-200 focus:border-green-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="flightHours" className="flex items-center gap-2"><Leaf className="w-4 h-4 text-blue-400" />Flight hours per year</Label>
                  <Input
                    id="flightHours"
                    type="number"
                    value={data.transport.flightHours}
                    onChange={(e) => updateData('transport', 'flightHours', Number(e.target.value))}
                    className="rounded-lg border-blue-200 focus:border-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="publicTransport" className="flex items-center gap-2"><Car className="w-4 h-4 text-green-400" />Public transport (hours per week)</Label>
                  <Input
                    id="publicTransport"
                    type="number"
                    value={data.transport.publicTransport}
                    onChange={(e) => updateData('transport', 'publicTransport', Number(e.target.value))}
                    className="rounded-lg border-green-100 focus:border-green-400"
                  />
                </div>
              </div>
            </TabsContent>
            {/* Home Tab */}
            <TabsContent value="home" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="electricity" className="flex items-center gap-2"><Home className="w-4 h-4 text-blue-500" />Monthly electricity (kWh)</Label>
                  <Input
                    id="electricity"
                    type="number"
                    value={data.home.electricity}
                    onChange={(e) => updateData('home', 'electricity', Number(e.target.value))}
                    className="rounded-lg border-blue-200 focus:border-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gas" className="flex items-center gap-2"><Home className="w-4 h-4 text-green-400" />Monthly gas (therms)</Label>
                  <Input
                    id="gas"
                    type="number"
                    value={data.home.gas}
                    onChange={(e) => updateData('home', 'gas', Number(e.target.value))}
                    className="rounded-lg border-green-200 focus:border-green-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="heating" className="flex items-center gap-2"><Home className="w-4 h-4 text-yellow-500" />Primary heating source</Label>
                  <Select 
                    value={data.home.heating} 
                    onValueChange={(value) => updateData('home', 'heating', value)}
                  >
                    <SelectTrigger className="rounded-lg border-green-200 focus:border-green-500">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gas">Natural Gas</SelectItem>
                      <SelectItem value="electric">Electric</SelectItem>
                      <SelectItem value="oil">Oil</SelectItem>
                      <SelectItem value="renewable">Renewable</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>
            {/* Diet Tab */}
            <TabsContent value="diet" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="dietType" className="flex items-center gap-2"><Utensils className="w-4 h-4 text-green-500" />Diet type</Label>
                  <Select 
                    value={data.diet.type} 
                    onValueChange={(value) => updateData('diet', 'type', value)}
                  >
                    <SelectTrigger className="rounded-lg border-green-200 focus:border-green-500">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vegan">Vegan</SelectItem>
                      <SelectItem value="vegetarian">Vegetarian</SelectItem>
                      <SelectItem value="pescatarian">Pescatarian</SelectItem>
                      <SelectItem value="mixed">Mixed</SelectItem>
                      <SelectItem value="high-meat">High Meat</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="meatServings" className="flex items-center gap-2"><Utensils className="w-4 h-4 text-red-400" />Meat servings per week</Label>
                  <Input
                    id="meatServings"
                    type="number"
                    value={data.diet.meatServings}
                    onChange={(e) => updateData('diet', 'meatServings', Number(e.target.value))}
                    className="rounded-lg border-red-200 focus:border-red-400"
                  />
                </div>
              </div>
            </TabsContent>
            {/* Shopping Tab */}
            <TabsContent value="shopping" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="clothing" className="flex items-center gap-2"><ShoppingBag className="w-4 h-4 text-purple-400" />Clothing spend (per year, $)</Label>
                  <Input
                    id="clothing"
                    type="number"
                    value={data.shopping.clothing}
                    onChange={(e) => updateData('shopping', 'clothing', Number(e.target.value))}
                    className="rounded-lg border-purple-200 focus:border-purple-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="electronics" className="flex items-center gap-2"><ShoppingBag className="w-4 h-4 text-blue-400" />Electronics spend (per year, $)</Label>
                  <Input
                    id="electronics"
                    type="number"
                    value={data.shopping.electronics}
                    onChange={(e) => updateData('shopping', 'electronics', Number(e.target.value))}
                    className="rounded-lg border-blue-200 focus:border-blue-400"
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
          {/* Navigation Buttons */}
          <div className="flex justify-between items-center mt-8">
            <Button
              variant="outline"
              className="rounded-full px-6 py-3 text-base"
              onClick={handlePrevious}
              disabled={currentIndex === 0}
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back
            </Button>
            <Button
              variant="eco"
              className="rounded-full px-8 py-3 text-base shadow-md bg-gradient-to-r from-green-500 via-blue-400 to-green-400 hover:scale-105 hover:shadow-lg transition-transform duration-200"
              onClick={handleNext}
            >
              {isLastTab ? 'Calculate' : 'Next'}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};