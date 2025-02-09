import React, { useState } from 'react';
import { 
  AppBar, 
  Tabs, 
  Tab, 
  Box, 
  ThemeProvider,
  CssBaseline,
} from '@mui/material';
import MyPortfolio from './components/MyPortfolio';
import ContractViewer from './components/ContractViewer';
import MostActive from './components/MostActive';
import News from './components/News';
import theme from './theme';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
      className="w-full"
    >
      {value === index && (
        <Box p={3}>
          {children}
        </Box>
      )}
    </div>
  );
}

export default function App() {
  const [currentTab, setCurrentTab] = useState(0);
  const [searchSymbol, setSearchSymbol] = useState('');
  
  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  const handleSymbolClick = (symbol) => {
    setSearchSymbol(symbol);
    setCurrentTab(3); // Switch to News tab
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div className="min-h-screen">
        <AppBar position="static" color="default" className="shadow-md">
          <div className="px-6 py-3 flex items-start">
            <div className="flex flex-col mr-8">
              <h1 className="text-2xl font-bold text-gray-800 font-gothicA1">OptionViewer</h1>
              <span className="text-sm text-gray-600 font-gothicA1">Option Data At Your Fingertips</span>
            </div>
            <Tabs 
              value={currentTab} 
              onChange={handleTabChange}
              indicatorColor="primary"
              textColor="primary"
              variant="fullWidth"
              className="mt-1"
            >
              <Tab label="MyPortfolio" />
              <Tab label="Contract Viewer" />
              <Tab label="Most Active" />
              <Tab label="News" />
            </Tabs>
          </div>
        </AppBar>

        <TabPanel value={currentTab} index={0}>
          <MyPortfolio onSymbolClick={handleSymbolClick} />
        </TabPanel>
        <TabPanel value={currentTab} index={1}>
          <ContractViewer onSymbolClick={handleSymbolClick} />
        </TabPanel>
        <TabPanel value={currentTab} index={2}>
          <MostActive onSymbolClick={handleSymbolClick} />
        </TabPanel>
        <TabPanel value={currentTab} index={3}>
          <News initialSearchSymbol={searchSymbol} />
        </TabPanel>
      </div>
    </ThemeProvider>
  );
}