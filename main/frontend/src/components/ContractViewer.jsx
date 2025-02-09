import React, { useState, useEffect, useMemo } from 'react';
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
  IconButton,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tooltip,
} from '@mui/material';
import { Line, CartesianGrid, XAxis, YAxis, Tooltip as RechartsTooltip, Legend, LineChart, ResponsiveContainer } from 'recharts';
import { Download, Star, Edit, Plus } from 'lucide-react';
import Plot from 'react-plotly.js';
import CreateContractForm from '../utils/CreateContractForm';
import EditContractForm from '../utils/EditContractForm';
import { formatNumber, formatPercentage, formatCurrency, getPercentageColorClass } from '../utils';

const ContractViewer = ({ onSymbolClick }) => {
  // required to set the states
  const [contracts, setContracts] = useState([]);
  const [priceHistory, setPriceHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [starredContracts, setStarredContracts] = useState([]);
  const [volSurfaceData, setVolSurfaceData] = useState(null);
  const [greeksData, setGreeksData] = useState({});
  const [editingContract, setEditingContract] = useState(null);
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState(null);
  
  // state for filters
  const [filters, setFilters] = useState({
    contractID: '',
    name: '',
    type: '',
    underlying: '',
    strike: '',
    price: '',
    impliedVol: ''
  });

  useEffect(() => {
    loadData();
    loadStarredContracts();
  }, []);

  // load all contract data with a fetch request to the FastAPI backend
  const loadData = async () => {
    try {
      console.log('Starting loadData...');
      setLoading(true);
      
      const response = await fetch('http://localhost:8000/api/contracts', {
        // i added cache control headers as I kept getting an error where any manual changes to data would write into the csv but then not be displayed - this fixed it
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch contracts');
      const data = await response.json();

      // logging to debug what was happening on the backend - this was to check if the data was being fetched correctly, same issue as above
      
      console.log('Fetched data successfully:', data);
      
      setContracts([...data]);
      console.log('Contract state now changed to this:', data);
      
      await loadGreeksData(data);
      
      setLoading(false);
  
    } catch (error) {
      console.error('Error loading contracts:', error);
      setLoading(false);
    }
  };

  // load the greeks data for each contract - this is calculated separately and is not stored in a dataset, so needs to be called for each contract
  // has a bit of a performance impact as it needs to be called for each contract, but it's the only way to get the data as fresh as possible
  // just fyi, the elapsed time to load the data with this method is about 5-12 seconds for 600 contracts depending on internet
  const loadGreeksData = async (contracts) => {
    try {
      const greeksPromises = contracts.map(contract =>
        fetch(`http://localhost:8000/api/contract/${contract.contractID}/greeks`)
          .then(res => res.json())
      );
      
      const greeksResults = await Promise.all(greeksPromises);
      const greeksMap = {};
      contracts.forEach((contract, index) => {
        greeksMap[contract.contractID] = greeksResults[index];
      });
      setGreeksData(greeksMap);
    } catch (error) {
      console.error('Error loading Greeks:', error);
    }
  };

  // load the price history for a selected contract
  const loadPriceHistory = async (contractId) => {
    try {
      const response = await fetch(`http://localhost:8000/api/contract/${contractId}/performance`);
      if (!response.ok) throw new Error('Failed to fetch performance data');
      const data = await response.json();
      
      setPriceHistory(data);
    } catch (error) {
      console.error('Error loading price history:', error);
    }
  };

  const loadVolSurface = async (symbol) => {
    try {
      const response = await fetch(`http://localhost:8000/api/volatility-surface/${symbol}`);
      if (!response.ok) throw new Error('Failed to fetch volatility surface');
      const data = await response.json();
      setVolSurfaceData(data);
    } catch (error) {
      console.error('Error loading volatility surface:', error);
    }
  };

  // handler for adding filters
  const handleFilterChange = (field) => (event) => {
    setFilters(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const handleAddNew = () => {
    setIsCreateFormOpen(true);
  };
  
  const handleEdit = (contract) => {
    setSelectedContract(contract);
    setIsEditFormOpen(true);
  };
  
  const handleSaveContract = async () => {
    await loadData(); // Reload the contracts
  };

  // filter contracts
  const filteredContracts = useMemo(() => {
    return contracts.filter(contract => {
      return (
        contract.contractID.toLowerCase().includes(filters.contractID.toLowerCase()) &&
        contract.name.toLowerCase().includes(filters.name.toLowerCase()) &&
        (filters.type === '' || contract.type.toLowerCase() === filters.type.toLowerCase()) &&
        contract.underlying.toLowerCase().includes(filters.underlying.toLowerCase()) &&
        (filters.strike === '' || contract.strike.toString().includes(filters.strike)) &&
        (filters.price === '' || contract.price.toString().includes(filters.price)) &&
        (filters.impliedVol === '' || contract.impliedVol.toString().includes(filters.impliedVol))
      );
    });
  }, [contracts, filters]);

  // handler for selecting a contract - upon selection, loads the performance and vol surface visualisations
  const handleContractSelect = async (contract) => {
    setSelectedContract(contract);
    try {
      await Promise.all([
        loadPriceHistory(contract.contractID),
        loadVolSurface(contract.underlying)
      ]);
    } catch (error) {
      console.error('Error loading contract data:', error);
    }
  };

  // retrieve any starred contracts from local storage
  const loadStarredContracts = () => {
    const saved = localStorage.getItem('starredContracts');
    if (saved) {
      setStarredContracts(JSON.parse(saved));
    }
  };

  // handler for exporting contracts to CSV
  const handleExportCSV = () => {
    if (!filteredContracts.length) return;
    const headers = Object.keys(filteredContracts[0]);
    const csv = [
      headers.join(','),
      ...filteredContracts.map(contract => 
        headers.map(header => {
          const value = contract[header];
          return typeof value === 'string' ? `"${value}"` : value;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'contracts.csv';
    link.click();
  };

  // enables the toggling of stars - adds or removes a contract from MyPortfolio
  const toggleStar = (contract) => {
    const isStarred = starredContracts.some(c => c.contractID === contract.contractID);
    let newStarredContracts;
    
    if (isStarred) {
      newStarredContracts = starredContracts.filter(c => c.contractID !== contract.contractID); // effectively apllies a filter to remove the contract from the starred contracts
    } else {
      newStarredContracts = [...starredContracts, contract];
    }
    
    setStarredContracts(newStarredContracts);
    localStorage.setItem('starredContracts', JSON.stringify(newStarredContracts));
  };

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
        <Paper className="p-4">
          {/* Header with buttons */}
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Options Contracts</h2>
            <div className="space-x-2">
              <Button 
                variant="contained" 
                onClick={handleAddNew}
                startIcon={<Plus />}
                className="bg-green-500"
              >
                Add New Contract
              </Button>
              <Button 
                variant="contained" 
                onClick={handleExportCSV}
                startIcon={<Download />}
                className="bg-blue-500"
              >
                Export to CSV
              </Button>
            </div>
          </div>

          {/* Filter controls */}
          <div className="grid grid-cols-4 gap-4 mb-4">
            <TextField
              label="Contract ID"
              value={filters.contractID}
              onChange={handleFilterChange('contractID')}
              className="w-full"
              size="small"
            />
            <TextField
              label="Name"
              value={filters.name}
              onChange={handleFilterChange('name')}
              className="w-full"
              size="small"
            />
            <FormControl className="w-full" size="small">
              <InputLabel>Type</InputLabel>
              <Select
                value={filters.type}
                onChange={handleFilterChange('type')}
                label="Type"
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="CALL">CALL</MenuItem>
                <MenuItem value="PUT">PUT</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Underlying"
              value={filters.underlying}
              onChange={handleFilterChange('underlying')}
              className="w-full"
              size="small"
            />
          </div>

          {/*table design for displaying the contract info*/}
          <TableContainer className="max-h-96">
            <Table stickyHeader>
              <TableHead>
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
                  <TableCell>
                    <Tooltip title="Implied Volatility - A metric that captures the market's forecast of likely movement in a security's price" arrow placement="top">
                      <span>Implied Vol</span>
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    <Tooltip title="Delta (Δ) - Measures how much the option price changes relative to the underlying asset price change" arrow placement="top">
                      <span>Δ</span>
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    <Tooltip title="Gamma (γ) - Measures the rate of change in delta with respect to the underlying asset's price" arrow placement="top">
                      <span>γ</span>
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    <Tooltip title="Vega (ν) - Measures sensitivity to volatility. Shows how much the option price changes when implied volatility changes" arrow placement="top">
                      <span>ν</span>
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    <Tooltip title="Theta (θ) - Measures the rate of time decay. Shows how much the option price changes as time passes" arrow placement="top">
                      <span>θ</span>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredContracts.map((contract) => {
                  const isStarred = starredContracts.some(c => c.contractID === contract.contractID);
                  const contractGreeks = greeksData[contract.contractID];
                  return (
                    <TableRow 
                      key={contract.contractID}
                      onClick={() => handleContractSelect(contract)}
                      className="cursor-pointer hover:bg-gray-50"
                    >
                      <TableCell>
                        <div className="flex space-x-1">
                          <IconButton
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleStar(contract);
                            }}
                            size="small"
                          >
                            <Star 
                              size={20} 
                              className={isStarred ? "text-yellow-400" : "text-gray-400"}
                              fill={isStarred ? "currentColor" : "none"}
                            />
                          </IconButton>
                          <IconButton
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(contract);
                            }}
                            size="small"
                          >
                            <Edit size={20} />
                          </IconButton>
                        </div>
                      </TableCell>
                      <TableCell>{contract.contractID}</TableCell>
                      <TableCell>{contract.name}</TableCell>
                      <TableCell>{contract.type}</TableCell>
                      <TableCell>
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSymbolClick?.(contract.underlying);
                          }}
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
                      <TableCell className={getPercentageColorClass(contract.impliedVol)}>
                        {formatPercentage(contract.impliedVol)}
                      </TableCell>
                      <TableCell>{contractGreeks ? formatNumber(contractGreeks.delta, 4) : '-'}</TableCell>
                      <TableCell>{contractGreeks ? formatNumber(contractGreeks.gamma, 4) : '-'}</TableCell>
                      <TableCell>{contractGreeks ? formatNumber(contractGreeks.vega, 4) : '-'}</TableCell>
                      <TableCell>{contractGreeks ? formatNumber(contractGreeks.theta, 4) : '-'}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Grid>

      {/* 2D performance over time and the 3D volatilty surface plots. the 3D plot does not quite work at this point - there is an issue with the interpolation, potentially due to the lack of data. not sure how to fix*/}
      {selectedContract && (
        <>
          <Grid item xs={12} md={6}>
            <Paper className="p-4" style={{ height: '40vh' }}>
              <h3 className="text-lg font-bold mb-4">Performance Over Time</h3>
              <div className="h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart 
                    data={priceHistory}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="priceDate"
                      tick={{ fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      domain={['auto', 'auto']}
                    />
                    <RechartsTooltip 
                      formatter={(value, name) => [
                        Number(value).toFixed(2),
                        name
                      ]}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="historicalPrice" 
                      stroke="#8884d8" 
                      name="Price"
                      dot={false}
                      strokeWidth={2}
                      isAnimationActive={false}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="MA5" 
                      stroke="#82ca9d" 
                      name="5-day MA"
                      dot={false}
                      strokeWidth={2}
                      isAnimationActive={false}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="MA20" 
                      stroke="#ffc658" 
                      name="20-day MA"
                      dot={false}
                      strokeWidth={2}
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper className="p-4" style={{ height: '40vh' }}>
              <h3 className="text-lg font-bold mb-4">Volatility Surface</h3>
              {volSurfaceData && (
                <Plot
                  data={[{
                    type: 'surface',
                    x: volSurfaceData.x,
                    y: volSurfaceData.y,
                    z: volSurfaceData.z,
                    colorscale: 'Viridis',
                  }]}
                  layout={{
                    scene: {
                      xaxis: { title: 'Strike' },
                      yaxis: { title: 'Time to Maturity' },
                      zaxis: { title: 'Implied Volatility' }
                    },
                    margin: { t: 0, b: 0, l: 0, r: 0 },
                    autosize: true,
                  }}
                  style={{ width: '100%', height: '100%' }}
                />
              )}
            </Paper>
          </Grid>
        </>
      )}
    </Grid>

    {/* forms for adding new or editing new contracts - this handles the opening of the dialogue box, and then once completed the saving of the contract changes*/}
    <CreateContractForm 
      open={isCreateFormOpen}
      onClose={() => setIsCreateFormOpen(false)}
      onSave={handleSaveContract}
    />

    <EditContractForm
      open={isEditFormOpen}
      onClose={() => setIsEditFormOpen(false)}
      contract={selectedContract}
      onSave={handleSaveContract}
    />
  </div>
);
};

export default ContractViewer;