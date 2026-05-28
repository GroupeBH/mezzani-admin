"use client";

import { Download, PackageCheck, Plus, Scale } from "lucide-react";
import { inventoryItems, recipeLines, stockMovements } from "@/lib/data/mock";
import { PageHeading } from "@/components/ui/page-heading";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/ui/status-pill";

export default function StockPage() {
  return (
    <div>
      <PageHeading
        eyebrow="Inventaire"
        title="Stocks et fiches recettes"
        action={
          <>
            <Button>
              <Download className="h-4 w-4" aria-hidden="true" />
              Export
            </Button>
            <Button variant="primary">
              <Plus className="h-4 w-4" aria-hidden="true" />
              Mouvement
            </Button>
          </>
        }
      >
        Suivi des niveaux, seuils d'alerte, mouvements et ingredients associes aux produits.
      </PageHeading>

      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <Panel>
          <PanelHeader title="Ingredients" eyebrow="Seuils actifs" />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left">
              <thead>
                <tr className="border-b border-ink/8 text-xs uppercase text-ink/45">
                  <th className="px-4 py-3">Ingredient</th>
                  <th className="px-4 py-3">Categorie</th>
                  <th className="px-4 py-3">Stock</th>
                  <th className="px-4 py-3">Niveau</th>
                  <th className="px-4 py-3">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/8">
                {inventoryItems.map((item) => {
                  const ratio = Math.min(100, Math.round((item.stock / item.target) * 100));
                  const tone = item.stock <= item.alert ? "danger" : ratio < 55 ? "warn" : "ok";
                  return (
                    <tr key={item.name}>
                      <td className="px-4 py-4">
                        <p className="font-medium text-ink">{item.name}</p>
                        <p className="text-xs text-ink/50">Seuil {item.alert} {item.unit}</p>
                      </td>
                      <td className="px-4 py-4 text-sm text-ink/60">{item.category}</td>
                      <td className="px-4 py-4 text-sm font-semibold text-ink">
                        {item.stock} {item.unit}
                      </td>
                      <td className="px-4 py-4">
                        <div className="h-2 w-full overflow-hidden rounded-full bg-ink/8">
                          <div
                            className={tone === "danger" ? "h-full bg-wine" : tone === "warn" ? "h-full bg-saffron" : "h-full bg-basil"}
                            style={{ width: `${ratio}%` }}
                          />
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <StatusPill tone={tone}>{tone === "danger" ? "A commander" : tone === "warn" ? "Surveiller" : "OK"}</StatusPill>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Panel>

        <div className="space-y-5">
          <Panel>
            <PanelHeader title="Mouvements recents" action={<PackageCheck className="h-4 w-4 text-ink/45" />} />
            <div className="divide-y divide-ink/8">
              {stockMovements.map((movement) => (
                <div key={`${movement.time}-${movement.label}`} className="flex items-center justify-between gap-3 px-4 py-4">
                  <div>
                    <p className="text-sm font-semibold text-ink">{movement.label}</p>
                    <p className="text-xs text-ink/50">{movement.time}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-ink">{movement.quantity}</p>
                    <p className="text-xs text-ink/50">{movement.status}</p>
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel>
            <PanelHeader title="Fiches recettes" action={<Scale className="h-4 w-4 text-ink/45" />} />
            <div className="grid gap-2 p-4">
              {recipeLines.map((line) => (
                <div key={`${line.product}-${line.ingredient}`} className="rounded-md border border-ink/8 bg-white/60 px-3 py-3">
                  <p className="text-sm font-semibold text-ink">{line.product}</p>
                  <p className="mt-1 text-sm text-ink/58">
                    {line.ingredient} - {line.quantity}
                  </p>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
