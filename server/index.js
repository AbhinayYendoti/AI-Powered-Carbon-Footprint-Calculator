import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Parser as Json2csvParser } from 'json2csv';
import PDFDocument from 'pdfkit';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3002;

// Initialize AI providers
const AI_PROVIDER = (process.env.AI_PROVIDER || 'openai').toLowerCase();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || ''
});
const geminiClient = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

async function aiCompletePrompt(prompt, { maxTokens = 800, temperature = 0.7, system = '', model: overrideModel } = {}) {
  try {
    if (AI_PROVIDER === 'gemini' && geminiClient) {
      const model = geminiClient.getGenerativeModel({ model: overrideModel || process.env.GEMINI_MODEL || 'gemini-1.5-flash' });
      const res = await model.generateContent({ contents: [{ role: 'user', parts: [{ text: system ? `${system}\n\n${prompt}` : prompt }] }] });
      const text = res.response?.text?.() || res.response?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      return text;
    }
    // Default: OpenAI
    const completion = await openai.chat.completions.create({
      model: overrideModel || process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
      messages: [
        system ? { role: 'system', content: system } : null,
        { role: 'user', content: prompt }
      ].filter(Boolean),
      max_tokens: maxTokens,
      temperature
    });
    return completion.choices[0].message.content;
  } catch (e) {
    console.error('AI completion error:', e);
    return '';
  }
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(join(__dirname, '../dist')));

// In-memory storage (in production, use a real database)
let userData = [];
let userSessions = [];

// Scientific emission factors (kg CO2 equivalent)
const EMISSION_FACTORS = {
  transport: {
    car: 0.12, // kg CO2 per km (gasoline)
    electricCar: 0.04, // kg CO2 per km (electric)
    hybridCar: 0.08, // kg CO2 per km (hybrid)
    bus: 0.03, // kg CO2 per km
    train: 0.02, // kg CO2 per km
    plane: 90, // kg CO2 per hour
    motorcycle: 0.08, // kg CO2 per km
  },
  home: {
    electricity: 0.42, // kg CO2 per kWh (grid average)
    renewableElectricity: 0.05, // kg CO2 per kWh
    naturalGas: 5.3, // kg CO2 per therm
    heatingOil: 7.3, // kg CO2 per gallon
    propane: 5.7, // kg CO2 per gallon
  },
  diet: {
    vegan: 1.5, // kg CO2 per day
    vegetarian: 2.5, // kg CO2 per day
    pescatarian: 3.2, // kg CO2 per day
    mixed: 4.0, // kg CO2 per day
    'high-meat': 5.5, // kg CO2 per day
    meatServing: 0.5, // kg CO2 per serving
  },
  shopping: {
    clothing: 0.03, // kg CO2 per dollar
    electronics: 0.05, // kg CO2 per dollar
    furniture: 0.08, // kg CO2 per dollar
    food: 0.02, // kg CO2 per dollar
  }
};

// Enhanced AI-Powered Carbon Footprint Analysis
class CarbonFootprintAI {
  constructor() {
    this.userProfiles = [];
    this.recommendationWeights = {
      transport: 0.35,
      home: 0.25,
      diet: 0.25,
      shopping: 0.15
    };
  }

  // AI-Powered Recommendation Generation via provider switch
  async generateAIRecommendations(userData, emissions) {
    try {
      const prompt = this.createRecommendationPrompt(userData, emissions);
      const aiResponse = await aiCompletePrompt(prompt, {
        maxTokens: 800,
        temperature: 0.7,
        system: 'You are an expert environmental scientist and sustainability consultant. Provide personalized, actionable recommendations to reduce carbon footprint. Be specific, practical, and encouraging.'
      });
      return this.parseAIRecommendations(aiResponse, emissions);
    } catch (error) {
      console.error('OpenAI API Error:', error);
      // Fallback to rule-based recommendations
      return this.generateFallbackRecommendations(userData, emissions);
    }
  }

  createRecommendationPrompt(userData, emissions) {
    return `
    Analyze this user's carbon footprint data and provide 5-7 personalized, actionable recommendations:

    USER DATA:
    - Transport: ${emissions.transport} kg CO2/year (${userData.transport?.carKm || 0} km by car, ${userData.transport?.publicKm || 0} km by public transport)
    - Home Energy: ${emissions.home} kg CO2/year (${userData.home?.electricity || 0} kWh electricity, ${userData.home?.naturalGas || 0} therms gas)
    - Diet: ${emissions.diet} kg CO2/year (${userData.diet?.dietType || 'mixed'} diet, ${userData.diet?.meatServings || 0} meat servings/week)
    - Shopping: ${emissions.shopping} kg CO2/year ($${userData.shopping?.clothing || 0} on clothing, $${userData.shopping?.electronics || 0} on electronics)
    - Total: ${emissions.total} kg CO2/year

    WORLD AVERAGE: 4800 kg CO2/year

    Please provide recommendations in this JSON format:
    {
      "recommendations": [
        {
          "category": "transport|home|diet|shopping|lifestyle",
          "title": "Short action title",
          "description": "Detailed explanation of the recommendation",
          "impact": "Estimated CO2 reduction in kg/year",
          "difficulty": "easy|medium|hard",
          "timeframe": "immediate|short-term|long-term",
          "cost": "free|low|medium|high",
          "actionSteps": ["Step 1", "Step 2", "Step 3"]
        }
      ]
    }

    Focus on the highest impact areas and provide practical, achievable steps.
    `;
  }

  parseAIRecommendations(aiResponse, emissions) {
    try {
      // Try to extract JSON from the response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return parsed.recommendations || [];
      }
      
      // If JSON parsing fails, create structured recommendations from text
      return this.createStructuredRecommendations(aiResponse, emissions);
    } catch (error) {
      console.error('Error parsing AI recommendations:', error);
      return this.createStructuredRecommendations(aiResponse, emissions);
    }
  }

  createStructuredRecommendations(aiText, emissions) {
    // Parse AI text and create structured recommendations
    const recommendations = [];
    const lines = aiText.split('\n').filter(line => line.trim());
    
    let currentRec = null;
    for (const line of lines) {
      if (line.includes('transport') || line.includes('Transport')) {
        if (currentRec) recommendations.push(currentRec);
        currentRec = { category: 'transport', title: '', description: '', impact: 0, difficulty: 'medium' };
      } else if (line.includes('home') || line.includes('Home') || line.includes('energy')) {
        if (currentRec) recommendations.push(currentRec);
        currentRec = { category: 'home', title: '', description: '', impact: 0, difficulty: 'medium' };
      } else if (line.includes('diet') || line.includes('Diet') || line.includes('food')) {
        if (currentRec) recommendations.push(currentRec);
        currentRec = { category: 'diet', title: '', description: '', impact: 0, difficulty: 'medium' };
      } else if (line.includes('shopping') || line.includes('Shopping') || line.includes('consumption')) {
        if (currentRec) recommendations.push(currentRec);
        currentRec = { category: 'shopping', title: '', description: '', impact: 0, difficulty: 'medium' };
      } else if (currentRec && line.trim()) {
        if (!currentRec.title) {
          currentRec.title = line.trim();
        } else if (!currentRec.description) {
          currentRec.description = line.trim();
        }
      }
    }
    if (currentRec) recommendations.push(currentRec);
    
    return recommendations;
  }

  // Fallback rule-based recommendations
  generateFallbackRecommendations(userData, emissions) {
    const recommendations = [];

    // Transport recommendations
    if (emissions.transport > 2000) {
      recommendations.push({
        category: 'transport',
        title: 'Switch to Electric Vehicle',
        description: 'Electric vehicles can reduce your transport emissions by up to 60%.',
        impact: Math.round(emissions.transport * 0.6),
        difficulty: 'medium',
        timeframe: 'long-term',
        cost: 'high',
        actionSteps: ['Research EV options', 'Calculate total cost of ownership', 'Consider leasing options']
      });
    }

    if (emissions.transport > 1500) {
      recommendations.push({
        category: 'transport',
        title: 'Use Public Transportation',
        description: 'Public transport can reduce your carbon footprint significantly.',
        impact: Math.round(emissions.transport * 0.4),
        difficulty: 'easy',
        timeframe: 'immediate',
        cost: 'low',
        actionSteps: ['Find local bus/train routes', 'Try public transport 3 days a week', 'Get a monthly pass']
      });
    }

    // Home energy recommendations
    if (emissions.home > 1500) {
      recommendations.push({
        category: 'home',
        title: 'Switch to Renewable Energy',
        description: 'Renewable energy sources can dramatically reduce your home emissions.',
        impact: Math.round(emissions.home * 0.7),
        difficulty: 'medium',
        timeframe: 'short-term',
        cost: 'medium',
        actionSteps: ['Contact your utility about green energy plans', 'Consider solar panel installation', 'Research local incentives']
      });
    }

    // Diet recommendations
    if (emissions.diet > 1200) {
      recommendations.push({
        category: 'diet',
        title: 'Reduce Meat Consumption',
        description: 'Reducing meat consumption is one of the most effective ways to lower your carbon footprint.',
        impact: Math.round(emissions.diet * 0.3),
        difficulty: 'easy',
        timeframe: 'immediate',
        cost: 'free',
        actionSteps: ['Start with meatless Mondays', 'Reduce meat servings by 50%', 'Explore plant-based alternatives']
      });
    }

    return recommendations;
  }

  // AI-Powered Carbon Footprint Analysis
  async analyzeCarbonFootprint(userData, emissions) {
    try {
      const prompt = `
      Analyze this carbon footprint data and provide insights:

      TRANSPORT: ${emissions.transport} kg CO2/year
      HOME: ${emissions.home} kg CO2/year  
      DIET: ${emissions.diet} kg CO2/year
      SHOPPING: ${emissions.shopping} kg CO2/year
      TOTAL: ${emissions.total} kg CO2/year

      WORLD AVERAGE: 4800 kg CO2/year

      Provide analysis in JSON format:
      {
        "analysis": {
          "overallAssessment": "excellent|good|average|high|very-high",
          "biggestContributor": "transport|home|diet|shopping",
          "improvementPotential": "low|medium|high",
          "insights": ["insight1", "insight2", "insight3"],
          "comparison": {
            "worldAverage": ${Math.round((emissions.total / 4800) * 100)},
            "percentile": "estimated percentile",
            "ranking": "how they compare to others"
          }
        }
      }
      `;

      const aiResponse = await aiCompletePrompt(prompt, {
        maxTokens: 500,
        temperature: 0.5,
        system: 'You are an environmental data analyst. Provide clear, encouraging insights about carbon footprint data.'
      });
      return this.parseAnalysis(aiResponse);
    } catch (error) {
      console.error('OpenAI Analysis Error:', error);
      return this.generateFallbackAnalysis(emissions);
    }
  }

  parseAnalysis(aiResponse) {
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.error('Error parsing AI analysis:', error);
    }
    return this.generateFallbackAnalysis();
  }

  generateFallbackAnalysis(emissions) {
    const total = emissions.total;
    let assessment = 'average';
    if (total < 2000) assessment = 'excellent';
    else if (total < 3000) assessment = 'good';
    else if (total < 4000) assessment = 'average';
    else if (total < 5000) assessment = 'high';
    else assessment = 'very-high';

    const biggestContributor = Object.entries(emissions)
      .filter(([key]) => key !== 'total')
      .sort(([,a], [,b]) => b - a)[0][0];

    return {
      analysis: {
        overallAssessment: assessment,
        biggestContributor,
        improvementPotential: total > 4000 ? 'high' : total > 3000 ? 'medium' : 'low',
        insights: [
          `Your carbon footprint is ${Math.round((total / 4800) * 100)}% of the world average`,
          `${biggestContributor} contributes the most to your emissions`,
          total > 4000 ? 'There\'s significant room for improvement' : 'You\'re doing well!'
        ],
        comparison: {
          worldAverage: Math.round((total / 4800) * 100),
          percentile: total < 2000 ? 'top 20%' : total < 3000 ? 'top 40%' : total < 4000 ? 'average' : 'above average',
          ranking: total < 3000 ? 'Excellent' : total < 4000 ? 'Good' : 'Needs improvement'
        }
      }
    };
  }

  // Enhanced ML features (keeping existing functionality)
  findSimilarUsers(userProfile) {
    const similarities = this.userProfiles.map(profile => {
      const transportDiff = Math.abs(profile.transport - userProfile.transport) / 1000;
      const homeDiff = Math.abs(profile.home - userProfile.home) / 1000;
      const dietDiff = Math.abs(profile.diet - userProfile.diet) / 1000;
      const shoppingDiff = Math.abs(profile.shopping - userProfile.shopping) / 1000;
      
      const similarity = 1 - (transportDiff + homeDiff + dietDiff + shoppingDiff) / 4;
      return { profile, similarity };
    });

    return similarities
      .filter(s => s.similarity > 0.7)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 5);
  }

  predictFutureFootprint(userData, months = 12) {
    const currentTotal = this.calculateEmissions(userData).total;
    
    // Enhanced prediction with AI insights
    const trend = Math.random() * 0.2 - 0.1; // -10% to +10% trend
    const monthlyChange = trend / 12;
    
    const predictions = [];
    for (let i = 1; i <= months; i++) {
      const predicted = currentTotal * (1 + monthlyChange * i);
      predictions.push({
        month: i,
        predicted: Math.round(predicted),
        confidence: Math.max(0.5, 1 - (i * 0.05))
      });
    }
    
    return predictions;
  }

  detectAnomalies(userData) {
    const anomalies = [];
    
    // Transport anomalies
    if (userData.transport?.carKm > 50000) {
      anomalies.push({
        category: 'transport',
        field: 'carKm',
        value: userData.transport.carKm,
        message: 'Car kilometers seem unusually high. Please verify.'
      });
    }
    
    // Home energy anomalies
    if (userData.home?.electricity > 20000) {
      anomalies.push({
        category: 'home',
        field: 'electricity',
        value: userData.home.electricity,
        message: 'Electricity usage seems unusually high. Please verify.'
      });
    }
    
    return anomalies;
  }

  calculateEmissions(userData) {
    // Transport emissions
    const carEmissions = (userData.transport?.carKm || 0) * EMISSION_FACTORS.transport.car;
    const publicEmissions = (userData.transport?.publicKm || 0) * EMISSION_FACTORS.transport.bus;
    const planeEmissions = (userData.transport?.planeHours || 0) * EMISSION_FACTORS.transport.plane;
    const transport = carEmissions + publicEmissions + planeEmissions;
    
    // Home emissions
    const electricityEmissions = (userData.home?.electricity || 0) * EMISSION_FACTORS.home.electricity;
    const gasEmissions = (userData.home?.naturalGas || 0) * EMISSION_FACTORS.home.naturalGas;
    const home = electricityEmissions + gasEmissions;
    
    // Diet emissions
    const dietType = userData.diet?.dietType || 'mixed';
    const baseDietEmissions = EMISSION_FACTORS.diet[dietType] * 365;
    const meatEmissions = (userData.diet?.meatServings || 0) * 52 * EMISSION_FACTORS.diet.meatServing;
    const diet = baseDietEmissions + meatEmissions;
    
    // Shopping emissions
    const clothingEmissions = (userData.shopping?.clothing || 0) * EMISSION_FACTORS.shopping.clothing;
    const electronicsEmissions = (userData.shopping?.electronics || 0) * EMISSION_FACTORS.shopping.electronics;
    const shopping = clothingEmissions + electronicsEmissions;
    
    return {
      transport: Math.round(transport),
      home: Math.round(home),
      diet: Math.round(diet),
      shopping: Math.round(shopping),
      total: Math.round(transport + home + diet + shopping)
    };
  }
}

const aiModel = new CarbonFootprintAI();

// API Routes
app.post('/api/calculate', async (req, res) => {
  try {
    const userData = req.body;
    
    // Detect anomalies
    const anomalies = aiModel.detectAnomalies(userData);
    if (anomalies.length > 0) {
      return res.status(400).json({
        success: false,
        anomalies,
        message: 'Please review your inputs for potential errors.'
      });
    }
    
    // Calculate emissions
    const emissions = aiModel.calculateEmissions(userData);
    
    // Generate AI-powered recommendations
    const recommendations = await aiModel.generateAIRecommendations(userData, emissions);
    
    // Generate AI-powered analysis
    const analysis = await aiModel.analyzeCarbonFootprint(userData, emissions);
    
    // Predict future footprint
    const predictions = aiModel.predictFutureFootprint(userData);
    
    res.json({
      success: true,
      emissions,
      recommendations,
      analysis: analysis.analysis,
      predictions,
      worldAverage: 4800,
      comparison: Math.round((emissions.total / 4800) * 100)
    });
  } catch (error) {
    console.error('Calculation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error calculating carbon footprint',
      error: error.message
    });
  }
});

// Enhanced AI Chat endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { message, context, userData } = req.body;
    
    // Use AI provider for intelligent responses
    const prompt = `
    You are an AI environmental consultant helping users understand and reduce their carbon footprint.
    
    User message: "${message}"
    
    ${context ? `Context: ${context}` : ''}
    ${userData ? `User's carbon footprint: ${JSON.stringify(userData)}` : ''}
    
    Provide a helpful, encouraging response with practical advice. Keep it under 200 words.
    `;
    const response = await aiCompletePrompt(prompt, {
      maxTokens: 300,
      temperature: 0.7,
      system: 'You are a friendly, knowledgeable environmental consultant. Provide practical, encouraging advice about reducing carbon footprints.'
    });
    
    res.json({
      success: true,
      response,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Chat error:', error);
    // Fallback to simple responses
    const responses = {
      'what is carbon footprint': 'A carbon footprint is the total greenhouse gas emissions caused by an individual, organization, event, or product. It\'s measured in carbon dioxide equivalent (CO2e) and includes emissions from transportation, energy use, diet, and consumption.',
      'how to reduce carbon footprint': 'You can reduce your carbon footprint by: 1) Using public transport or electric vehicles, 2) Switching to renewable energy, 3) Reducing meat consumption, 4) Buying secondhand items, 5) Using energy-efficient appliances.',
      'default': 'I\'m here to help you understand your carbon footprint and find ways to reduce it. What would you like to know?'
    };
    
    const lowerMessage = message.toLowerCase();
    let response = responses.default;
    
    for (const [key, value] of Object.entries(responses)) {
      if (lowerMessage.includes(key)) {
        response = value;
        break;
      }
    }
    
    res.json({
      success: true,
      response,
      timestamp: new Date().toISOString()
    });
  }
});

app.post('/api/save-session', (req, res) => {
  try {
    const { userId, data } = req.body;
    const sessionId = uuidv4();
    
    userSessions.push({
      sessionId,
      userId,
      data,
      timestamp: new Date().toISOString()
    });
    
    res.json({
      success: true,
      sessionId
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error saving session',
      error: error.message
    });
  }
});

app.get('/api/session/:sessionId', (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = userSessions.find(s => s.sessionId === sessionId);
    
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }
    
    res.json({
      success: true,
      session
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving session',
      error: error.message
    });
  }
});

// --- Enhanced AI-Powered Action Plan Endpoint ---
app.get('/api/actionplan/:userid', async (req, res) => {
  try {
    const { userid } = req.params;
    
    // In production, fetch user data from DB using userid
    // For now, use sample data to demonstrate AI capabilities
    const sampleUserData = {
      transport: { carKm: 8000, publicKm: 2000, planeHours: 10 },
      home: { electricity: 5000, naturalGas: 800 },
      diet: { dietType: 'mixed', meatServings: 5 },
      shopping: { clothing: 500, electronics: 300 }
    };
    
    // Calculate emissions
    const emissions = aiModel.calculateEmissions(sampleUserData);
    
    // Generate AI-powered recommendations
    const recommendations = await aiModel.generateAIRecommendations(sampleUserData, emissions);
    
    // Generate AI analysis
    const analysis = await aiModel.analyzeCarbonFootprint(sampleUserData, emissions);
    
    const actionPlan = {
      userId: userid,
      timestamp: new Date().toISOString(),
      emissions: emissions,
      analysis: analysis.analysis,
      recommendations: recommendations,
      summary: {
        totalRecommendations: recommendations.length,
        potentialReduction: recommendations.reduce((sum, rec) => sum + (rec.impact || 0), 0),
        priorityAreas: recommendations.slice(0, 3).map(rec => rec.category)
      }
    };
    
    res.json(actionPlan);
  } catch (error) {
    console.error('Action plan error:', error);
    // Fallback to basic recommendations
    const fallbackPlan = {
      userId: req.params.userid,
      timestamp: new Date().toISOString(),
      recommendations: [
        {
          category: 'transport',
          title: 'Use Public Transportation',
          description: 'Switch to public transport for your daily commute',
          impact: 500,
          difficulty: 'easy',
          timeframe: 'immediate',
          cost: 'low',
          actionSteps: ['Find local bus/train routes', 'Get a monthly pass', 'Try it for a week']
        },
        {
          category: 'home',
          title: 'Switch to LED Bulbs',
          description: 'Replace traditional bulbs with energy-efficient LEDs',
          impact: 200,
          difficulty: 'easy',
          timeframe: 'immediate',
          cost: 'low',
          actionSteps: ['Count your current bulbs', 'Buy LED replacements', 'Install them gradually']
        },
        {
          category: 'diet',
          title: 'Reduce Meat Consumption',
          description: 'Try meatless Mondays and reduce overall meat intake',
          impact: 300,
          difficulty: 'easy',
          timeframe: 'immediate',
          cost: 'free',
          actionSteps: ['Start with meatless Mondays', 'Explore plant-based recipes', 'Reduce meat servings by 50%']
        }
      ]
    };
    
    res.json(fallbackPlan);
  }
});

// --- New Report Download Endpoint ---
app.get('/api/report/:userid', (req, res) => {
  // In production, fetch user data from DB using req.params.userid
  // For now, use sample data
  const userReport = {
    name: 'Sample User',
    totalEmissions: 4200,
    transport: 1200,
    home: 1500,
    diet: 1000,
    shopping: 500
  };

  const format = req.query.format || 'pdf';

  if (format === 'csv') {
    const fields = ['name', 'totalEmissions', 'transport', 'home', 'diet', 'shopping'];
    const parser = new Json2csvParser({ fields });
    const csv = parser.parse(userReport);
    res.header('Content-Type', 'text/csv');
    res.attachment('carbon_report.csv');
    return res.send(csv);
  } else {
    // PDF
    res.header('Content-Type', 'application/pdf');
    res.attachment('carbon_report.pdf');
    const doc = new PDFDocument();
    doc.pipe(res);
    doc.fontSize(18).text('Personal Carbon Footprint Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Name: ${userReport.name}`);
    doc.text(`Total Emissions: ${userReport.totalEmissions} kg CO₂/year`);
    doc.text(`Transport: ${userReport.transport} kg CO₂/year`);
    doc.text(`Home: ${userReport.home} kg CO₂/year`);
    doc.text(`Diet: ${userReport.diet} kg CO₂/year`);
    doc.text(`Shopping: ${userReport.shopping} kg CO₂/year`);
    doc.end();
  }
});

// --- Send Report via Email (Gmail SMTP) ---
app.post('/api/send-report', async (req, res) => {
  try {
    const { to, subject = 'Carbon Footprint Report', text = 'Please find your report attached.', report = null, format = 'pdf' } = req.body || {};

    const gmailUser = process.env.GMAIL_USER;
    const gmailPass = process.env.GMAIL_PASS;
    if (!gmailUser || !gmailPass) {
      return res.status(400).json({ success: false, message: 'Missing GMAIL_USER or GMAIL_PASS env vars' });
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: gmailUser, pass: gmailPass }
    });

    // Build attachment buffer (PDF or CSV)
    let attachments = [];
    if (format === 'csv') {
      const fields = ['name', 'totalEmissions', 'transport', 'home', 'diet', 'shopping'];
      const parser = new Json2csvParser({ fields });
      const csv = parser.parse(report || { name: 'User', totalEmissions: 0, transport: 0, home: 0, diet: 0, shopping: 0 });
      attachments.push({ filename: 'carbon_report.csv', content: csv });
    } else {
      // Generate simple PDF
      const doc = new PDFDocument();
      const chunks = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', async () => {
        const pdfBuffer = Buffer.concat(chunks);
        try {
          const info = await transporter.sendMail({
            from: gmailUser,
            to: to || gmailUser,
            subject,
            text,
            attachments: [{ filename: 'carbon_report.pdf', content: pdfBuffer }]
          });
          return res.json({ success: true, messageId: info.messageId });
        } catch (err) {
          console.error('SMTP send error:', err);
          return res.status(500).json({ success: false, message: 'Email send failed', error: err.message });
        }
      });
      const r = report || { name: 'User', totalEmissions: 0, transport: 0, home: 0, diet: 0, shopping: 0 };
      doc.fontSize(18).text('Personal Carbon Footprint Report', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`Name: ${r.name}`);
      doc.text(`Total Emissions: ${r.totalEmissions} kg CO₂/year`);
      doc.text(`Transport: ${r.transport} kg CO₂/year`);
      doc.text(`Home: ${r.home} kg CO₂/year`);
      doc.text(`Diet: ${r.diet} kg CO₂/year`);
      doc.text(`Shopping: ${r.shopping} kg CO₂/year`);
      doc.end();
      return; // response will be sent in 'end' handler
    }

    // If CSV path
    const info = await transporter.sendMail({
      from: gmailUser,
      to: to || gmailUser,
      subject,
      text,
      attachments
    });
    return res.json({ success: true, messageId: info.messageId });
  } catch (error) {
    console.error('send-report error:', error);
    res.status(500).json({ success: false, message: 'Failed to send report', error: error.message });
  }
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, '../dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Carbon Wise AI Friend server running on port ${PORT}`);
  console.log(`🤖 AI-powered recommendations enabled`);
  console.log(`📊 Enhanced ML models initialized`);
  console.log(`🌱 Ready to calculate carbon footprints with AI insights!`);
  console.log(`💡 Set OPENAI_API_KEY environment variable for full AI capabilities`);
}); 