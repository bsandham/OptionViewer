// src/theme/index.js
import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  typography: {
    fontFamily: '"Gothic A1", sans-serif',
    h1: {
      fontFamily: '"Gothic A1", sans-serif',
    },
    h2: {
      fontFamily: '"Gothic A1", sans-serif',
    },
    h3: {
      fontFamily: '"Gothic A1", sans-serif',
    },
    h4: {
      fontFamily: '"Gothic A1", sans-serif',
    },
    h5: {
      fontFamily: '"Gothic A1", sans-serif',
    },
    h6: {
      fontFamily: '"Gothic A1", sans-serif',
    },
    body1: {
      fontFamily: '"Gothic A1", sans-serif',
    },
    body2: {
      fontFamily: '"Gothic A1", sans-serif',
    },
  },
  palette: {
    primary: {
      main: '#4A5568', // dark gray
      light: '#718096',
      dark: '#2D3748',
    },
    background: {
      default: '#F7FAFC',
      paper: '#FFFFFF',
    },
  },
  components: {
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontFamily: '"Gothic A1", sans-serif',
          '&:hover': {
            backgroundColor: '#4A5568',
            color: 'white',
          },
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: '#F7FAFC',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          fontFamily: '"Gothic A1", sans-serif',
        },
      },
    },
  },
});

export default theme;