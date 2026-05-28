"use client";

import { Download, FileDown } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { reportCategories, salesSeries, staffPerformance } from "@/lib/data/mock";
import { currency } from "@/lib/utils";
import { ClientChart } from "@/components/charts/client-chart";
import { Button } from "@/components/ui/button";
import { Field, Select } from "@/components/ui/data-state";
import { PageHeading } from "@/components/ui/page-heading";
import { Panel, PanelHeader } from "@/components/ui/panel";

const colors = ["#27745f", "#c56f45", "#d7a33d", "#8a3345"];

export default function ReportsPage() {
  return (
    <div>
      <PageHeading
        eyebrow="Analyse"
        title="Rapports et exports"
        action={
          <>
            <Button>
              <FileDown className="h-4 w-4" aria-hidden="true" />
              CSV
            </Button>
            <Button variant="primary">
              <Download className="h-4 w-4" aria-hidden="true" />
              PDF
            </Button>
          </>
        }
      >
        Lecture des ventes, performance equipe, categories et historique d'annulation par periode.
      </PageHeading>

      <Panel className="mb-5">
        <div className="grid gap-3 p-4 md:grid-cols-4">
          <Field type="date" defaultValue="2026-05-22" />
          <Field type="date" defaultValue="2026-05-28" />
          <Select defaultValue="sales_by_category">
            <option value="sales_by_category">Ventes par categorie</option>
            <option value="staff_performance">Performance serveurs</option>
            <option value="cancellations">Annulations</option>
          </Select>
          <Button variant="primary">Generer</Button>
        </div>
      </Panel>

      <div className="grid gap-5 xl:grid-cols-[1.3fr_0.7fr]">
        <Panel>
          <PanelHeader title="Ventes hebdomadaires" />
          <div className="h-[360px] p-4">
            <ClientChart>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesSeries} margin={{ left: 8, right: 20, top: 10, bottom: 0 }}>
                  <CartesianGrid stroke="rgba(21,21,21,0.08)" vertical={false} />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "#6b665e", fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: "#6b665e", fontSize: 12 }} />
                  <Tooltip
                    formatter={(value) => currency(Number(value))}
                    contentStyle={{ borderRadius: 8, borderColor: "rgba(21,21,21,0.12)" }}
                  />
                  <Bar dataKey="sales" radius={[6, 6, 0, 0]} fill="#27745f" />
                </BarChart>
              </ResponsiveContainer>
            </ClientChart>
          </div>
        </Panel>

        <Panel>
          <PanelHeader title="Mix categories" />
          <div className="h-[360px] p-4">
            <ClientChart>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={reportCategories} innerRadius={64} outerRadius={112} dataKey="value" paddingAngle={3}>
                    {reportCategories.map((entry, index) => (
                      <Cell key={entry.name} fill={colors[index % colors.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value}%`, "Part"]} />
                </PieChart>
              </ResponsiveContainer>
            </ClientChart>
          </div>
          <div className="grid gap-2 px-4 pb-4">
            {reportCategories.map((category, index) => (
              <div key={category.name} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-ink/62">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: colors[index % colors.length] }} />
                  {category.name}
                </span>
                <span className="font-semibold text-ink">{category.value}%</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <Panel className="mt-5">
        <PanelHeader title="Performance serveurs" />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] text-left">
            <thead>
              <tr className="border-b border-ink/8 text-xs uppercase text-ink/45">
                <th className="px-4 py-3">Serveur</th>
                <th className="px-4 py-3">Commandes</th>
                <th className="px-4 py-3">Ventes</th>
                <th className="px-4 py-3">Panier moyen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/8">
              {staffPerformance.map((row) => (
                <tr key={row.name}>
                  <td className="px-4 py-4 font-medium text-ink">{row.name}</td>
                  <td className="px-4 py-4 text-sm text-ink/60">{row.orders}</td>
                  <td className="px-4 py-4 text-sm font-semibold text-ink">{currency(row.sales)}</td>
                  <td className="px-4 py-4 text-sm text-ink/60">{currency(row.sales / row.orders)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
