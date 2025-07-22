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
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent
} from '@mui/material';
import { Edit, Save, Cancel, Percent } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useSelector, useDispatch } from 'react-redux';
import { fetchJarsData, createJarData, updateJarData, deleteJarData } from '../store/jarsSlice';

const defaultJars = [
  { id: 1, code: 'NEC', name: 'Necessities', percentage: 55, color: '#FF6B6B', description: 'Basic needs like food, housing, utilities' },
  { id: 2, code: 'FFA', name: 'Financial Freedom', percentage: 10, color: '#4ECDC4', description: 'Investments and long-term savings' },
  { id: 3, code: 'LTSS', name: 'Long-term Savings', percentage: 10, color: '#45B7D1', description: 'Emergency fund and big purchases' },
  { id: 4, code: 'EDU', name: 'Education', percentage: 10, color: '#96CEB4', description: 'Learning and personal development' },
  { id: 5, code: 'PLY', name: 'Play', percentage: 10, color: '#FFEAA7', description: 'Entertainment and fun activities' },
  { id: 6, code: 'GIV', name: 'Give', percentage: 5, color: '#DDA0DD', description: 'Charity and helping others' }
];

const JarSettings = () => {
  const dispatch = useDispatch();
  const { jars: apiJars, loading } = useSelector(state => state.jars);
  const [editing, setEditing] = useState(false);
  const [tempJars, setTempJars] = useState(defaultJars);
  const [totalPercentage, setTotalPercentage] = useState(100);
  const [error, setError] = useState('');
  const [income, setIncome] = useState(0);
  const [aiJarResult, setAiJarResult] = useState(null);
  const [aiJarDialogOpen, setAiJarDialogOpen] = useState(false);

  // Map API jars vào defaultJars để render đúng UI
  const mergedJars = defaultJars.map(jar => {
    const apiJar = Array.isArray(apiJars) ? apiJars.find(j => j.jar_code === jar.code) : null;
    return apiJar
      ? {
          ...jar,
          percentage: Number(apiJar.percent),
          virtual_budget_amount: Number(apiJar.virtual_budget_amount),
          spent_amount: Number(apiJar.spent_amount),
          remaining_budget: Number(apiJar.remaining_budget),
          y_month: apiJar.y_month,
          // ... add more fields if needed
        }
      : jar;
  });

  // Fetch jars on mount
  useEffect(() => {
    dispatch(fetchJarsData());
  }, [dispatch]);

  // Validate khi chỉnh sửa
  useEffect(() => {
    if (editing) {
      const total = tempJars.reduce((sum, jar) => sum + jar.percentage, 0);
      setTotalPercentage(total);
      if (total !== 100) {
        setError(`Total percentage must be 100%. Current: ${total}%`);
      } else {
        setError('');
      }
    }
  }, [tempJars, editing]);

  // Validate khi load data từ API (không edit)
  useEffect(() => {
    if (!editing) {
      const total = mergedJars.reduce((sum, jar) => sum + jar.percentage, 0);
      setTotalPercentage(total);
      if (total !== 100) {
        setError(`Total percentage must be 100%. Current: ${total}%`);
      } else {
        setError('');
      }
      // Set default income là tổng virtual_budget_amount nếu income chưa chỉnh
      const totalIncome = mergedJars.reduce((sum, jar) => sum + (jar.virtual_budget_amount || 0), 0);
      setIncome(totalIncome);
    }
  }, [mergedJars, editing]);

  // useEffect tự động lưu này gây lỗi tự động tắt edit, cần xóa
  // useEffect(() => {
  //   if (totalPercentage === 100) {
  //     console.log('tempJars before save:', tempJars);
  //     // Gọi API cập nhật percent cho từng jar
  //     const jarsToUpdate = tempJars.map(jar => ({
  //       jar_code: jar.code,
  //       percent: jar.percentage
  //     }));
  //     console.log('jarsToUpdate:', jarsToUpdate);
  //     dispatch(updateJarData({ jars: jarsToUpdate })).then(() => {
  //       dispatch(fetchJarsData());
  //     });
  //     setEditing(false);
  //     setError('');
  //   }
  // }, [tempJars, totalPercentage, dispatch]);

  const handlePercentageChange = (jarId, newPercentage) => {
    const updatedJars = tempJars.map(jar =>
      jar.id === jarId ? { ...jar, percentage: newPercentage } : jar
    );
    setTempJars(updatedJars);
  };

  const handleSave = () => {
    if (totalPercentage !== 100) {
      setError(`Total percentage must be 100%. Current: ${totalPercentage}%`);
      return;
    }
    // Gọi API cập nhật percent cho từng jar
    const jarsToUpdate = tempJars.map(jar => ({
      jar_code: jar.code || jar.name, // tuỳ backend, nếu có code thì dùng code, không thì dùng name
      percent: jar.percentage
    }));
    dispatch(updateJarData({ jars: jarsToUpdate, income })).then(() => {
      dispatch(fetchJarsData());
    });
    setEditing(false);
    setError('');
  };

  const handleCancel = () => {
    setTempJars(mergedJars);
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

        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          {/* Total Allocation bên trái */}
          <Box display="flex" alignItems="center">
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
          {/* Income bên phải */}
          <Box display="flex" alignItems="center">
            <TextField
              type="text"
              value={income.toLocaleString('vi-VN') + ' đ'}
              onChange={e => {
                // Lấy số từ chuỗi nhập vào, bỏ ký tự không phải số
                const raw = e.target.value.replace(/[^\d]/g, '');
                setIncome(Number(raw) || 0);
              }}
              size="small"
              sx={{ width: 160 }}
              disabled={!editing}
              inputProps={{ min: 0, style: { textAlign: 'right', fontWeight: 'bold' } }}
            />
          </Box>
        </Box>
        <Grid container spacing={2}>
          {(editing ? tempJars : mergedJars).map((jar) => (
            <Grid item xs={12} key={jar.name}>
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
      <Box display="flex" justifyContent="flex-end" sx={{ px: 2, pb: 2 }}>
        <Button
          variant="outlined"
          color="secondary"
          onClick={async () => {
            try {
              const token = localStorage.getItem('token');
              const res = await fetch('/api/v1/ai/jar/coaching', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  ...(token ? { Authorization: `Bearer ${token}` } : {})
                }
              });
              const data = await res.json();
              setAiJarResult(data);
              setAiJarDialogOpen(true);
            } catch (err) {
              setAiJarResult({ error: 'AI Jar Coaching call failed' });
              setAiJarDialogOpen(true);
            }
          }}
        >
          Demo AI Jar Coaching
        </Button>
      </Box>
      <Dialog open={aiJarDialogOpen} onClose={() => setAiJarDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>AI Jar Coaching Result</DialogTitle>
        <DialogContent>
          {aiJarResult && (aiJarResult.triggered_jars || aiJarResult.coaching_suggestions) ? (
            <>
              {aiJarResult.coaching_suggestions && aiJarResult.coaching_suggestions.length > 0 && (
                <Box mb={2}>
                  {aiJarResult.coaching_suggestions.map((sug, idx) => (
                    <Box key={idx} mb={1} p={2} sx={{ border: '1px solid #f44336', borderRadius: 2, background: '#fff6f6' }}>
                      <Typography variant="subtitle2" color="error" fontWeight="bold">
                        {sug.jar_code} - {sug.issue}
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 0.5 }}>
                        {sug.recommendation}
                      </Typography>
                      <Chip
                        label={sug.priority === 'high' ? 'High Priority' : sug.priority}
                        color={sug.priority === 'high' ? 'error' : (sug.priority === 'medium' ? 'warning' : 'default')}
                        size="small"
                      />
                    </Box>
                  ))}
                </Box>
              )}
              {aiJarResult.triggered_jars && aiJarResult.triggered_jars.length > 0 && (
                <Box>
                  <Typography variant="subtitle1" fontWeight="bold" mb={1}>Details of triggered Jars:</Typography>
                  {aiJarResult.triggered_jars.map((jar, idx) => (
                    <Box key={idx} mb={2} p={2} sx={{ border: '1px solid #eee', borderRadius: 2, background: '#fafbfc' }}>
                      <Typography variant="subtitle2" fontWeight="bold">{jar.jar_code}</Typography>
                      <Typography variant="body2">
                        Remaining Balance: <b>{Number(jar.remaining_budget).toLocaleString('vi-VN')} ₫</b>
                      </Typography>
                      <Typography variant="body2">
                        Ideal Daily Spending: <b>{Math.round(jar.ideal_daily_spending).toLocaleString('vi-VN')} ₫</b>
                      </Typography>
                      <Typography variant="body2">
                        Actual Daily Spending: <b>{Math.round(jar.actual_daily_spending).toLocaleString('vi-VN')} ₫</b>
                      </Typography>
                      {jar.remaining_budget < 0 && (
                        <Typography variant="body2" color="error" fontWeight="bold">
                          Budget Exceeded!
                        </Typography>
                      )}
                    </Box>
                  ))}
                </Box>
              )}
            </>
          ) : (
            <Typography color="text.secondary">No coaching data.</Typography>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default JarSettings;