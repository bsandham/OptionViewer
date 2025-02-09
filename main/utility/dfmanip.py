from typing import Optional, Dict, Any
import pandas as pd
from main.data.dataLoader import DataLoader
from pydantic import BaseModel

data = DataLoader()

class ContractCreate(BaseModel):
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
    underlyingPrice: Optional[float] = None

class DFManipulation:
    """
    class to handle general dataframe manipulation tasks. methods to create and edit existing contracts which are integrated in with the frontend
    """
    def __init__(self):
        self.filterTag = None   # BOOL TRUE/FALSE
        self._df = pd.read_csv("data\contracts.csv") # read the contracts csv file into a dataframe
    
    # Add property to access _df
    @property
    def df(self):
        return self._df

    @df.setter
    def df(self, value):
        self._df = value

    def createContract(self, contract_data: ContractCreate) -> Dict[str, Any]:
        """Create a new contract"""
        try:
            # Convert Pydantic model to dict if it's not already
            contract_dict = contract_data if isinstance(contract_data, dict) else contract_data.model_dump()

            # Load fresh data
            self.df = pd.read_csv("data/contracts.csv")

            # Check if contract exists
            if contract_dict['contractID'] in self.df['contractID'].values:
                raise ValueError("Contract ID already exists")

            # Add new contract to DataFrame
            self.df = pd.concat([self.df, pd.DataFrame([contract_dict])], ignore_index=True)

            # Save to CSV
            self.df.to_csv("data/contracts.csv", index=False)

            return contract_dict

        except Exception as e:
            print(f"Error in createContract: {str(e)}")
            raise e
    
    def updateContract(self, contractID: str, contractData: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Update an existing contract"""
        try:
            
            self.df = data.getDataFromContractsCSV(self)
            
            # ceck if contract exists
            if contractID not in self.df['contractID'].values:
                return None

            # define the fields that the user should be able to edit
            editable_fields = [
                'name', 
                'strike', 
                'underlying', 
                'price', 
                'bid', 
                'ask', 
                'volume', 
                'impliedVol'
            ]

            # update the fields
            for field in editable_fields:
                if field in contractData:
                    self.df.loc[self.df['contractID'] == contractID, field] = contractData[field]

            # write directly to the csv to save
            self.df.to_csv("data/contracts.csv", index=False)
            
            # return the new contract data in a dict
            updated_contract = self.df[self.df['contractID'] == contractID].iloc[0].to_dict()
            return updated_contract

        except Exception as e:
            print(f"Error updating contract: {str(e)}")
            raise e
