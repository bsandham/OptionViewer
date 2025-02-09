# app.py
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from typing import List, Optional
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import os
import sys
from main.analytics.calculations import Calculations
from main.analytics.visualisations import Visualisations
from main.data.dataLoader import DataLoader
from main.utility.dfmanip import DFManipulation
from pydantic import BaseModel

calc = Calculations()
vis = Visualisations()
data = DataLoader()
dfm = DFManipulation()

class ContractBase(BaseModel):
    contractID: str
    name: str
    type: str
    underlying: str
    strike: float
    price: Optional[float] = None
    bid: Optional[float] = None
    ask: Optional[float] = None
    volume: Optional[int] = None
    impliedVol: Optional[float] = None
    expiration: str

sys.path.append(os.path.dirname(os.path.realpath(__file__)))

app = FastAPI()

origins = [
    "http://localhost:5173",    
    "http://localhost:3000",    
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,      # Specify exact origins instead of ["*"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Cache for performance optimization
contracts_df = None
price_history_df = None

def load_contracts():
    """Load contracts from CSV file"""
    global contracts_df
    if contracts_df is None:
        try:
            contracts_df = data.getDataFromContractsCSV()
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error loading contracts: {str(e)}")
    return contracts_df

def load_price_history():
    """Load price history from CSV file"""
    global price_history_df
    if price_history_df is None:
        try:
            price_history_df = data.getDataFromPriceHistoryCSV()
            price_history_df['priceDate'] = pd.to_datetime(price_history_df['priceDate'])

        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error loading price history: {str(e)}")
    return price_history_df

@app.get("/")
async def root():
    """Root endpoint for API health check"""
    return {"status": "OK", "message": "API is running"}

@app.get("/api/contracts")
async def get_contracts():
    """Get all contracts"""
    try:
        df = load_contracts()
        return df.to_dict(orient='records')
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/contract/{contract_id}")
async def get_contract(contract_id: str):
    """Get specific contract by ID"""
    try:
        df = load_contracts()
        contract = df[df['contractID'] == contract_id]

        if contract.empty:
            raise HTTPException(status_code=404, detail="Contract not found")
        return contract.iloc[0].to_dict()
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@app.get("/api/contract/{contract_id}/greeks")
async def get_contract_greeks(contract_id: str):
    """Calculate Greeks for a specific contract"""
    try:
        result = calc.findGreeks(contract_id)
        print(f"Greeks calculated for {contract_id}:", result)  
        return result
    
    except Exception as e:
        print(f"Error calculating Greeks for {contract_id}:", str(e)) 
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/contract/{contract_id}/performance")
async def get_contract_performance(contract_id: str):
    try:
        df = data.getDataFromPriceHistoryCSV()
        contract_data = df[df['contractID'] == contract_id].copy()
        
        if contract_data.empty:
            raise HTTPException(status_code=404, detail="No performance data found")
        
        # Replace NaN values with None before converting to dict
        contract_data = contract_data.replace({np.nan: None, np.inf: None, -np.inf: None})
        
        # Convert to records
        result = contract_data.to_dict('records')
        return result
    except Exception as e:
        print(f"Error in performance endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/volatility-surface/{symbol}")
async def get_volatility_surface(symbol: str):
    """Get volatility surface data for a symbol"""
    try:
        surfaceData = vis.modelVolSurface(symbol)
        
        if surfaceData is None:
            raise HTTPException(status_code=404, detail="Volatility surface not found")
        
        return surfaceData

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/contract/{contract_id}/history")
async def get_contract_history(contract_id: str):
    """Get price history for a specific contract"""
    try:
        data = vis.modelPerformanceOverTime(contract_id)

        responseData = {
            'data': data.to_dict(orient='records')
        }
        return responseData
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/most-active")
async def get_most_active():
    """Find and list the top n contracts with greatest positive and negative price changes"""
    try:
        contracts = load_contracts()
        history = load_price_history()
        
        # get the most recent two prices available for each contract
        latest_prices = history.sort_values('priceDate').groupby('contractID').tail(2)
        
        # find the percentage change between the two prices
        changes = []
        for contract_id in latest_prices['contractID'].unique():
            contract_prices = latest_prices[latest_prices['contractID'] == contract_id]
            if len(contract_prices) == 2:
                old_price = contract_prices.iloc[0]['historicalPrice']
                new_price = contract_prices.iloc[1]['historicalPrice']
                pct_change = ((new_price - old_price) / old_price) * 100
                changes.append({
                    'contractID': contract_id,
                    'percentChange': pct_change
                })
        
        changes_df = pd.DataFrame(changes)
      
        result = pd.merge(contracts, changes_df, on='contractID')
    
        gainers = result.nlargest(10, 'percentChange')
        losers = result.nsmallest(10, 'percentChange')
        
        return {
            "gainers": gainers.to_dict(orient='records'),
            "losers": losers.to_dict(orient='records')
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@app.get("/api/symbols")
async def get_symbols():
    """Get list of all unique underlying symbols"""
    try:
        df = data.getDataFromContractsCSV()
            
        symbols = df['underlying'].unique().tolist()
        
        if not symbols:
            raise HTTPException(status_code=404, detail="No symbols found")
            
        return {"symbols": symbols}
    
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Contracts data file not found")
    
    except Exception as e:
        print(f"Error getting symbols: {str(e)}")  
        raise HTTPException(status_code=500, detail=str(e))
    
@app.get("/api/news/{symbol}")
async def get_news(symbol: str):
    """Get news articles for a specific symbol"""
    try:
        articles = data.getNewsfeed(symbol)
        
        if not articles:
            return []
            
        return articles
    
    except Exception as e:
        print(f"Error fetching news for {symbol}: {str(e)}")  
        raise HTTPException(status_code=500, detail=str(e))
    
@app.post("/api/contract/create")
async def create_contract(contract: ContractBase):
    try:
        # Convert Pydantic model to dict
        contract_dict = contract.dict()
        result = dfm.createContract(contract_dict)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"Error creating contract: {str(e)}")  # Debug print
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/contract/update/{contract_id}")
async def update_contract(contract_id: str, contract: ContractBase):
    try:
        # Convert Pydantic model to dict
        contract_dict = contract.dict()
        result = dfm.updateContract(contract_id, contract_dict)
        if result is None:
            raise HTTPException(status_code=404, detail="Contract not found")
        return result
    except Exception as e:
        print(f"Error updating contract: {str(e)}")  # Debug print
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)