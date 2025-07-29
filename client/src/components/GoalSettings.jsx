// src/components/GoalSettings.jsx
import React, {useEffect, useState} from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  IconButton,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  CircularProgress
} from '@mui/material';
import { Icon } from '@iconify/react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchGoalsData,
  createGoalsBatchThunk,
  allocateSavingThunk,
  pauseGoalThunk,
  deleteGoalThunk
} from '../store/goalsSlice';

import ReactMarkdown from 'react-markdown';

const defaultGoal = {
  goal_name: '',
  target_amount: '',
  goal_type: 'long_term',
  priority_level: 3,
  eta_lock: 0
};

const GoalSettings = (props) => {
  const dispatch = useDispatch();
  const { goals } = useSelector(state => state.goals);
  const { ltss } = props;
  const {virtual_budget_amount: monthlyAmount} = ltss || {}
  const [userId] = useState('mock-user-id'); // Replace with real user id
  const [goalForms, setGoalForms] = useState([{ ...defaultGoal }]);
  const [aiGoalDialogOpen, setAiGoalDialogOpen] = useState(false);
  const [aiGoalResult, setAiGoalResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    dispatch(fetchGoalsData(userId));
  }, [dispatch, userId]);

  const handleGoalChange = (index, field, value) => {
    const updated = [...goalForms];
    updated[index][field] = value;
    setGoalForms(updated);
  };

  const handleAddGoal = () => {
    setGoalForms([...goalForms, { ...defaultGoal }]);
  };

  const handleRemoveGoal = (index) => {
    if (goalForms.length > 1) {
      setGoalForms(goalForms.filter((_, i) => i !== index));
    }
  };

  const handleCreateGoals = () => {
    dispatch(createGoalsBatchThunk({
      total_monthly_amount: parseFloat(monthlyAmount),
      goals: goalForms.map(g => ({
        ...g,
        target_amount: parseFloat(g.target_amount)
      }))
    })).then(() => {
      dispatch(fetchGoalsData(userId));
    })
    setGoalForms([{ ...defaultGoal }]);
  };

  const handleDistributeSaving = () => {
    dispatch(allocateSavingThunk({
      sent_amount: parseFloat(monthlyAmount)
    })).then(() => {
      dispatch(fetchGoalsData(userId));
    })
  };

  const handlePauseGoal = (goal_id) => {
    dispatch(pauseGoalThunk({ goal_id })).then(() => {
      dispatch(fetchGoalsData(userId));
    })
  };

  const handleDeleteGoal = (goal_id) => {
    dispatch(deleteGoalThunk({ goal_id })).then(() => {
      dispatch(fetchGoalsData(userId));
    })

  };

  const getProgress = (goal) => {
    const { current_amount = 0, target_amount = 1 } = goal;
    return Math.min((current_amount / target_amount) * 100, 100);
  };

  return (
      <Card sx={{ borderRadius: 4, boxShadow: 3 }}>
        <CardContent>
          <Typography
              variant="h6"
              sx={{
                background: '-webkit-linear-gradient(0,#e00200,#015aad,#00b74f)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                color: 'black',
                fontWeight: 'bold',
                paddingBottom: '10px'
              }}
          >
            Goal Settings
          </Typography>
          <Grid container spacing={2} alignItems="center" mb={2}>
            <Grid item xs={9}>
              <TextField
                  fullWidth
                  label="Total Monthly Amount"
                  disabled={true}
                  value={monthlyAmount}
              />
            </Grid>
            <Grid item xs={3}>
              <Button fullWidth variant="outlined" onClick={handleDistributeSaving}>Distribute Saving</Button>
            </Grid>
          </Grid>

          {goalForms.map((goal, index) => (
              <Grid container spacing={2} key={index} mb={2}>
                <Grid item xs={4}>
                  <TextField
                      fullWidth
                      label="Goal Name"
                      value={goal.goal_name}
                      onChange={(e) => handleGoalChange(index, 'goal_name', e.target.value)}
                  />
                </Grid>
                <Grid item xs={4}>
                  <TextField
                      fullWidth
                      label="Target"
                      type="number"
                      value={goal.target_amount}
                      onChange={(e) => handleGoalChange(index, 'target_amount', e.target.value)}
                  />
                </Grid>
                <Grid item xs={2}>
                  <TextField
                      fullWidth
                      label="Goal Type"
                      value={goal.goal_type}
                      onChange={(e) => handleGoalChange(index, 'goal_type', e.target.value)}
                  />
                </Grid>
                <Grid item xs={2}>
                  <TextField
                      fullWidth
                      label="Priority"
                      select
                      value={goal.priority_level}
                      onChange={(e) => handleGoalChange(index, 'priority_level', e.target.value)}
                      SelectProps={{ native: true }}
                  >
                    <option value={3}>Low</option>
                    <option value={2}>Moderate</option>
                    <option value={1}>Urgent</option>
                  </TextField>
                </Grid>
                <Grid item xs={12}>
                  <Box display="flex" justifyContent="flex-end">
                    <IconButton onClick={() => handleRemoveGoal(index)} color="error">
                      <Icon icon="solar:trash-bin-trash-bold-duotone" />
                    </IconButton>
                  </Box>
                </Grid>
              </Grid>
          ))}

          <Box mb={2}>
            <Button variant="text" onClick={handleAddGoal} startIcon={<Icon icon="solar:add-circle-bold-duotone" />}>Add Goal</Button>
          </Box>

          <Button variant="contained" onClick={handleCreateGoals}>Create Goals</Button>

          <Box mt={4}>
            <Typography variant="h6" fontWeight="bold" mb={2}>Your Goals</Typography>
            {goals.map(goal => (
                <Box key={goal.goal_id} p={2} mb={2} border="1px solid #ccc" borderRadius={2}>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography variant="subtitle1" fontWeight="bold">{goal.goal_name}</Typography>
                      <Chip label={goal.goal_type} sx={{ mr: 1 }} />
                      <Chip label={goal.priority_level === 1? 'Urgent': goal.priority_level === 2? 'Moderate' : 'Low'} color="primary" sx={{ mr: 1 }} />
                      <Chip label={goal.target_date} color="secondary" />
                    </Box>
                    <Box>
                      <IconButton onClick={() => handlePauseGoal(goal.goal_id)} color="warning">
                        <Icon icon="solar:pause-circle-bold-duotone" />
                      </IconButton>
                      <IconButton onClick={() => handleDeleteGoal(goal.goal_id)} color="error">
                        <Icon icon="solar:trash-bin-trash-bold-duotone" />
                      </IconButton>
                    </Box>
                  </Box>
                  <Box mt={1}>
                    <Typography variant="body2">Progress: {getProgress(goal).toFixed(1)}%</Typography>
                    <LinearProgress variant="determinate" value={getProgress(goal)} sx={{height: 8, borderRadius: 4}}/>
                    <span style={{fontSize: 9}}>{goal.target_date}</span>
                  </Box>
                </Box>
            ))}
          </Box>
          <Box display="flex" justifyContent="flex-end" sx={{ px: 2, pb: 2 }}>
            <Button
                variant="outlined"
                color="secondary"
                onClick={async () => {
                  try {
                    const token = localStorage.getItem('token')
                    setLoading(true)
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
                    setLoading(false)
                  } catch (err) {
                    setAiGoalResult({ error: 'AI Goal Coaching call failed' });
                    setAiGoalDialogOpen(true);
                    setLoading(false)
                  }
                }}
            >
              Demo AI Goal Coaching
            </Button>
          </Box>
          {loading ? <LinearProgress /> : null}
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
                          <ReactMarkdown>
                            {aiGoalResult.financial_advice.advice}
                          </ReactMarkdown>
                        </Box>
                    )}
                    {aiGoalResult.goal_analysis && aiGoalResult.goal_analysis.length > 0 && (
                        <Box mb={2}>
                          <Typography variant="subtitle1" fontWeight="bold" mb={1}>Goal Analysis:</Typography>
                          {aiGoalResult.goal_analysis.map((goal, idx) => (
                              <Card key={idx} sx={{ mb: 2, p: 2, background: '#f9f9f9' }}>
                                <Typography variant="h6">{goal.goal_name}</Typography>
                                <Chip label={goal.goal_type} sx={{ mr: 1 }} />
                                <Chip label={
                                  goal.priority_level === 1 ? 'Urgent' :
                                  goal.priority_level === 2 ? 'Moderate' : 'Low'
                                } color="primary" sx={{ mr: 1 }} />
                                <Typography variant="body2">Status: {goal.on_track_status}</Typography>
                                <Box mt={1} mb={1}>
                                  <LinearProgress variant="determinate" value={goal.progress_percent} sx={{ height: 8, borderRadius: 4 }} />
                                  <Typography variant="body2">
                                    {goal.current_amount?.toLocaleString('vi-VN')} / {goal.target_amount?.toLocaleString('vi-VN')} VND ({goal.progress_percent}%)
                                  </Typography>
                                </Box>
                                <Typography variant="body2">Target Date: {goal.target_date}</Typography>
                                <Typography variant="body2">Months Remaining: {goal.remaining_months?.toFixed(1)}</Typography>
                                <Typography variant="body2">Monthly Needed: {goal.current_monthly_saving_needed?.toLocaleString('vi-VN')} VND</Typography>
                                <Typography variant="body2">Initial Monthly Needed: {goal.initial_monthly_saving_needed?.toLocaleString('vi-VN')} VND</Typography>
                              </Card>
                          ))}
                        </Box>
                    )}
                    {aiGoalResult.financial_advice && aiGoalResult.financial_advice.retrieved_references && aiGoalResult.financial_advice.retrieved_references.length > 0 && (
                        <Box>
                          <Typography variant="subtitle2" fontWeight="bold" mb={1}>Tham khảo:</Typography>
                          <ul>
                            {aiGoalResult.financial_advice.retrieved_references.map((ref, idx) => (
                                <li key={idx}>
                                  <ReactMarkdown>
                                    {ref.content?.text}
                                  </ReactMarkdown>
                                  {ref.location?.s3Location?.uri && (
                                    <a href={ref.location.s3Location.uri} target="_blank" rel="noopener noreferrer">
                                      [Nguồn]
                                    </a>
                                  )}
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
        </CardContent>
      </Card>
  );
};
export default GoalSettings; 