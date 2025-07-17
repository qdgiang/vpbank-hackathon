import React, { useState, useRef, useEffect } from 'react';
import {
  Container,
  Grid,
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
  LinearProgress,
  Tabs,
  Tab,
  Select,
  FormControl,
  InputLabel,
  GlobalStyles
} from '@mui/material';
import { motion } from 'framer-motion';
import JarSettings from '../../components/JarSettings';
import GoalSettings from '../../components/GoalSettings';
import { useNavigate } from 'react-router-dom';
import TransactionInputButton from '../../components/TransactionInput';
import NotificationCenter from '../../components/NotificationCenter';
import * as am5 from '@amcharts/amcharts5';
import * as am5percent from '@amcharts/amcharts5/percent';
import am5themes_Animated from '@amcharts/amcharts5/themes/Animated';
import { Icon } from '@iconify/react';
import JarPolarChart from '../../components/JarPolarChart';
import ApexCharts from 'react-apexcharts';
import dayjs from 'dayjs';
import { useDispatch, useSelector } from 'react-redux';
import { fetchTransactionsData, createTransactionData } from '../../store/transactionsSlice';
import { fetchJarsData } from '../../store/jarsSlice';
import TransactionManagementCard from '../../components/TransactionManagementCard';
import ChatSession from '../../components/ChatSession';
import { setUser } from '../../store/authSlice';

const DEFAULT_USER = {
  user_id: "000b1dd0-c880-45fd-8515-48dd705a3aa2",
  email: "justin42@example.org",
  hash_pwd: null,
  phone: "001-585-307-9419",
  identity_number: null,
  full_name: "Võ Ngọc Huyền",
  gender: null,
  date_of_birth: "1993-05-24",
  status: 0,
  timezone: "Asia/Ho_Chi_Minh",
  city: "TP HCM",
  created_at: "2020-11-04 07:44:59",
  updated_at: "2021-06-02 07:44:59",
  is_active: 1
};

const DemoDashboard = () => {
  const pieChartRef = useRef(null);
  const am5RootRef = useRef(null);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  // Get transactions from Redux, always ensure it's an array
  const rawTransactions = useSelector(state => state.transactions.transactions);
  const transactions = Array.isArray(rawTransactions)
    ? rawTransactions
    : (rawTransactions?.transactions || []);
  // Get jars from Redux (already an array of objects from API)
  const jars = useSelector(state => state.jars.jars) || [];
  // Standard jar list
  const jarList = [
    { key: 'NEC', name: 'Necessities', color: '#FF6B6B', description: 'Basic needs like food, housing, utilities' },
    { key: 'FFA', name: 'Financial Freedom', color: '#4ECDC4', description: 'Investments and long-term savings' },
    { key: 'LTSS', name: 'Long-term Savings', color: '#45B7D1', description: 'Emergency fund and big purchases' },
    { key: 'EDU', name: 'Education', color: '#96CEB4', description: 'Learning and personal development' },
    { key: 'PLY', name: 'Play', color: '#FFEAA7', description: 'Entertainment and fun activities' },
    { key: 'GIV', name: 'Give', color: '#DDA0DD', description: 'Charity and helping others' },
  ];
  // Map API jars to standard UI (merge extra info from jarList if needed)
  const mergedJars = jarList.map(jar => {
    const apiJar = jars.find(j => j.jar_code === jar.key);
    return apiJar
      ? {
          ...jar,
          percent: Number(apiJar.percent),
          virtual_budget_amount: Number(apiJar.virtual_budget_amount),
          spent_amount: Number(apiJar.spent_amount),
          remaining_budget: Number(apiJar.remaining_budget),
          y_month: apiJar.y_month,
        }
      : jar;
  });
  // After getting jars from Redux and mapping mergedJars, only keep summary declarations and data here:
  const totalIncome = mergedJars.reduce((sum, jar) => sum + (jar.virtual_budget_amount || 0), 0);
  const totalExpense = mergedJars.reduce((sum, jar) => sum + (jar.spent_amount || 0), 0);
  const totalBalance = mergedJars.reduce((sum, jar) => sum + (jar.remaining_budget || 0), 0);
  const net = totalIncome - totalExpense;
  const user = useSelector(state => state.auth.user);
  const notifications = useSelector(state => state.notifications.notifications);
  const unreadCount = notifications.filter(n => n.status === 0 || n.read !== true).length;
  const goals = useSelector(state => state.goals.goals); // If goals in redux, else keep local

  // Synchronize data with transactions
  // Create an array of months present in transactions and sort by chronological order
  const allMonths = transactions.map(tx => dayjs(tx.txn_time).format('MMM'));
  const uniqueMonths = [...new Set(allMonths)];
  const months = uniqueMonths.sort((a, b) => {
    const monthOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return monthOrder.indexOf(a) - monthOrder.indexOf(b);
  });
  
  // Ensure there are 9 months of data for the chart
  const currentDate = dayjs();
  const chartMonths = [];
  for (let i = 8; i >= 0; i--) {
    const monthDate = currentDate.subtract(i, 'month');
    chartMonths.push(monthDate.format('MMM'));
  }
  
  // Income types (+)
  const IN_TYPES = [
    'transfer_in',
    'cashback',
    'refund',
    'opensaving',
    'opendeposit',
    'openaccumulation'
  ];
  // Expense types (-)
  const OUT_TYPES = [
    'transfer_out',
    'qrcode_payment',
    'atm_withdrawal',
    'service_fee',
    'loan_repayment',
    'stock',
    'bill_payment',
    'mobile_topup'
  ];
  function getTransactionSign(tranx_type) {
    if (IN_TYPES.includes(tranx_type)) return 1;
    if (OUT_TYPES.includes(tranx_type)) return -1;
    return 0;
  }

  const [notificationFilter, setNotificationFilter] = useState('all');
  const [overviewTab, setOverviewTab] = useState(0);
  const [statTab, setStatTab] = useState('income');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState('All');
  const [showChat, setShowChat] = useState(false);
  const [txForm, setTxForm] = useState({
    amount: '',
    txn_time: '',
    msg_content: '',
    merchant: '',
    location: '',
    channel: '',
    tranx_type: 'transfer_out',
  });
  // Get the list of months present in transactions
  const monthOptions = Array.from(new Set(transactions.map(tx => dayjs(tx.txn_time).format('MMM YYYY'))));

  // 2. useEffect to fetch all data on mount
  useEffect(() => {
    dispatch(fetchTransactionsData());
    dispatch(fetchJarsData());
    // dispatch(fetchGoalsData()); // If goals in redux
  }, [dispatch]);

  useEffect(() => {
    if (!user || !user.user_id) {
      dispatch(setUser(DEFAULT_USER));
    }
  }, [user, dispatch]);

  const incomeData = chartMonths.map(month =>
    transactions.filter(tx => getTransactionSign(tx.tranx_type) > 0 && dayjs(tx.txn_time).format('MMM') === month)
      .reduce((sum, tx) => sum + Math.abs(Number(tx.amount)), 0)
  );
  const expenseData = chartMonths.map(month =>
    transactions.filter(tx => getTransactionSign(tx.tranx_type) < 0 && dayjs(tx.txn_time).format('MMM') === month)
      .reduce((sum, tx) => sum + Math.abs(Number(tx.amount)), 0)
  );
  const incomeChange = incomeData.length > 1
    ? (incomeData[incomeData.length-2] === 0
        ? '100'
        : (((incomeData[incomeData.length-1] - incomeData[incomeData.length-2]) / incomeData[incomeData.length-2]) * 100).toFixed(1)
      )
    : '100';

  const expenseChange = expenseData.length > 1
    ? (expenseData[expenseData.length-2] === 0
        ? '100'
        : (((expenseData[expenseData.length-1] - expenseData[expenseData.length-2]) / expenseData[expenseData.length-2]) * 100).toFixed(1)
      )
    : '100';

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleMenuClose();
    // In a real app, this would handle logout
    console.log('Logout clicked');
  };

  const handleJarSettingsSave = (updatedJars) => {
    const newSettings = {};
    updatedJars.forEach(jar => {
      newSettings[jar.key] = jar.percent;
    });
    dispatch(updateJarData(newSettings));
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

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

  // --- Notification unread count logic ---

  const handleAddTransaction = (tx) => {
    dispatch(createTransactionData(tx));
  };

  // Function to classify transaction into a jar (temporarily based on description)
  const classifyTransaction = (tx) => {
    const desc = (tx.msg_content || '').toLowerCase();
    // FFA (Financial Freedom)
    if (
      desc.includes('lương') || desc.includes('salary') ||
      desc.includes('lãi') || desc.includes('interest') ||
      desc.includes('đầu tư') || desc.includes('investment') ||
      desc.includes('cổ phiếu') || desc.includes('stock')
    ) return 'FFA';
    // Necessities
    if (
      desc.includes('ăn uống') || desc.includes('food') ||
      desc.includes('mua sắm') || desc.includes('shopping') ||
      desc.includes('điện') || desc.includes('electricity') ||
      desc.includes('điện thoại') || desc.includes('phone') ||
      desc.includes('đồ ăn') || desc.includes('groceries') ||
      desc.includes('utilities') || desc.includes('gas') ||
      desc.includes('water') || desc.includes('transport') ||
      desc.includes('xe buýt') || desc.includes('bus') ||
      desc.includes('taxi') || desc.includes('grab') ||
      desc.includes('nhà') || desc.includes('rent') || desc.includes('housing')
    ) return 'Necessities';
    // Education
    if (
      desc.includes('sách') || desc.includes('book') ||
      desc.includes('học') || desc.includes('study') ||
      desc.includes('học phí') || desc.includes('tuition') ||
      desc.includes('course') || desc.includes('khóa học')
    ) return 'Education';
    // LTSS (Long-term Savings)
    if (
      desc.includes('tiết kiệm') || desc.includes('saving') ||
      desc.includes('long-term') || desc.includes('chuyển tiền tiết kiệm') ||
      desc.includes('emergency fund')
    ) return 'LTSS';
    // Play
    if (
      desc.includes('giải trí') || desc.includes('entertainment') ||
      desc.includes('mua đồ chơi') || desc.includes('toy') ||
      desc.includes('vui chơi') || desc.includes('play') ||
      desc.includes('du lịch') || desc.includes('travel') ||
      desc.includes('party') || desc.includes('game')
    ) return 'Play';
    // Give
    if (
      desc.includes('từ thiện') || desc.includes('charity') ||
      desc.includes('cho mẹ') || desc.includes('cho ba') ||
      desc.includes('ủng hộ') || desc.includes('donate') ||
      desc.includes('give') || desc.includes('help')
    ) return 'Give';
    // Default
    return 'Necessities';
  };
  // Calculate saved amount for each goal from transactions (temporarily based on description)
  const computedGoals = goals.map(goal => {
    const goalName = goal.goal_name?.toLowerCase?.() || '';
    const target = Number(goal.target_amount) || 1;

    const goalTxs = transactions.filter(tx => {
      const content = tx.msg_content?.toLowerCase?.() || '';
      return content.includes(goalName) || content.includes('tiết kiệm');
    });

    const saved = goalTxs.reduce((sum, tx) => {
      const amount = Number(tx.amount) || 0;
      return sum + (getTransactionSign(tx.tranx_type) > 0 ? Math.abs(amount) : 0);
    }, 0);

    const percent = Math.min(100, (saved / target) * 100);

    const months = Array.from(new Set(goalTxs.map(tx =>
        dayjs(tx.txn_time).format('YYYY-MM')
    )));
    const avgPerMonth = months.length > 0 ? saved / months.length : 0;
    const eta = avgPerMonth > 0 ? Math.ceil((target - saved) / avgPerMonth) : null;

    return {
      ...goal,
      saved,
      percent,
      eta
    };
  });


  useEffect(() => {
    if (!pieChartRef.current) return;
    if (am5RootRef.current) {
      am5RootRef.current.dispose();
    }
    const root = am5.Root.new(pieChartRef.current);
    am5RootRef.current = root;
    root.setThemes([am5themes_Animated.new(root)]);
    const chart = root.container.children.push(
      am5percent.PieChart.new(root, {
        layout: root.verticalLayout
      })
    );
    const series = chart.series.push(
      am5percent.PieSeries.new(root, {
        alignLabels: true,
        calculateAggregates: true,
        valueField: 'value',
        categoryField: 'category',
        fillField: 'color'
      })
    );
    series.slices.template.setAll({
      strokeWidth: 3,
      stroke: am5.color(0xffffff)
    });
    series.labelsContainer.set('paddingTop', 30);
    series.labels.template.setAll({
      fontSize: 12,
      fillOpacity: 0.9,
      fontWeight: 500,
    })
    // Variable slice radius
    series.slices.template.adapters.add('radius', function (radius, target) {
      var dataItem = target.dataItem;
      var high = series.getPrivate('valueHigh');
      if (dataItem) {
        var value = target.dataItem.get('valueWorking', 0);
        return radius * value / high;
      }
      return radius;
    });
    // Set data
    series.data.setAll(
      mergedJars.map(jar => ({
        value: jar.percent || 0,
        category: jar.name,
        color: jar.color || am5.color('#4ECDC4')
      }))
    );
    // Legend
    var legend = chart.children.push(
      am5.Legend.new(root, {
        centerX: am5.p50,
        x: am5.p50,
        marginTop: 15,
        marginBottom: 15,
      })
    );
    legend.markers.template.setAll({
      width: 12,
      height: 12,
      cornerRadiusTL: 10,
      cornerRadiusTR: 10,
      cornerRadiusBL: 10,
      cornerRadiusBR: 10
    });
    legend.data.setAll(series.dataItems);
    legend.labels.template.setAll({ text: "{category}" });
    legend.labels.template.setAll({
      fontSize: 13,
      fontWeight: "400"
    });
    legend.valueLabels.template.set("forceHidden", true);

    // Animation
    series.appear(1000, 100);
    series.labels.template.setAll({
      text: "{valuePercentTotal.formatNumber('#.0')}%"
    });
    series.labels.template.adapters.add('forceHidden', function(forceHidden, target) {
      var dataItem = target.dataItem;
      if (dataItem && dataItem.get('valuePercentTotal') < 8) {
        return true;
      }
      return false;
    });
    // Hide amCharts logo
    root._logo && root._logo.set("forceHidden", true);
    return () => {
      root.dispose();
      am5RootRef.current = null;
    };
  }, [jarList]); // Depend on jarList to update when settings change

  return (
    <>
      <GlobalStyles styles={{ '.MuiInputBase-root, .MuiButtonBase-root': { borderRadius: '8px!important', padding: '2px 8px!important' }, '.MuiInputBase-input': {padding: '0 5 0 0!important'}, '.MuiInputBase-root, .MuiFormLabel-root': {fontSize: '13px!important'}}} />
      <Box sx={{ flexGrow: 1, backgroundColor: '#f5f5f5', minHeight: '100vh', fontFamily: 'sans-serif' }}>
        {/* App Bar */}
        <AppBar position="static" elevation={0} sx={{ backgroundColor: 'white', color: 'text.primary' }}>
          <Toolbar>
            <Box display="flex" alignItems="center" sx={{ flexGrow: 1 }}>
              <Typography
                  variant="h6"
                  sx={{
                    background: '-webkit-linear-gradient(0,#e00200,#015aad,#00b74f)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    color: '#00000',
                    fontWeight: 'bold'
                  }}
              >
                SmartJarvis
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
                  G
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
                <MenuItem
                    onClick={() => {
                      localStorage.clear();
                      sessionStorage.clear();
                      window.location.reload();
                    }}
                >
                  <Icon icon="solar:logout-2-line-duotone" style={{ marginRight: 8 }} />
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
              <Card sx={{ p: 4, borderRadius: 4, mb: 3, background: 'linear-gradient(90deg,#015aad,#00b74f)', color: '#c4f5d0' }}>
                <CardContent>
                  <Typography variant="h4" gutterBottom fontWeight={"bold"}>
                    Welcome to <span style={{color: '#53cd73'}}>SmartJarvis</span> Demo! 👋
                  </Typography>
                  <Typography variant="body1" sx={{ opacity: 0.9 }}>
                    This is a demonstration of the enhanced dashboard with Jar Settings, Goal Settings, and AI Coaching
                  </Typography>
                </CardContent>
              </Card>
            </motion.div>

            {/* Quick Stats */}
            <motion.div variants={itemVariants}>
              <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ textAlign: 'center', py: 2, borderRadius: 4, background: '#e3f2fd' }}>
                    <CardContent>
                      <Icon icon="solar:dollar-bold-duotone" style={{ fontSize: 40, marginBottom: 8, color: '#1976d2' }} />
                      <Typography variant="h5" sx={{ color: '#1976d2', fontWeight: 'bold' }}>
                        {formatCurrency(totalBalance)}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#1976d2', opacity: 0.7 }}>
                        Total Balance
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ textAlign: 'center', py: 2, borderRadius: 4, background: '#e8f5e9' }}>
                    <CardContent>
                      <Icon icon="solar:wallet-bold-duotone" style={{ fontSize: 40, marginBottom: 8, color: '#388e3c' }} />
                      <Typography variant="h5" sx={{ color: '#388e3c', fontWeight: 'bold' }}>
                        {mergedJars.length}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#388e3c', opacity: 0.7 }}>
                        Total Jars
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ textAlign: 'center', py: 2, borderRadius: 4, background: '#fff3e0' }}>
                    <CardContent>
                      <Icon icon="solar:flag-bold-duotone" style={{ fontSize: 40, marginBottom: 8, color: '#f57c00' }} />
                      <Typography variant="h5" sx={{ color: '#f57c00', fontWeight: 'bold' }}>
                        {goals.length}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#f57c00', opacity: 0.7 }}>
                        Total Goals
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ textAlign: 'center', py: 2, borderRadius: 4, background: '#ede7f6' }}>
                    <CardContent>
                      <Icon icon="solar:graph-up-bold-duotone" style={{ fontSize: 40, marginBottom: 8, color: '#7c4dff' }} />
                      <Typography variant="h5" sx={{ color: '#7c4dff', fontWeight: 'bold' }}>
                        {computedGoals.length > 0 ? `${(
                          computedGoals.reduce((sum, g) => sum + (g.percent || 0), 0) / computedGoals.length
                        ).toFixed(1)}%` : '0%'}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#7c4dff', opacity: 0.7 }}>
                        Goals Progress
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </motion.div>

            {/* Main Dashboard Grid */}
            <Grid container spacing={3}>
              {/* Left Column - Finance Overview, Jar Progress, and Goals */}
              <Grid item xs={12} lg={8}>
                {/* New income/expense statistics */}
                <motion.div variants={itemVariants}>
                  <Card sx={{ mb: 3, borderRadius: 4, boxShadow: '0 2px 12px #0001', p: 3 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <Box>
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
                          Balances Overview
                        </Typography>
                      </Box>
                    </Box>
                    <Box sx={{ background: '#f8fafc', borderRadius: 3, p: 2, mb: 2 }}>
                      <Box display="flex" alignItems="center" gap={2}>
                        <Box
                          onClick={() => setStatTab('income')}
                          sx={{
                            flex: 1,
                            background: statTab === 'income' ? '#fff' : 'transparent',
                            borderRadius: 3,
                            p: 4,
                            outline: 'none',
                            boxShadow: statTab === 'income' ? 'rgba(0, 0, 0, 0.1) 0px 10px 15px -3px, rgba(0, 0, 0, 0.05) 0px 4px 6px -2px' : 0,
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                        >
                          <Box display="flex" alignItems="center" gap={1} mb={1}>
                            <Icon icon="solar:arrow-left-down-linear" style={{ fontSize: 28, background: '#0a4d3c', color: '#fff', borderRadius: '50%', padding: 10 }} />
                            <Typography variant="h6" fontWeight="bold">Income</Typography>
                            <Icon icon="solar:info-circle-bold-duotone" style={{ fontSize: 18, color: '#bdbdbd' }} />
                            <Box ml="auto" display="flex" alignItems="center" gap={0.5}>
                              {Number(incomeChange.replace('%','')) >= 0 ? (
                                <Icon icon="solar:alt-arrow-up-bold-duotone" style={{ color: '#2e7d32', fontSize: 18 }} />
                              ) : (
                                <Icon icon="solar:alt-arrow-down-bold-duotone" style={{ color: '#d32f2f', fontSize: 18 }} />
                              )}
                              <Typography variant="body2" color="success.main" fontWeight="bold">{Number(incomeChange.replace('%','')) >= 0 ? '+' : '-'}{incomeChange}%</Typography>
                            </Box>
                          </Box>
                          <Typography variant="h5" fontWeight="bold" color="primary.main">
                            {formatCurrency(totalIncome)}
                          </Typography>
                        </Box>
                        <Box
                          onClick={() => setStatTab('expense')}
                          sx={{
                            flex: 1,
                            background: statTab === 'expense' ? '#fff' : 'transparent',
                            borderRadius: 3,
                            p: 4,
                            boxShadow: statTab === 'expense' ? 'rgba(0, 0, 0, 0.1) 0px 10px 15px -3px, rgba(0, 0, 0, 0.05) 0px 4px 6px -2px' : 0,
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                        >
                          <Box display="flex" alignItems="center" gap={1} mb={1}>
                            <Icon icon="solar:arrow-right-up-linear" style={{ fontSize: 28, background: '#7c3f00', color: '#fff', borderRadius: '50%', padding: 10 }} />
                            <Typography variant="h6" fontWeight="bold">Expenses</Typography>
                            <Icon icon="solar:info-circle-bold-duotone" style={{ fontSize: 18, color: '#bdbdbd' }} />
                            <Box ml="auto" display="flex" alignItems="center" gap={0.5}>
                              {Number(expenseChange.replace('%','')) >= 0 ? (
                                <Icon icon="solar:alt-arrow-up-bold-duotone" style={{ color: '#d32f2f', fontSize: 18 }} />
                              ) : (
                                <Icon icon="solar:alt-arrow-down-bold-duotone" style={{ color: '#2e7d32', fontSize: 18 }} />
                              )}
                              <Typography variant="body2" color="error.main" fontWeight="bold">{Number(expenseChange.replace('%','')) >= 0 ? '+' : '-'}{expenseChange}%</Typography>
                            </Box>
                          </Box>
                          <Typography variant="h5" fontWeight="bold" color="error.main">
                            {formatCurrency(totalExpense)}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                    {/* Chart based on tab */}
                    <Box sx={{ width: '100%', height: 220 }}>
                      <ApexCharts
                        options={{
                          chart: { id: 'stat-line', toolbar: { show: false } },
                          xaxis: { categories: chartMonths },
                          stroke: { curve: 'smooth', width: 3 },
                          colors: [statTab === 'income' ? '#0a4d3c' : '#d32f2f'],
                          grid: { show: true, borderColor: '#e0e0e0' },
                          dataLabels: { enabled: false },
                          yaxis: { show: false },
                          tooltip: { enabled: true },
                          fill: { type: 'solid', opacity: 0.2 },
                        }}
                        series={[{
                          name: statTab === 'income' ? 'Income' : 'Expense',
                          data: statTab === 'income' ? incomeData : expenseData
                        }]}
                        type="line"
                        height={220}
                      />
                    </Box>
                  </Card>
                </motion.div>
                {/* Financial Overview + JarPolarChart in 1 card with Tabs */}
                <motion.div variants={itemVariants}>
                  <Card sx={{ mb: 3, borderRadius: 4, boxShadow: '0 2px 12px #0001' }}>
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
                          Jars Overview
                        </Typography>
                        <TransactionInputButton onAddTransaction={handleAddTransaction} />
                      </Box>
                      <FormControl size="small" sx={{ minWidth: 120, float: 'right', mb: 1 }}>
                        <InputLabel>Month</InputLabel>
                        <Select
                            variant={'outlined'}
                          value={selectedMonth}
                          label="Month"
                          onChange={e => setSelectedMonth(e.target.value)}
                        >
                          <MenuItem value="All">All</MenuItem>
                          {monthOptions.map(month => (
                            <MenuItem key={month} value={month}>{month}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      <Tabs value={overviewTab} onChange={(_, v) => setOverviewTab(v)} sx={{ mb: 2 }}>
                        <Tab label="Progress" />
                        <Tab label="Polar Chart" />
                        {/*<Tab label="Goals Progress" />*/}
                      </Tabs>
                      {overviewTab === 0 && (
                        <>
                          <Box sx={{ mt: 2 }}>
                            {(() => {
                              const totalSpent = mergedJars.reduce((sum, j) => sum + (j.spent_amount || 0), 0);
                              return mergedJars.map((jar) => {
                                const percentUsed = totalSpent > 0 ? (jar.spent_amount / totalSpent) * 100 : 0;
                                const isExceeded = percentUsed > jar.percent;
                                // Progress bar: so sánh với ngân sách thực tế của jar
                                const progress = jar.virtual_budget_amount > 0 ? (jar.spent_amount / jar.virtual_budget_amount) * 100 : 0;
                                return (
                                  <Box key={jar.name} sx={{ mb: 2, p: 2, borderRadius: 3, background: '#fafbfc', boxShadow: '0 1px 4px #0001' }}>
                                    <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                                      <Box display="flex" alignItems="center" gap={1}>
                                        <Box sx={{ width: 16, height: 16, borderRadius: '50%', background: jar.color || '#ccc' }} />
                                        <Typography variant="subtitle1" fontWeight="bold">{jar.name}</Typography>
                                      </Box>
                                      <Chip
                                        label={`${percentUsed.toFixed(1)}% / ${jar.percent}%`}
                                        size="small"
                                        sx={{
                                          fontWeight: 'bold',
                                          backgroundColor: isExceeded ? '#d32f2f' : '#1976d2',
                                          color: '#fff'
                                        }}
                                      />
                                    </Box>
                                    <Box display="flex" alignItems="center" justifyContent="space-between" mb={0.5}>
                                      <Typography variant="body2" color="text.secondary">
                                        Spent: {formatCurrency(jar.spent_amount || 0)}
                                      </Typography>
                                      <Typography variant="body2" color="text.secondary">
                                        Remaining: {formatCurrency(jar.remaining_budget || 0)}
                                      </Typography>
                                    </Box>
                                    <LinearProgress
                                      variant="determinate"
                                      value={progress > 100 ? 100 : progress}
                                      sx={{
                                        height: 8,
                                        borderRadius: 4,
                                        mb: 1,
                                        background: '#eee',
                                        '& .MuiLinearProgress-bar': {
                                          backgroundColor: progress > 100 ? '#d32f2f' : ''
                                        }
                                      }}
                                    />
                                    {isExceeded && (
                                      <Typography variant="body2" color="#d32f2f" fontWeight="bold">
                                        Exceeded: {(percentUsed - jar.percent).toFixed(1)}%
                                      </Typography>
                                    )}
                                  </Box>
                                );
                              });
                            })()}
                          </Box>
                          <Box mt={2}>
                            <Typography variant="body2" color="text.secondary">
                              Progress: % of target completion for each jar
                            </Typography>
                          </Box>
                        </>
                      )}
                      {overviewTab === 1 && (
                        <Box mt={2}>
                          <JarPolarChart jars={mergedJars.map(jar => ({
                            name: jar.name,
                            spent: jar.spent_amount,
                            color: jar.color,
                            setPercent: jar.percent,
                            actualPercent: jar.virtual_budget_amount > 0 ? (jar.spent_amount / jar.virtual_budget_amount) * 100 : 0
                          }))} />
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
                <motion.div variants={itemVariants}>
                  <Box sx={{ borderRadius: 4, boxShadow: '0 2px 12px #0001' }}>
                    <GoalSettings goals={goals} />
                  </Box>
                </motion.div>
                <motion.div variants={itemVariants}>
                  <TransactionManagementCard
                    transactions={transactions}
                    classifyTransaction={classifyTransaction}
                    jarList={jarList}
                  />
                </motion.div>
              </Grid>

              {/* Right Column - Pie Chart, Jar Settings, and Notifications */}
              <Grid item xs={12} lg={4}>
                <motion.div variants={itemVariants}>
                  <Box sx={{borderRadius: 4, boxShadow: '0 2px 12px #0001', mb: 3}}>
                    <JarSettings onSave={handleJarSettingsSave}/>
                  </Box>
                </motion.div>
                <motion.div variants={itemVariants}>
                  <Card sx={{borderRadius: 4, boxShadow: '0 2px 12px #0001', mb: 3}}>
                    <CardContent>
                      <Box display="flex" alignItems="center" gap={1} mb={2}>
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
                          Jars Distribution
                        </Typography>
                      </Box>
                      <Box ref={pieChartRef} sx={{height: 300, width: '100%'}}/>
                    </CardContent>
                  </Card>
                </motion.div>
                <motion.div variants={itemVariants}>
                  <Box sx={{borderRadius: 4, boxShadow: '0 2px 12px #0001'}}>
                    <NotificationCenter/>
                  </Box>
                </motion.div>
              </Grid>
            </Grid>
          </motion.div>
        </Container>
        {/* Floating Chat Button & ChatSession */}
        <div style={{ position: 'fixed', bottom: 32, right: 32, zIndex: 1300 }}>
          {showChat ? (
            <div style={{ boxShadow: '0 4px 24px #0002', borderRadius: 16, background: '#fff', padding: 0 }}>
              {/* Removed close button, only ChatSession */}
              <ChatSession userId={user?.id || 'demo'} onLogout={() => setShowChat(false)} />
            </div>
          ) : (
            <button onClick={() => setShowChat(true)} style={{ background: 'linear-gradient(90deg,#015aad,#00b74f)', color: '#fff', border: 'none', borderRadius: '50%', width: 56, height: 56, fontSize: 28, boxShadow: '0 2px 8px #0003', cursor: 'pointer' }}>
              💬
            </button>
          )}
        </div>
      </Box>
    </>
  );
};

export default DemoDashboard; 