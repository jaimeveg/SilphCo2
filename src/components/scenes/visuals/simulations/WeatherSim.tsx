// src/components/scenes/visuals/simulations/WeatherSim.tsx
'use client';
import { motion } from 'framer-motion';
import { CloudRain, Sun, Snowflake, Wind } from 'lucide-react';

interface WeatherSimProps {
  config: {
    weatherType: 'sun' | 'rain' | 'sand' | 'snow';
    intensity: number;
    particles: boolean;
  };
}

export default function WeatherSim({ config }: WeatherSimProps) {
  const getIcon = () => {
    switch (config.weatherType) {
      case 'rain':
        return <CloudRain size={64} className="text-blue-400" />;
      case 'sun':
        return <Sun size={64} className="text-orange-400" />;
      case 'snow':
        return <Snowflake size={64} className="text-cyan-200" />;
      case 'sand':
        return <Wind size={64} className="text-yellow-600" />;
    }
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900/50 rounded-xl border border-slate-700 p-8 relative overflow-hidden">
      {/* Background Effect placeholder */}
      <div
        className={`absolute inset-0 opacity-20 ${
          config.weatherType === 'sun' ? 'bg-orange-500/20' : 'bg-blue-500/20'
        }`}
      />

      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        className="z-10"
      >
        {getIcon()}
      </motion.div>

      <div className="mt-6 z-10 text-center">
        <h3 className="text-xl font-display font-bold text-white uppercase tracking-widest">
          SIMULACIÓN: {config.weatherType}
        </h3>
        <div className="mt-2 flex items-center gap-2 justify-center text-xs font-mono text-brand-cyan">
          <span>INTENSITY: {config.intensity}%</span>
          <span className="w-px h-3 bg-slate-600" />
          <span>PARTICLES: {config.particles ? 'ON' : 'OFF'}</span>
        </div>
      </div>
    </div>
  );
}
