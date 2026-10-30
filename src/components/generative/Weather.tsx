import React from 'react';
import { Cloud, CloudRain, CloudSnow, Sun, Wind, Droplets, Thermometer } from 'lucide-react';

export interface WeatherProps {
  location?: string;
  city?: string;
  weather?: string;
  condition?: string;
  temperature?: number | string;
  humidity?: string | number;
  windSpeed?: string;
  high?: number | string;
  low?: number | string;
}

export const Weather: React.FC<WeatherProps> = ({
  location,
  city,
  weather,
  condition,
  temperature,
  humidity,
  windSpeed,
  high,
  low,
}) => {
  const cityName = location || city || 'Unknown Location';
  const conditionText = weather || condition || 'Clear';
  const tempDisplay = typeof temperature === 'number' ? `${temperature}°C` : (temperature || '21°C');

  // Pick appropriate weather icon
  const getIcon = () => {
    const text = conditionText.toLowerCase();
    if (text.includes('rain') || text.includes('shower')) {
      return <CloudRain size={28} color="#38bdf8" />;
    }
    if (text.includes('snow') || text.includes('chilly')) {
      return <CloudSnow size={28} color="#93c5fd" />;
    }
    if (text.includes('cloud')) {
      return <Cloud size={28} color="#94a3b8" />;
    }
    if (text.includes('wind')) {
      return <Wind size={28} color="#cbd5e1" />;
    }
    return <Sun size={28} color="#f59e0b" />;
  };

  return (
    <div className="gen-ui-card gen-weather-card">
      <div className="gen-weather-header">
        <div className="gen-weather-city-wrap">
          <span className="gen-ui-tag">Generative UI • Weather</span>
          <h3 className="gen-weather-city">{cityName}</h3>
          <span className="gen-weather-condition">{conditionText}</span>
        </div>
        <div className="gen-weather-icon-badge">
          {getIcon()}
        </div>
      </div>

      <div className="gen-weather-main">
        <div className="gen-weather-temp">{tempDisplay}</div>
        {(high || low) && (
          <div className="gen-weather-range">
            {high && <span>H: {high}</span>}
            {low && <span>L: {low}</span>}
          </div>
        )}
      </div>

      <div className="gen-weather-metrics">
        <div className="gen-metric-item">
          <Droplets size={14} color="#38bdf8" />
          <span className="gen-metric-label">Humidity</span>
          <span className="gen-metric-val">{humidity ? (typeof humidity === 'number' ? `${humidity}%` : humidity) : '48%'}</span>
        </div>
        <div className="gen-metric-item">
          <Wind size={14} color="#94a3b8" />
          <span className="gen-metric-label">Wind</span>
          <span className="gen-metric-val">{windSpeed || '12 km/h'}</span>
        </div>
        <div className="gen-metric-item">
          <Thermometer size={14} color="#f59e0b" />
          <span className="gen-metric-label">RealFeel</span>
          <span className="gen-metric-val">{tempDisplay}</span>
        </div>
      </div>
    </div>
  );
};
