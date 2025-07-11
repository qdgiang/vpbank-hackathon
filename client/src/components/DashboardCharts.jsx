import React, { useEffect, useRef, useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Grid,
  ToggleButton,
  ToggleButtonGroup,
  Chip
} from '@mui/material';
import {
  PieChart,
  BarChart,
  TrendingUp,
  ShowChart
} from '@mui/icons-material';
import * as am5 from '@amcharts/amcharts5';
import * as am5xy from '@amcharts/amcharts5/xy';
import * as am5percent from '@amcharts/amcharts5/percent';
import * as am5themes_Animated from '@amcharts/amcharts5/themes/Animated';

const DashboardCharts = ({ jars, transactions = [] }) => {
  const [chartType, setChartType] = useState('pie');
  const [timeRange, setTimeRange] = useState('month');
  const chartRefs = useRef({});
  const chartContainerRef = useRef(null);

  // Sample data for demonstration
  const sampleTransactions = [
    { date: '2024-01-01', amount: 5000000, category: 'Income' },
    { date: '2024-01-05', amount: -1500000, category: 'Necessities' },
    { date: '2024-01-10', amount: -500000, category: 'Play' },
    { date: '2024-01-15', amount: -300000, category: 'Education' },
    { date: '2024-01-20', amount: -200000, category: 'Give' },
    { date: '2024-01-25', amount: -800000, category: 'Long-term Savings' },
    { date: '2024-01-30', amount: -700000, category: 'Financial Freedom' },
  ];

  const chartData = jars.map(jar => ({
    category: jar.name,
    value: jar.currentBalance || Math.random() * 10000000,
    color: jar.color || am5.color('#4ECDC4')
  }));

  const expenseData = sampleTransactions
    .filter(t => t.amount < 0)
    .reduce((acc, transaction) => {
      const category = transaction.category;
      acc[category] = (acc[category] || 0) + Math.abs(transaction.amount);
      return acc;
    }, {});

  const expenseChartData = Object.entries(expenseData).map(([category, amount]) => ({
    category,
    value: amount
  }));

  const monthlyData = [
    { month: 'Jan', income: 5000000, expenses: 4000000, savings: 1000000 },
    { month: 'Feb', income: 5200000, expenses: 3800000, savings: 1400000 },
    { month: 'Mar', income: 4800000, expenses: 4200000, savings: 600000 },
    { month: 'Apr', income: 5500000, expenses: 3500000, savings: 2000000 },
    { month: 'May', income: 5100000, expenses: 3900000, savings: 1200000 },
    { month: 'Jun', income: 5400000, expenses: 3600000, savings: 1800000 },
  ];

  // Dispose of existing charts
  const disposeCharts = () => {
    Object.values(chartRefs.current).forEach(chart => {
      if (chart && !chart.isDisposed()) {
        chart.dispose();
      }
    });
    chartRefs.current = {};
  };

  useEffect(() => {
    if (jars.length === 0) return;

    // Dispose of existing charts
    disposeCharts();

    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      if (chartType === 'pie') {
        createPieChart();
      } else if (chartType === 'bar') {
        createBarChart();
      } else if (chartType === 'line') {
        createLineChart();
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      disposeCharts();
    };
  }, [chartType, jars, timeRange]);

  const createPieChart = () => {
    try {
      // Check if container exists
      if (!chartContainerRef.current) return;

      const root = am5.Root.new(chartContainerRef.current);
      root.setThemes([am5themes_Animated.new(root)]);

      const chart = root.container.children.push(
        am5percent.PieChart.new(root, {
          layout: root.verticalLayout,
          innerRadius: am5.percent(50)
        })
      );

      const series = chart.series.push(
        am5percent.PieSeries.new(root, {
          valueField: 'value',
          categoryField: 'category',
          fillField: 'color'
        })
      );

      series.data.setAll(chartData);

      series.labels.template.setAll({
        textType: 'adjusted',
        centerX: am5.p50,
        centerY: am5.p50,
        text: '{category}\n{valuePercentTotal.formatNumber(\'#.#\')}%'
      });

      series.ticks.template.setAll({
        forceHidden: true
      });

      const legend = chart.children.push(
        am5.Legend.new(root, {
          centerX: am5.p50,
          x: am5.p50,
          centerY: am5.p100,
          y: am5.p100,
          layout: root.horizontalLayout
        })
      );

      legend.data.setAll(series.dataItems);

      chartRefs.current.pie = root;
    } catch (error) {
      console.error('Error creating pie chart:', error);
    }
  };

  const createBarChart = () => {
    try {
      if (!chartContainerRef.current) return;

      const root = am5.Root.new(chartContainerRef.current);
      root.setThemes([am5themes_Animated.new(root)]);

      const chart = root.container.children.push(
        am5xy.XYChart.new(root, {
          panX: false,
          panY: false,
          wheelX: 'none',
          wheelY: 'none',
          layout: root.verticalLayout
        })
      );

      const xAxis = chart.xAxes.push(
        am5xy.CategoryAxis.new(root, {
          categoryField: 'category',
          renderer: am5xy.AxisRendererX.new(root, {}),
          tooltip: am5.Tooltip.new(root, {})
        })
      );

      const yAxis = chart.yAxes.push(
        am5xy.ValueAxis.new(root, {
          renderer: am5xy.AxisRendererY.new(root, {})
        })
      );

      const series = chart.series.push(
        am5xy.ColumnSeries.new(root, {
          xAxis: xAxis,
          yAxis: yAxis,
          valueYField: 'value',
          categoryXField: 'category',
          tooltip: am5.Tooltip.new(root, {
            labelText: '{valueY.formatNumber(\'#,##0\')} VND'
          })
        })
      );

      series.columns.template.setAll({
        cornerRadiusTL: 5,
        cornerRadiusTR: 5,
        strokeOpacity: 0
      });

      series.data.setAll(expenseChartData);
      xAxis.data.setAll(expenseChartData);

      chartRefs.current.bar = root;
    } catch (error) {
      console.error('Error creating bar chart:', error);
    }
  };

  const createLineChart = () => {
    try {
      if (!chartContainerRef.current) return;

      const root = am5.Root.new(chartContainerRef.current);
      root.setThemes([am5themes_Animated.new(root)]);

      const chart = root.container.children.push(
        am5xy.XYChart.new(root, {
          panX: false,
          panY: false,
          wheelX: 'none',
          wheelY: 'none',
          layout: root.verticalLayout
        })
      );

      const xAxis = chart.xAxes.push(
        am5xy.CategoryAxis.new(root, {
          categoryField: 'month',
          renderer: am5xy.AxisRendererX.new(root, {}),
          tooltip: am5.Tooltip.new(root, {})
        })
      );

      const yAxis = chart.yAxes.push(
        am5xy.ValueAxis.new(root, {
          renderer: am5xy.AxisRendererY.new(root, {}),
          tooltip: am5.Tooltip.new(root, {})
        })
      );

      // Income series
      const incomeSeries = chart.series.push(
        am5xy.LineSeries.new(root, {
          xAxis: xAxis,
          yAxis: yAxis,
          valueYField: 'income',
          categoryXField: 'month',
          name: 'Income',
          tooltip: am5.Tooltip.new(root, {
            labelText: 'Income: {valueY.formatNumber(\'#,##0\')} VND'
          })
        })
      );

      incomeSeries.strokes.template.setAll({
        strokeWidth: 3,
        stroke: am5.color('#4ECDC4')
      });

      incomeSeries.bullets.push(() => {
        return am5.Bullet.new(root, {
          sprite: am5.Circle.new(root, {
            radius: 5,
            fill: am5.color('#4ECDC4')
          })
        });
      });

      // Expenses series
      const expenseSeries = chart.series.push(
        am5xy.LineSeries.new(root, {
          xAxis: xAxis,
          yAxis: yAxis,
          valueYField: 'expenses',
          categoryXField: 'month',
          name: 'Expenses',
          tooltip: am5.Tooltip.new(root, {
            labelText: 'Expenses: {valueY.formatNumber(\'#,##0\')} VND'
          })
        })
      );

      expenseSeries.strokes.template.setAll({
        strokeWidth: 3,
        stroke: am5.color('#FF6B6B')
      });

      expenseSeries.bullets.push(() => {
        return am5.Bullet.new(root, {
          sprite: am5.Circle.new(root, {
            radius: 5,
            fill: am5.color('#FF6B6B')
          })
        });
      });

      // Savings series
      const savingsSeries = chart.series.push(
        am5xy.LineSeries.new(root, {
          xAxis: xAxis,
          yAxis: yAxis,
          valueYField: 'savings',
          categoryXField: 'month',
          name: 'Savings',
          tooltip: am5.Tooltip.new(root, {
            labelText: 'Savings: {valueY.formatNumber(\'#,##0\')} VND'
          })
        })
      );

      savingsSeries.strokes.template.setAll({
        strokeWidth: 3,
        stroke: am5.color('#96CEB4')
      });

      savingsSeries.bullets.push(() => {
        return am5.Bullet.new(root, {
          sprite: am5.Circle.new(root, {
            radius: 5,
            fill: am5.color('#96CEB4')
          })
        });
      });

      const legend = chart.children.push(
        am5.Legend.new(root, {
          centerX: am5.p50,
          x: am5.p50,
          centerY: am5.p100,
          y: am5.p100,
          layout: root.horizontalLayout
        })
      );

      legend.data.setAll(chart.series.values);

      incomeSeries.data.setAll(monthlyData);
      expenseSeries.data.setAll(monthlyData);
      savingsSeries.data.setAll(monthlyData);
      xAxis.data.setAll(monthlyData);

      chartRefs.current.line = root;
    } catch (error) {
      console.error('Error creating line chart:', error);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const totalBalance = jars.reduce((sum, jar) => sum + (jar.currentBalance || 0), 0);

  return (
    <Card sx={{ height: '100%' }}>
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
          <Chip
            label={`Total: ${formatCurrency(totalBalance)}`}
            color="primary"
            variant="outlined"
          />
        </Box>

        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <ToggleButtonGroup
            value={chartType}
            exclusive
            onChange={(_, newType) => newType && setChartType(newType)}
            size="small"
          >
            <ToggleButton value="pie">
              <PieChart fontSize="small" />
            </ToggleButton>
            <ToggleButton value="bar">
              <BarChart fontSize="small" />
            </ToggleButton>
            <ToggleButton value="line">
              <ShowChart fontSize="small" />
            </ToggleButton>
          </ToggleButtonGroup>

          {chartType === 'line' && (
            <ToggleButtonGroup
              value={timeRange}
              exclusive
              onChange={(_, newRange) => newRange && setTimeRange(newRange)}
              size="small"
            >
              <ToggleButton value="month">Month</ToggleButton>
              <ToggleButton value="quarter">Quarter</ToggleButton>
              <ToggleButton value="year">Year</ToggleButton>
            </ToggleButtonGroup>
          )}
        </Box>

        <Box
          ref={chartContainerRef}
          sx={{
            width: '100%',
            height: 400,
            minHeight: 400
          }}
        />

        {chartType === 'pie' && (
          <Box mt={2}>
            <Typography variant="body2" color="text.secondary">
              Distribution of your money across different jars
            </Typography>
          </Box>
        )}

        {chartType === 'bar' && (
          <Box mt={2}>
            <Typography variant="body2" color="text.secondary">
              Monthly expense breakdown by category
            </Typography>
          </Box>
        )}

        {chartType === 'line' && (
          <Box mt={2}>
            <Typography variant="body2" color="text.secondary">
              Income vs Expenses vs Savings over time
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default DashboardCharts; 