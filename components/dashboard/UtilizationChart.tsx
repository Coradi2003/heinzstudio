"use client";

import React, { useState } from "react";
import { Edit2, Check } from "lucide-react";

interface UtilizationChartProps {
  horasMeta: number;
  horasTrabalhadas: number;
  taxaUtilizacao: number;
  onMetaChange: (horas: number) => void;
}

export function UtilizationChart({
  horasMeta,
  horasTrabalhadas,
  taxaUtilizacao,
  onMetaChange,
}: UtilizationChartProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempMeta, setTempMeta] = useState(String(horasMeta));

  const handleSave = () => {
    const parsed = parseInt(tempMeta, 10);
    if (!isNaN(parsed) && parsed > 0) {
      onMetaChange(parsed);
    }
    setIsEditing(false);
  };

  // Circular progress calculations
  const radius = 50;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  const clampedProgress = Math.min(Math.max(taxaUtilizacao, 0), 100);
  const strokeDashoffset = circumference - (clampedProgress / 100) * circumference;

  return (
    <div className="bg-[#161b26] border border-gray-800/50 p-6 rounded-[28px] shadow-lg flex flex-col h-full justify-between">
      <div>
        <div className="flex justify-between items-start mb-2">
          <div>
            <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest">
              Taxa de Utilização
            </h4>
            <p className="text-xs text-gray-500 font-medium">Produtividade operacional</p>
          </div>
          
          {/* Inline Edit Trigger */}
          {isEditing ? (
            <button 
              onClick={handleSave} 
              className="p-1.5 bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg hover:bg-green-500/30 active:scale-95 transition"
            >
              <Check size={14} />
            </button>
          ) : (
            <button 
              onClick={() => { setTempMeta(String(horasMeta)); setIsEditing(true); }}
              className="p-1.5 bg-gray-800/60 text-gray-400 border border-gray-700/30 rounded-lg hover:text-white transition"
              title="Ajustar Meta de Horas"
            >
              <Edit2 size={12} />
            </button>
          )}
        </div>

        {/* Info Rows */}
        <div className="space-y-3 mt-4">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-gray-400 uppercase tracking-tight">Meta de Horas</span>
            {isEditing ? (
              <input
                type="number"
                value={tempMeta}
                onChange={e => setTempMeta(e.target.value)}
                className="w-16 bg-gray-800 border border-gray-700 rounded px-1.5 py-0.5 text-right font-black text-white outline-none focus:border-primary"
                onKeyDown={e => { if (e.key === 'Enter') handleSave(); }}
              />
            ) : (
              <span className="font-black text-white text-sm">{horasMeta}h</span>
            )}
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-gray-400 uppercase tracking-tight">Horas Trabalhadas</span>
            <span className="font-black text-white text-sm">{horasTrabalhadas}h</span>
          </div>
        </div>
      </div>

      {/* Circle Ring Progress Visual */}
      <div className="flex justify-center items-center py-6 mt-4">
        <div className="relative w-32 h-32 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90">
            {/* Background Ring */}
            <circle
              cx="64"
              cy="64"
              r={radius}
              stroke="#1f2937"
              strokeWidth={strokeWidth}
              fill="transparent"
            />
            {/* Progress Ring */}
            <circle
              cx="64"
              cy="64"
              r={radius}
              stroke="#A855F7" // Purple progress ring
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              className="transition-all duration-1000 ease-out"
            />
          </svg>

          {/* Value Display */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
            <span className="text-xl font-black text-white leading-none">
              {taxaUtilizacao}%
            </span>
            <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest mt-1">
              taxa
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
