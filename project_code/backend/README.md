# Cost-of-Living Analytics Backend

## Setup Instructions

### 1. Install Python Dependencies
```bash
pip install -r requirements.txt
```

### 2. Prepare Data
Place your CSV file named `livingcost_india_all_inr.csv` in the `backend/` directory.

**Expected CSV Format:**
```
City Name,Cost of Living (₹),Rent (₹),Monthly Salary After Tax (₹),Income After Rent (₹),Months Covered
Cost of Living in Mumbai,85000,35000,75000,40000,5.6
Cost of Living in Delhi,72000,28000,68000,40000,5.9
...
```

### 3. Run the Server
```bash
python main.py
```

The API will be available at `http://localhost:8000`

### 4. API Endpoints

#### Get All Cities
```
GET /api/cities
```

Response:
```json
{
  "cities": ["mumbai", "delhi", "bangalore", ...]
}
```

#### Get City Data
```
GET /api/city/{city}
```

Example: `GET /api/city/mumbai`

Response:
```json
{
  "city": "mumbai",
  "cost_one_person_inr": 85000,
  "rent_one_person_inr": 35000,
  "monthly_salary_after_tax_inr": 75000,
  "income_after_rent_inr": 40000,
  "months_covered": 5.6,
  "stress_score": 0.4667,
  "stress_level": "Moderate"
}
```

#### Health Check
```
GET /health
```

### 5. Stress Score Calculation
- **Formula**: `stress_score = rent / monthly_salary`
- **Low**: score < 0.30
- **Moderate**: 0.30 ≤ score ≤ 0.50
- **High**: score > 0.50

## Notes
- The API automatically cleans city names (removes "Cost of Living in " prefix, converts to lowercase)
- CORS is enabled for frontend integration
- All monetary values are in INR (Indian Rupees)