import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Box,
  Grid,
  Slider,
  Alert,
  Chip,
  IconButton,
  Tooltip
} from '@mui/material';
import { Edit, Save, Cancel, Percent } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useSelector, useDispatch } from 'react-redux';
import { fetchJarsData, createJarData, updateJarData, deleteJarData } from '../store/jarsSlice';

const defaultJars = [
  { id: 1, name: 'Necessities', percentage: 55, color: '#FF6B6B', description: 'Basic needs like food, housing, utilities' },
  { id: 2, name: 'Financial Freedom', percentage: 10, color: '#4ECDC4', description: 'Investments and long-term savings' },
  { id: 3, name: 'Long-term Savings', percentage: 10, color: '#45B7D1', description: 'Emergency fund and big purchases' },
  { id: 4, name: 'Education', percentage: 10, color: '#96CEB4', description: 'Learning and personal development' },
  { id: 5, name: 'Play', percentage: 10, color: '#FFEAA7', description: 'Entertainment and fun activities' },
  { id: 6, name: 'Give', percentage: 5, color: '#DDA0DD', description: 'Charity and helping others' }
];

const JarSettings = () => {
  const dispatch = useDispatch();
  const { jars, loading } = useSelector(state => state.jars);
  const [editing, setEditing] = useState(false);
  const [tempJars, setTempJars] = useState(defaultJars);
  const [totalPercentage, setTotalPercentage] = useState(100);
  const [error, setError] = useState('');

  useEffect(() => {
    dispatch(fetchJarsData());
  }, [dispatch]);

  useEffect(() => {
    const total = tempJars.reduce((sum, jar) => sum + jar.percentage, 0);
    setTotalPercentage(total);
    
    if (total !== 100) {
      setError(`Total percentage must be 100%. Current: ${total}%`);
    } else {
      setError('');
    }
  }, [tempJars]);

  const handlePercentageChange = (jarId, newPercentage) => {
    const updatedJars = tempJars.map(jar =>
      jar.id === jarId ? { ...jar, percentage: newPercentage } : jar
    );
    setTempJars(updatedJars);
  };

  const handleSave = () => {
    if (totalPercentage === 100) {
      // This part needs to be updated to use thunk actions for add/edit/delete
      // For now, it's a placeholder.
      console.log('Saving jars:', tempJars);
      setEditing(false);
      setError('');
    }
  };

  const handleCancel = () => {
    setTempJars(jars);
    setEditing(false);
    setError('');
  };

  const handleAddJar = (data) => {
    dispatch(createJarData(data));
  };
  const handleEditJar = (id, data) => {
    dispatch(updateJarData({ id, data }));
  };
  const handleDeleteJar = (id) => {
    dispatch(deleteJarData(id));
  };

  const getStatusColor = () => {
    if (totalPercentage === 100) return 'success';
    if (totalPercentage > 100) return 'error';
    return 'warning';
  };

  return (
    <Card sx={{ height: '100%', borderRadius: 4, boxShadow: '0 2px 12px #0001' }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography
              variant="h6"
              sx={{
                background: '-webkit-linear-gradient(0,#e00200,#015aad,#00b74f)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                color: 'black',
                fontWeight: 'bold'
              }}
          >
            Jar Settings
          </Typography>
          {!editing ? (
            <Button
              startIcon={<Edit />}
              variant="outlined"
              size="small"
              onClick={() => setEditing(true)}
              sx={{ borderRadius: 2, fontWeight: 'bold', px: 2, py: 0.5, minWidth: 0 }}
            >
              Edit
            </Button>
          ) : (
            <Box>
              <Button
                startIcon={<Save />}
                variant="contained"
                size="small"
                onClick={handleSave}
                disabled={totalPercentage !== 100}
                sx={{ mr: 1 }}
              >
                Save
              </Button>
              <Button
                startIcon={<Cancel />}
                variant="outlined"
                size="small"
                onClick={handleCancel}
              >
                Cancel
              </Button>
            </Box>
          )}
        </Box>

        {error && (
          <Alert severity={getStatusColor()} sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box display="flex" alignItems="center" mb={2}>
          <Typography variant="body2" sx={{ mr: 1 }}>
            Total Allocation:
          </Typography>
          <Chip
            label={`${totalPercentage}%`}
            color={getStatusColor()}
            size="small"
            icon={<Percent />}
          />
        </Box>

        <Grid container spacing={2}>
          {(editing ? tempJars : jars).map((jar) => (
            <Grid item xs={12} key={jar.id}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Box
                  sx={{
                    p: 2,
                    border: `2px solid ${jar.color}20`,
                    borderRadius: 2,
                    backgroundColor: `${jar.color}08`,
                    position: 'relative'
                  }}
                >
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      {jar.name}
                    </Typography>
                    <Box display="flex" alignItems="center">
                      {editing ? (
                        <TextField
                          type="number"
                          value={jar.percentage}
                          onChange={(e) => handlePercentageChange(jar.id, parseInt(e.target.value) || 0)}
                          inputProps={{ min: 0, max: 100 }}
                          size="small"
                          sx={{ width: 80, mr: 1 }}
                        />
                      ) : (
                        <Chip
                          label={`${jar.percentage}%`}
                          size="small"
                          sx={{ backgroundColor: jar.color, color: 'white' }}
                        />
                      )}
                    </Box>
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" mb={1}>
                    {jar.description}
                  </Typography>

                  <Box sx={{ width: '100%', mt: 1 }}>
                    <Slider
                      value={jar.percentage}
                      onChange={(_, value) => editing && handlePercentageChange(jar.id, value)}
                      disabled={!editing}
                      min={0}
                      max={100}
                      sx={{
                        '& .MuiSlider-track': {
                          backgroundColor: jar.color,
                        },
                        '& .MuiSlider-thumb': {
                          backgroundColor: jar.color,
                        },
                        '& .MuiSlider-rail': {
                          backgroundColor: `${jar.color}40`,
                        }
                      }}
                    />
                  </Box>
                </Box>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );
};

export default JarSettings; 