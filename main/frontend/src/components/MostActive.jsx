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
  Grid,
  CircularProgress,
} from '@mui/material';
import { Download } from 'lucide-react';
import { formatNumber, formatPercentage, formatCurrency, getPercentageColorClass } from '../utils';

// set out the states that will be used in this component - essentially all this tab does is display gainers, losers and then the loading screen when required
const MostActive = ({ onSymbolClick }) => {
  const [gainers, setGainers] = useState([]);
  const [losers, setLosers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMostActive();
  }, []);

  // fetch the most active contracts from the API - in the backend, the percentage change in the two most recent prices is calculated and then the contracts are sorted by this percentage change
  // returns top 10 gainers (greatest positive percentage increase) and 10 losers (greatest negative percentage decrease)
  const fetchMostActive = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/most-active');
      if (!response.ok) throw new Error('Failed to fetch most active contracts');
      const data = await response.json();
      setGainers(data.gainers);
      setLosers(data.losers);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching most active contracts:', error);
      setLoading(false);
    }
  };
  // handles the csv export - i copied this from contractviewer, it is the same function
  const handleExportCSV = (data, type) => {
    if (data.length === 0) return;

    const headers = Object.keys(data[0]);
    const csv = [
      headers.join(','),
      ...data.map(contract => 
        headers.map(header => {
          const value = contract[header];
          return typeof value === 'string' ? `"${value}"` : value;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${type}.csv`;
    link.click();
  };

  const ContractTable = ({ title, data, type }) => (
    <Paper className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">{title}</h2>
        <Button
          variant="contained"
          startIcon={<Download />}
          onClick={() => handleExportCSV(data, type)}
          disabled={data.length === 0}
          className="bg-blue-500"
        >
          Export to CSV
        </Button>
      </div>
      <TableContainer>
        <Table>
          <TableHead className="bg-gray-50">
            <TableRow>
              <TableCell>Contract Name</TableCell>
              <TableCell>Underlying</TableCell>
              <TableCell>Contract Type</TableCell>
              <TableCell>Strike Price</TableCell>
              <TableCell>Contract Price</TableCell>
              <TableCell>Volume</TableCell>
              <TableCell>% Change</TableCell>
              <TableCell>Implied Volatility</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((contract) => (
              <TableRow 
                key={contract.contractID}
                className="hover:bg-gray-50"
              >
                <TableCell>{contract.contractID}</TableCell>
                <TableCell>
                  <Button
                    onClick={() => onSymbolClick(contract.underlying)}
                    className="text-blue-600 hover:underline"
                  >
                    {contract.underlying}
                  </Button>
                </TableCell>
                <TableCell>{contract.type}</TableCell>
                <TableCell>{formatCurrency(contract.strike)}</TableCell>
                <TableCell>{formatCurrency(contract.price)}</TableCell>
                <TableCell>{formatNumber(contract.volume, 0)}</TableCell>
                <TableCell className={getPercentageColorClass(contract.percentChange)}>
                  {formatPercentage(contract.percentChange)}
                </TableCell>
                <TableCell>{formatPercentage(contract.impliedVol)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <CircularProgress />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <ContractTable 
            title="Biggest Gainers" 
            data={gainers} 
            type="gainers" 
          />
        </Grid>
        <Grid item xs={12}>
          <ContractTable 
            title="Biggest Losers" 
            data={losers} 
            type="losers" 
          />
        </Grid>
      </Grid>
    </div>
  );
};

export default MostActive;