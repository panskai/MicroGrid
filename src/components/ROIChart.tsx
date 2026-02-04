import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { ROIYearData } from '../utils/roiCalculator';
import './ROIChart.css';

interface ROIChartProps {
  yearData: ROIYearData[];
  roiYears: number;
}

export default function ROIChart({ yearData, roiYears }: ROIChartProps) {
  // 检查数据有效性
  if (!yearData || yearData.length === 0) {
    return (
      <div className="roi-chart-container">
        <h3 className="chart-title">投资回报曲线</h3>
        <p style={{ textAlign: 'center', color: '#666', padding: '2rem' }}>
          数据计算中，请稍候...
        </p>
      </div>
    );
  }

  // 格式化数据用于图表显示
  const chartData = yearData.map((data) => ({
    年份: data.year,
    累计投资: data.cumulativeCost / 10000, // 转换为万元
    累计收益: data.cumulativeSavings / 10000, // 转换为万元
    净收益: data.netValue / 10000, // 转换为万元
    投资回报率: data.roi,
  }));

  // 找到回本年份的数据点
  const breakEvenPoint = yearData.find((d) => d.netValue >= 0);
  const breakEvenYear = breakEvenPoint?.year || Math.ceil(roiYears);

  return (
    <div className="roi-chart-container">
      <h3 className="chart-title">投资回报曲线</h3>
      <div className="chart-info">
        <div className="info-item">
          <span className="info-label">预计回本年限：</span>
          <span className="info-value highlight">{roiYears.toFixed(1)} 年</span>
        </div>
        <div className="info-item">
          <span className="info-label">回本年份：</span>
          <span className="info-value">{breakEvenYear} 年</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="年份" 
            label={{ value: '年份', position: 'insideBottom', offset: -5 }}
          />
          <YAxis 
            label={{ value: '金额（万元）', angle: -90, position: 'insideLeft' }}
            yAxisId="left"
          />
          <YAxis 
            orientation="right"
            label={{ value: '投资回报率 (%)', angle: 90, position: 'insideRight' }}
            yAxisId="right"
          />
          <Tooltip 
            formatter={(value: any, name: any) => {
              if (value === undefined || value === null) return '';
              const numValue = Number(value);
              if (isNaN(numValue)) return '';
              if (name === '投资回报率') {
                return [`${numValue.toFixed(1)}%`, name];
              }
              return [`${numValue.toFixed(2)} 万元`, name];
            }}
            labelFormatter={(label) => `第 ${label} 年`}
          />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="累计投资" 
            stroke="#8884d8" 
            strokeWidth={2}
            dot={false}
            name="累计投资"
            yAxisId="left"
          />
          <Line 
            type="monotone" 
            dataKey="累计收益" 
            stroke="#82ca9d" 
            strokeWidth={2}
            dot={false}
            name="累计收益"
            yAxisId="left"
          />
          <Line 
            type="monotone" 
            dataKey="净收益" 
            stroke="#ff7300" 
            strokeWidth={2}
            dot={{ r: 4 }}
            name="净收益"
            yAxisId="left"
          />
          <Line
            type="monotone"
            dataKey="投资回报率"
            stroke="#ffc658"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={false}
            name="投资回报率 (%)"
            yAxisId="right"
          />
        </LineChart>
      </ResponsiveContainer>
      <div className="chart-notes">
        <p>• 累计投资：系统初始投资成本</p>
        <p>• 累计收益：累计节省的电费和维护成本</p>
        <p>• 净收益：累计收益减去累计投资</p>
        <p>• 当净收益曲线超过0时，表示已回本</p>
      </div>
    </div>
  );
}
