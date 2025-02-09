import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Alert,
} from '@mui/material';

const EditContractForm = ({ open, onClose, contract, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    strike: '',
    underlying: '',
    price: '',
    bid: '',
    ask: '',
    volume: '',
    impliedVol: ''
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (contract) {
      setFormData({
        name: contract.name || '',
        underlying: contract.underlying || '',
        strike: contract.strike || '',
        price: contract.price || '',
        bid: contract.bid || '',
        ask: contract.ask || '',
        volume: contract.volume || '',
        impliedVol: contract.impliedVol || ''
      });
    }
  }, [contract]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/contract/update/${contract.contractID}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to update contract');
      }

      const updatedContract = await response.json();
      onSave(updatedContract);
      onClose();
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Edit Contract</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" className="mb-4 mt-2">{error}</Alert>}
        
        <div className="grid grid-cols-2 gap-4 mt-4">
          <TextField
            name="name"
            label="Name"
            value={formData.name}
            onChange={handleChange}
          />
          <TextField
            name="underlying"
            label="Underlying"
            value={formData.underlying}
            onChange={handleChange}
          />
          <TextField
            name="strike"
            label="Strike"
            type="number"
            value={formData.strike}
            onChange={handleChange}
          />
          <TextField
            name="price"
            label="Price"
            type="number"
            value={formData.price}
            onChange={handleChange}
          />
          <TextField
            name="bid"
            label="Bid"
            type="number"
            value={formData.bid}
            onChange={handleChange}
          />
          <TextField
            name="ask"
            label="Ask"
            type="number"
            value={formData.ask}
            onChange={handleChange}
          />
          <TextField
            name="volume"
            label="Volume"
            type="number"
            value={formData.volume}
            onChange={handleChange}
          />
          <TextField
            name="impliedVol"
            label="Implied Volatility"
            type="number"
            value={formData.impliedVol}
            onChange={handleChange}
          />
        </div>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" color="primary">
          Save Changes
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditContractForm;