import React from 'react';
import ApexCharts from 'react-apexcharts';
import { Box, Typography } from '@mui/material';

const getColors = [
  '#4ECDC4', '#1976d2', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#FF6B6B', '#2e7d32'
];

const GoalRadialChart = ({ goals = [] }) => {
  const series = goals.map(g => Math.min(100, g.percent || 0));
  const labels = goals.map(g => g.name);
  const options = {
    chart: {
      type: 'radialBar',
      height: 350,
      toolbar: { show: false }
    },
    plotOptions: {
      radialBar: {
        offsetY: 0,
        startAngle: 0,
        endAngle: 270,
        hollow: { margin: 5, size: '30%' },
        dataLabels: {
          name: { show: true, fontSize: '16px', fontWeight: 700 },
          value: { show: true, fontSize: '18px', fontWeight: 700, formatter: val => `${val}%` },
          total: { show: false }
        }
      }
    },
    colors: getColors.slice(0, goals.length),
    labels,
    legend: {
      show: true,
      floating: true,
      fontSize: '16px',
      position: 'left',
      offsetX: 0,
      offsetY: 0,
      labels: { useSeriesColors: true },
      markers: { size: 0 },
      formatter: (seriesName, opts) => `${seriesName}: ${series[opts.seriesIndex]}%`,
      itemMargin: { vertical: 4 }
    },
    stroke: { lineCap: 'round' }
  };
  return (
    <Box sx={{ width: '100%', display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: 'center', justifyContent: 'center', gap: 3 }}>
      <ApexCharts options={options} series={series} type="radialBar" height={350} />
    </Box>
  );
};

export default GoalRadialChart; 