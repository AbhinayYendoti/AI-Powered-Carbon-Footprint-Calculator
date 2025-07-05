import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Car, Home, Utensils, ShoppingBag, ArrowRight, ArrowLeft } from "lucide-react";
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

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="shadow-card">
        <CardHeader className="text-center pb-6">
          <CardTitle className="text-2xl font-bold">Carbon Footprint Calculator</CardTitle>
          <CardDescription>
            Help us understand your lifestyle to calculate your environmental impact
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Tabs value={currentTab} onValueChange={setCurrentTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 mb-8">
              {tabs.map((tab, index) => {
                const Icon = tab.icon;
                const isCompleted = index < currentIndex;
                const isCurrent = tab.id === currentTab;
                
                return (
                  <TabsTrigger 
                    key={tab.id} 
                    value={tab.id}
                    className={`flex items-center gap-2 ${
                      isCompleted ? 'bg-primary/10 text-primary' : ''
                    } ${isCurrent ? 'bg-primary text-primary-foreground' : ''}`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>

            <TabsContent value="transport" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="carKm">Car driving (km per week)</Label>
                  <Input
                    id="carKm"
                    type="number"
                    value={data.transport.carKm}
                    onChange={(e) => updateData('transport', 'carKm', Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="flightHours">Flight hours per year</Label>
                  <Input
                    id="flightHours"
                    type="number"
                    value={data.transport.flightHours}
                    onChange={(e) => updateData('transport', 'flightHours', Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="publicTransport">Public transport (hours per week)</Label>
                  <Input
                    id="publicTransport"
                    type="number"
                    value={data.transport.publicTransport}
                    onChange={(e) => updateData('transport', 'publicTransport', Number(e.target.value))}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="home" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="electricity">Monthly electricity (kWh)</Label>
                  <Input
                    id="electricity"
                    type="number"
                    value={data.home.electricity}
                    onChange={(e) => updateData('home', 'electricity', Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gas">Monthly gas (therms)</Label>
                  <Input
                    id="gas"
                    type="number"
                    value={data.home.gas}
                    onChange={(e) => updateData('home', 'gas', Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="heating">Primary heating source</Label>
                  <Select 
                    value={data.home.heating} 
                    onValueChange={(value) => updateData('home', 'heating', value)}
                  >
                    <SelectTrigger>
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

            <TabsContent value="diet" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="dietType">Diet type</Label>
                  <Select 
                    value={data.diet.type} 
                    onValueChange={(value) => updateData('diet', 'type', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vegan">Vegan</SelectItem>
                      <SelectItem value="vegetarian">Vegetarian</SelectItem>
                      <SelectItem value="pescatarian">Pescatarian</SelectItem>
                      <SelectItem value="mixed">Mixed Diet</SelectItem>
                      <SelectItem value="high-meat">High Meat</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="meatServings">Meat servings per week</Label>
                  <Input
                    id="meatServings"
                    type="number"
                    value={data.diet.meatServings}
                    onChange={(e) => updateData('diet', 'meatServings', Number(e.target.value))}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="shopping" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="clothing">Annual clothing spending ($)</Label>
                  <Input
                    id="clothing"
                    type="number"
                    value={data.shopping.clothing}
                    onChange={(e) => updateData('shopping', 'clothing', Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="electronics">Annual electronics spending ($)</Label>
                  <Input
                    id="electronics"
                    type="number"
                    value={data.shopping.electronics}
                    onChange={(e) => updateData('shopping', 'electronics', Number(e.target.value))}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-between mt-8">
            <Button 
              variant="outline" 
              onClick={handlePrevious}
              disabled={currentIndex === 0}
            >
              <ArrowLeft className="w-4 h-4" />
              Previous
            </Button>
            <Button variant="eco" onClick={handleNext}>
              {isLastTab ? 'Calculate Results' : 'Next'}
              {!isLastTab && <ArrowRight className="w-4 h-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};