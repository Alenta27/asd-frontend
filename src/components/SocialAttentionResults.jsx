import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line
} from 'recharts';

const SocialAttentionResults = ({ results }) => {
  if (!results) return null;

  const { socialPreferenceScore = 0, leftTime = 0, rightTime = 0, leftLookTime = 0, rightLookTime = 0, clinicalSummary = "No data available", logs, metrics } = results;

  // Use leftTime/rightTime if available, otherwise fall back to leftLookTime/rightLookTime
  const leftTimeMs = leftTime || leftLookTime || 0;
  const rightTimeMs = rightTime || rightLookTime || 0;

  const barData = [
    { name: 'Social (Left)', time: leftTimeMs / 1000 },
    { name: 'Non-Social (Right)', time: rightTimeMs / 1000 },
  ];

  // Prepare timeline data from logs
  const timelineData = logs?.map((log, index) => ({
    time: Number((index * 0.3).toFixed(1)), // 300ms interval
    side: log.side === 'left' ? 1 : 0
  })) || [];

  return (
    <div className="social-attention-results">
      <div className="results-hero">
        <div className="score-large">{Math.round(socialPreferenceScore || 0)}%</div>
        <div className="score-label">Social Preference Score</div>
      </div>

      <div className="results-charts">
        <div className="chart-box">
          <h4>Visual Attention Distribution (Seconds)</h4>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis label={{ value: 'Seconds', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Bar dataKey="time" fill="#4f46e5" radius={[10, 10, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {logs && logs.length > 0 && (
          <div className="chart-box">
            <h4>Gaze Shift Timeline (Social vs Non-Social)</h4>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" label={{ value: 'Time (s)', position: 'insideBottom', offset: -5 }} />
                <YAxis 
                  ticks={[0, 1]} 
                  tickFormatter={(val) => val === 1 ? 'Social' : 'Object'}
                />
                <Tooltip />
                <Line 
                  type="stepAfter" 
                  dataKey="side" 
                  stroke="#ff1493" 
                  strokeWidth={3} 
                  dot={false} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="clinical-summary-box">
        <h4>Clinical Interpretation</h4>
        <p>{clinicalSummary}</p>
      </div>
    </div>
  );
};

export default SocialAttentionResults;
