import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
} from '@mui/material';

const CreateContractForm = ({ open, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    contractID: '',
    name: '',
    type: 'CALL',
    underlying: '',
    strike: '',
    price: '',
    bid: '',
    ask: '',
    volume: '',
    impliedVol: '',
    expiration:''
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/contract/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to create contract');
      }

      const savedContract = await response.json();
      onSave(savedContract);
      onClose();
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Add New Contract</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" className="mb-4 mt-2">{error}</Alert>}
        
        <div className="grid grid-cols-2 gap-4 mt-4">
          <TextField
            name="contractID"
            label="Contract ID"
            value={formData.contractID}
            onChange={handleChange}
          />
          <TextField
            name="name"
            label="Name"
            value={formData.name}
            onChange={handleChange}
          />
          <FormControl>
            <InputLabel>Type</InputLabel>
            <Select
              name="type"
              value={formData.type}
              onChange={handleChange}
            >
              <MenuItem value="CALL">CALL</MenuItem>
              <MenuItem value="PUT">PUT</MenuItem>
            </Select>
          </FormControl>
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
         <TextField
            name="expiration"
            label="Expiry Date"
            value={formData.expiration}
            onChange={handleChange}
          />
        </div>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" color="primary">
          Add Contract
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateContractForm;