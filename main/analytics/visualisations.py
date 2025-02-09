import matplotlib as plt 
import numpy as np
import pandas as pd
from ..models.optionParser import OptionParser
from datetime import datetime
from typing import Dict
import scipy.interpolate
from main.data.dataLoader import DataLoader

class Visualisations:
    """
    class to handle any visualisation tasks that are required. both return the data required for the visualisations, which is plotted in the frontend 
    """
    def modelVolSurface(self, name: str) -> tuple:
        """
        this does not quite work as intended. currently the calculations return a tuple of None, None. i think this is due to an error with the noise levels within the data itself.
        """
        try:
            allContracts = DataLoader.getDataFromContractsCSV(self)
            allContractsFromUnderlying = allContracts[allContracts['underlying'] == name] # filter the contracts to only include those with the same underlying asset (we are generating the vol surface from an options chain, as we need to consider different strikes and expiries)

            if allContractsFromUnderlying.empty: # error handling for if we don't have the data
                print(f"No contracts found for {name}")
                return None, None

            # dictionary for the data required for the surface plot

            surfaceData = { 
                'strikes': [],
                'expiries': [],
                'ivs': [],
                'underlyingPrice': None,
                'moneyness': None
            }

            for _, row in allContractsFromUnderlying.iterrows(): # iterate through the contracts to extract the data required for the surface plot
                try:
                    expiry_date = datetime.strptime(row['expiration'], '%d/%m/%Y') # convert the expiration date to a datetime object - using .days method again later on
                    today = datetime.now()
                    dte = (expiry_date - today).days

                    if dte > 0:  # only include non-expired options
                        surfaceData['strikes'].append(float(row['strike']))
                        surfaceData['expiries'].append(dte/365)  # convert days to expiry to years
                        surfaceData['ivs'].append(float(row['impliedVol']))

                        if surfaceData['underlyingPrice'] is None:
                            surfaceData['underlyingPrice'] = float(row['underlyingPrice']) # assume all contracts have the same underlying price since they are based on the same underlying. works as this only needs to be correct at a point in time

                except (ValueError, TypeError) as e:
                    print(f"Error processing: {row['contractID']}: {str(e)}")
                    continue

            if not surfaceData['strikes']:
                print(f"No data (strikes) for this: {name}")
                return None, None

            # convert to a numpy array as i kept getting NaN values messing up my calculations
            surfaceData['strikes'] = np.array(surfaceData['strikes'])
            surfaceData['expiries'] = np.array(surfaceData['expiries'])
            surfaceData['ivs'] = np.array(surfaceData['ivs'])
            
            # remove said NaN values using a mask - tests element-wise for NaNs
            mask = ~np.isnan(surfaceData['ivs'])
            surfaceData['strikes'] = surfaceData['strikes'][mask]
            surfaceData['expiries'] = surfaceData['expiries'][mask]
            surfaceData['ivs'] = surfaceData['ivs'][mask]

            if len(surfaceData['strikes']) < 4:  # basically the miniumum number of data points required to generate a surface (interpolate)
                return None, None

            surfaceData['moneyness'] = surfaceData['strikes'] / surfaceData['underlyingPrice'] # moneyness is the ratio of the strike price to the underlying price

            # create the ranges of strikes and expiries, then attempt a meshgrid conversion
            strikeRange = np.linspace(min(surfaceData['strikes']), max(surfaceData['strikes']), 50)
            expiryRange = np.linspace(min(surfaceData['expiries']), max(surfaceData['expiries']), 50)
            strikeMesh, expiry_mesh = np.meshgrid(strikeRange, expiryRange)

            # interpolate surface using cubic interpolation. generally this is a pretty bad method of doing it but i just don't have the data
            points = np.column_stack((surfaceData['strikes'], surfaceData['strikes']))
            ivSurface = scipy.interpolate.griddata(
                points, 
                surfaceData['ivs'], 
                (strikeMesh, expiry_mesh), 
                method='cubic',
                fill_value=np.nan
            )

            # attempt to replace any NaN values with the nearest values, using a mask. this is a bit of a hacky solution but it works for now
            mask = np.isnan(ivSurface)
            ivSurface[mask] = scipy.interpolate.griddata(
                points,
                surfaceData['ivs'],
                (strikeMesh[mask], expiry_mesh[mask]),
                method='nearest'
            )

            # return data in the right format that ContractViewer is expecting
            return {
                'x': strikeRange.tolist(),  
                'y': expiryRange.tolist(),  
                'z': ivSurface.tolist(),    
            }

        except Exception as e:
            print(f"Error generating volatility surface for {name}: {str(e)}")
            return None, None

    def modelPerformanceOverTime(self, contractID: str) -> dict:
        """
        returns performance over time data in a format that can be used by ContractViewer
        """
        priceHistoryDF = DataLoader.getDataFromPriceHistoryCSV(self) # load tha data up
        priceHistoryDF['priceDate'] = pd.to_datetime(priceHistoryDF['priceDate'])

        contractData = priceHistoryDF[priceHistoryDF['contractID'] == contractID].copy()

        if contractData.empty:
            raise ValueError("No data for contract")
        
        contractData = contractData.sort_values('priceDate') # sort to most recent
        
        # MA calculations - does MA5 and MA20 due to data limitations. ideally would have a few more time periods :(
        contractData['MA5'] = contractData['historicalPrice'].rolling(window=5).mean()
        contractData['MA20'] = contractData['historicalPrice'].rolling(window=20).mean()

        # format data for frontend expects
        result = contractData.assign(
            priceDate=contractData['priceDate'].dt.strftime('%d-%m-%Y'),  # change to iso dates
            historicalPrice=contractData['historicalPrice'].round(2),
            MA5=contractData['MA5'].round(2),
            MA20=contractData['MA20'].round(2)
        ).to_dict('records')
    
        return result