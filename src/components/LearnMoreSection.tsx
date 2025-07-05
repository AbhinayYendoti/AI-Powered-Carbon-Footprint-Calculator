import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  Leaf, 
  Globe, 
  TrendingUp, 
  Lightbulb, 
  BookOpen, 
  Target,
  Zap,
  Car,
  Plane,
  Home,
  Utensils,
  ShoppingBag,
  TreePine
} from "lucide-react";

interface LearnMoreSectionProps {
  onBack: () => void;
}

export const LearnMoreSection = ({ onBack }: LearnMoreSectionProps) => {
  const emissionSources = [
    {
      icon: Car,
      title: "Transportation",
      description: "Cars, buses, trains, and flights",
      percentage: "29%",
      color: "bg-blue-500"
    },
    {
      icon: Home,
      title: "Home Energy",
      description: "Electricity, heating, and cooling",
      percentage: "25%",
      color: "bg-green-500"
    },
    {
      icon: Utensils,
      title: "Food & Diet",
      description: "Meat production, food waste, and packaging",
      percentage: "21%",
      color: "bg-orange-500"
    },
    {
      icon: ShoppingBag,
      title: "Consumer Goods",
      description: "Clothing, electronics, and household items",
      percentage: "15%",
      color: "bg-purple-500"
    },
    {
      icon: Plane,
      title: "Travel & Leisure",
      description: "Vacations, entertainment, and recreation",
      percentage: "10%",
      color: "bg-red-500"
    }
  ];

  const climateFacts = [
    {
      icon: TrendingUp,
      title: "Global Temperature Rise",
      description: "Earth's average temperature has increased by 1.1°C since pre-industrial times",
      impact: "High"
    },
    {
      icon: Globe,
      title: "Sea Level Rise",
      description: "Global sea levels are rising at 3.3mm per year due to thermal expansion and ice melt",
      impact: "Critical"
    },
    {
      icon: TreePine,
      title: "Deforestation",
      description: "We lose 137 species of plants, animals, and insects every day due to deforestation",
      impact: "High"
    },
    {
      icon: Zap,
      title: "Extreme Weather",
      description: "Climate change is intensifying hurricanes, droughts, floods, and heatwaves",
      impact: "Critical"
    }
  ];

  const reductionTips = [
    {
      category: "Transportation",
      tips: [
        "Use public transport or carpool when possible",
        "Switch to electric or hybrid vehicles",
        "Walk or bike for short distances",
        "Maintain proper tire pressure for better fuel efficiency"
      ]
    },
    {
      category: "Home Energy",
      tips: [
        "Switch to LED light bulbs",
        "Use energy-efficient appliances",
        "Improve home insulation",
        "Install solar panels or use renewable energy"
      ]
    },
    {
      category: "Food & Diet",
      tips: [
        "Reduce meat consumption, especially beef",
        "Buy local and seasonal produce",
        "Minimize food waste",
        "Choose organic and sustainable options"
      ]
    },
    {
      category: "Lifestyle",
      tips: [
        "Reduce, reuse, and recycle",
        "Choose sustainable fashion",
        "Use reusable water bottles and bags",
        "Support eco-friendly businesses"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/10 to-accent/10 border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={onBack}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Learn About Carbon Footprints</h1>
                <p className="text-muted-foreground">Understanding climate change and how to make a difference</p>
              </div>
            </div>
            <Badge variant="secondary" className="flex items-center gap-2">
              <Leaf className="w-4 h-4" />
              Educational Content
            </Badge>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* What is Carbon Footprint */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-primary" />
                  What is a Carbon Footprint?
                </CardTitle>
                <CardDescription>
                  Understanding your environmental impact
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground leading-relaxed">
                  A carbon footprint is the total amount of greenhouse gases (primarily carbon dioxide) 
                  that are emitted directly or indirectly by an individual, organization, event, or product. 
                  It's measured in units of carbon dioxide equivalents (CO₂e).
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-primary/5 rounded-lg">
                    <h4 className="font-semibold text-primary mb-2">Direct Emissions</h4>
                    <p className="text-sm text-muted-foreground">
                      From activities you control directly (driving, heating your home)
                    </p>
                  </div>
                  <div className="p-4 bg-accent/5 rounded-lg">
                    <h4 className="font-semibold text-accent mb-2">Indirect Emissions</h4>
                    <p className="text-sm text-muted-foreground">
                      From products and services you use (food production, electricity generation)
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Emission Sources */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  Major Sources of Carbon Emissions
                </CardTitle>
                <CardDescription>
                  Where do most of our emissions come from?
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {emissionSources.map((source, index) => (
                    <div key={index} className="flex items-start gap-3 p-4 border rounded-lg hover:bg-accent/5 transition-colors">
                      <div className={`p-2 rounded-lg ${source.color} text-white`}>
                        <source.icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-semibold">{source.title}</h4>
                          <Badge variant="outline">{source.percentage}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{source.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Climate Change Facts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Climate Change Facts
                </CardTitle>
                <CardDescription>
                  The science behind climate change
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {climateFacts.map((fact, index) => (
                    <div key={index} className="flex items-start gap-3 p-4 border rounded-lg">
                      <fact.icon className="w-5 h-5 text-primary mt-1" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-semibold">{fact.title}</h4>
                          <Badge 
                            variant={fact.impact === 'Critical' ? 'destructive' : 'secondary'}
                          >
                            {fact.impact}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{fact.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-primary" />
                  Quick Facts
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center p-4 bg-primary/5 rounded-lg">
                  <div className="text-2xl font-bold text-primary">16.5</div>
                  <div className="text-sm text-muted-foreground">Tons CO₂ per person/year (Global Average)</div>
                </div>
                <div className="text-center p-4 bg-accent/5 rounded-lg">
                  <div className="text-2xl font-bold text-accent">2.5</div>
                  <div className="text-sm text-muted-foreground">Tons CO₂ per person/year (Sustainable Target)</div>
                </div>
                <div className="text-center p-4 bg-green-500/5 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">30%</div>
                  <div className="text-sm text-muted-foreground">Potential reduction with lifestyle changes</div>
                </div>
              </CardContent>
            </Card>

            {/* Action Tips */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-primary" />
                  How to Reduce Your Footprint
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reductionTips.map((category, index) => (
                    <div key={index}>
                      <h4 className="font-semibold text-primary mb-2">{category.category}</h4>
                      <ul className="space-y-1">
                        {category.tips.map((tip, tipIndex) => (
                          <li key={tipIndex} className="text-sm text-muted-foreground flex items-start gap-2">
                            <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                            {tip}
                          </li>
                        ))}
                      </ul>
                      {index < reductionTips.length - 1 && <Separator className="my-4" />}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Call to Action */}
            <Card className="bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <Leaf className="w-12 h-12 text-primary mx-auto" />
                  <h3 className="font-semibold text-lg">Ready to Calculate Your Impact?</h3>
                  <p className="text-sm text-muted-foreground">
                    Use our AI-powered calculator to discover your carbon footprint and get personalized recommendations.
                  </p>
                  <Button onClick={onBack} className="w-full">
                    Start Calculator
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}; 