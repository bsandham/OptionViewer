from typing import Dict, List, Any, Optional, Union
import pandas as pd 

class OptionParser:
    """class to fetch contract data from CSV based on contract ID"""
    
    @staticmethod
    def parseContract(contractID: str, df: Optional[pd.DataFrame] = None) -> Dict[str, Any]:
        """
        fetch all fields for a given contract from the CSV
        Args:
            contractID (str): The ID of the contract to find
            df (Optional[pd.DataFrame]): DataFrame containing contract data, if None will read from CSV
        Returns:
            Dict containing all fields for the contract
        """
        try:
            # read from csv if no dataframe is specified in the args. 
            if df is None:
                df = pd.read_csv('data/contracts.csv')
            
            contract = df[df['contractID'] == contractID] # locate the row of the contractID we are after

            return contract.iloc[0].to_dict() # convert the row to a dictionary
            
        except Exception as e:
            print(f"Error: {str(e)}")
            return {}
    
    @staticmethod
    def getField(contractID: str, field: str, df: Optional[pd.DataFrame] = None) -> Union[str, float, int]:
        """utilises the parseContract method to get a single field from a contract, given a contract ID
        
        Args: contractID (str)
        """
        contract_data = OptionParser.parseContract(contractID, df)

        return contract_data[field]
    
    @staticmethod
    def getFields(contractID: str, fields: list, df: Optional[pd.DataFrame] = None) -> Dict[str, Any]:
        """get multiple fields for a contract"""
        contract_data = OptionParser.parseContract(contractID, df)
        return {field: contract_data[field] for field in fields if field in contract_data} # literally the same logic as above but with a for loop to get every field we specified