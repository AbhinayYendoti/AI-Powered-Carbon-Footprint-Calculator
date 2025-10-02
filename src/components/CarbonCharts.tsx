import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  PieChart, 
  Pie, 
  Cell, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Calendar,
  Leaf,
  Car,
  Home,
  Utensils,
  ShoppingBag
} from "lucide-react";
import { EmissionsResult, Prediction, Recommendation } from "@/services/carbonService";

interface CarbonChartsProps {
  emissions: EmissionsResult;
  predictions: Prediction[];
  recommendations: Recommendation[];
  worldAverage: number;
}

const COLORS = {
  transport: '#3B82F6', // Blue
  home: '#10B981',      // Green
  diet: '#F59E0B',      // Amber
  shopping: '#EF4444',  // Red
  prediction: '#8B5CF6', // Purple
  target: '#06B6D4'     // Cyan
};

export const CarbonCharts = ({ emissions, predictions, recommendations, worldAverage }: CarbonChartsProps) => {
  // Prepare data for pie chart
  const pieData = [
    { name: 'Transport', value: emissions.transport, color: COLORS.transport, icon: Car },
    { name: 'Home Energy', value: emissions.home, color: COLORS.home, icon: Home },
    { name: 'Diet', value: emissions.diet, color: COLORS.diet, icon: Utensils },
    { name: 'Shopping', value: emissions.shopping, color: COLORS.shopping, icon: ShoppingBag }
  ].filter(item => item.value > 0);

  // Prepare data for prediction chart
  const predictionData = predictions.map(pred => ({
    month: `Month ${pred.month}`,
    predicted: pred.predicted,
    confidence: Math.round(pred.confidence * 100),
    current: pred.month === 1 ? emissions.total : null
  }));

  // Calculate potential savings
  const totalPotentialSavings = recommendations.reduce((sum, rec) => sum + rec.impact, 0);
  const projectedFootprint = emissions.total - totalPotentialSavings;

  const savingsData = [
    { name: 'Current', value: emissions.total, color: COLORS.transport },
    { name: 'Potential Savings', value: totalPotentialSavings, color: COLORS.target },
    { name: 'Projected', value: projectedFootprint, color: COLORS.prediction }
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {entry.value.toLocaleString()} kg CO₂
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const PieChartTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const percentage = ((data.value / emissions.total) * 100).toFixed(1);
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium">{data.name}</p>
          <p style={{ color: data.color }}>
            {data.value.toLocaleString()} kg CO₂ ({percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Emissions Breakdown */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Leaf className="w-5 h-5" />
            Carbon Footprint Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pie Chart */}
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<PieChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Legend */}
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">
                  {emissions.total.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">kg CO₂ per year</div>
                <Badge className={`mt-2 ${
                  emissions.total < worldAverage ? 'bg-green-500' : 'bg-yellow-500'
                } text-white`}>
                  {emissions.total < worldAverage ? 'Below Average' : 'Above Average'}
                </Badge>
              </div>

              <div className="space-y-2">
                {pieData.map((item, index) => {
                  const Icon = item.icon;
                  const percentage = ((item.value / emissions.total) * 100).toFixed(1);
                  
                  return (
                    <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: item.color }}
                        />
                        <Icon className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">{item.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{item.value.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">{percentage}%</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Prediction Chart */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            12-Month Forecast
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={predictionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Line 
                  type="monotone" 
                  dataKey="predicted" 
                  stroke={COLORS.prediction} 
                  strokeWidth={3}
                  dot={{ fill: COLORS.prediction, strokeWidth: 2, r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="current" 
                  stroke={COLORS.transport} 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ fill: COLORS.transport, strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 text-center text-sm text-muted-foreground">
            Purple line shows predicted emissions, blue dashed line shows current level
          </div>
        </CardContent>
      </Card>

      {/* Savings Potential */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Potential Savings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <div className="text-2xl font-bold text-primary">
                {emissions.total.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">Current Footprint</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-green-100">
              <div className="text-2xl font-bold text-green-600">
                {totalPotentialSavings.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">Potential Savings</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-purple-100">
              <div className="text-2xl font-bold text-purple-600">
                {projectedFootprint.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">Projected Footprint</div>
            </div>
          </div>

          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={savingsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" fill={COLORS.transport} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Recommendations Impact */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="w-5 h-5" />
            Recommendations Impact
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recommendations
              .sort((a, b) => b.impact - a.impact)
              .slice(0, 5)
              .map((rec, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex-1">
                    <div className="font-medium">{rec.title}</div>
                    <div className="text-sm text-muted-foreground">{rec.description}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-green-600">
                      -{rec.impact.toLocaleString()} kg
                    </div>
                    <Badge className={`text-xs ${
                      rec.difficulty === 'easy' ? 'bg-green-500' : 
                      rec.difficulty === 'medium' ? 'bg-yellow-500' : 'bg-red-500'
                    } text-white`}>
                      {rec.difficulty}
                    </Badge>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 