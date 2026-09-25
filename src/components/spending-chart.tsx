"use client";

import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatMoney } from "@/lib/currency";

export function SpendingChart({ data, currency }: { data: { day: string; amount: number; income?: number }[]; currency: string }) {
  return <div className="spending-chart"><ResponsiveContainer width="100%" height="100%"><LineChart data={data} margin={{ top: 12, right: 8, bottom: 0, left: -16 }}>
    <CartesianGrid stroke="#edf0eb" vertical={false} />
    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "#969e95", fontSize: 11 }} dy={10} />
    <YAxis axisLine={false} tickLine={false} tick={{ fill: "#969e95", fontSize: 11 }} tickFormatter={(value: number) => new Intl.NumberFormat("en", { notation: "compact" }).format(value)} />
    <Tooltip formatter={(value, name) => [formatMoney(Number(value), currency), name === "income" || name === "Income" ? "Income" : "Expenses"]} contentStyle={{ borderRadius: 12, border: "1px solid #e8ebe6", boxShadow: "0 10px 30px #263c2512" }} />
    <Legend verticalAlign="top" height={22} iconType="circle" wrapperStyle={{ fontSize: 10, color: "#7f8980" }} />
    <Line type="monotone" dataKey="amount" name="Expenses" stroke="#5f8064" strokeWidth={3} dot={false} activeDot={{ r: 5, fill: "#5f8064", stroke: "white", strokeWidth: 3 }} />
    <Line type="monotone" dataKey="income" name="Income" stroke="#b39a69" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: "#b39a69", stroke: "white", strokeWidth: 2 }} />
  </LineChart></ResponsiveContainer></div>;
}
