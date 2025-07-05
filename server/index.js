import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Parser as Json2csvParser } from 'json2csv';
import PDFDocument from 'pdfkit';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3002;

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

// ML Models (simplified implementations)
class CarbonFootprintML {
  constructor() {
    this.userProfiles = [];
    this.recommendationWeights = {
      transport: 0.35,
      home: 0.25,
      diet: 0.25,
      shopping: 0.15
    };
  }

  // Collaborative filtering for recommendations
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

  // Generate personalized recommendations
  generateRecommendations(userData, emissions) {
    const userProfile = {
      transport: emissions.transport,
      home: emissions.home,
      diet: emissions.diet,
      shopping: emissions.shopping
    };

    // Add to user profiles for future recommendations
    this.userProfiles.push(userProfile);

    const similarUsers = this.findSimilarUsers(userProfile);
    const recommendations = [];

    // Transport recommendations
    if (emissions.transport > 2000) {
      recommendations.push({
        category: 'transport',
        title: 'Switch to Electric Vehicle',
        impact: Math.round(emissions.transport * 0.6),
        difficulty: 'medium',
        confidence: 0.85,
        description: 'Electric vehicles can reduce your transport emissions by up to 60%.',
        action: 'Consider leasing or purchasing an electric vehicle for your daily commute.'
      });
    }

    if (emissions.transport > 1500) {
      recommendations.push({
        category: 'transport',
        title: 'Use Public Transportation',
        impact: Math.round(emissions.transport * 0.4),
        difficulty: 'easy',
        confidence: 0.75,
        description: 'Public transport can reduce your carbon footprint significantly.',
        action: 'Try taking the bus or train for your daily commute 3 days a week.'
      });
    }

    // Home energy recommendations
    if (emissions.home > 1500) {
      recommendations.push({
        category: 'home',
        title: 'Switch to Renewable Energy',
        impact: Math.round(emissions.home * 0.7),
        difficulty: 'medium',
        confidence: 0.80,
        description: 'Renewable energy sources can dramatically reduce your home emissions.',
        action: 'Contact your utility provider about green energy plans or consider solar panels.'
      });
    }

    // Diet recommendations
    if (emissions.diet > 1200) {
      recommendations.push({
        category: 'diet',
        title: 'Reduce Meat Consumption',
        impact: Math.round(emissions.diet * 0.3),
        difficulty: 'easy',
        confidence: 0.90,
        description: 'Reducing meat consumption is one of the most effective ways to lower your carbon footprint.',
        action: 'Try meatless Mondays or reduce meat servings by 50%.'
      });
    }

    // Shopping recommendations
    if (emissions.shopping > 200) {
      recommendations.push({
        category: 'shopping',
        title: 'Buy Secondhand and Reduce Consumption',
        impact: Math.round(emissions.shopping * 0.5),
        difficulty: 'easy',
        confidence: 0.70,
        description: 'Extending product lifecycles reduces manufacturing emissions.',
        action: 'Shop at thrift stores and repair items instead of replacing them.'
      });
    }

    // Add recommendations from similar users
    if (similarUsers.length > 0) {
      const similarUserRecs = similarUsers[0].profile.recommendations || [];
      recommendations.push(...similarUserRecs.slice(0, 2));
    }

    return recommendations.sort((a, b) => b.impact - a.impact);
  }

  // Predict future carbon footprint
  predictFutureFootprint(userData, months = 12) {
    const currentTotal = this.calculateEmissions(userData).total;
    
    // Simple linear prediction with some randomness
    const trend = Math.random() * 0.2 - 0.1; // -10% to +10% trend
    const monthlyChange = trend / 12;
    
    const predictions = [];
    for (let i = 1; i <= months; i++) {
      const predicted = currentTotal * (1 + monthlyChange * i);
      predictions.push({
        month: i,
        predicted: Math.round(predicted),
        confidence: Math.max(0.5, 1 - (i * 0.05)) // Confidence decreases over time
      });
    }
    
    return predictions;
  }

  // Anomaly detection
  detectAnomalies(userData) {
    const anomalies = [];
    
    // Check for unrealistic values
    if (userData.transport.carKm > 1000) {
      anomalies.push({
        field: 'carKm',
        message: 'Car kilometers seem unusually high. Please verify your input.',
        severity: 'high'
      });
    }
    
    if (userData.transport.flightHours > 200) {
      anomalies.push({
        field: 'flightHours',
        message: 'Flight hours seem unusually high. Please verify your input.',
        severity: 'high'
      });
    }
    
    if (userData.home.electricity > 2000) {
      anomalies.push({
        field: 'electricity',
        message: 'Electricity consumption seems unusually high. Please verify your input.',
        severity: 'medium'
      });
    }
    
    return anomalies;
  }

  calculateEmissions(userData) {
    // Transport emissions
    const transport = (userData.transport.carKm * 52 * EMISSION_FACTORS.transport.car) +
                     (userData.transport.flightHours * EMISSION_FACTORS.transport.plane) +
                     (userData.transport.publicTransport * 52 * EMISSION_FACTORS.transport.bus);
    
    // Home emissions
    const home = (userData.home.electricity * 12 * EMISSION_FACTORS.home.electricity) +
                 (userData.home.gas * 12 * EMISSION_FACTORS.home.naturalGas);
    
    // Diet emissions
    const dietMultiplier = EMISSION_FACTORS.diet[userData.diet.type] || EMISSION_FACTORS.diet.mixed;
    const diet = (dietMultiplier * 365) + (userData.diet.meatServings * 52 * EMISSION_FACTORS.diet.meatServing);
    
    // Shopping emissions
    const shopping = (userData.shopping.clothing * EMISSION_FACTORS.shopping.clothing) +
                     (userData.shopping.electronics * EMISSION_FACTORS.shopping.electronics);
    
    return {
      transport: Math.round(transport),
      home: Math.round(home),
      diet: Math.round(diet),
      shopping: Math.round(shopping),
      total: Math.round(transport + home + diet + shopping)
    };
  }
}

const mlModel = new CarbonFootprintML();

// API Routes
app.post('/api/calculate', (req, res) => {
  try {
    const userData = req.body;
    
    // Detect anomalies
    const anomalies = mlModel.detectAnomalies(userData);
    if (anomalies.length > 0) {
      return res.status(400).json({
        success: false,
        anomalies,
        message: 'Please review your inputs for potential errors.'
      });
    }
    
    // Calculate emissions
    const emissions = mlModel.calculateEmissions(userData);
    
    // Generate recommendations
    const recommendations = mlModel.generateRecommendations(userData, emissions);
    
    // Predict future footprint
    const predictions = mlModel.predictFutureFootprint(userData);
    
    res.json({
      success: true,
      emissions,
      recommendations,
      predictions,
      worldAverage: 4800,
      comparison: Math.round((emissions.total / 4800) * 100)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error calculating carbon footprint',
      error: error.message
    });
  }
});

app.post('/api/chat', (req, res) => {
  try {
    const { message, context } = req.body;
    
    // Simple AI assistant responses (in production, integrate with OpenAI API)
    const responses = {
      'what is carbon footprint': 'A carbon footprint is the total greenhouse gas emissions caused by an individual, organization, event, or product. It\'s measured in carbon dioxide equivalent (CO2e) and includes emissions from transportation, energy use, diet, and consumption.',
      'how to reduce carbon footprint': 'You can reduce your carbon footprint by: 1) Using public transport or electric vehicles, 2) Switching to renewable energy, 3) Reducing meat consumption, 4) Buying secondhand items, 5) Using energy-efficient appliances.',
      'what are emission factors': 'Emission factors are coefficients that quantify the emissions or removals of a gas per unit activity. For example, driving 1 km in a gasoline car produces about 0.12 kg of CO2.',
      'help': 'I can help you understand your carbon footprint! Ask me about: what is carbon footprint, how to reduce it, emission factors, or any specific questions about your results.',
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
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error processing chat message',
      error: error.message
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

// --- New Action Plan Endpoint ---
app.get('/api/actionplan/:userid', (req, res) => {
  // In production, fetch user data from DB using req.params.userid
  // For now, use sample recommendations
  const actionPlan = {
    actions: [
      'Use public transport twice a week instead of driving',
      'Switch to LED bulbs',
      'Reduce beef consumption to once a week'
    ]
  };
  res.json(actionPlan);
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

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, '../dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Carbon Wise AI Friend server running on port ${PORT}`);
  console.log(`📊 ML models initialized`);
  console.log(`🌱 Ready to calculate carbon footprints!`);
}); 