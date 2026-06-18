"use client";

import React from "react";

interface DashboardCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  subtitle?: string;
  trend?: {
    value: number;
    label: string;
    isPositive: boolean;
  };
  className?: string;
}

export function DashboardCard({
  title,
  value,
  icon,
  subtitle,
  trend,
  className = "",
}: DashboardCardProps) {
  return (
    <div
      className={`bg-[#161b26] border border-gray-800/50 p-5 rounded-[24px] shadow-lg flex flex-col justify-between hover:scale-[1.02] hover:border-primary/30 transition-all duration-300 group ${className}`}
    >
      <div className="flex justify-between items-start mb-3">
        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest group-hover:text-gray-300 transition-colors">
          {title}
        </span>
        <div className="w-10 h-10 rounded-2xl bg-gray-800/40 border border-gray-700/30 flex items-center justify-center text-primary/80 group-hover:text-primary transition-colors">
          {icon}
        </div>
      </div>

      <div className="space-y-1">
        <h3 className="text-2xl md:text-3xl font-black text-white leading-none tracking-tight">
          {value}
        </h3>
        
        {subtitle && (
          <p className="text-xs font-medium text-gray-500 truncate">
            {subtitle}
          </p>
        )}

        {trend && (
          <div className="flex items-center gap-1.5 pt-1.5">
            <span
              className={`text-[11px] font-black px-1.5 py-0.5 rounded ${
                trend.isPositive
                  ? "bg-green-500/10 text-green-400"
                  : "bg-red-500/10 text-red-400"
              }`}
            >
              {trend.isPositive ? "+" : ""}{trend.value}%
            </span>
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tight">
              {trend.label}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
