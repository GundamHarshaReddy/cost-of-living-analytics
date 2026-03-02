from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import os
import logging
from typing import List, Dict, Optional, Any
from dotenv import load_dotenv
from groq import Groq

# Load environment variables from .env file if present
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI
app = FastAPI(title="Cost-of-Living Analytics API")

# Initialize Groq Client
groq_client = None
if os.getenv("GROQ_API_KEY"):
    groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))


# CORS
# Typically allow local frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Constants
CSV_FILE = "livingcost_india_all_inr.csv"

# Functions for data processing
def clean_city_name(city: str) -> str:
    """Clean city name by removing 'Cost of Living in ' prefix and converting to lowercase"""
    if isinstance(city, str):
        if city.startswith("Cost of Living in "):
            city = city.replace("Cost of Living in ", "")
        return city.lower().strip()
    return ""

def calculate_stress_score(rent: float, salary: float) -> float:
    if pd.isna(salary) or salary == 0:
        return 0
    if pd.isna(rent):
        return 0
    
    score = rent / salary
    # Cap score if needed to avoid infinite or crazy values
    if pd.isna(score): # removed pd.isinf which doesn't exist
        return 0
    # Check for infinity manually or via numpy if available, but simplest is:
    if score == float('inf') or score == float('-inf'):
        return 0
    
    return score

def get_stress_level(stress_score: float) -> str:
    if pd.isna(stress_score) or stress_score == 0:
        return "Unknown" # Return a new status for unknown/missing data
    elif stress_score < 0.30:
        return "Low"
    elif 0.30 <= stress_score <= 0.50:
        return "Moderate"
    else:
        return "High"

def load_and_process_csv() -> pd.DataFrame:
    """Load CSV and return a standardized DataFrame"""
    csv_path = CSV_FILE
    if not os.path.exists(CSV_FILE):
        if os.path.exists(os.path.join(".", CSV_FILE)):
             csv_path = os.path.join(".", CSV_FILE)
        else:
            logger.error(f"{CSV_FILE} not found")
            return pd.DataFrame()
    
    try:
        df = pd.read_csv(csv_path)
        
        # New CSV format already has snake_case columns
        # We ensure they are present.
        # Format: city,cost_one_person_usd,rent_one_person_usd,...,cost_one_person_inr,...
        
        # Normalize column names just in case
        df.columns = [c.lower() for c in df.columns]

        if "city" not in df.columns:
             logger.error("City column not found in CSV")
             return pd.DataFrame()

        df["city"] = df["city"].apply(clean_city_name)
        
        # Ensure we have the required fields for the API
        required_fields = [
            "cost_one_person_inr", 
            "rent_one_person_inr", 
            "monthly_salary_after_tax_inr", 
            "income_after_rent_inr", 
            "months_covered"
        ]
        
        for col in required_fields:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)
            else:
                df[col] = 0 # Fill missing columns with 0

        df["stress_score"] = df.apply(
            lambda row: calculate_stress_score(row.get("rent_one_person_inr", 0), row.get("monthly_salary_after_tax_inr", 0)), 
            axis=1
        )
        df["stress_level"] = df["stress_score"].apply(get_stress_level)
        
        return df
    except Exception as e:
        logger.error(f"Error processing CSV: {e}")
        return pd.DataFrame()

# Initialize Database connection
from db import Database

db = Database()

@app.on_event("startup")
async def startup_event():
    """On startup, load CSV and seed Cosmos DB if connected"""
    df = load_and_process_csv()
    if not df.empty and db.container:
        try:
             # Seed data logic is in db.py
             db.seed_data(df)
        except Exception as e:
            logger.error(f"Failed to seed database: {e}")
    elif not db.container:
         logger.info("Running in CSV-only mode (No Cosmos DB connection)")

@app.get("/api/cities")
async def get_cities():
    """Get list of all available cities"""
    try:
        cities = []
        if db.container:
             cities = db.get_all_cities()
        
        # Fallback to CSV if DB empty / failed or offline
        if not cities:
            df = load_and_process_csv()
            if not df.empty:
                cities = df["city"].unique().tolist()
        
        cities = sorted(list(set(cities)))
        return {"cities": cities}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/city/{city}")
async def get_city_data(city: str):
    """Get affordability data for a specific city"""
    try:
        city_clean = clean_city_name(city)
        data = None
        
        if db.container:
            data = db.get_city(city_clean)
            if isinstance(data, list):
                 data = data[0] if data else None

        # Fallback to CSV
        if not data:
            df = load_and_process_csv()
            if not df.empty:
                matches = df[df["city"] == city_clean]
                if not matches.empty:
                    data = matches.iloc[0].to_dict()

        if not data:
             raise HTTPException(status_code=404, detail=f"City '{city}' not found")

        return {
            "city": data.get("city"),
            "cost_one_person_inr": data.get("cost_one_person_inr"),
            "rent_one_person_inr": data.get("rent_one_person_inr"),
            "monthly_salary_after_tax_inr": data.get("monthly_salary_after_tax_inr"),
            "income_after_rent_inr": data.get("income_after_rent_inr"),
            "months_covered": data.get("months_covered"),
            "stress_score": data.get("stress_score"),
            "stress_level": data.get("stress_level")
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/chat")
async def chat_with_ai(
    message: str = Body(..., embed=True),
    context: Optional[Dict] = Body(None, embed=True)
):
    """Chat endpoint using Groq API"""
    if not groq_client:
        return {"response": "I'm sorry, my AI brain isn't connected right now. Please set the GROQ_API_KEY in the backend configuration."}

    try:
        # Construct system prompt with context
        system_prompt = (
            "You are a strict financial advisor specializing in cost-of-living analysis for Indian cities. "
            "You MUST ONLY answer questions related to cost of living, rent, salary, affordability, and financial planning in India. "
            "If a user asks about anything else (like general knowledge, coding, or personal questions), politely refuse and steer them back to finances. "
            "Provide quantitative analysis where possible."
        )
        
        if context and context.get('city'):
            city = context.get('city')
            rent = context.get('rent', 0)
            salary = context.get('salary', 0)
            savings_est = float(salary) - float(rent)
            system_prompt = (
                f"You are an intelligent financial advisor for Indian cities. "
                f"CONTEXT: The user is currently viewing data for '{city}' (Rent: ₹{rent}, Salary: ₹{salary}). "
                "IMPORTANT INSTRUCTIONS:\n"
                "1. If the user asks about the CURRENT city ({city}), use the provided data numbers exactly.\n"
                "2. If the user asks about a DIFFERENT city (e.g., Hyderabad, Mumbai), IGNORE the dashboard data. Instead, use your own internal knowledge to provide specific, realistic numbers and a detailed plan for that requested city. Do NOT apologize for not having dashboard data. Just answer helpfuly.\n"
                "3. If the user asks for a 'Personalized Plan', ask for their income/lifestyle ONLY if you don't have enough info. If they just say 'plan for Hyderabad', assume a typical middle-class scenario (e.g., ₹50k-80k salary) and give a sample breakdown first, then ask for their specifics to refine it.\n"
                "4. Be confident and direct. Do not keep repeating 'I am viewing the dashboard for X'.\n"
            )

        # If user message asks for savings, explicitly calculate it
        if "savings" in message.lower() and context and context.get('salary') and context.get('rent'):
             savings = context.get('salary') - context.get('rent')
             system_prompt += f"\nNote: The estimated monthly savings (Salary - Rent) is ₹{savings}."

        completion = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": message}
            ],
            temperature=0.7,
            max_tokens=300,
        )
        return {"response": completion.choices[0].message.content}
    except Exception as e:
         logger.error(f"Groq API Error: {e}")
         return {"response": f"I'm encountering an error: {str(e)}. Please check my API key configuration."}

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
