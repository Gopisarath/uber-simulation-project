from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime
import pickle
import numpy as np
from dateutil.parser import isoparse

# Load the trained model
with open("uber_fare_model.pkl", "rb") as model_file:
    model = pickle.load(model_file)

# Initialize FastAPI app
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for CORS
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods
    allow_headers=["*"],  # Allow all headers
)

# Define Pydantic model for input validation
class FarePredictionInput(BaseModel):
    pickup_latitude: float
    pickup_longitude: float
    dropoff_latitude: float
    dropoff_longitude: float
    passenger_count: int
    pickup_time: str  # Accept pickup time as a string in ISO 8601 format

# Define /predict route
@app.post("/predict")
async def predict_fare(input_data: FarePredictionInput):
    try:
        # Parse the pickup_time to extract hour and day_of_week
        pickup_time = isoparse(input_data.pickup_time)
        hour = pickup_time.hour
        day_of_week = pickup_time.weekday()  # Monday = 0, Sunday = 6

        # Prepare input data for prediction
        features = np.array([[
            input_data.pickup_latitude,
            input_data.pickup_longitude,
            input_data.dropoff_latitude,
            input_data.dropoff_longitude,
            input_data.passenger_count,
            hour,
            day_of_week
        ]], dtype=np.float32)
        
        # Make prediction
        prediction = round(float(model.predict(features)[0]) * 1.39, 2)  # Round to 2 decimal places, account for inflation rate
        
        # Return the response with input data and prediction
        return {
            "input": {
                "pickup_latitude": input_data.pickup_latitude,
                "pickup_longitude": input_data.pickup_longitude,
                "dropoff_latitude": input_data.dropoff_latitude,
                "dropoff_longitude": input_data.dropoff_longitude,
                "passenger_count": input_data.passenger_count,
                "pickup_time": input_data.pickup_time,
            },
            "fare_amount": prediction
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))