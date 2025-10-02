import axios from 'axios';

export interface CarbonData {
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

export interface EmissionsResult {
  transport: number;
  home: number;
  diet: number;
  shopping: number;
  total: number;
}

export interface Recommendation {
  category: string;
  title: string;
  impact: number;
  difficulty: 'easy' | 'medium' | 'hard';
  confidence: number;
  description: string;
  action: string;
}

export interface Prediction {
  month: number;
  predicted: number;
  confidence: number;
}

export interface CalculationResult {
  emissions: EmissionsResult;
  recommendations: Recommendation[];
  predictions: Prediction[];
  worldAverage: number;
  comparison: number;
  anomalies?: any[];
}

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL
  ? `${(import.meta as any).env.VITE_API_URL}`
  : 'http://localhost:5000';

class CarbonService {
  private static instance: CarbonService;

  private constructor() {}

  public static getInstance(): CarbonService {
    if (!CarbonService.instance) {
      CarbonService.instance = new CarbonService();
    }
    return CarbonService.instance;
  }

  async calculateFootprint(data: CarbonData): Promise<CalculationResult> {
    try {
      const response = await axios.post(`${API_BASE_URL}/predict`, data, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000, // 10 second timeout
      });
      
      if (response.data) {
        // Convert Flask response to frontend format
        const flaskResult = response.data;
        
        const emissions: EmissionsResult = {
          transport: flaskResult.breakdown.transport,
          home: flaskResult.breakdown.home,
          diet: flaskResult.breakdown.diet,
          shopping: flaskResult.breakdown.shopping,
          total: flaskResult.total
        };

        // Convert Flask recommendations to frontend format
        const recommendations: Recommendation[] = flaskResult.recommendations?.map((rec: any, index: number) => ({
          category: rec.category,
          title: rec.action,
          impact: Math.round(emissions.total * 0.1), // Estimate impact
          difficulty: rec.priority === 'high' ? 'easy' : 'medium',
          confidence: 0.8,
          description: rec.action,
          action: rec.action
        })) || [];

        // Generate basic predictions
        const predictions: Prediction[] = Array.from({ length: 12 }, (_, i) => ({
          month: i + 1,
          predicted: Math.round(emissions.total * (1 + (i * 0.01))),
          confidence: Math.max(0.7, 1 - (i * 0.03))
        }));

        return {
          emissions,
          recommendations,
          predictions,
          worldAverage: 4800,
          comparison: Math.round((emissions.total / 4800) * 100)
        };
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Error calculating carbon footprint:', error);
      
      // Fallback to local calculation if API is unavailable
      return this.localCalculation(data);
    }
  }

  async sendChatMessage(message: string, context?: any): Promise<string> {
    try {
      const response = await axios.post(`${API_BASE_URL}/chat`, {
        message,
        context
      });
      
      if (response.data.success) {
        return response.data.response;
      } else {
        throw new Error(response.data.message || 'Chat failed');
      }
    } catch (error) {
      console.error('Error sending chat message:', error);
      return "I'm sorry, I'm having trouble connecting right now. Please try again later.";
    }
  }

  async saveSession(userId: string, data: any): Promise<string> {
    try {
      const response = await axios.post(`${API_BASE_URL}/save-session`, {
        userId,
        data
      });
      
      if (response.data.success) {
        return response.data.sessionId;
      } else {
        throw new Error(response.data.message || 'Failed to save session');
      }
    } catch (error) {
      console.error('Error saving session:', error);
      throw error;
    }
  }

  async getSession(sessionId: string): Promise<any> {
    try {
      const response = await axios.get(`${API_BASE_URL}/session/${sessionId}`);
      
      if (response.data.success) {
        return response.data.session;
      } else {
        throw new Error(response.data.message || 'Failed to retrieve session');
      }
    } catch (error) {
      console.error('Error retrieving session:', error);
      throw error;
    }
  }

  // Fallback local calculation (simplified)
  private localCalculation(data: CarbonData): CalculationResult {
    // Basic emission factors
    const transport = (data.transport.carKm * 52 * 0.12) + 
                     (data.transport.flightHours * 90) + 
                     (data.transport.publicTransport * 52 * 0.03);
    
    const home = (data.home.electricity * 12 * 0.42) + 
                 (data.home.gas * 12 * 5.3);
    
    const dietMultiplier = {
      vegan: 1.5,
      vegetarian: 2.5,
      pescatarian: 3.2,
      mixed: 4.0,
      'high-meat': 5.5
    };
    const diet = (dietMultiplier[data.diet.type as keyof typeof dietMultiplier] || 4.0) * 365;
    
    const shopping = (data.shopping.clothing * 0.03) + 
                     (data.shopping.electronics * 0.05);
    
    const emissions = {
      transport: Math.round(transport),
      home: Math.round(home),
      diet: Math.round(diet),
      shopping: Math.round(shopping),
      total: Math.round(transport + home + diet + shopping)
    };

    // Basic recommendations
    const recommendations: Recommendation[] = [
      {
        category: 'transport',
        title: 'Use Public Transportation',
        impact: Math.round(emissions.transport * 0.3),
        difficulty: 'easy',
        confidence: 0.8,
        description: 'Public transport can significantly reduce your carbon footprint.',
        action: 'Try taking the bus or train for your daily commute.'
      },
      {
        category: 'diet',
        title: 'Reduce Meat Consumption',
        impact: Math.round(emissions.diet * 0.2),
        difficulty: 'easy',
        confidence: 0.9,
        description: 'Reducing meat consumption is one of the most effective ways to lower your carbon footprint.',
        action: 'Try meatless Mondays or reduce meat servings by 50%.'
      }
    ];

    // Basic predictions
    const predictions: Prediction[] = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      predicted: Math.round(emissions.total * (1 + (i * 0.02))),
      confidence: Math.max(0.5, 1 - (i * 0.05))
    }));

    return {
      emissions,
      recommendations,
      predictions,
      worldAverage: 4800,
      comparison: Math.round((emissions.total / 4800) * 100)
    };
  }

  // Utility methods
  formatEmissions(emissions: number): string {
    if (emissions >= 1000) {
      return `${(emissions / 1000).toFixed(1)} tonnes`;
    }
    return `${emissions} kg`;
  }

  getImpactLevel(total: number): { level: string; color: string; textColor: string } {
    if (total < 3000) {
      return { 
        level: "Low", 
        color: "bg-green-500", 
        textColor: "text-green-700" 
      };
    }
    if (total < 6000) {
      return { 
        level: "Medium", 
        color: "bg-yellow-500", 
        textColor: "text-yellow-700" 
      };
    }
    return { 
      level: "High", 
      color: "bg-red-500", 
      textColor: "text-red-700" 
    };
  }

  getDifficultyColor(difficulty: string): string {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'hard':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  }

  // Export data for reports
  exportToCSV(data: CarbonData, results: CalculationResult): string {
    const csvContent = [
      'Category,Value,Emissions (kg CO2)',
      `Transport - Car,${data.transport.carKm} km/week,${results.emissions.transport}`,
      `Transport - Flights,${data.transport.flightHours} hours/year,${results.emissions.transport}`,
      `Home - Electricity,${data.home.electricity} kWh/month,${results.emissions.home}`,
      `Diet - Type,${data.diet.type},${results.emissions.diet}`,
      `Shopping - Total,$${data.shopping.clothing + data.shopping.electronics},${results.emissions.shopping}`,
      `Total Carbon Footprint,,${results.emissions.total}`,
      `World Average Comparison,${results.comparison}%,4800 kg`
    ].join('\n');

    return csvContent;
  }
}

export const carbonService = CarbonService.getInstance(); 