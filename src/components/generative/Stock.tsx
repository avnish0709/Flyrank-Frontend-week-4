import React from 'react';
import { TrendingUp, TrendingDown, DollarSign, Activity } from 'lucide-react';

export interface StockProps {
  symbol: string;
  price: number;
  change?: number;
  changePercent?: number;
  companyName?: string;
  high?: number;
  low?: number;
  volume?: string;
  currency?: string;
}

export const Stock: React.FC<StockProps> = ({
  symbol,
  price,
  change = 2.45,
  changePercent = 1.34,
  companyName,
  high,
  low,
  volume,
  currency = 'USD',
}) => {
  const isPositive = change >= 0;
  const displayCompany = companyName || getCompanyName(symbol);

  // Generate SVG path for a dynamic trend sparkline
  const sparklinePoints = isPositive
    ? '0,28 15,22 30,25 45,18 60,19 75,12 90,14 105,8 120,4'
    : '0,6 15,12 30,10 45,16 60,15 75,22 90,20 105,25 120,29';

  return (
    <div className="gen-ui-card gen-stock-card">
      <div className="gen-stock-header">
        <div>
          <div className="gen-stock-symbol-row">
            <span className="gen-ui-tag">Generative UI • Market</span>
            <span className="gen-stock-badge">{symbol.toUpperCase()}</span>
          </div>
          <h3 className="gen-stock-company">{displayCompany}</h3>
        </div>

        <div className={`gen-stock-trend-badge ${isPositive ? 'positive' : 'negative'}`}>
          {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          <span>
            {isPositive ? '+' : ''}
            {changePercent.toFixed(2)}%
          </span>
        </div>
      </div>

      <div className="gen-stock-main">
        <div className="gen-stock-price-wrap">
          <div className="gen-stock-price">
            ${typeof price === 'number' ? price.toFixed(2) : price}
            <span className="gen-stock-currency">{currency}</span>
          </div>
          <div className={`gen-stock-change ${isPositive ? 'positive' : 'negative'}`}>
            {isPositive ? '+' : ''}${Math.abs(change).toFixed(2)} Today
          </div>
        </div>

        {/* Dynamic Mini Sparkline SVG */}
        <div className="gen-stock-sparkline">
          <svg viewBox="0 0 120 32" className="sparkline-svg">
            <polyline
              fill="none"
              stroke={isPositive ? '#10b981' : '#ef4444'}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={sparklinePoints}
            />
          </svg>
        </div>
      </div>

      <div className="gen-stock-metrics">
        <div className="gen-metric-item">
          <Activity size={13} color="#94a3b8" />
          <span className="gen-metric-label">Day High</span>
          <span className="gen-metric-val">${(high || price * 1.018).toFixed(2)}</span>
        </div>
        <div className="gen-metric-item">
          <Activity size={13} color="#94a3b8" />
          <span className="gen-metric-label">Day Low</span>
          <span className="gen-metric-val">${(low || price * 0.985).toFixed(2)}</span>
        </div>
        <div className="gen-metric-item">
          <DollarSign size={13} color="#f59e0b" />
          <span className="gen-metric-label">Volume</span>
          <span className="gen-metric-val">{volume || '34.2M'}</span>
        </div>
      </div>
    </div>
  );
};

function getCompanyName(sym: string): string {
  const map: Record<string, string> = {
    AAPL: 'Apple Inc.',
    MSFT: 'Microsoft Corporation',
    GOOGL: 'Alphabet Inc.',
    AMZN: 'Amazon.com Inc.',
    NVDA: 'NVIDIA Corporation',
    TSLA: 'Tesla, Inc.',
    META: 'Meta Platforms Inc.',
  };
  return map[sym.toUpperCase()] || `${sym.toUpperCase()} Corp`;
}
