import axios from 'axios';

const API_BASE_URL = 'http://localhost:3002/api';

async function testServer() {
  try {
    console.log('🧪 Testing Carbon Wise AI Friend Server...\n');

    // Test 1: Calculate carbon footprint
    console.log('1. Testing carbon footprint calculation...');
    const testData = {
      transport: {
        carKm: 100,
        flightHours: 10,
        publicTransport: 5
      },
      home: {
        electricity: 500,
        gas: 50,
        heating: "gas"
      },
      diet: {
        type: "mixed",
        meatServings: 7
      },
      shopping: {
        clothing: 500,
        electronics: 200
      }
    };

    const calculationResponse = await axios.post(`${API_BASE_URL}/calculate`, testData);
    console.log('✅ Calculation successful!');
    console.log(`   Total emissions: ${calculationResponse.data.emissions.total} kg CO₂/year`);
    console.log(`   Recommendations: ${calculationResponse.data.recommendations.length} generated\n`);

    // Test 2: Chat functionality
    console.log('2. Testing AI chat assistant...');
    const chatResponse = await axios.post(`${API_BASE_URL}/chat`, {
      message: "What is carbon footprint?",
      context: {}
    });
    console.log('✅ Chat successful!');
    console.log(`   Response: ${chatResponse.data.response.substring(0, 100)}...\n`);

    // Test 3: Session management
    console.log('3. Testing session management...');
    const sessionResponse = await axios.post(`${API_BASE_URL}/save-session`, {
      userId: 'test-user',
      data: testData
    });
    console.log('✅ Session saved!');
    console.log(`   Session ID: ${sessionResponse.data.sessionId}\n`);

    console.log('🎉 All tests passed! Server is working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

testServer(); 