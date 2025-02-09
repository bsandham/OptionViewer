# OptionViewer

A Collection Manager for Option Contracts

## Overview

OptionViewer is a tool that makes the process of finding and visualizing Options contracts easier. It was created to help people learn more about Options through an intuitive, easy-to-navigate interface.

## Understanding Options

Options are financial derivatives that derive their value from changes in the price of an underlying stock. Each options contract has three main components:

- **Underlying Asset**: The stock that the strike price is based on (e.g., NVIDIA, Apple or Microsoft)
- **Strike Price**: The price level of the underlying stock at which the option becomes "In The Money" (ITM)
- **Expiration Date**: The specific date when the contract expires and can therefore be exercised

**Important Note**: This project is based around European Options, rather than American. This choice was made because European Options are more widely traded.

## Installation

1. Unzip the Collection-Manager folder into your chosen directory (if downloaded rather than cloned)

2. Create a virtual environment:
```bash
python3 -m venv venv
```
Note: Use `python3` instead of `python` to ensure Python 3 compatibility. Scipy has dependency issues with newer Python versions.

3. Activate the virtual environment:
```bash
./venv/Scripts/activate
```

4. Install requirements:
```bash
pip install -r "docs/requirements.txt"
```

5. Navigate to Collection-Manager directory:
```bash
cd "<?path_to_collection_manager_dir?>"
```

6. Launch uvicorn:
```bash
python -m uvicorn app:app --reload
```

7. In a new terminal, navigate to frontend directory:
```bash
cd "<?path_to_the_frontend_directory?>"
```

8. Install NodeJS (if not already installed) and required packages:
```bash
npm install
```

9. Start the development server:
```bash
npm run dev
```

10. Access the application at http://localhost:5173/ or click the link in the npm dev terminal

## Features

### MyPortfolio Page
- Landing page displaying favorited contracts
- Essential information for saved contracts
- Favorite/unfavorite options using the star icon
- Dynamic summary statistics based on selected contracts

### ContractViewer Page
- View all contracts with core data and sophisticated indicators
- Dynamic Greek calculations per contract
- Interactive features:
  - Performance charts (price over time)
  - Volatility surface (per underlying - currently under development)

### Contract Management
- Edit existing contracts
  - Click edit icon next to the star
  - Make changes
  - Save updates
- Add new contracts
  - Click "Add New Contract" in top right
  - Fill form following naming convention
  - Save to add

### Filtering System
Filter contracts using various criteria:
- Expiration year (e.g., "2025")
- Strike price (e.g., "200")
- Underlying ticker (e.g., "NVDA")

### Data Export
- Export table data to CSV using "Export to CSV" button

### Most Active Page
- View contracts filtered by percentage change
- Top section: biggest gainers
- Bottom section: biggest losers

### News Page
- Search by ticker symbol (e.g., "NVDA" for NVIDIA)
- Displays 8 most recent articles per ticker
- Quick search via underlying symbols in MyPortfolio or Most Active pages

**NOTE**: To use the News function:
1. Sign up at https://webz.io/products/news-api/
2. Claim your free API key
3. Navigate to main\data\dataLoader.py
4. Edit the apiKey variable with your key

## Known Issues

### 3D Volatility Plot
- Currently not rendering
- Error related to interpolation and meshgrid noise
- Issue emerged after switching from matplotlib to plotly for frontend visualization
- May be related to dataset limitations