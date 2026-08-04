"use client";

import { FormEvent, useMemo, useState } from "react";
import { AlertTriangle, Boxes, PackagePlus, Scale, TrendingDown, TrendingUp } from "lucide-react";
import { useActiveRestaurant } from "@/lib/hooks/use-active-restaurant";
import { useCreateStockItemMutation, useListStockQuery, useMoveStockMutation } from "@/lib/services/mezani-api";
import type { StockMovement } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState, Field, LoadingState, Select } from "@/components/ui/data-state";
import { PageHeading } from "@/components/ui/page-heading";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { StatusPill } from "@/components/ui/status-pill";

const emptyItem = { name: "", category: "Boissons", sale_unit: "bouteille", base_unit: "bouteille", units_per_sale_unit: 1, quantity: 0, alert_quantity: 0 };

export default function StockPage() {
  const { restaurant } = useActiveRestaurant();
  const restaurantId = restaurant?.id ?? "";
  const stockQuery = useListStockQuery(restaurantId, { skip: !restaurantId });
  const [createItem, createState] = useCreateStockItemMutation();
  const [moveStock, moveState] = useMoveStockMutation();
  const [itemForm, setItemForm] = useState(emptyItem);
  const [movement, setMovement] = useState<{ item_id: string; type: StockMovement["type"]; quantity: number; reason: string }>({ item_id: "", type: "entry", quantity: 0, reason: "" });
  const [message, setMessage] = useState<string | null>(null);

  const items = stockQuery.data?.items ?? [];
  const movements = stockQuery.data?.movements ?? [];
  const lowStock = useMemo(() => items.filter((item) => item.quantity <= item.alert_quantity), [items]);

  async function submitItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!restaurantId) return; setMessage(null);
    try { await createItem({ restaurantId, body: itemForm }).unwrap(); setItemForm(emptyItem); setMessage("Article ajoute au stock."); }
    catch { setMessage("Impossible d'ajouter cet article."); }
  }

  async function submitMovement(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!restaurantId || !movement.item_id) return; setMessage(null);
    try { await moveStock({ restaurantId, body: movement }).unwrap(); setMovement((current) => ({ ...current, quantity: 0, reason: "" })); setMessage("Mouvement enregistre dans le journal."); }
    catch { setMessage("Mouvement refuse : verifiez le stock disponible et le motif."); }
  }

  return (
    <div>
      <PageHeading eyebrow="Magasin" title="Stocks, pertes et casses">
        Suivez les quantites dans leurs unites reelles : bouteille, casier, verre, dose, kilogramme ou portion.
      </PageHeading>

      {message ? <div className="mb-5 rounded-lg border border-info/20 bg-info-light px-4 py-3 text-sm font-medium text-info">{message}</div> : null}
      {stockQuery.isLoading ? <LoadingState label="Chargement du stock" /> : null}
      {stockQuery.isError ? <ErrorState detail="Le stock n'est pas accessible pour ce role." /> : null}

      <div className="grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
        <Panel>
          <PanelHeader title="Etat du stock" eyebrow={`${lowStock.length} alertes`} />
          {items.length === 0 && !stockQuery.isLoading ? <EmptyState title="Stock vide" detail="Ajoutez les premiers produits et leur unite de vente." /> : null}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left">
              <thead><tr className="border-b border-border bg-surface-elevated text-xs uppercase text-text-secondary"><th className="px-4 py-3">Produit</th><th className="px-4 py-3">Unite</th><th className="px-4 py-3">Conversion</th><th className="px-4 py-3">Disponible</th><th className="px-4 py-3">Etat</th></tr></thead>
              <tbody className="divide-y divide-border">
                {items.map((item) => {
                  const critical = item.quantity <= item.alert_quantity;
                  return <tr key={item.id}>
                    <td className="px-4 py-4"><p className="font-semibold text-primary">{item.name}</p><p className="text-xs text-text-secondary">{item.category}</p></td>
                    <td className="px-4 py-4 text-sm text-text-secondary">{item.sale_unit}</td>
                    <td className="px-4 py-4 text-sm text-text-secondary">1 {item.sale_unit} = {item.units_per_sale_unit} {item.base_unit}</td>
                    <td className="px-4 py-4 font-semibold text-primary">{item.quantity} {item.base_unit}</td>
                    <td className="px-4 py-4"><StatusPill tone={critical ? "danger" : "ok"}>{critical ? `Seuil ${item.alert_quantity}` : "Disponible"}</StatusPill></td>
                  </tr>;
                })}
              </tbody>
            </table>
          </div>
        </Panel>

        <div className="space-y-5">
          <Panel>
            <PanelHeader title="Ajouter un article" action={<PackagePlus className="h-4 w-4 text-info" />} />
            <form className="grid gap-3 p-4" onSubmit={submitItem}>
              <Field value={itemForm.name} onChange={(event) => setItemForm((current) => ({ ...current, name: event.target.value }))} placeholder="Nom du produit" required />
              <Field value={itemForm.category} onChange={(event) => setItemForm((current) => ({ ...current, category: event.target.value }))} placeholder="Categorie" />
              <div className="grid grid-cols-2 gap-3"><Select value={itemForm.sale_unit} onChange={(event) => setItemForm((current) => ({ ...current, sale_unit: event.target.value }))}>{unitOptions.map((unit) => <option key={unit}>{unit}</option>)}</Select><Select value={itemForm.base_unit} onChange={(event) => setItemForm((current) => ({ ...current, base_unit: event.target.value }))}>{unitOptions.map((unit) => <option key={unit}>{unit}</option>)}</Select></div>
              <div className="grid grid-cols-3 gap-3"><Field title="Conversion" type="number" min="0.01" step="0.01" value={itemForm.units_per_sale_unit} onChange={(event) => setItemForm((current) => ({ ...current, units_per_sale_unit: Number(event.target.value) }))} /><Field title="Stock initial" type="number" min="0" step="0.01" value={itemForm.quantity} onChange={(event) => setItemForm((current) => ({ ...current, quantity: Number(event.target.value) }))} /><Field title="Seuil" type="number" min="0" step="0.01" value={itemForm.alert_quantity} onChange={(event) => setItemForm((current) => ({ ...current, alert_quantity: Number(event.target.value) }))} /></div>
              <Button variant="primary" disabled={createState.isLoading}><Boxes className="h-4 w-4" />Ajouter au stock</Button>
            </form>
          </Panel>

          <Panel>
            <PanelHeader title="Entree ou sortie" action={<Scale className="h-4 w-4 text-success" />} />
            <form className="grid gap-3 p-4" onSubmit={submitMovement}>
              <Select value={movement.item_id} onChange={(event) => setMovement((current) => ({ ...current, item_id: event.target.value }))} required><option value="">Produit</option>{items.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select>
              <Select value={movement.type} onChange={(event) => setMovement((current) => ({ ...current, type: event.target.value as StockMovement["type"] }))}><option value="entry">Entree</option><option value="exit">Sortie</option><option value="loss">Perte</option><option value="breakage">Casse</option><option value="correction">Correction</option></Select>
              <Field type="number" min="0.01" step="0.01" value={movement.quantity || ""} onChange={(event) => setMovement((current) => ({ ...current, quantity: Number(event.target.value) }))} placeholder="Quantite" required />
              <Field value={movement.reason} onChange={(event) => setMovement((current) => ({ ...current, reason: event.target.value }))} placeholder="Motif ou fournisseur" required={movement.type !== "entry" && movement.type !== "exit"} />
              <Button disabled={moveState.isLoading}>{movement.type === "entry" ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}Enregistrer</Button>
            </form>
          </Panel>
        </div>

        <Panel className="xl:col-span-2">
          <PanelHeader title="Journal des mouvements" eyebrow="Tracabilite" />
          {movements.length === 0 ? <EmptyState title="Aucun mouvement" /> : <div className="divide-y divide-border">{movements.slice().reverse().slice(0, 20).map((movement) => { const item = items.find((entry) => entry.id === movement.item_id); return <div key={movement.id} className="flex flex-col gap-2 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3">{movement.type === "loss" || movement.type === "breakage" ? <AlertTriangle className="h-4 w-4 text-danger" /> : movement.type === "entry" ? <TrendingUp className="h-4 w-4 text-success" /> : <TrendingDown className="h-4 w-4 text-warning" />}<div><p className="text-sm font-semibold text-primary">{item?.name ?? movement.item_id}</p><p className="text-xs text-text-secondary">{movement.reason || movement.type} · {new Date(movement.created_at).toLocaleString("fr-CD")}</p></div></div><p className="text-sm font-semibold text-primary">{movement.previous_stock} → {movement.new_stock}</p></div>; })}</div>}
        </Panel>
      </div>
    </div>
  );
}

const unitOptions = ["bouteille", "casier", "verre", "dose", "portion", "piece", "kilogramme", "litre", "paquet"];
