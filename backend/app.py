"""
Flask backend for AI-Powered Carbon Footprint Calculator
Provides ML-powered predictions via REST API endpoints
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np
import joblib
import os
from datetime import datetime
import logging
from sklearn.ensemble import RandomForestRegressor
from sklearn.linear_model import LinearRegression
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
import warnings
warnings.filterwarnings('ignore')

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for frontend integration

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global variables for models and scalers
models = {}
scalers = {}
label_encoders = {}
emission_factors = {}

class CarbonFootprintPredictor:
    def __init__(self):
        self.models = {
            'linear_regression': LinearRegression(),
            'random_forest': RandomForestRegressor(n_estimators=100, random_state=42)
        }
        self.scaler = StandardScaler()
        self.label_encoders = {}
        self.is_trained = False
        
    def load_emission_factors(self):
        """Load emission factors from CSV"""
        try:
            factors_df = pd.read_csv('data/emission_factors.csv')
            factors = {}
            for _, row in factors_df.iterrows():
                factors[row['category']] = {
                    'factor': row['emission_factor_kg_co2_per_unit'],
                    'unit': row['unit']
                }
            return factors
        except FileNotFoundError:
            logger.warning("Emission factors file not found, using default values")
            return self.get_default_emission_factors()
    
    def get_default_emission_factors(self):
        """Default emission factors (kg CO2 per unit)"""
        return {
            'electricity': {'factor': 0.5, 'unit': 'kWh'},
            'gas': {'factor': 2.3, 'unit': 'liter'},
            'car_fuel': {'factor': 2.31, 'unit': 'liter'},
            'flight': {'factor': 90.0, 'unit': 'hour'},
            'public_transport': {'factor': 0.04, 'unit': 'km'},
            'meat_heavy': {'factor': 7.26, 'unit': 'day'},
            'vegetarian': {'factor': 3.81, 'unit': 'day'},
            'vegan': {'factor': 2.89, 'unit': 'day'},
            'clothing': {'factor': 0.01, 'unit': 'dollar'},
            'electronics': {'factor': 0.02, 'unit': 'dollar'}
        }
    
    def preprocess_user_data(self, raw_data):
        """Convert user input to model features"""
        features = {}
        
        # Transport features
        features['car_km_per_week'] = raw_data.get('transport', {}).get('carKm', 0)
        features['flight_hours_per_year'] = raw_data.get('transport', {}).get('flightHours', 0)
        features['public_transport_km_per_week'] = raw_data.get('transport', {}).get('publicTransport', 0)
        
        # Home energy features
        features['electricity_kwh_per_month'] = raw_data.get('home', {}).get('electricity', 0)
        features['gas_liters_per_month'] = raw_data.get('home', {}).get('gas', 0)
        features['heating_type'] = raw_data.get('home', {}).get('heating', 'gas')
        
        # Diet features
        features['diet_type'] = raw_data.get('diet', {}).get('type', 'mixed')
        features['meat_servings_per_week'] = raw_data.get('diet', {}).get('meatServings', 7)
        
        # Shopping features
        features['clothing_spend_per_year'] = raw_data.get('shopping', {}).get('clothing', 500)
        features['electronics_spend_per_year'] = raw_data.get('shopping', {}).get('electronics', 200)
        
        return features
    
    def calculate_baseline_emissions(self, features):
        """Calculate emissions using emission factors"""
        factors = self.get_default_emission_factors()
        
        # Annual calculations
        transport_emissions = (
            features['car_km_per_week'] * 52 * 0.12 +  # Assume 0.12 kg CO2/km for cars
            features['flight_hours_per_year'] * factors['flight']['factor'] +
            features['public_transport_km_per_week'] * 52 * factors['public_transport']['factor']
        )
        
        home_emissions = (
            features['electricity_kwh_per_month'] * 12 * factors['electricity']['factor'] +
            features['gas_liters_per_month'] * 12 * factors['gas']['factor']
        )
        
        # Diet emissions (daily to annual)
        diet_multiplier = {
            'vegan': factors['vegan']['factor'],
            'vegetarian': factors['vegetarian']['factor'],
            'mixed': factors['meat_heavy']['factor']
        }
        diet_emissions = diet_multiplier.get(features['diet_type'], factors['meat_heavy']['factor']) * 365
        
        shopping_emissions = (
            features['clothing_spend_per_year'] * factors['clothing']['factor'] +
            features['electronics_spend_per_year'] * factors['electronics']['factor']
        )
        
        total_emissions = transport_emissions + home_emissions + diet_emissions + shopping_emissions
        
        return {
            'total': round(total_emissions, 2),
            'breakdown': {
                'transport': round(transport_emissions, 2),
                'home': round(home_emissions, 2),
                'diet': round(diet_emissions, 2),
                'shopping': round(shopping_emissions, 2)
            }
        }
    
    def train_models(self):
        """Train ML models using synthetic data"""
        try:
            # Load training data
            df = pd.read_csv('data/user_lifestyle_data.csv')
            logger.info(f"Loaded training data with {len(df)} samples")
        except FileNotFoundError:
            logger.info("Training data not found, generating synthetic data")
            df = self.generate_synthetic_data()
        
        # Prepare features
        feature_columns = [
            'car_km_per_week', 'flight_hours_per_year', 'public_transport_km_per_week',
            'electricity_kwh_per_month', 'gas_liters_per_month', 'heating_type',
            'diet_type', 'meat_servings_per_week',
            'clothing_spend_per_year', 'electronics_spend_per_year'
        ]
        
        # Handle categorical variables
        categorical_columns = ['heating_type', 'diet_type']
        for col in categorical_columns:
            if col in df.columns:
                le = LabelEncoder()
                df[col] = le.fit_transform(df[col].astype(str))
                self.label_encoders[col] = le
        
        X = df[feature_columns]
        y = df['total_co2_kg_per_year']
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        # Scale features
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)
        
        # Train models
        model_performance = {}
        for name, model in self.models.items():
            logger.info(f"Training {name}...")
            model.fit(X_train_scaled, y_train)
            
            # Evaluate
            y_pred = model.predict(X_test_scaled)
            r2 = r2_score(y_test, y_pred)
            rmse = np.sqrt(mean_squared_error(y_test, y_pred))
            mae = mean_absolute_error(y_test, y_pred)
            
            model_performance[name] = {
                'r2': r2,
                'rmse': rmse,
                'mae': mae
            }
            
            logger.info(f"{name} - R²: {r2:.3f}, RMSE: {rmse:.2f}, MAE: {mae:.2f}")
        
        self.is_trained = True
        return model_performance
    
    def generate_synthetic_data(self, n_samples=1000):
        """Generate synthetic training data"""
        logger.info(f"Generating {n_samples} synthetic samples")
        
        np.random.seed(42)
        data = []
        
        for _ in range(n_samples):
            # Generate realistic ranges
            car_km = np.random.exponential(100)  # 0-500+ km/week
            flight_hours = np.random.exponential(10)  # 0-100+ hours/year
            public_transport = np.random.exponential(50)  # 0-300+ km/week
            
            electricity = np.random.normal(300, 100)  # kWh/month
            electricity = max(50, electricity)
            
            gas = np.random.normal(50, 20)  # liters/month
            gas = max(0, gas)
            
            heating_type = np.random.choice(['gas', 'electric', 'oil'])
            diet_type = np.random.choice(['vegan', 'vegetarian', 'mixed'])
            meat_servings = np.random.poisson(7) if diet_type == 'mixed' else np.random.poisson(2)
            
            clothing = np.random.normal(500, 200)  # $/year
            clothing = max(100, clothing)
            
            electronics = np.random.normal(200, 100)  # $/year
            electronics = max(50, electronics)
            
            # Calculate target using emission factors
            features = {
                'car_km_per_week': car_km,
                'flight_hours_per_year': flight_hours,
                'public_transport_km_per_week': public_transport,
                'electricity_kwh_per_month': electricity,
                'gas_liters_per_month': gas,
                'heating_type': heating_type,
                'diet_type': diet_type,
                'meat_servings_per_week': meat_servings,
                'clothing_spend_per_year': clothing,
                'electronics_spend_per_year': electronics
            }
            
            baseline = self.calculate_baseline_emissions(features)
            
            # Add some noise to make it more realistic
            noise = np.random.normal(0, baseline['total'] * 0.1)
            total_co2 = max(100, baseline['total'] + noise)
            
            data.append({
                **features,
                'total_co2_kg_per_year': total_co2
            })
        
        return pd.DataFrame(data)
    
    def predict(self, user_data, model_name='random_forest'):
        """Make prediction using trained model"""
        if not self.is_trained:
            logger.warning("Models not trained, using baseline calculation")
            features = self.preprocess_user_data(user_data)
            return self.calculate_baseline_emissions(features)
        
        try:
            # Preprocess input
            features = self.preprocess_user_data(user_data)
            
            # Convert to DataFrame for consistent processing
            feature_df = pd.DataFrame([features])
            
            # Handle categorical variables
            for col, le in self.label_encoders.items():
                if col in feature_df.columns:
                    feature_df[col] = le.transform(feature_df[col].astype(str))
            
            # Scale features
            X_scaled = self.scaler.transform(feature_df)
            
            # Make prediction
            model = self.models.get(model_name, self.models['random_forest'])
            prediction = model.predict(X_scaled)[0]
            
            # Calculate breakdown (using baseline method for now)
            baseline = self.calculate_baseline_emissions(features)
            
            # Scale breakdown proportionally
            scale_factor = prediction / baseline['total'] if baseline['total'] > 0 else 1
            
            return {
                'total': round(prediction, 2),
                'breakdown': {
                    'transport': round(baseline['breakdown']['transport'] * scale_factor, 2),
                    'home': round(baseline['breakdown']['home'] * scale_factor, 2),
                    'diet': round(baseline['breakdown']['diet'] * scale_factor, 2),
                    'shopping': round(baseline['breakdown']['shopping'] * scale_factor, 2)
                },
                'model_used': model_name
            }
            
        except Exception as e:
            logger.error(f"Prediction error: {str(e)}")
            # Fallback to baseline calculation
            features = self.preprocess_user_data(user_data)
            result = self.calculate_baseline_emissions(features)
            result['model_used'] = 'baseline_fallback'
            return result

# Initialize predictor
predictor = CarbonFootprintPredictor()

@app.route('/status', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'models_trained': predictor.is_trained
    })

@app.route('/factors', methods=['GET'])
def get_emission_factors():
    """Get emission factors for reference"""
    factors = predictor.get_default_emission_factors()
    return jsonify({
        'emission_factors': factors,
        'timestamp': datetime.now().isoformat()
    })

@app.route('/predict', methods=['POST'])
def predict_carbon_footprint():
    """Main prediction endpoint"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Get model preference from request
        model_name = data.get('model', 'random_forest')
        
        # Make prediction
        result = predictor.predict(data, model_name)
        
        # Add recommendations
        result['recommendations'] = generate_recommendations(result)
        result['timestamp'] = datetime.now().isoformat()
        
        logger.info(f"Prediction made: {result['total']} kg CO2/year")
        
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Prediction error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/train', methods=['POST'])
def train_models():
    """Endpoint to trigger model training"""
    try:
        performance = predictor.train_models()
        return jsonify({
            'message': 'Models trained successfully',
            'performance': performance,
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        logger.error(f"Training error: {str(e)}")
        return jsonify({'error': str(e)}), 500

def generate_recommendations(result):
    """Generate personalized recommendations based on emissions breakdown"""
    recommendations = []
    breakdown = result.get('breakdown', {})
    total = result.get('total', 0)
    
    # Transport recommendations
    if breakdown.get('transport', 0) > total * 0.3:
        recommendations.append({
            'category': 'transport',
            'priority': 'high',
            'action': 'Consider using public transport or cycling for short trips',
            'potential_savings': '20-40% transport emissions'
        })
    
    # Home energy recommendations
    if breakdown.get('home', 0) > total * 0.25:
        recommendations.append({
            'category': 'home',
            'priority': 'medium',
            'action': 'Switch to LED bulbs and improve home insulation',
            'potential_savings': '15-25% home emissions'
        })
    
    # Diet recommendations
    if breakdown.get('diet', 0) > total * 0.2:
        recommendations.append({
            'category': 'diet',
            'priority': 'medium',
            'action': 'Try reducing meat consumption by 1-2 days per week',
            'potential_savings': '10-20% diet emissions'
        })
    
    return recommendations

if __name__ == '__main__':
    # Create data directory if it doesn't exist
    os.makedirs('data', exist_ok=True)
    
    # Train models on startup
    logger.info("Starting Flask application...")
    try:
        performance = predictor.train_models()
        logger.info("Models trained successfully on startup")
    except Exception as e:
        logger.error(f"Model training failed: {str(e)}")
        logger.info("Will use baseline calculations")
    
    app.run(debug=True, host='0.0.0.0', port=5000)
