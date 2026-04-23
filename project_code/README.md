# Cost of Living Analytics Platform

A full-stack web application for analyzing cost of living and affordability across Indian cities.

## Tech Stack
- **Frontend**: React + Tailwind CSS (Vite)
- **Backend**: Python FastAPI
- **Database**: Azure Cosmos DB (with CSV fallback)
- **Infrastructure**: Azure Container Apps (via `azd`)

## Setup & Run Locally

1. **Backend**:
   ```bash
   cd backend
   pip install -r requirements.txt
   uvicorn main:app --reload
   ```

2. **Frontend**:
   ```bash
   npm install
   npm run dev
   ```

## Deploy to Azure

Prerequisites: [Azure Developer CLI (azd)](https://learn.microsoft.com/en-us/azure/developer/azure-developer-cli/install-azd)

1. Login to Azure:
   ```bash
   azd auth login
   ```

2. Initialize and deploy:
   ```bash
   azd up
   ```

3. **Important Configuration**:
   After deployment, go to the Azure Portal -> Container Apps -> [your-backend-app] -> Settings -> Containers -> Edit -> Environment variables.
   Add:
   - `AZURE_COSMOS_CONNECTION_STRING`: Copy this value from the `azd up` output or the Key Vault secret.
   - `COSMOS_ENDPOINT`: Alternatively, use Endpoint & Key.

   The application will automatically seed the database from the CSV on first run.

## API Documentation

Once running, visit `http://localhost:8000/docs` for the Swagger UI.
