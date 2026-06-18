"use client";

import React, { useEffect, useState } from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { ExpenseBreakdown } from "@/types/dashboard";

interface ExpenseDonutChartProps {
  data: ExpenseBreakdown;
}

export function ExpenseDonutChart({ data }: ExpenseDonutChartProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Filter out categories with 0 value to make the donut look clean
  const chartData = data.categories.filter(c => c.value > 0);

  // If no expenses, render a dummy gray circle so the UI looks complete
  const hasExpenses = chartData.length > 0;
  const displayData = hasExpenses 
    ? chartData 
    : [{ name: "Sem despesas", value: 1, color: "#374151" }];

  return (
    <div className="bg-[#161b26] border border-gray-800/50 p-6 rounded-[28px] shadow-lg flex flex-col h-full">
      <div className="mb-4">
        <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest">
          Despesas por Categoria
        </h4>
        <p className="text-xs text-gray-500 font-medium">Breakdown mensal de saídas</p>
      </div>

      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
        {/* Chart View with Hydration Check */}
        <div className="relative w-full h-44 flex items-center justify-center">
          {mounted ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={displayData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={75}
                  paddingAngle={hasExpenses ? 3 : 0}
                  dataKey="value"
                >
                  {displayData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                {hasExpenses && (
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1f2937",
                      borderRadius: "12px",
                      border: "1px solid #374151",
                      color: "#fff",
                      fontFamily: "inherit",
                      fontSize: "12px",
                      fontWeight: "bold",
                    }}
                    formatter={(value: any) => [
                      Number(value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }),
                      "Gasto",
                    ]}
                  />
                )}
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="w-32 h-32 rounded-full border-4 border-gray-800 border-t-primary animate-spin"></div>
          )}

          {/* Centered Total Text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
              Total
            </span>
            <span className="text-lg font-black text-white leading-tight">
              {data.total.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
                maximumFractionDigits: 0,
              })}
            </span>
          </div>
        </div>

        {/* Legend / Category List */}
        <div className="space-y-2.5">
          {data.categories.map((cat, idx) => (
            <div key={idx} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: cat.color }}
                />
                <span className="font-bold text-gray-300 truncate">
                  {cat.name}
                </span>
              </div>
              <span className="font-black text-white shrink-0 ml-2">
                {cat.value.toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
