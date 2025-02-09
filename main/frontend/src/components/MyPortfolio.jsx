import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  IconButton,
} from '@mui/material';
import { Star, Download } from 'lucide-react';
import { formatNumber, formatPercentage, formatCurrency, getPercentageColorClass } from '../utils';

// this is the smallest component, we only need the functionality to star and unstar contracts and the loading screen
const MyPortfolio = ({ onSymbolClick }) => {
  const [starredContracts, setStarredContracts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStarredContracts();
  }, []);

  // load the starred contracts from local storage and then fetch all contracts from the API 
  const loadStarredContracts = async () => {
    try {
      const saved = localStorage.getItem('starredContracts');
      if (saved) {
        const savedIds = JSON.parse(saved);
        const response = await fetch('http://localhost:8000/api/contracts');
        if (!response.ok) throw new Error('Failed to fetch contracts');
        const allContracts = await response.json();
        const updatedStarred = allContracts.filter(contract => 
          savedIds.some(saved => saved.contractID === contract.contractID)
        );
        setStarredContracts(updatedStarred);
      }
    } catch (error) {
      console.error('Error loading starred contracts:', error);
    } finally {
      setLoading(false);
    }
  };
  // remove a contract from the portfolio - this is the same as the function in contractviewer
  const removeFromPortfolio = (contractId) => {
    const updatedContracts = starredContracts.filter(
      contract => contract.contractID !== contractId
    );
    setStarredContracts(updatedContracts);
    localStorage.setItem('starredContracts', JSON.stringify(updatedContracts));
  };

  // export the portfolio to a csv file - this is the same as the function in contractviewer
  const handleExportCSV = () => {
    if (starredContracts.length === 0) return;

    const headers = Object.keys(starredContracts[0]);
    const csv = [
      headers.join(','),
      ...starredContracts.map(contract => 
        headers.map(header => {
          const value = contract[header];
          return typeof value === 'string' ? `"${value}"` : value;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'portfolio.csv';
    link.click();
  };

  if (loading) {
    return <div className="p-4">Loading portfolio...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">My Portfolio</h2>
        <Button
          variant="contained"
          startIcon={<Download />}
          onClick={handleExportCSV}
          disabled={starredContracts.length === 0}
          className="bg-blue-500"
        >
          Export to CSV
        </Button>
      </div>
      {/* if there are no contracts in the portfolio, show a message - just a quick note, the syntax to do this genuinely took me about 10 minutes to figure out*/}
      {starredContracts.length === 0 ? (
        <Paper className="p-8 text-center">
          <p className="text-gray-600">
            No contracts in portfolio yet. Star contracts from the Contract Viewer to add them here.
          </p>
        </Paper>
      ) : (
        <TableContainer component={Paper} className="shadow-md">
          <Table>
            <TableHead className="bg-gray-50">
              <TableRow>
                <TableCell>Actions</TableCell>
                <TableCell>Contract ID</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Underlying</TableCell>
                <TableCell>Strike</TableCell>
                <TableCell>Price</TableCell>
                <TableCell>Bid</TableCell>
                <TableCell>Ask</TableCell>
                <TableCell>Volume</TableCell>
                <TableCell>Implied Vol</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {starredContracts.map((contract) => (
                <TableRow 
                  key={contract.contractID}
                  className="hover:bg-gray-50"
                >
                  <TableCell>
                    <IconButton
                      onClick={() => removeFromPortfolio(contract.contractID)}
                      size="small"
                    >
                      <Star className="text-yellow-400" fill="currentColor" size={20} />
                    </IconButton>
                  </TableCell>
                  <TableCell>{contract.contractID}</TableCell>
                  <TableCell>{contract.name}</TableCell>
                  <TableCell>{contract.type}</TableCell>
                  <TableCell>
                    <Button
                      onClick={() => onSymbolClick(contract.underlying)}
                      className="text-blue-600 hover:underline"
                    >
                      {contract.underlying}
                    </Button>
                  </TableCell>
                  <TableCell>{formatCurrency(contract.strike)}</TableCell>
                  <TableCell>{formatCurrency(contract.price)}</TableCell>
                  <TableCell>{formatCurrency(contract.bid)}</TableCell>
                  <TableCell>{formatCurrency(contract.ask)}</TableCell>
                  <TableCell>{formatNumber(contract.volume, 0)}</TableCell>
                  <TableCell className={getPercentageColorClass(contract.impliedVol)}>{formatPercentage(contract.impliedVol)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </div>
  );
};

export default MyPortfolio;