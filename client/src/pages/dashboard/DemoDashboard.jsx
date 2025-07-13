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
  Button,
  LinearProgress,
  Tabs,
  Tab,
  Select,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  Badge
} from '@mui/material';
import { motion } from 'framer-motion';
import JarSettings from '../../components/JarSettings';
import GoalSettings from '../../components/GoalSettings';
import { useBank } from '../../contexts/BankContext';
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
import { fetchTransactionsData, createTransactionData, updateTransactionData, deleteTransactionData } from '../../store/transactionsSlice';
import { fetchJarsData } from '../../store/jarsSlice';
import TransactionManagementCard from '../../components/TransactionManagementCard';

const DemoDashboard = () => {
  const pieChartRef = useRef(null);
  const am5RootRef = useRef(null);
  const { bankInfo, disconnectBank } = useBank();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const transactions = useSelector(state => state.transactions.transactions) || [];
  const jars = useSelector(state => state.dashboard.jars);
  const user = useSelector(state => state.auth.currentUser);
  const notifications = useSelector(state => state.notifications.notifications); // If notifications in redux, else keep local
  const goals = useSelector(state => state.goals.goals); // If goals in redux, else keep local
  // Nếu goals được quản lý qua redux, có thể bỏ useState. Nếu cần local state, dùng dòng sau:
  // const [goals, setGoals] = useState([]);
  // const [setGoals] = useState(() => () => {}); // Dummy setGoals để tránh lỗi ReferenceError
  // const [setTransactions] = useState(() => () => {}); // Dummy setTransactions để tránh lỗi ReferenceError
  const [notificationFilter, setNotificationFilter] = useState('all');
  const [overviewTab, setOverviewTab] = useState(0);
  const [statTab, setStatTab] = useState('income');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState('All');
  const [notificationOpen, setNotificationOpen] = useState(false);
  // Lấy danh sách các tháng có trong transactions
  const monthOptions = Array.from(new Set(transactions.map(tx => dayjs(tx.txn_time).format('MMM YYYY'))));

  // 2. useEffect to fetch all data on mount
  useEffect(() => {
    dispatch(fetchTransactionsData());
    dispatch(fetchJarsData());
    // dispatch(fetchNotificationsData()); // If notifications in redux
    // dispatch(fetchGoalsData()); // If goals in redux
  }, [dispatch]);

  // Đồng bộ số liệu với transactions
  // Tạo mảng các tháng có trong transactions và sắp xếp theo thứ tự thời gian
  const allMonths = transactions.map(tx => dayjs(tx.txn_time).format('MMM'));
  const uniqueMonths = [...new Set(allMonths)];
  const months = uniqueMonths.sort((a, b) => {
    const monthOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return monthOrder.indexOf(a) - monthOrder.indexOf(b);
  });
  
  // Đảm bảo có đủ 9 tháng dữ liệu cho chart
  const currentDate = dayjs();
  const chartMonths = [];
  for (let i = 8; i >= 0; i--) {
    const monthDate = currentDate.subtract(i, 'month');
    chartMonths.push(monthDate.format('MMM'));
  }
  
  // Tính income/expense theo tháng
  const incomeData = chartMonths.map(month =>
    transactions.filter(tx => tx.amount > 0 && dayjs(tx.txn_time).format('MMM') === month)
      .reduce((sum, tx) => sum + tx.amount, 0)
  );
  const expenseData = chartMonths.map(month =>
    transactions.filter(tx => tx.amount < 0 && dayjs(tx.txn_time).format('MMM') === month)
      .reduce((sum, tx) => sum + Math.abs(tx.amount), 0)
  );
  const totalIncome = incomeData.reduce((a, b) => a + b, 0);
  const totalExpense = expenseData.reduce((a, b) => a + b, 0);
  const net = totalIncome - totalExpense;
  // Tính % tăng/giảm (so với tháng trước)
  const incomeChange = incomeData.length > 1 && incomeData[incomeData.length-2] > 0 ?
    `${(((incomeData[incomeData.length-1] - incomeData[incomeData.length-2]) / incomeData[incomeData.length-2]) * 100).toFixed(1)}%` : '+0%';
  const expenseChange = expenseData.length > 1 && expenseData[expenseData.length-2] > 0 ?
    `${(((expenseData[expenseData.length-1] - expenseData[expenseData.length-2]) / expenseData[expenseData.length-2]) * 100).toFixed(1)}%` : '+0%';

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

  const handleChangeBank = () => {
    disconnectBank();
    navigate('/bank-demo');
  };

  const handleOpenNotification = () => setNotificationOpen(true);
  const handleCloseNotification = () => setNotificationOpen(false);

  const handleFilterChange = (e) => setNotificationFilter(e.target.value);

  const filteredNotifications = notificationFilter === 'all'
    ? notifications
    : notifications.filter(n => n.notification_type === notificationFilter);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleAddTransaction = (tx) => {
    dispatch(createTransactionData(tx));
    // Add notification for confirm
    // setNotifications(prev => [ // This line is removed as notifications are now in Redux
    //   {
    //     id: Date.now(),
    //     notification_type: 'confirm',
    //     title: 'Xác nhận giao dịch mới',
    //     content: `Vui lòng xác nhận giao dịch "${tx.msg_content || ''}" vừa được thêm!`,
    //     read: false,
    //     status: 0,
    //     created_at: new Date().toISOString(),
    //   },
    //   ...prev
    // ]);
    // Nếu là chi tiêu và vượt 10% tổng số dư, sinh notification
    // if (tx.amount < 0 && Math.abs(tx.amount) > 0.1 * totalBalance) { // totalBalance is not defined here, this logic needs to be re-evaluated
    //   setNotifications(prev => [
    //     {
    //       id: Date.now(),
    //       title: 'Cảnh báo chi tiêu lớn',
    //       content: `Giao dịch "${tx.msg_content || ''}" có số tiền vượt 10% tổng số dư!`,
    //       read: false
    //     },
    //     ...prev
    //   ]);
    // }
  };

  const handleReadNotification = (id) => {
    // setNotifications(prev => prev.map(n => (n.notification_id === id || n.id === id) ? { ...n, status: 1, read: true } : n)); // This line is removed
  };

  const handleDeleteNotification = (id) => {
    // setNotifications(prev => prev.filter(n => n.id !== id)); // This line is removed
  };

  // Hàm phân loại transaction vào jar (tạm thời dựa vào description)
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

  // Danh sách jars chuẩn
  const jarList = [
    { key: 'Necessities', name: 'Necessities', color: '#FF6B6B', description: 'Basic needs like food, housing, utilities' },
    { key: 'FFA', name: 'Financial Freedom', color: '#4ECDC4', description: 'Investments and long-term savings' },
    { key: 'LTSS', name: 'Long-term Savings', color: '#45B7D1', description: 'Emergency fund and big purchases' },
    { key: 'Education', name: 'Education', color: '#96CEB4', description: 'Learning and personal development' },
    { key: 'Play', name: 'Play', color: '#FFEAA7', description: 'Entertainment and fun activities' },
    { key: 'Give', name: 'Give', color: '#DDA0DD', description: 'Charity and helping others' },
  ];

  // Filter transactions theo tháng đã chọn
  const filteredTransactions = selectedMonth === 'All'
    ? transactions
    : transactions.filter(tx => dayjs(tx.txn_time).format('MMM YYYY') === selectedMonth);

  // Tổng số dư hiện tại = tổng tất cả các transaction (income - expense) trong tháng đã chọn
  const totalBalance = filteredTransactions.reduce((sum, tx) => sum + tx.amount, 0);

  // Mock goals
  const mockGoals = [
    { id: 1, name: 'Mua xe máy', target: 20000000, priority: 'high' },
    { id: 2, name: 'Du lịch Đà Nẵng', target: 10000000, priority: 'medium' },
    { id: 3, name: 'Quỹ khẩn cấp', target: 15000000, priority: 'high' },
  ];
  // Tính số tiền đã tiết kiệm cho từng goal từ transactions (tạm dựa vào description)
  const computedGoals = goals.map(goal => {
    const goalTxs = transactions.filter(
      tx => (tx.msg_content || '').toLowerCase().includes(goal.name.toLowerCase()) ||
            (tx.msg_content || '').toLowerCase().includes('tiết kiệm')
    );
    const saved = goalTxs.reduce((sum, tx) => sum + (tx.amount > 0 ? tx.amount : 0), 0);
    const percent = Math.min(100, (saved / goal.target) * 100);
    // ETA: số tháng còn lại = (target - saved) / tốc độ tiết kiệm TB/tháng
    const months = Array.from(new Set(goalTxs.map(tx => dayjs(tx.txn_time).format('YYYY-MM'))));
    const avgPerMonth = months.length > 0 ? saved / months.length : 0;
    const eta = avgPerMonth > 0 ? Math.ceil((goal.target - saved) / avgPerMonth) : null;
    return { ...goal, saved, percent, eta };
  });

  // Rename the local jars variable to computedJars to avoid redeclaration
  const computedJars = jarList.map(jar => {
    const spent = filteredTransactions.filter(tx => {
      const jarKey = tx.jar || classifyTransaction(tx);
      return jarKey === jar.key && tx.amount < 0;
    }).reduce((sum, tx) => sum + Math.abs(tx.amount), 0) || 0;
    // Tính actualPercent dựa trên tổng chi tiêu các jar trong tháng đã chọn
    const totalExpenseAllJars = jarList.reduce((sum, jar) => {
      return sum + filteredTransactions.filter(tx => {
        const jarKey = tx.jar || classifyTransaction(tx);
        return jarKey === jar.key && tx.amount < 0;
      }).reduce((s, tx) => s + Math.abs(tx.amount), 0);
    }, 0);
    const actualPercent = totalExpenseAllJars > 0 ? (spent / totalExpenseAllJars) * 100 : 0;
    const setPercent = Number(jarList.find(j => j.key === jar.key)?.percent) || 0; // Assuming jarList has a 'percent' property
    const allowed = (totalExpenseAllJars * setPercent) / 100;
    const exceeded = spent > allowed ? spent - allowed : 0;
    return {
      ...jar,
      spent: isFinite(spent) ? spent : 0,
      actualPercent: isFinite(actualPercent) ? actualPercent : 0,
      setPercent: isFinite(setPercent) ? setPercent : 0,
      exceeded: isFinite(exceeded) ? exceeded : 0
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
      jarList.map(jar => ({
        value: jarList.find(j => j.key === jar.key)?.percent || 0, // Use actual percent from jarList
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
    // Ẩn logo amCharts
    root._logo && root._logo.set("forceHidden", true);
    return () => {
      root.dispose();
      am5RootRef.current = null;
    };
  }, [jarList]); // Depend on jarList to update when settings change

  return (
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
            {bankInfo && (
              <Chip
                label={`Bank: ${bankInfo.name}`}
                avatar={<Avatar src={bankInfo.logo} />}
                sx={{ ml: 2 }}
              />
            )}
          </Box>
          
          <Box display="flex" alignItems="center" gap={2}>
            <Chip
              label={`Total: ${formatCurrency(totalBalance)}`}
              color="primary"
              variant="outlined"
              size="small"
            />
            <Button variant="outlined" color="secondary" onClick={handleChangeBank} sx={{ borderRadius: 2, fontWeight: 'bold', px: 2, py: 0.5, minWidth: 0 }} >
             Disconnect
            </Button>
            {/* Notification Bell */}
            <IconButton color="inherit" onClick={handleOpenNotification}>
              <Badge badgeContent={unreadCount} color="error">
                <Icon icon="solar:bell-bold-duotone" style={{ fontSize: 28 }} />
              </Badge>
            </IconButton>
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
              <MenuItem onClick={handleMenuClose}>
                <Icon icon="solar:user-circle-bold-duotone" style={{ marginRight: 8 }} />
                Profile
              </MenuItem>
              <MenuItem onClick={handleMenuClose}>
                <Icon icon="solar:settings-bold-duotone" style={{ marginRight: 8 }} />
                Settings
              </MenuItem>
              <Divider />
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>
      {/* Notification Center Dialog */}
      <Dialog open={notificationOpen} onClose={handleCloseNotification} maxWidth="xs" fullWidth>
        <DialogTitle>Notification Center</DialogTitle>
        <DialogContent>
          <Box mb={2} display="flex" gap={1} alignItems="center">
            <Typography variant="body2">Lọc theo loại:</Typography>
            <Select size="small" value={notificationFilter} onChange={handleFilterChange}>
              <MenuItem value="all">Tất cả</MenuItem>
              <MenuItem value="confirm">Xác nhận</MenuItem>
              <MenuItem value="alert">Cảnh báo</MenuItem>
              <MenuItem value="goal">Mục tiêu</MenuItem>
              <MenuItem value="spending">Chi tiêu</MenuItem>
            </Select>
          </Box>
          <NotificationCenter notifications={filteredNotifications} onRead={handleReadNotification}
                                      onDelete={handleDeleteNotification}/>
        </DialogContent>
      </Dialog>

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
                      {computedJars.length}
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
              {/* Thống kê thu nhập/chi tiêu kiểu mới */}
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
                            <Typography variant="body2" color="success.main" fontWeight="bold">{Number(incomeChange.replace('%','')) >= 0 ? '+' : '-'}{incomeChange}</Typography>
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
                            <Typography variant="body2" color="error.main" fontWeight="bold">{Number(expenseChange.replace('%','')) >= 0 ? '+' : '-'}{expenseChange}</Typography>
                          </Box>
                        </Box>
                        <Typography variant="h5" fontWeight="bold" color="error.main">
                          {formatCurrency(totalExpense)}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                  {/* Chart theo tab */}
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
              {/* Financial Overview + JarPolarChart trong 1 card với Tabs */}
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
                          {computedJars.map((jar) => {
                            const percentColor = jar.actualPercent > jar.setPercent ? 'error.main' : 'primary.main';
                            return (
                              <Box key={jar.name} sx={{ mb: 2, p: 2, borderRadius: 3, background: '#fafbfc', boxShadow: '0 1px 4px #0001' }}>
                                <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                                  <Box display="flex" alignItems="center" gap={1}>
                                    <Box sx={{ width: 16, height: 16, borderRadius: '50%', background: jar.color || '#ccc' }} />
                                    <Typography variant="subtitle1" fontWeight="bold">{jar.name}</Typography>
                                  </Box>
                                  <Chip
                                    label={`${jar.actualPercent.toFixed(1)}% / ${jar.setPercent}%`}
                                    color={jar.actualPercent > jar.setPercent ? 'error' : 'primary'}
                                    size="small"
                                    sx={{ fontWeight: 'bold' }}
                                  />
                                </Box>
                                <Box display="flex" alignItems="center" justifyContent="space-between" mb={0.5}>
                                  <Typography variant="body2" color="text.secondary">
                                    Spent: {formatCurrency(isFinite(jar.spent) ? jar.spent : 0)}
                                  </Typography>
                                  {jar.exceeded > 0 && (
                                    <Typography variant="body2" color="error.main" fontWeight="bold">
                                      Exceeded: {formatCurrency(jar.exceeded)}
                                    </Typography>
                                  )}
                                </Box>
                                <LinearProgress
                                  variant="determinate"
                                  value={Math.min((jar.actualPercent / (jar.setPercent || 1)) * 100, 100)}
                                  sx={{ height: 8, borderRadius: 4, mb: 1, background: '#eee', '& .MuiLinearProgress-bar': { backgroundColor: percentColor } }}
                                />
                              </Box>
                            );
                          })}
                        </Box>
                        <Box mt={2}>
                          <Typography variant="body2" color="text.secondary">
                            Progress: % hoàn thành mục tiêu của từng jar
                          </Typography>
                        </Box>
                      </>
                    )}
                    {overviewTab === 1 && (
                      <Box mt={2}>
                        <JarPolarChart jars={computedJars} />
                      </Box>
                    )}
                    {/*{overviewTab === 2 && (*/}
                    {/*  <Box mt={2}>*/}
                    {/*    <GoalRadialChart goals={computedGoals} />*/}
                    {/*  </Box>*/}
                    {/*)}*/}
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
                  <NotificationCenter notifications={notifications} onRead={handleReadNotification}
                                      onDelete={handleDeleteNotification}/>
                </Box>
              </motion.div>
            </Grid>
          </Grid>
        </motion.div>
      </Container>
    </Box>
  );
};

export default DemoDashboard; 