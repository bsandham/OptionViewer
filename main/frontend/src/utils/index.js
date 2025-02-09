import Papa from 'papaparse';

/// this entire file contains functions that are utility, used in multiple contracts. basically made it so i dont have to rewrite all of this code in each component and can just call the functions instead

// formats a number so it can be easily read in the display. takes in the number itself and then the number of decimals to show, ensures consistency
export const formatNumber = (number, decimals = 2) => {
  if (number === null || number === undefined) return '-';
  return Number(number).toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

// formats any numerical value that is supposed to be a percentage - adds the percentage sign at the end and limits to a certain number of decimals
export const formatPercentage = (number, decimals = 2) => {
  if (number === null || number === undefined) return '-';
  return `${formatNumber(number, decimals)}%`;
};

// alter the colour for different percentage values - displays green for positive, red for negative, and nothing for 0
export const getPercentageColorClass = (number) => {
  if (number === null || number === undefined) return '';
  return number > 0 ? 'text-green-600' : number < 0 ? 'text-red-600' : '';
};

// format any currency with dollar symbol
export const formatCurrency = (number, decimals = 2) => {
  if (number === null || number === undefined) return '-';
  return `$${formatNumber(number, decimals)}`;
};

// parse a csv file in the java frontend - only used once in the entire thing as i wanted to keep all the csv ops in the backend
export const parseCSV = async (file, options = {}) => {
  const defaultOptions = {
    header: true,
    dynamicTyping: true,
    skipEmptyLines: true,
  };

  try {
    const response = await window.fs.readFile(file, { encoding: 'utf8' });
    return new Promise((resolve, reject) => {
      Papa.parse(response, {
        ...defaultOptions,
        ...options,
        complete: (results) => resolve(results.data),
        error: (error) => reject(error)
      });
    });
  } catch (error) {
    console.error(`Error reading ${file}:`, error);
    throw error;
  }
};

// sort data by column 
export const sortData = (data, sortBy, sortDirection) => {
  return [...data].sort((a, b) => {
    if (a[sortBy] === null) return 1;
    if (b[sortBy] === null) return -1;
    if (a[sortBy] === b[sortBy]) return 0;
    
    const modifier = sortDirection === 'asc' ? 1 : -1;
    return a[sortBy] < b[sortBy] ? -1 * modifier : 1 * modifier;
  });
};

// filter a given table by search term - applies to any filter ops
export const filterData = (data, searchTerm, columns) => {
  if (!searchTerm) return data;
  
  const lowercasedTerm = searchTerm.toLowerCase();
  return data.filter(item => 
    columns.some(column => 
      String(item[column]).toLowerCase().includes(lowercasedTerm)
    )
  );
};

// export data to a csv file - used in multiple components e.g whenever an export button is clicked
export const exportToCSV = (data, filename) => {
  if (!data.length) return;
  
  const csv = Papa.unparse(data);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};