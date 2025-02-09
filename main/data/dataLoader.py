import pandas as pd
from typing import Optional, Dict, Any
import requests
from datetime import datetime, timedelta
from ..models.optionParser import OptionParser

class DataLoader:
    def __init__(self):
        self.df = None
        
    def getDataFromContractsCSV(self):
        """
        method that reads the data from the contracts csv file and stores it in a dataframe, standardising the data as well
        """
        try:
            self.df = pd.read_csv("data/contracts.csv") # read the csv and store in df
            
            # standardise the type column as some are uppercase and some are lowercase
            if 'type' in self.df.columns:
                self.df['type'] = self.df['type'].str.upper()  # convert all to uppercase
                
            # convert any numerical columns to the correct type
            numeric_columns = ['strike', 'price', 'bid', 'ask', 'volume', 'impliedVol', 'underlyingPrice']
            for col in numeric_columns:
                if col in self.df.columns:
                    self.df[col] = pd.to_numeric(self.df[col], errors='coerce')
            
            return self.df
            
        except Exception as e:
            print(f"Error reading CSV: {str(e)}")
            raise e

    def getDataFromPriceHistoryCSV(self):
        """
        method to get the data from the priceHistory csv file and store it in a dataframe.
        """
        self.df = pd.read_csv("data\priceHistory.csv")

        return self.df
    
    def parseOptionDetails(self, contractID: str, fields: Optional[list] = None): # required to use the OptionParser class in any useful capacity
        """
        wrapper method to use OptionParser with the df. args: contractID (str), [OPTIONAL] fields (list) 
        """
        if self.df is None:
            self.getDataFromCSV()
            
        if fields:
            return OptionParser.getFields(contractID, fields, self.df)
        return OptionParser.parseContract(contractID, self.df)
    
    def getNewsfeed(self, underlying: str) -> list:
        """
        method to get the newsfeed for a given underlying asset. args: underlying (str) e.g 'AAPL', returns latest related news articles from the last 7 days
        """

        apiKey = 'YOUR_API_KEY' # ideally this would be stored securely and not in plain text
        daysBack = 7
        maxArticles = 4 # can be anything - default return is 8
        baseUrl = "https://api.webz.io/newsApiLite"
        
        endDate = datetime.now()
        startDate = endDate - timedelta(days=daysBack)
      
        params = { # parameters for the API request
            "token": apiKey,
            "q": f"\"{underlying}\" OR \"{underlying} stock\"",  
            "ts": f"{startDate.timestamp()}:{endDate.timestamp()}",
            "sort": "published",
            "size": maxArticles,
            "format": "json"
        }
        
        try:
            response = requests.get(baseUrl, params=params)
            response.raise_for_status()
            data = response.json() # capture the response as a json object
            
            articles = []
            for article in data.get('posts', []): # iterate through the articles and extract the relevant data
                articles.append({
                    'title': article.get('title'),
                    'publishedDate': article.get('published'),
                    'source': article.get('thread', {}).get('site_full'),
                    'url': article.get('url'),
                    'text': article.get('text'),
                    'language': article.get('language')
                })
            
            return articles
        
        except requests.exceptions.RequestException as e:
            print(f"Error fetching news: {str(e)}")
            return []
        
        except (KeyError, ValueError) as e:
            print(f"Error parsing response: {str(e)}")
            return []