import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI safely (no hardcoded API key)
const GEMINI_API_KEY = (import.meta as any).env?.VITE_GEMINI_API_KEY as string | undefined;
const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

export interface CarbonFootprintData {
  total: number;
  breakdown: {
    transport: number;
    home: number;
    diet: number;
    shopping: number;
  };
  recommendations?: any[];
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

class GeminiService {
  private model: ReturnType<GoogleGenerativeAI['getGenerativeModel']> | null;
  private chatHistory: ChatMessage[] = [];

  constructor() {
    this.model = genAI ? genAI.getGenerativeModel({ model: 'gemini-1.5-flash' }) : null;
  }

  isReady(): boolean {
    return !!this.model;
  }

  async getCarbonFootprintAdvice(
    carbonData: CarbonFootprintData,
    userMessage?: string
  ): Promise<string> {
    try {
      if (!this.model) {
        return this.getFallbackResponse(carbonData);
      }
      const context = this.buildCarbonContext(carbonData);
      const prompt = this.buildAdvicePrompt(context, userMessage);

      const result = await this.model.generateContent(prompt);
      const response = result.response;
      const text = response.text();

      // Add to chat history
      if (userMessage) {
        this.addToHistory('user', userMessage);
      }
      this.addToHistory('assistant', text);

      return text;
    } catch (error) {
      console.error('Gemini API error:', error);
      return this.getFallbackResponse(carbonData);
    }
  }

  async sendChatMessage(message: string, carbonData?: CarbonFootprintData): Promise<string> {
    try {
      if (!this.model) {
        // Fallback simple echo or guidance
        if (carbonData) {
          return this.getFallbackResponse(carbonData);
        }
        return "I'm currently offline. Ask me after running a calculation for tailored tips.";
      }
      let prompt = message;
      
      // If carbon data is available, include context
      if (carbonData) {
        const context = this.buildCarbonContext(carbonData);
        prompt = `${context}\n\nUser question: ${message}`;
      }

      const result = await this.model.generateContent(prompt);
      const response = result.response;
      const text = response.text();

      // Add to chat history
      this.addToHistory('user', message);
      this.addToHistory('assistant', text);

      return text;
    } catch (error) {
      console.error('Gemini chat error:', error);
      return "I'm sorry, I'm having trouble connecting right now. Please try again later.";
    }
  }

  async getPersonalizedRecommendations(carbonData: CarbonFootprintData): Promise<string> {
    try {
      if (!this.model) {
        return this.getFallbackRecommendations(carbonData);
      }
      const context = this.buildCarbonContext(carbonData);
      const prompt = `${context}

Based on this carbon footprint analysis, provide 5 specific, actionable recommendations to reduce emissions. For each recommendation:

1. Specify the exact action to take
2. Estimate the potential CO2 reduction in kg/year
3. Rate the difficulty (Easy/Medium/Hard)
4. Explain why this will help

Format your response as a clear, numbered list with specific details. Focus on the highest impact areas first.`;

      const result = await this.model.generateContent(prompt);
      const response = result.response;
      return response.text();
    } catch (error) {
      console.error('Gemini recommendations error:', error);
      return this.getFallbackRecommendations(carbonData);
    }
  }

  async explainCarbonImpact(category: string, value: number, carbonData: CarbonFootprintData): Promise<string> {
    try {
      if (!this.model) {
        return `Your ${category} emissions are ${value} kg CO2/year. This represents a significant portion of your carbon footprint. Consider reducing usage and switching to more sustainable alternatives.`;
      }
      const context = this.buildCarbonContext(carbonData);
      const prompt = `${context}

The user wants to understand their ${category} emissions of ${value} kg CO2/year. Please explain:

1. What this means in practical terms (compare to everyday objects/activities)
2. How this compares to average levels
3. What specific activities contribute to this
4. 3 concrete steps to reduce it
5. The environmental impact of these emissions

Make it educational but not overwhelming. Use relatable examples and positive, encouraging tone.`;

      const result = await this.model.generateContent(prompt);
      const response = result.response;
      return response.text();
    } catch (error) {
      console.error('Gemini explanation error:', error);
      return `Your ${category} emissions are ${value} kg CO2/year. This represents a significant portion of your carbon footprint. Consider reducing usage and switching to more sustainable alternatives.`;
    }
  }

  private buildCarbonContext(carbonData: CarbonFootprintData): string {
    const { total, breakdown } = carbonData;
    const percentages = {
      transport: Math.round((breakdown.transport / total) * 100),
      home: Math.round((breakdown.home / total) * 100),
      diet: Math.round((breakdown.diet / total) * 100),
      shopping: Math.round((breakdown.shopping / total) * 100),
    };

    return `Carbon Footprint Analysis:
- Total Annual Emissions: ${total} kg CO2
- Transport: ${breakdown.transport} kg CO2 (${percentages.transport}%)
- Home Energy: ${breakdown.home} kg CO2 (${percentages.home}%)
- Diet: ${breakdown.diet} kg CO2 (${percentages.diet}%)
- Shopping: ${breakdown.shopping} kg CO2 (${percentages.shopping}%)

Global Context: Average person emits ~4,800 kg CO2/year
User's impact: ${total > 4800 ? 'Above' : 'Below'} average (${Math.round((total/4800)*100)}% of global average)`;
  }

  private buildAdvicePrompt(context: string, userMessage?: string): string {
    const basePrompt = `You are an expert environmental advisor specializing in carbon footprint reduction. 

${context}

${userMessage ? `User asks: "${userMessage}"` : 'Provide personalized advice for reducing this carbon footprint.'}

Please provide:
1. Specific, actionable advice tailored to their footprint
2. Focus on the highest-impact areas first
3. Include practical steps they can take immediately
4. Be encouraging and positive
5. Use clear, jargon-free language
6. Provide realistic timelines and expectations

Keep responses conversational and helpful, like talking to a friend who wants to make a positive environmental impact.`;

    return basePrompt;
  }

  private getFallbackResponse(carbonData: CarbonFootprintData): string {
    const { total, breakdown } = carbonData;
    const highestCategory = Object.entries(breakdown).reduce((a, b) => 
      breakdown[a[0] as keyof typeof breakdown] > breakdown[b[0] as keyof typeof breakdown] ? a : b
    );

    const advice = {
      transport: "Consider using public transport, cycling, or walking for short trips. For longer distances, carpooling or electric vehicles can make a big difference.",
      home: "Switch to LED bulbs, improve insulation, and consider renewable energy sources. Small changes in daily habits can lead to significant savings.",
      diet: "Try reducing meat consumption by 1-2 days per week. Plant-based meals are often healthier and have a much lower carbon footprint.",
      shopping: "Buy less, choose quality items that last longer, and consider second-hand options. Repair instead of replace when possible."
    };

    return `Based on your carbon footprint of ${total} kg CO2/year, I recommend focusing on ${highestCategory[0]} emissions first, as they represent your largest impact area. ${advice[highestCategory[0] as keyof typeof advice]} Every small step counts toward a more sustainable future!`;
  }

  private getFallbackRecommendations(carbonData: CarbonFootprintData): string {
    const { total, breakdown } = carbonData;
    
    return `Here are 5 personalized recommendations based on your ${total} kg CO2/year footprint:

1. **Reduce Car Usage** - Walk, bike, or use public transport for trips under 5km
   • Potential savings: 500-1000 kg CO2/year
   • Difficulty: Easy
   • Also improves your health and saves money!

2. **Energy Efficient Appliances** - Replace old appliances with Energy Star certified ones
   • Potential savings: 300-600 kg CO2/year
   • Difficulty: Medium
   • Long-term savings on electricity bills

3. **Reduce Meat Consumption** - Try "Meatless Monday" or plant-based meals 2-3 times per week
   • Potential savings: 200-400 kg CO2/year
   • Difficulty: Easy
   • Discover new cuisines and improve health

4. **Smart Home Heating** - Lower thermostat by 2°C and improve insulation
   • Potential savings: 400-800 kg CO2/year
   • Difficulty: Easy to Medium
   • Immediate comfort and cost savings

5. **Mindful Shopping** - Buy only what you need, choose quality over quantity
   • Potential savings: 100-300 kg CO2/year
   • Difficulty: Easy
   • Save money and reduce clutter

Start with the easy wins and gradually implement more changes. Every action makes a difference!`;
  }

  private addToHistory(role: 'user' | 'assistant', content: string): void {
    this.chatHistory.push({
      role,
      content,
      timestamp: new Date()
    });

    // Keep only last 10 messages to prevent memory issues
    if (this.chatHistory.length > 10) {
      this.chatHistory = this.chatHistory.slice(-10);
    }
  }

  getChatHistory(): ChatMessage[] {
    return [...this.chatHistory];
  }

  clearChatHistory(): void {
    this.chatHistory = [];
  }
}

export const geminiService = new GeminiService();
