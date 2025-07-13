import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  AppBar,
  Toolbar,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  Card,
  CardContent,
  Chip,
  Button
} from '@mui/material';
import {
  AccountCircle,
  Logout,
  Settings,
  Dashboard as DashboardIcon,
  TrendingUp,
  AccountBalance,
  Flag
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { fetchJarsData } from '../store/jarsSlice';
import JarSettings from '../../components/JarSettings';
import GoalSettings from '../../components/GoalSettings';
import DashboardCharts from '../../components/DashboardCharts';
import AlertNotification from '../../components/AlertNotification';

const EnhancedDashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { jars, loading, error } = useSelector((state) => state.dashboard);
  const { user } = useSelector((state) => state.auth);
  const [anchorEl, setAnchorEl] = useState(null);
  const [showAlert, setShowAlert] = useState(false);

  useEffect(() => {
    dispatch(fetchJarsData());
  }, [dispatch]);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    // Handle logout logic here
    handleMenuClose();
    navigate('/login');
  };

  const handleJarSettingsSave = (updatedJars) => {
    console.log('Jar settings updated:', updatedJars);
    // Here you would typically dispatch an action to update the jar settings
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const totalBalance = jars.reduce((sum, jar) => sum + (jar.currentBalance || 0), 0);
  const totalTarget = jars.reduce((sum, jar) => sum + (jar.target || 0), 0);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5
      }
    }
  };

  return (
    <Box sx={{ flexGrow: 1, backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      {/* App Bar */}
      <AppBar position="static" elevation={0} sx={{ backgroundColor: 'white', color: 'text.primary' }}>
        <Toolbar>
          <Box display="flex" alignItems="center" sx={{ flexGrow: 1 }}>
            <AccountBalance sx={{ mr: 2, color: 'primary.main' }} />
            <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
              Money Jars Dashboard
            </Typography>
          </Box>
          
          <Box display="flex" alignItems="center" gap={2}>
            <Chip
              label={`Total: ${formatCurrency(totalBalance)}`}
              color="primary"
              variant="outlined"
              size="small"
            />
            <IconButton
              size="large"
              onClick={handleMenuOpen}
              color="inherit"
            >
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                {user?.name?.charAt(0) || 'U'}
              </Avatar>
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
            >
              <MenuItem onClick={handleMenuClose}>
                <AccountCircle sx={{ mr: 1 }} />
                Profile
              </MenuItem>
              <MenuItem onClick={handleMenuClose}>
                <Settings sx={{ mr: 1 }} />
                Settings
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleLogout}>
                <Logout sx={{ mr: 1 }} />
                Logout
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Container maxWidth="xl" sx={{ mt: 3, mb: 4 }}>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Welcome Section */}
          <motion.div variants={itemVariants}>
            <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
              <CardContent>
                <Typography variant="h4" gutterBottom>
                  Welcome back, {user?.name || 'User'}! 👋
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.9 }}>
                  Track your financial progress and manage your money jars effectively
                </Typography>
              </CardContent>
            </Card>
          </motion.div>

          {/* Quick Stats */}
          <motion.div variants={itemVariants}>
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ textAlign: 'center', py: 2 }}>
                  <CardContent>
                    <TrendingUp color="primary" sx={{ fontSize: 40, mb: 1 }} />
                    <Typography variant="h6" color="primary">
                      {formatCurrency(totalBalance)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Balance
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ textAlign: 'center', py: 2 }}>
                  <CardContent>
                    <Flag color="success" sx={{ fontSize: 40, mb: 1 }} />
                    <Typography variant="h6" color="success.main">
                      {formatCurrency(totalTarget)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Target
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ textAlign: 'center', py: 2 }}>
                  <CardContent>
                    <AccountBalance color="warning" sx={{ fontSize: 40, mb: 1 }} />
                    <Typography variant="h6" color="warning.main">
                      {jars.length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Active Jars
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ textAlign: 'center', py: 2 }}>
                  <CardContent>
                    <DashboardIcon color="info" sx={{ fontSize: 40, mb: 1 }} />
                    <Typography variant="h6" color="info.main">
                      {((totalBalance / totalTarget) * 100).toFixed(1)}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Progress
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </motion.div>

          {/* Main Dashboard Grid */}
          <Grid container spacing={3}>
            {/* Charts Section */}
            <motion.div variants={itemVariants}>
              <Grid item xs={12} lg={8}>
                <DashboardCharts jars={jars} />
              </Grid>
            </motion.div>

            {/* Jar Settings Section */}
            <motion.div variants={itemVariants}>
              <Grid item xs={12} lg={4}>
                <JarSettings onSave={handleJarSettingsSave} />
              </Grid>
            </motion.div>

            {/* Goal Settings Section */}
            <motion.div variants={itemVariants}>
              <Grid item xs={12}>
                <GoalSettings />
              </Grid>
            </motion.div>
          </Grid>
        </motion.div>
      </Container>

      <AlertNotification
        open={!!error}
        message={error}
        severity="error"
        onClose={() => setShowAlert(false)}
      />
    </Box>
  );
};

export default EnhancedDashboard; 