import React, { useState, useEffect, useRef } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Grid,
  ToggleButton,
  ToggleButtonGroup,
  Chip,
  LinearProgress,
  Button
} from '@mui/material';
import { Icon } from '@iconify/react';
import TransactionInputButton from './TransactionInput';
import * as am5 from '@amcharts/amcharts5';
import * as am5percent from '@amcharts/amcharts5/percent';
import am5themes_Animated from '@amcharts/amcharts5/themes/Animated';
import * as am5radar from '@amcharts/amcharts5/radar';
import * as am5xy from '@amcharts/amcharts5/xy';

const JAR_ICONS = {
  'Necessities': 'solar:home-2-bold-duotone',
  'Financial Freedom': 'solar:wallet-bold-duotone',
  'Long-term Savings': 'solar:calendar-bold-duotone',
  'Education': 'solar:book-bold-duotone',
  'Play': 'solar:gamepad-bold-duotone',
  'Give': 'solar:heart-bold-duotone',
};

const SimpleCharts = ({ jars, transactions = [], onAddTransaction }) => {
  const [chartType, setChartType] = useState('pie');
  const [timeRange, setTimeRange] = useState('month');
  const pieChartRef = useRef(null);
  const am5RootRef = useRef(null);

  useEffect(() => {
    if (!pieChartRef.current) return;
    if (am5RootRef.current) {
      am5RootRef.current.dispose();
    }
    const root = am5.Root.new(pieChartRef.current);
    am5RootRef.current = root;
    root.setThemes([am5themes_Animated.new(root)]);
    const chart = root.container.children.push(
      am5radar.RadarChart.new(root, {
        panX: false,
        panY: false,
        startAngle: 0,
        endAngle: 360,
        radius: am5.percent(90),
        innerRadius: am5.percent(10),
        layout: root.horizontalLayout
      })
    );
    const xRenderer = am5radar.AxisRendererCircular.new(root, { minGridDistance: 30 });
    const xAxis = chart.xAxes.push(
      am5radar.CategoryAxis.new(root, {
        categoryField: 'category',
        renderer: xRenderer
      })
    );
    const yRenderer = am5radar.AxisRendererRadial.new(root, {});
    const yAxis = chart.yAxes.push(
      am5xy.ValueAxis.new(root, {
        renderer: yRenderer,
        min: 0
      })
    );
    xAxis.data.setAll(jars.map(jar => ({ category: jar.name })));
    const series = chart.series.push(
      am5radar.RadarColumnSeries.new(root, {
        name: 'Jars',
        xAxis: xAxis,
        yAxis: yAxis,
        valueYField: 'value',
        categoryXField: 'category',
        fillField: 'color',
        strokeField: 'color',
        clustered: false
      })
    );
    series.columns.template.setAll({
      tooltipText: '{category}: {valueY}',
      width: am5.percent(90),
      fillOpacity: 0.9,
      strokeOpacity: 1,
      cornerRadius: 10
    });
    series.data.setAll(jars.map(jar => ({
      category: jar.name,
      value: jar.currentBalance,
      color: am5.color(jar.color || '#4ECDC4')
    })));
    chart.appear(1000, 100);
    return () => {
      root.dispose();
      am5RootRef.current = null;
    };
  }, [jars]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const totalBalance = jars.reduce((sum, jar) => sum + (jar.currentBalance || 0), 0);

  // Progress của từng jar: % hoàn thành mục tiêu
  const renderJarProgress = () => (
    <Box sx={{ mt: 2 }}>
      {jars.map((jar, idx) => {
        const percent = jar.target && jar.target > 0 ? (jar.currentBalance / jar.target) * 100 : 0;
        return (
          <Box key={jar.name} sx={{ mb: 2, p: 2, borderRadius: 3, background: '#fafbfc', boxShadow: '0 1px 4px #0001' }}>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
              <Box display="flex" alignItems="center" gap={1}>
                <Box sx={{ width: 16, height: 16, borderRadius: '50%', background: jar.color || '#ccc' }} />
                <Typography variant="subtitle1" fontWeight="bold">{jar.name}</Typography>
              </Box>
              <Chip
                label={`${percent.toFixed(1)}%`}
                color={percent >= 100 ? 'success' : 'primary'}
                size="small"
                sx={{ fontWeight: 'bold' }}
              />
            </Box>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={0.5}>
              <Typography variant="body2" color="text.secondary">
                {formatCurrency(jar.currentBalance)} / {formatCurrency(jar.target)}
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={Math.min(percent, 100)}
              sx={{
                height: 10,
                borderRadius: 5,
                backgroundColor: `${jar.color || '#ccc'}22`,
                '& .MuiLinearProgress-bar': {
                  backgroundColor: jar.color || '#4ECDC4',
                  borderRadius: 5
                }
              }}
            />
          </Box>
        );
      })}
    </Box>
  );

  return (
    <Card sx={{ borderRadius: 4, boxShadow: '0 2px 12px #0001', height: 'fit-content' }}>
      <CardContent>
        <Typography variant="h6" fontWeight="bold" mb={2}>
          Expenses categories
        </Typography>
        <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} alignItems="center" justifyContent="space-between" gap={3}>
          {/* Radar Chart */}
          <Box ref={pieChartRef} sx={{ width: 320, height: 320, minWidth: 220, mx: 'auto' }} />
          {/* Legend */}
          <Box display="flex" flexDirection="column" gap={1}>
            {jars.map(jar => (
              <Box key={jar.name} display="flex" alignItems="center" gap={1}>
                <Icon icon={JAR_ICONS[jar.name] || 'solar:wallet-bold-duotone'} style={{ color: jar.color, fontSize: 24 }} />
                <Typography fontWeight="bold" color="text.primary">{jar.name}</Typography>
                <Typography color="text.secondary">({formatCurrency(jar.currentBalance)})</Typography>
              </Box>
            ))}
          </Box>
        </Box>
        {/* Footer summary */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mt={3} pt={2} borderTop="1px dashed #e0e0e0">
          <Box textAlign="center" flex={1}>
            <Typography variant="body2" color="text.secondary">Categories</Typography>
            <Typography variant="h5" fontWeight="bold">{jars.length}</Typography>
          </Box>
          <Box textAlign="center" flex={1}>
            <Typography variant="body2" color="text.secondary">Total</Typography>
            <Typography variant="h5" fontWeight="bold">{formatCurrency(jars.reduce((sum, j) => sum + (j.currentBalance || 0), 0))}</Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default SimpleCharts; 