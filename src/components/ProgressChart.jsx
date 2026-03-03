import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import './ProgressChart.css';

const ProgressChart = ({ patientId, metric = 'gaze' }) => {
  const [data, setData] = useState([]);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProgressData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const headers = {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        };

        const response = await fetch(
          `http://localhost:5000/api/therapist/patient-progress/${patientId}?metric=${metric}`,
          { headers }
        );

        if (!response.ok) throw new Error('Failed to fetch progress data');

        const result = await response.json();
        setData(result.historicalData || []);
        setPrediction(result.prediction || null);
        setError(null);
      } catch (err) {
        setError(err.message);
        console.error('Error fetching progress data:', err);
      } finally {
        setLoading(false);
      }
    };

    if (patientId) {
      fetchProgressData();
    }
  }, [patientId, metric]);

  if (loading) {
    return <div className="progress-chart-loading">Loading progress data...</div>;
  }

  if (error) {
    return <div className="progress-chart-error">Error: {error}</div>;
  }

  const metricLabel = metric === 'gaze' ? 'Gaze Consistency Score' : 'Motor Activity Score';
  const metricUnit = metric === 'gaze' ? 'Variance' : 'Velocity';

  const chartData = data.map((item, idx) => ({
    session: `S${idx + 1}`,
    date: new Date(item.sessionDate).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    }),
    actual: item.score,
  }));

  if (prediction) {
    prediction.forEach((pred, idx) => {
      chartData.push({
        session: `P${idx + 1}`,
        date: new Date(pred.forecastDate).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        }),
        predicted: pred.score,
      });
    });
  }

  return (
    <div className="progress-chart-container">
      <div className="progress-chart-header">
        <h3 className="progress-chart-title">{metricLabel} Over Time</h3>
        <p className="progress-chart-subtitle">Historical data and 6-week forecast</p>
      </div>

      <ResponsiveContainer width="100%" height={350}>
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
          <XAxis
            dataKey="date"
            stroke="#666"
            style={{ fontSize: '12px' }}
          />
          <YAxis
            stroke="#666"
            style={{ fontSize: '12px' }}
            label={{ value: metricUnit, angle: -90, position: 'insideLeft' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #ccc',
              borderRadius: '4px',
            }}
            formatter={(value, name) => {
              if (name === 'actual') return [value?.toFixed(2), 'Historical'];
              if (name === 'predicted') return [value?.toFixed(2), 'Predicted'];
              return value;
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="actual"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={{ fill: '#3b82f6', r: 5 }}
            name="Historical"
            connectNulls
          />
          {prediction && (
            <Line
              type="monotone"
              dataKey="predicted"
              stroke="#a0aec0"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ fill: '#a0aec0', r: 4 }}
              name="Predicted"
              connectNulls
            />
          )}
        </LineChart>
      </ResponsiveContainer>

      {prediction && (
        <div className="progress-insight-card">
          <h4 className="insight-title">📊 Clinical Insight</h4>
          <p className="insight-text">
            Predicted to achieve{' '}
            <strong>{prediction[prediction.length - 1]?.score?.toFixed(1)}</strong>
            {' '}
            {metricUnit} within 6 weeks, representing a{' '}
            <strong>
              {(
                ((prediction[prediction.length - 1]?.score - data[data.length - 1]?.score) /
                  data[data.length - 1]?.score) *
                100
              ).toFixed(1)}
              %
            </strong>
            {' '}
            improvement.
          </p>
        </div>
      )}
    </div>
  );
};

export default ProgressChart;
