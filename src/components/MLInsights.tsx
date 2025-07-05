import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Brain, 
  TrendingUp, 
  Target, 
  Users, 
  BarChart3,
  Lightbulb,
  Zap,
  Shield,
  CheckCircle,
  AlertTriangle
} from "lucide-react";
import { Recommendation, Prediction } from "@/services/carbonService";

interface MLInsightsProps {
  recommendations: Recommendation[];
  predictions: Prediction[];
  totalEmissions: number;
  worldAverage: number;
}

export const MLInsights = ({ recommendations, predictions, totalEmissions, worldAverage }: MLInsightsProps) => {
  const totalPotentialSavings = recommendations.reduce((sum, rec) => sum + rec.impact, 0);
  const projectedFootprint = totalEmissions - totalPotentialSavings;
  const savingsPercentage = ((totalPotentialSavings / totalEmissions) * 100).toFixed(1);

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-green-500';
    if (confidence >= 0.6) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getDifficultyIcon = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'medium':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'hard':
        return <Shield className="w-4 h-4 text-red-600" />;
      default:
        return <Lightbulb className="w-4 h-4 text-blue-600" />;
    }
  };

  const averageConfidence = recommendations.length > 0 
    ? recommendations.reduce((sum, rec) => sum + rec.confidence, 0) / recommendations.length 
    : 0;

  return (
    <div className="space-y-6">
      {/* ML Overview */}
      <Card className="shadow-card border-l-4 border-l-purple-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-600" />
            AI & Machine Learning Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 rounded-lg bg-purple-50">
              <div className="text-2xl font-bold text-purple-600">
                {recommendations.length}
              </div>
              <div className="text-sm text-muted-foreground">ML Recommendations</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-blue-50">
              <div className="text-2xl font-bold text-blue-600">
                {(averageConfidence * 100).toFixed(0)}%
              </div>
              <div className="text-sm text-muted-foreground">Average Confidence</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-green-50">
              <div className="text-2xl font-bold text-green-600">
                {savingsPercentage}%
              </div>
              <div className="text-sm text-muted-foreground">Potential Reduction</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ML Models Explanation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Collaborative Filtering */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              Collaborative Filtering
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Our AI analyzes patterns from users with similar carbon profiles to provide personalized recommendations.
            </p>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Similarity Matching</span>
                <Badge className="bg-blue-100 text-blue-800">Active</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>User Profiling</span>
                <Badge className="bg-green-100 text-green-800">Complete</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Recommendation Engine</span>
                <Badge className="bg-purple-100 text-purple-800">ML-Powered</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Time Series Prediction */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              Time Series Prediction
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Machine learning models predict your future carbon footprint based on current trends and patterns.
            </p>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Forecast Period</span>
                <Badge className="bg-green-100 text-green-800">12 Months</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Confidence Intervals</span>
                <Badge className="bg-blue-100 text-blue-800">Included</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Trend Analysis</span>
                <Badge className="bg-purple-100 text-purple-800">ML-Powered</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Recommendations */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-yellow-600" />
            AI-Powered Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recommendations.map((rec, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold">{rec.title}</h4>
                      {getDifficultyIcon(rec.difficulty)}
                      <Badge className={`text-xs ${getConfidenceColor(rec.confidence)} text-white`}>
                        {(rec.confidence * 100).toFixed(0)}% confidence
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {rec.description}
                    </p>
                    <div className="text-sm font-medium text-green-600">
                      Potential savings: {rec.impact.toLocaleString()} kg CO₂/year
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span>Implementation Difficulty</span>
                    <span className="capitalize">{rec.difficulty}</span>
                  </div>
                  <Progress 
                    value={
                      rec.difficulty === 'easy' ? 25 : 
                      rec.difficulty === 'medium' ? 50 : 75
                    } 
                    className="h-2"
                  />
                </div>

                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="text-sm font-medium text-blue-800 mb-1">
                    💡 AI Suggestion:
                  </div>
                  <div className="text-sm text-blue-700">
                    {rec.action}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Prediction Analysis */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-purple-600" />
            Prediction Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3">12-Month Forecast</h4>
              <div className="space-y-2">
                {predictions.slice(0, 6).map((pred, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <span>Month {pred.month}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {pred.predicted.toLocaleString()} kg
                      </span>
                      <Badge className={`text-xs ${getConfidenceColor(pred.confidence)} text-white`}>
                        {(pred.confidence * 100).toFixed(0)}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-3">Impact Analysis</h4>
              <div className="space-y-4">
                <div className="text-center p-3 rounded-lg bg-gray-50">
                  <div className="text-lg font-bold text-gray-800">
                    {totalEmissions.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">Current Footprint</div>
                </div>
                
                <div className="text-center p-3 rounded-lg bg-green-50">
                  <div className="text-lg font-bold text-green-600">
                    {totalPotentialSavings.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">Potential Savings</div>
                </div>
                
                <div className="text-center p-3 rounded-lg bg-purple-50">
                  <div className="text-lg font-bold text-purple-600">
                    {projectedFootprint.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">Projected Footprint</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ML Model Status */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-600" />
            Machine Learning Model Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Collaborative Filtering</span>
                <Badge className="bg-green-100 text-green-800">Active</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Time Series Prediction</span>
                <Badge className="bg-green-100 text-green-800">Active</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Anomaly Detection</span>
                <Badge className="bg-green-100 text-green-800">Active</Badge>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Model Accuracy</span>
                <Badge className="bg-blue-100 text-blue-800">85%</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Training Data</span>
                <Badge className="bg-purple-100 text-purple-800">Updated</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Real-time Learning</span>
                <Badge className="bg-green-100 text-green-800">Enabled</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 