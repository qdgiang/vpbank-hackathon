import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Button,
} from '@mui/material';
import * as am5 from '@amcharts/amcharts5';
import * as am5xy from '@amcharts/amcharts5/xy';
import { fetchJarsData } from '../../store/dashboardSlice';
import JarCard from '../../components/JarCard';
import AlertNotification from '../../components/AlertNotification';

const Dashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { jars, loading, error } = useSelector((state) => state.dashboard);
  const [showAlert, setShowAlert] = useState(false);

  useEffect(() => {
    dispatch(fetchJarsData());
  }, [dispatch]);

  useEffect(() => {
    if (jars.length > 0) {
      // Initialize income distribution chart
      const incomeChart = am5.Root.new('incomeChart');
      const chart = incomeChart.container.children.push(
        am5xy.XYChart.new(incomeChart, {
          panY: false,
          layout: incomeChart.verticalLayout
        })
      );

      // Add data
      const data = jars.map(jar => ({
        category: jar.name,
        value: jar.currentBalance
      }));

      // Create axes
      const yAxis = chart.yAxes.push(
        am5xy.CategoryAxis.new(incomeChart, {
          categoryField: 'category',
          renderer: am5xy.AxisRendererY.new(incomeChart, {}),
          tooltip: am5.Tooltip.new(incomeChart, {})
        })
      );
      yAxis.data.setAll(data);

      const xAxis = chart.xAxes.push(
        am5xy.ValueAxis.new(incomeChart, {
          renderer: am5xy.AxisRendererX.new(incomeChart, {})
        })
      );

      // Add series
      const series = chart.series.push(
        am5xy.ColumnSeries.new(incomeChart, {
          xAxis: xAxis,
          yAxis: yAxis,
          valueXField: 'value',
          categoryYField: 'category',
          tooltip: am5.Tooltip.new(incomeChart, {
            labelText: '{valueX} VND'
          })
        })
      );
      series.data.setAll(data);

      return () => {
        incomeChart.dispose();
      };
    }
  }, [jars]);

  const handleJarClick = (jarId) => {
    navigate(`/jars/${jarId}`);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3}>
        {/* Income Distribution Chart */}
        <Grid item xs={12}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 400,
            }}
          >
            <Typography component="h2" variant="h6" color="primary" gutterBottom>
              Income Distribution
            </Typography>
            <div id="incomeChart" style={{ width: '100%', height: '100%' }} />
          </Paper>
        </Grid>

        {/* Jars Grid */}
        <Grid item xs={12}>
          <Typography component="h2" variant="h6" color="primary" gutterBottom>
            Your Jars
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
        </Grid>
      </Grid>

      <AlertNotification
        open={!!error}
        message={error}
        severity="error"
        onClose={() => setShowAlert(false)}
      />
    </Container>
  );
};

export default Dashboard; 