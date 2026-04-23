from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import os
import logging
import json
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

def find_city_in_csv(city_name: str) -> Optional[Dict]:
    """Look up a city in the CSV and return its data"""
    df = load_and_process_csv()
    if df.empty:
        return None
    city_clean = clean_city_name(city_name)
    matches = df[df["city"].str.contains(city_clean, case=False, na=False)]
    if not matches.empty:
        row = matches.iloc[0]
        return {
            "city": row.get("city", city_clean),
            "rent": row.get("rent_one_person_inr", 0),
            "salary": row.get("monthly_salary_after_tax_inr", 0),
            "cost": row.get("cost_one_person_inr", 0),
            "income_after_rent": row.get("income_after_rent_inr", 0),
        }
    return None

# List of known city names from CSV for matching
KNOWN_CITIES = [
    "bangalore", "mumbai", "delhi", "hyderabad", "chennai", "pune", "kolkata",
    "ahmedabad", "jaipur", "lucknow", "surat", "goa", "chandigarh", "indore",
    "bhopal", "nagpur", "coimbatore", "mysore", "vadodara", "rajkot", "patna",
    "ranchi", "guwahati", "srinagar", "jodhpur", "agra", "varanasi", "ludhiana",
    "amritsar", "nashik", "thane", "faridabad", "ghaziabad", "meerut", "kanpur",
    "raipur", "madurai", "aurangabad", "navi mumbai", "howrah", "kalyan",
    "vijayawada", "visakhapatnam", "kota", "dhanbad", "jamshedpur", "jabalpur",
    "gwalior", "allahabad",
]

def detect_mentioned_cities(message: str, current_city: Optional[str] = None) -> List[str]:
    """Detect city names mentioned in the user message"""
    message_lower = message.lower()
    mentioned = []
    for city in KNOWN_CITIES:
        if city in message_lower and city != (current_city or "").lower():
            mentioned.append(city)
    return mentioned


@app.post("/api/chat")
async def chat_with_ai(
    message: str = Body(..., embed=True),
    context: Optional[Dict] = Body(None, embed=True),
    history: Optional[List[Dict]] = Body(None, embed=True),
):
    """Chat endpoint using Groq API with conversation history and markdown formatting"""
    if not groq_client:
        return {"response": "I'm sorry, my AI brain isn't connected right now. Please set the `GROQ_API_KEY` in the backend configuration."}

    try:
        # ── Base formatting instructions ──
        formatting_rules = (
            "\n\n## RESPONSE FORMATTING RULES (VERY IMPORTANT):\n"
            "- Use **Markdown** formatting in your 'response' value.\n"
            "- Use **bold** for key numbers and important terms.\n"
            "- Use bullet points (- ) for lists and breakdowns.\n"
            "- Use ### headers to separate sections in longer answers.\n"
            "- When comparing cities, use a markdown table like:\n"
            "  | Metric | City A | City B |\n"
            "  |--------|--------|--------|\n"
            "  | Rent   | ₹X     | ₹Y     |\n"
            "- When giving a budget/savings plan, format as a clear breakdown:\n"
            "  - **Rent**: ₹X\n"
            "  - **Food**: ₹X\n"
            "  - **Transport**: ₹X\n"
            "  - **Savings**: ₹X\n"
            "- Keep responses concise but well-structured. Aim for 150-400 words.\n"
            "- End with a helpful follow-up question or suggestion.\n"
        )

        # ── Off-topic guard ──
        offtopic_refuse_msg = (
            "I'm your **Cost-of-Living Financial Advisor** \U0001f3e6 — "
            "I can only help with questions about rent, salary, savings, city comparisons, "
            "and budget planning in India. Try asking me something like:\\n\\n"
            "- *What's the cost of living in Mumbai?*\\n"
            "- *Compare Bangalore vs Hyderabad*\\n"
            "- *Create a savings plan for me*"
        )
        offtopic_guard = (
            "\n\n## STRICT TOPIC GUARD:\n"
            "You are ONLY allowed to discuss: cost of living, rent, salary, housing, savings, "
            "budget planning, financial stress, city affordability, and city comparisons in India.\n"
            "If the user asks about ANYTHING else (jokes, coding, general knowledge, weather, sports, "
            "personal questions, etc.), you MUST refuse politely. Use this message as the 'response' value: "
            f"{offtopic_refuse_msg}\n"
            "Set 'target_city' to null. Do NOT attempt to answer off-topic questions, even partially.\n"
        )

        # ── JSON output instruction ──
        json_instruction = (
            "\n\n## OUTPUT FORMAT:\n"
            "You MUST respond ONLY with a valid JSON object containing exactly two keys:\n"
            "- 'response': your message in **Markdown format**\n"
            "- 'target_city': the city name in lowercase if the user is asking about a DIFFERENT city than the current context, otherwise null\n"
        )

        # ── Build system prompt based on context ──
        if context and context.get('city'):
            city = context.get('city')
            rent = context.get('rent', 0)
            salary = context.get('salary', 0)
            savings_est = float(salary) - float(rent)
            
            system_prompt = (
                f"You are an expert financial advisor AI specializing in cost-of-living analysis for Indian cities.\n\n"
                f"## CURRENT DASHBOARD CONTEXT:\n"
                f"- **City**: {city}\n"
                f"- **Average Rent (1BHK)**: ₹{rent:,.0f}\n"
                f"- **Average Salary (after tax)**: ₹{salary:,.0f}\n"
                f"- **Estimated Savings (Salary - Rent)**: ₹{savings_est:,.0f}\n\n"
                f"## INSTRUCTIONS:\n"
                f"1. If the user asks about **{city}**, use the dashboard data above.\n"
                f"2. If the user asks about a DIFFERENT city, use the REAL DATA provided below (if available), NOT your internal guesses.\n"
                f"3. Be confident, specific, and data-driven. Never say 'I don't have data'.\n"
                f"4. For personalized plans, if they don't give income info, use the dashboard salary as a starting point.\n"
            )
        else:
            system_prompt = (
                "You are an expert financial advisor AI specializing in cost-of-living analysis for Indian cities.\n"
                "Help users understand costs, compare cities, and plan their finances.\n"
                "Be data-driven and specific with numbers.\n"
            )

        # ── Inject real CSV data for mentioned cities ──
        mentioned_cities = detect_mentioned_cities(message, context.get('city') if context else None)
        if mentioned_cities:
            system_prompt += "\n## REAL DATA FOR MENTIONED CITIES:\n"
            for mc in mentioned_cities[:3]:  # Limit to 3 cities
                city_data = find_city_in_csv(mc)
                if city_data:
                    system_prompt += (
                        f"\n### {city_data['city'].title()}:\n"
                        f"- Rent (1BHK): ₹{city_data['rent']:,.0f}\n"
                        f"- Salary (after tax): ₹{city_data['salary']:,.0f}\n"
                        f"- Total Cost of Living: ₹{city_data['cost']:,.0f}\n"
                        f"- Income After Rent: ₹{city_data['income_after_rent']:,.0f}\n"
                    )

        # If user asks about savings, calculate explicitly
        if "savings" in message.lower() and context and context.get('salary') and context.get('rent'):
            savings = context.get('salary') - context.get('rent')
            system_prompt += f"\n**Note**: Estimated monthly savings (Salary - Rent) = ₹{savings:,.0f}\n"

        # Append formatting rules, off-topic guard, and JSON instruction
        system_prompt += formatting_rules + offtopic_guard + json_instruction

        # ── Build message list with conversation history ──
        messages = [{"role": "system", "content": system_prompt}]
        
        if history:
            # Include last 10 messages for context (skip system messages)
            for msg in history[-10:]:
                role = msg.get("role", "user")
                content = msg.get("content", "")
                if role in ("user", "assistant") and content:
                    messages.append({"role": role, "content": content})
        
        messages.append({"role": "user", "content": message})

        completion = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            temperature=0.7,
            max_tokens=800,
            response_format={"type": "json_object"}
        )
        content = completion.choices[0].message.content
        try:
            parsed = json.loads(content)
            return {"response": parsed.get("response", content), "target_city": parsed.get("target_city")}
        except json.JSONDecodeError:
            return {"response": content, "target_city": None}
    except Exception as e:
         logger.error(f"Groq API Error: {e}")
         return {"response": f"⚠️ I'm encountering an error: `{str(e)}`. Please check the API key configuration."}

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
