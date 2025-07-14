import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Box, Grid, Paper, Typography, IconButton, Menu, MenuItem } from '@mui/material';
import { Menu as MenuIcon } from '@mui/icons-material';
import * as am5 from '@amcharts/amcharts5';
import * as am5xy from '@amcharts/amcharts5/xy';
import * as am5percent from '@amcharts/amcharts5/percent';
import { fetchJars } from '../store/jarsSlice';
import JarCard from '../../components/JarCard';
import AlertNotification from '../../components/AlertNotification';

const Dashboard = () => {
  const dispatch = useDispatch();
  const { jars, loading } = useSelector((state) => state.dashboard);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [showAlert, setShowAlert] = useState(false);

  useEffect(() => {
    dispatch(fetchJars());
  }, [dispatch]);

  // Initialize charts
  useEffect(() => {
    if (!loading) {
      // Income vs Expense Chart
      const incomeExpenseChart = am5.Root.new('incomeExpenseChart');
      const chart = incomeExpenseChart.container.children.push(
        am5xy.XYChart.new(incomeExpenseChart, {
          panY: false,
          layout: incomeExpenseChart.verticalLayout
        })
      );

      // Add data
      const data = [
        { month: 'Jan', income: 50000000, expense: 35000000 },
        { month: 'Feb', income: 50000000, expense: 40000000 },
        { month: 'Mar', income: 50000000, expense: 38000000 },
      ];

      // Create axes
      const xAxis = chart.xAxes.push(
        am5xy.CategoryAxis.new(incomeExpenseChart, {
          categoryField: 'month',
          renderer: am5xy.AxisRendererX.new(incomeExpenseChart, {}),
          tooltip: am5.Tooltip.new(incomeExpenseChart, {})
        })
      );
      xAxis.data.setAll(data);

      const yAxis = chart.yAxes.push(
        am5xy.ValueAxis.new(incomeExpenseChart, {
          renderer: am5xy.AxisRendererY.new(incomeExpenseChart, {})
        })
      );

      // Add series
      const incomeSeries = chart.series.push(
        am5xy.ColumnSeries.new(incomeExpenseChart, {
          name: 'Income',
          xAxis: xAxis,
          yAxis: yAxis,
          valueYField: 'income',
          categoryXField: 'month',
          tooltip: am5.Tooltip.new(incomeExpenseChart, {
            labelText: '{valueY} VND'
          })
        })
      );
      incomeSeries.data.setAll(data);

      const expenseSeries = chart.series.push(
        am5xy.ColumnSeries.new(incomeExpenseChart, {
          name: 'Expense',
          xAxis: xAxis,
          yAxis: yAxis,
          valueYField: 'expense',
          categoryXField: 'month',
          tooltip: am5.Tooltip.new(incomeExpenseChart, {
            labelText: '{valueY} VND'
          })
        })
      );
      expenseSeries.data.setAll(data);

      // Add legend
      chart.legend = am5.Legend.new(incomeExpenseChart, {
        centerX: am5.percent(50),
        x: am5.percent(50)
      });

      // Jar Distribution Chart
      const jarDistributionChart = am5.Root.new('jarDistributionChart');
      const pieChart = jarDistributionChart.container.children.push(
        am5percent.PieChart.new(jarDistributionChart, {
          layout: jarDistributionChart.verticalLayout
        })
      );

      const pieSeries = pieChart.series.push(
        am5percent.PieSeries.new(jarDistributionChart, {
          valueField: 'percentage',
          categoryField: 'name',
          alignLabels: true
        })
      );

      pieSeries.data.setAll(jars);
      pieSeries.labels.template.setAll({
        forceHidden: true
      });

      // Transaction Count Chart
      const transactionChart = am5.Root.new('transactionChart');
      const lineChart = transactionChart.container.children.push(
        am5xy.XYChart.new(transactionChart, {
          panY: false,
          layout: transactionChart.verticalLayout
        })
      );

      const lineData = [
        { date: '2024-03-01', count: 5 },
        { date: '2024-03-02', count: 8 },
        { date: '2024-03-03', count: 12 },
      ];

      const lineXAxis = lineChart.xAxes.push(
        am5xy.DateAxis.new(transactionChart, {
          baseInterval: { timeUnit: 'day', count: 1 },
          renderer: am5xy.AxisRendererX.new(transactionChart, {})
        })
      );
      lineXAxis.data.setAll(lineData);

      const lineYAxis = lineChart.yAxes.push(
        am5xy.ValueAxis.new(transactionChart, {
          renderer: am5xy.AxisRendererY.new(transactionChart, {})
        })
      );

      const lineSeries = lineChart.series.push(
        am5xy.LineSeries.new(transactionChart, {
          xAxis: lineXAxis,
          yAxis: lineYAxis,
          valueYField: 'count',
          valueXField: 'date',
          tooltip: am5.Tooltip.new(transactionChart, {
            labelText: '{valueY} transactions'
          })
        })
      );
      lineSeries.data.setAll(lineData);

      return () => {
        incomeExpenseChart.dispose();
        jarDistributionChart.dispose();
        transactionChart.dispose();
      };
    }
  }, [loading, jars]);

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleJarClick = (jarId) => {
    // Navigate to jar detail page
    window.location.href = `/jars/${jarId}`;
  };

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      {/* Header with Menu */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Money Jars Dashboard</Typography>
        <IconButton onClick={handleMenuClick}>
          <MenuIcon />
        </IconButton>
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          {jars.map((jar) => (
            <MenuItem
              key={jar.id}
              onClick={() => {
                handleMenuClose();
                handleJarClick(jar.id);
              }}
            >
              {jar.name}
            </MenuItem>
          ))}
        </Menu>
      </Box>

      {/* Charts Section */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: 300 }}>
            <Typography variant="h6" gutterBottom>
              Income vs Expense
            </Typography>
            <div id="incomeExpenseChart" style={{ width: '100%', height: '250px' }} />
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: 300 }}>
            <Typography variant="h6" gutterBottom>
              Jar Distribution
            </Typography>
            <div id="jarDistributionChart" style={{ width: '100%', height: '250px' }} />
          </Paper>
        </Grid>
        <Grid item xs={12}>
          <Paper sx={{ p: 2, height: 300 }}>
            <Typography variant="h6" gutterBottom>
              Transaction Count
            </Typography>
            <div id="transactionChart" style={{ width: '100%', height: '250px' }} />
          </Paper>
        </Grid>
      </Grid>

      {/* Jars Section */}
      <Typography variant="h5" gutterBottom>
        Your Money Jars
      </Typography>
      <Grid container spacing={3}>
        {jars.map((jar) => (
          <Grid item xs={12} sm={6} md={4} key={jar.id}>
            <JarCard
              jar={jar}
              onClick={() => handleJarClick(jar.id)}
            />
          </Grid>
        ))}
      </Grid>

      {/* Alert Notification */}
      <AlertNotification
        open={showAlert}
        onClose={() => setShowAlert(false)}
        message="New transaction has been automatically classified!"
      />
    </Box>
  );
};

export default Dashboard; 