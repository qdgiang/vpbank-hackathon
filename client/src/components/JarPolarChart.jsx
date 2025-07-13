import React from 'react';
import ApexCharts from 'react-apexcharts';
import { Box, Typography } from '@mui/material';
import { Icon } from '@iconify/react';

const JAR_ICONS = {
  'Necessities': 'solar:home-2-bold-duotone',
  'Financial Freedom': 'solar:wallet-bold-duotone',
  'Long-term Savings': 'solar:calendar-bold-duotone',
  'Education': 'solar:book-bold-duotone',
  'Play': 'solar:gamepad-bold-duotone',
  'Give': 'solar:heart-bold-duotone',
};

function getJarStatus(jar) {
  const actual = Number(jar.actualPercent) || 0;
  const limit = Number(jar.setPercent) || 0;
  if (limit === 0) return 'No limit set';
  if (actual > limit) return 'Overspent';
  if (actual > 0.9 * limit) return 'Close to limit';
  if (actual >= 0.6 * limit) return 'On track';
  return 'Safe';
}

const JarPolarChart = ({ jars }) => {
  const series = jars.map(jar => Number(jar.spent ?? jar.currentBalance ?? 0) || 0);
  const categories = jars.map(jar => jar.name || 'Unknown');
  const safeSeries = series.length === categories.length ? series : categories.map(() => 0);
  const total = jars.reduce((sum, jar) => sum + (jar.spent || 0), 0);

  const options = {
    chart: {
      type: 'polarArea',
      toolbar: { show: false },
      sparkline: { enabled: false }
    },
    labels: categories,
    fill: {
      opacity: 0.9
    },
    stroke: {
      width: 1,
      colors: ['#fff']
    },
    yaxis: {
      show: false
    },
    legend: { show: false },
    plotOptions: {
      polarArea: {
        rings: {
          strokeWidth: 0
        },
        spokes: {
          strokeWidth: 1,
          connectorColors: '#e0e0e0'
        }
      }
    },
    colors: jars.map(jar => jar.color),
    dataLabels: {
      enabled: false
    }
  };

  return (
    <Box sx={{ borderRadius: 4, boxShadow: '0 2px 12px #0001', background: '#fff', p: 3 }}>
      <Typography variant="h6" fontWeight="bold" mb={2}>
        Jar Polar Chart
      </Typography>
      <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} alignItems="center" justifyContent="space-between" gap={3}>
        {/* Chart */}
        <Box sx={{ width: 320, height: 320, minWidth: 220, mx: 'auto' }}>
          <ApexCharts options={options} series={safeSeries} type="polarArea" height={320} />
        </Box>
        {/* Legend + status */}
        <Box display="flex" flexDirection="column" gap={1}>
          {jars.map(jar => (
            <Box key={jar.name} display="flex" alignItems="center" gap={1}>
              <Icon icon={JAR_ICONS[jar.name] || 'solar:wallet-bold-duotone'} style={{ color: jar.color, fontSize: 24 }} />
              <Typography fontWeight="bold" color="text.primary">{jar.name}</Typography>
              <Typography color="text.secondary">({Number(jar.spent ?? jar.currentBalance ?? 0).toLocaleString('vi-VN')}₫)</Typography>
              <Typography color="info.main" fontSize={13} ml={1}>{getJarStatus(jar)}</Typography>
            </Box>
          ))}
        </Box>
      </Box>
      {/* Footer summary */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mt={3} pt={2} borderTop="1px dashed #e0e0e0">
        <Box textAlign="center" flex={1}>
          <Typography variant="body2" color="text.secondary">Jars</Typography>
          <Typography variant="h5" fontWeight="bold">{jars.length}</Typography>
        </Box>
        <Box textAlign="center" flex={1}>
          <Typography variant="body2" color="text.secondary">Total</Typography>
          <Typography variant="h5" fontWeight="bold">{Number(total ?? 0).toLocaleString('vi-VN')}₫</Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default JarPolarChart; 