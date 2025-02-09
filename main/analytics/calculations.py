from datetime import datetime
import math
import numpy as np
from scipy.stats import norm
from datetime import timedelta
import pandas as pd
from typing import Dict
from ..models.optionParser import OptionParser
from ..data.dataLoader import DataLoader

class Calculations:
    """
    class to handle the calculations for the options contracts. the methods query the data themselves and return the calculated values, displayed in dict or float format
    """
    def findGreeks(self, contractID: str) -> Dict[str, float]:
        """
        method to calculate and return Greeks (delta, gamma, vega, theta) for a given contract. calculations done with the Black-Scholes model, assuming these options are European.

        args: contractID (str) e.g 'NVDA22311.......'
        """
        try:
            contract = OptionParser.parseContract(contractID) # fetch each piece of data from the contractID

            greeksDict = {
                'delta': None,
                'gamma': None,
                'vega': None,
                'theta': None
            }
            
            try:
                expiry = datetime.strptime(contract['expiration'], '%d/%m/%Y') # convert the expiration date to a datetime object which allows us to use the .days method later on
                today = datetime.now()

                daysToExpiry = (expiry-today).days
                if daysToExpiry <= 0:
                    print(f"Contract {contractID} has expired") # an expired option has no value, and therefore has no Greeks applied. 
                    return greeksDict
                    
                yearsToExpiry = daysToExpiry/252 # 252 represents the number of trading days in a year - this is the standard used in the Black-Scholes model

                # validate the parameters to avoid any potential math domain errors 
                sigma = float(contract['impliedVol']/100) 
                if sigma <= 0:
                    print(f"Invalid implied volatility for {contractID}: {sigma}") # implied volatility (sigma) must be positive
                    return greeksDict

                S = float(contract['underlyingPrice'])
                K = float(contract['strike'])
                if S <= 0 or K <= 0: # underlying price and strike price must be positive (obviously, as you cant have negative price)
                    print(f"Invalid price parameters for {contractID}: S={S}, K={K}")
                    return greeksDict

                r = 0.045  # 4.5% risk free rate, represents the interest rate at a given point of time. correct as of 01/25

                try: # use of the black-scholes model to calculate the Greeks
                    term1 = math.log(S/K)
                    term2 = (r + ((sigma**2) * 0.5)*yearsToExpiry)
                    denominator = sigma * math.sqrt(yearsToExpiry)
                    
                    if denominator == 0:
                        print(f"Cant divide thru by 0: {contractID}")
                        return greeksDict

                    d1 = (term1 + term2)/denominator
                    d2 = d1 - sigma * math.sqrt(yearsToExpiry)
                    
                    # there is a different formula depending on whether the option is a call or a put. this is because the delta of a call is positive, and the delta of a put is negative
                    if contract['type'].lower() == "call": 
                        greeksDict['delta'] = norm.cdf(d1) # norm.cdf is the cumulative distribution function of the standard normal distribution
                    else:
                        greeksDict['delta'] = norm.cdf(d1) - 1
                    
                    gamma = norm.pdf(d1) / (S * sigma * math.sqrt(yearsToExpiry))
                    greeksDict['gamma'] = gamma

                    vega = S * math.sqrt(yearsToExpiry) * norm.pdf(d1)
                    greeksDict['vega'] = vega/100

                    if contract['type'].lower() == 'call': # theta is calculated differently for calls and puts. this is because the theta of a call is negative, and the theta of a put is positive as t tends towards expiry.
                        theta = (-(S * sigma * norm.pdf(d1)) / (2 * math.sqrt(yearsToExpiry))) - r * K * math.exp(-r * yearsToExpiry) * norm.cdf(d2)
                    else:
                        theta = (-(S * sigma * norm.pdf(d1)) / (2 * math.sqrt(yearsToExpiry))) + r * K * math.exp(-r * yearsToExpiry) * norm.cdf(-d2)

                    greeksDict['theta'] = theta 

                except Exception as calc_error: # catch any errors that may occur during the calculation
                    print(f"Calculation error for {contractID}: {str(calc_error)}")
                    print(f"Parameters: S={S}, K={K}, sigma={sigma}, T={yearsToExpiry}")
                    return greeksDict
                
                # round any value that is not None in the dict to 4dp
                for key in greeksDict:
                    if greeksDict[key] is not None:
                        greeksDict[key] = round(greeksDict[key], 4)
                        
                return greeksDict
                
            except ValueError as date_error:
                print(f"Dae error for {contractID}: {str(date_error)}")
                return greeksDict
                
        except Exception as e:
            print(f"Error on contract: {contractID}: {str(e)}")
            return greeksDict

    def findPerformance(self, contractID: str, timescale: int) -> float:
        """
        method to return the percentage change in the contracts value for a given contract and time period. 
        args: contractID (str), timescale (int) e.g 'NVDA22311', 30 to get the percentage change in the last 30 days
        """
        priceHistoryDF = DataLoader.getDataFromPriceHistoryCSV(self)
        priceHistoryDF['priceDate'] = pd.to_datetime(priceHistoryDF['priceDate'], format='%d/%m/%Y') # convert the priceDate column to a datetime object (we need to use the timedelta method later on)

        contractData = priceHistoryDF[priceHistoryDF['contractID'] == contractID].copy()

        if contractData.empty:
            raise ValueError("Couldn't find the price history for the contract")
        
        contractData = contractData.sort_values('priceDate')

        endDate = contractData['priceDate'].max()
        startDate = endDate - timedelta(days=timescale) # get the start date by subtracting the timescale from the end date

        startPrice = contractData[contractData['priceDate'] >= startDate].iloc[0]['historicalPrice'] # get the price of the contract on the start date
        endPrice = contractData[contractData['priceDate'] == endDate].iloc[0]['historicalPrice'] # get the price of the contract on the end date

        percentChange = ((endPrice - startPrice) / startPrice) * 100
        return percentChange

    def findNotionalRisk(self, contractID: str) -> float:
        """ 
        notional risk = delta x underlyingPrice x 100 (1 option represents 100 of the underlying asset)

        i didn't end up using this function as IV can give you a good enough view of the risk of a contract, but it is still useful to have as a reference
        """
        greeksDict = self.findGreeks(contractID)
        delta = greeksDict['delta']
        underlyingPrice = OptionParser.getField(contractID, 'underlyingPrice')
        notionalRisk = (delta * underlyingPrice * 100)
        return notionalRisk