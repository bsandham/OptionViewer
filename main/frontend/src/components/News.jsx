import React, { useState, useEffect } from 'react';
import {
  TextField,
  Card,
  CardContent,
  Typography,
  Grid,
  InputAdornment,
  CircularProgress,
  Paper,
  Box,
} from '@mui/material';
import { Search } from 'lucide-react';
import { useDebounce } from 'react-use';
import Papa from 'papaparse';

const News = ({ initialSearchSymbol }) => {
  const [searchQuery, setSearchQuery] = useState(initialSearchSymbol || '');
  
  // useEffect to handle incoming search symbol from either MyPortfolio or MostActive when a click on the underlying is registered
  useEffect(() => {
      if (initialSearchSymbol) {
          setSearchQuery(initialSearchSymbol);
          fetchNews(initialSearchSymbol);
      }
  }, [initialSearchSymbol]);
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [availableSymbols, setAvailableSymbols] = useState([]);
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

  // load the symbols out ouf the database
  useEffect(() => {
    const loadSymbols = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/symbols');
        if (!response.ok) throw new Error('Failed to fetch symbols');
        const data = await response.json();
        setAvailableSymbols(data.symbols);
      } catch (error) {
        console.error('Error loading symbols:', error);
      }
    };
    loadSymbols();
  }, []);

  // debounce the search query - what this does is add a delay time before the search query is executed, meaning that the user can type out their whole query before it is exected instead of a search being initiated after every letter. also limits 
  useDebounce(
    () => {
      setDebouncedSearchQuery(searchQuery);
    },
    500,
    [searchQuery]
  );

  // useEffect that fetches the news artocles from the backend once the debounce is up and the search query is valid
  useEffect(() => {
    if (debouncedSearchQuery && availableSymbols.includes(debouncedSearchQuery)) {
      fetchNews(debouncedSearchQuery);
    }
  }, [debouncedSearchQuery]);

  const fetchNews = async (symbol) => {
    if (!symbol || !availableSymbols.includes(symbol)) {
      setArticles([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`http://localhost:8000/api/news/${symbol}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to fetch news');
      }
      const data = await response.json();
      setArticles(data);
    } catch (error) {
      console.error('Error fetching news:', error);
      setArticles([]);
    } finally {
      setLoading(false);
    }
  };

  // the api returns the date in an en-us string format, this function formats it into M/D/YYYY
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      <Paper className="p-4">
        <Box className="max-w-3xl mx-auto">
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search for a stock symbol (e.g., NVDA, AAPL)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value.toUpperCase())}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search className="text-gray-400" size={20} />
                </InputAdornment>
              ),
              endAdornment: loading && (
                <InputAdornment position="end">
                  <CircularProgress size={20} />
                </InputAdornment>
              ),
            }}
            className="bg-white"
          />
          {searchQuery && !availableSymbols.includes(searchQuery) && (
            <Typography variant="caption" color="error" className="mt-1 block">
              Symbol not found in available contracts
            </Typography>
          )}
        </Box>
      </Paper>

      <Grid container spacing={3}>
        {articles.map((article, index) => (
          <Grid item xs={12} md={6} key={index}>
            <Card className="h-full hover:shadow-lg transition-shadow duration-200">
              <CardContent>
                <Typography variant="h6" component="h2" className="mb-2">
                  <a
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {article.title}
                  </a>
                </Typography>
                <Typography variant="body2" color="textSecondary" className="mb-2">
                  {article.source} • {formatDate(article.publishedDate)}
                </Typography>
                <Typography variant="body1" color="textPrimary" className="line-clamp-3">
                  {article.text}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {articles.length === 0 && !loading && searchQuery && (
        <Paper className="p-8 text-center">
          <Typography variant="body1" color="textSecondary">
            No news articles found for {searchQuery}.
          </Typography>
        </Paper>
      )}

      {articles.length === 0 && !loading && !searchQuery && (
        <Paper className="p-8 text-center">
          <Typography variant="body1" color="textSecondary">
            Enter a stock symbol above to search for news articles.
          </Typography>
        </Paper>
      )}
    </div>
  );
};

export default News;