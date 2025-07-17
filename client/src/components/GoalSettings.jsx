import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  Grid,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Chip,
  Fab
} from '@mui/material';
import { Icon } from '@iconify/react';
import { motion, AnimatePresence } from 'framer-motion';
import AddCircleIcon from "@mui/icons-material/AddCircle.js";
import { useSelector, useDispatch } from 'react-redux';
import { useEffect } from 'react';
import { fetchGoalsData, createGoalData, updateGoalData, deleteGoalData } from '../store/goalsSlice';

const GoalSettings = () => {
  const dispatch = useDispatch();
  const { goals, loading } = useSelector(state => state.goals);
  useEffect(() => {
    dispatch(fetchGoalsData());
  }, [dispatch]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    target: '',
    current: '',
    deadline: '',
    category: '',
    priority: 'Medium'
  });

  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [aiGoalResult, setAiGoalResult] = useState(null);
  const [aiGoalDialogOpen, setAiGoalDialogOpen] = useState(false);

  const handleAddGoal = () => {
    setEditingGoal(null);
    setFormData({
      name: '',
      target: '',
      current: '',
      deadline: '',
      category: 'Long-term Savings',
      priority: 'Medium'
    });
    setDialogOpen(true);
  };

  const handleEditGoal = (goal) => {
    setEditingGoal(goal);
    setFormData({
      name: goal.name,
      target: goal.target.toString(),
      current: goal.current.toString(),
      deadline: goal.deadline,
      category: goal.category,
      priority: goal.priority
    });
    setDialogOpen(true);
  };

  const handleDeleteGoal = (goalId) => {
    dispatch(deleteGoalData(goalId));
  };

  const handleSaveGoal = () => {
    if (editingGoal) {
      dispatch(updateGoalData({ id: editingGoal.goal_id, data: formData }));
    } else {
      dispatch(createGoalData(formData));
    }
    setDialogOpen(false);
  };

  const getProgressColor = (progress) => {
    if (progress >= 80) return 'success';
    if (progress >= 50) return 'warning';
    return 'error';
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High': return 'error';
      case 'Medium': return 'warning';
      case 'Low': return 'success';
      default: return 'default';
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const calculateProgress = (current, target) => {
    return Math.min((current / target) * 100, 100);
  };

  const calculateDaysLeft = (deadline) => {
    const today = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Xác định loại goal
  const getGoalType = (goal) => {
    if ((goal.category || '').toLowerCase().includes('long')) return 'long';
    if ((goal.category || '').toLowerCase().includes('short')) return 'short';
    return 'other';
  };

  // Xác định trạng thái goal
  const getGoalStatus = (goal) => {
    const progress = calculateProgress(goal.current, goal.target);
    if (progress >= 100) return 'done';
    if (goal.deadline) {
      const daysLeft = calculateDaysLeft(goal.deadline);
      if (daysLeft < 0 && progress < 100) return 'behind';
    }
    return 'ontrack';
  };

  // Lọc goals
  const filteredGoals = goals.filter(goal => {
    const type = getGoalType(goal);
    const status = getGoalStatus(goal);
    const typeOk = typeFilter === 'all' || (typeFilter === 'long' && type === 'long') || (typeFilter === 'short' && type === 'short');
    const statusOk = statusFilter === 'all' || statusFilter === status;
    return typeOk && statusOk;
  });

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
            Goals Setting
          </Typography>
          <Button
            variant="outlined"
            color="primary"
            size="small"
            onClick={handleAddGoal}
            startIcon={<AddCircleIcon />}
            sx={{ borderRadius: 2, fontWeight: 'bold', px: 2, py: 0.5, minWidth: 0 }}
          >
            Create
          </Button>
        </Box>

        <Box display="flex" gap={2} mb={2}>
          <TextField
            select
            label="Goal Type"
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            size="small"
            sx={{ minWidth: 120 }}
            SelectProps={{ native: true }}
          >
            <option value="all">All</option>
            <option value="short">Short-term</option>
            <option value="long">Long-term</option>
          </TextField>
          <TextField
            select
            label="Status"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            size="small"
            sx={{ minWidth: 120 }}
            SelectProps={{ native: true }}
          >
            <option value="all">All</option>
            <option value="ontrack">On track</option>
            <option value="behind">Behind</option>
            <option value="done">Done</option>
          </TextField>
        </Box>

        <AnimatePresence>
          {filteredGoals.map((goal) => {
            const progress = calculateProgress(goal.current, goal.target);
            const daysLeft = calculateDaysLeft(goal.deadline);
            
            return (
              <motion.div
                key={goal.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Box
                  sx={{
                    p: 2,
                    mb: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 2,
                    backgroundColor: 'background.paper',
                    '&:hover': {
                      boxShadow: 2,
                      borderColor: 'primary.main'
                    }
                  }}
                >
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                    <Box>
                      <Typography variant="h6" fontWeight="bold">
                        {goal.name}
                      </Typography>
                      <Chip
                        label={goal.category}
                        size="small"
                        sx={{ mr: 1, mt: 0.5 }}
                      />
                      <Chip
                        label={goal.priority}
                        size="small"
                        color={getPriorityColor(goal.priority)}
                        sx={{ mt: 0.5 }}
                      />
                    </Box>
                    <Box display="flex" gap={1}>
                      <IconButton
                        size="small"
                        onClick={() => handleEditGoal(goal)}
                        color="primary"
                      >
                        <Icon icon="solar:pen-bold-duotone" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteGoal(goal.id)}
                        color="error"
                      >
                        <Icon icon="solar:trash-bin-trash-bold-duotone" />
                      </IconButton>
                    </Box>
                  </Box>

                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="body2" color="text.secondary">
                      Progress: {progress.toFixed(1)}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {formatCurrency(goal.current)} / {formatCurrency(goal.target)}
                    </Typography>
                  </Box>

                  <LinearProgress
                    variant="determinate"
                    value={progress}
                    color={getProgressColor(progress)}
                    sx={{ height: 8, borderRadius: 4, mb: 1 }}
                  />

                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Box display="flex" alignItems="center" gap={1}>
                      <Icon icon="solar:calendar-bold-duotone" fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary">
                        {daysLeft > 0 ? `${daysLeft} days left` : 'Overdue'}
                      </Typography>
                    </Box>
                    <Typography variant="body2" fontWeight="bold" color="primary">
                      {formatCurrency(goal.target - goal.current)} to go
                    </Typography>
                  </Box>
                </Box>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {filteredGoals.length === 0 && (
          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            py={4}
            color="text.secondary"
          >
            <Icon icon="solar:flag-bold-duotone" fontSize="large" sx={{ mb: 2, opacity: 0.5 }} />
            <Typography variant="body1">No goals set yet</Typography>
            <Typography variant="body2">Click the + button to add your first financial goal</Typography>
          </Box>
        )}

        {/* Add/Edit Goal Dialog */}
        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            {editingGoal ? 'Edit Goal' : 'Add New Goal'}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Goal Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Target Amount"
                  type="number"
                  value={formData.target}
                  onChange={(e) => setFormData({ ...formData, target: e.target.value })}
                  InputProps={{
                    startAdornment: <Icon icon="solar:wallet-money-bold-duotone" fontSize="small" />
                  }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Current Amount"
                  type="number"
                  value={formData.current}
                  onChange={(e) => setFormData({ ...formData, current: e.target.value })}
                  InputProps={{
                    startAdornment: <Icon icon="solar:trending-up-bold-duotone" fontSize="small" />
                  }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Deadline"
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  helperText={formData.category === 'Long-term Savings' ? 'This is a long-term savings goal that is independent of the jar allocation.' : ''}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  select
                  label="Priority"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  SelectProps={{
                    native: true,
                  }}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </TextField>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveGoal} variant="contained">
              {editingGoal ? 'Update' : 'Add'}
            </Button>
          </DialogActions>
        </Dialog>
      </CardContent>
      <Box display="flex" justifyContent="flex-end" sx={{ px: 2, pb: 2 }}>
        <Button
          variant="outlined"
          color="secondary"
          onClick={async () => {
            try {
              const token = localStorage.getItem('token');
              const res = await fetch('/api/v1/ai/goal/coaching', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  ...(token ? { Authorization: `Bearer ${token}` } : {})
                }
              });
              const data = await res.json();
              setAiGoalResult(data);
              setAiGoalDialogOpen(true);
            } catch (err) {
              setAiGoalResult({ error: 'AI Goal Coaching call failed' });
              setAiGoalDialogOpen(true);
            }
          }}
        >
          Demo AI Goal Coaching
        </Button>
      </Box>
      <Dialog open={aiGoalDialogOpen} onClose={() => setAiGoalDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>AI Goal Coaching Result</DialogTitle>
        <DialogContent>
          {aiGoalResult ? (
            <>
              {aiGoalResult.message && (
                <Typography variant="subtitle2" color="primary" mb={2}>
                  {aiGoalResult.message}
                </Typography>
              )}
              {aiGoalResult.financial_advice && aiGoalResult.financial_advice.advice && (
                <Box mb={2}>
                  <Typography variant="h6" color="success.main" fontWeight="bold">
                    {aiGoalResult.financial_advice.advice}
                  </Typography>
                </Box>
              )}
              {aiGoalResult.goal_analysis && aiGoalResult.goal_analysis.length > 0 && (
                <Box mb={2}>
                  <Typography variant="subtitle1" fontWeight="bold" mb={1}>Goal Analysis:</Typography>
                  {aiGoalResult.goal_analysis.map((goal, idx) => (
                    <Box key={idx} mb={2} p={2} sx={{ border: '1px solid #eee', borderRadius: 2, background: '#fafbfc' }}>
                      {/* Render các trường của goal, ví dụ: */}
                      <Typography variant="subtitle2" fontWeight="bold">{goal.name}</Typography>
                      <Typography variant="body2">Progress: {goal.progress}%</Typography>
                      {/* ... các trường khác nếu có ... */}
                    </Box>
                  ))}
                </Box>
              )}
              {aiGoalResult.financial_advice && aiGoalResult.financial_advice.retrieved_references && aiGoalResult.financial_advice.retrieved_references.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" fontWeight="bold" mb={1}>References:</Typography>
                  <ul>
                    {aiGoalResult.financial_advice.retrieved_references.map((ref, idx) => (
                      <li key={idx}>
                        <Typography variant="body2">{ref}</Typography>
                      </li>
                    ))}
                  </ul>
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

export default GoalSettings; 