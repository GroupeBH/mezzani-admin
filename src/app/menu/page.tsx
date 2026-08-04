"use client";

import { FormEvent, useMemo, useState } from "react";
import { ChefHat, Plus, Search, ToggleLeft, ToggleRight } from "lucide-react";
import { useActiveRestaurant } from "@/lib/hooks/use-active-restaurant";
import { useCreateMenuItemMutation, useGetLocalSettingsQuery, useListMenuItemsQuery, useSetMenuItemAvailabilityMutation } from "@/lib/services/mezani-api";
import type { CurrencyCode } from "@/lib/types";
import { currency, titleCase } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState, Field, LoadingState, Select } from "@/components/ui/data-state";
import { PageHeading } from "@/components/ui/page-heading";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { StatusPill } from "@/components/ui/status-pill";

const emptyProduct = { category_id: "plats", name: "", description: "", price: 0, currency: "CDF" as CurrencyCode, sale_unit: "portion", allergens: "" };

export default function MenuPage() {
  const { restaurant } = useActiveRestaurant();
  const restaurantId = restaurant?.id ?? "";
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [product, setProduct] = useState(emptyProduct);
  const [message, setMessage] = useState<string | null>(null);
  const menuQuery = useListMenuItemsQuery({ restaurantId }, { skip: !restaurantId });
  const settingsQuery = useGetLocalSettingsQuery(restaurantId, { skip: !restaurantId });
  const [createProduct, createState] = useCreateMenuItemMutation();
  const [setAvailability, availabilityState] = useSetMenuItemAvailabilityMutation();
  const items = menuQuery.data?.items ?? [];
  const categories = useMemo(() => Array.from(new Set(items.map((item) => item.category_id))), [items]);
  const filteredItems = useMemo(() => { const term = search.trim().toLowerCase(); return items.filter((item) => (!term || item.name.toLowerCase().includes(term) || item.description.toLowerCase().includes(term)) && (!categoryId || item.category_id === categoryId)); }, [categoryId, items, search]);

  async function submitProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!restaurantId) return; setMessage(null);
    try { await createProduct({ restaurantId, body: { ...product, allergens: product.allergens.split(",").map((value) => value.trim()).filter(Boolean) } }).unwrap(); setProduct({ ...emptyProduct, currency: settingsQuery.data?.primary_currency ?? "CDF" }); setMessage("Produit ajoute au menu."); }
    catch { setMessage("Creation refusee. Verifiez le prix et votre role."); }
  }

  async function toggle(itemId: string, current: boolean) {
    setMessage(null);
    try { await setAvailability({ restaurantId, itemId, isAvailable: !current }).unwrap(); }
    catch { setMessage("La disponibilite n'a pas pu etre modifiee."); }
  }

  return (
    <div>
      <PageHeading eyebrow="Catalogue" title="Menu et produits">
        Prix en CDF ou USD, unite de vente et disponibilite immediate pour la salle, le bar et la cuisine.
      </PageHeading>
      {message ? <div className="mb-5 rounded-lg border border-info/20 bg-info-light px-4 py-3 text-sm font-medium text-info">{message}</div> : null}
      <div className="grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
        <Panel>
          <PanelHeader title="Articles" eyebrow={restaurant?.name} action={<div className="flex flex-wrap gap-2"><label className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-disabled" /><Field className="w-52 pl-9" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Recherche" /></label><Select value={categoryId} onChange={(event) => setCategoryId(event.target.value)}><option value="">Toutes categories</option>{categories.map((category) => <option key={category}>{category}</option>)}</Select></div>} />
          {menuQuery.isLoading ? <LoadingState /> : null}
          {menuQuery.isError ? <ErrorState detail="Le menu n'a pas pu etre charge." /> : null}
          {!menuQuery.isLoading && filteredItems.length === 0 ? <EmptyState title="Aucun article" detail="Creez le premier produit du restaurant." /> : null}
          <div className="divide-y divide-border">
            {filteredItems.map((item) => <article key={item.item_id} className="grid gap-4 px-4 py-4 sm:grid-cols-[1fr_auto] sm:items-center"><div className="min-w-0"><div className="flex items-center gap-2"><p className="truncate font-semibold text-primary">{item.name}</p><StatusPill tone={item.is_available ? "ok" : "danger"}>{item.is_available ? "Disponible" : "Stop"}</StatusPill></div><p className="mt-1 text-sm text-text-secondary">{item.description || "Aucune description"}</p><div className="mt-2 flex flex-wrap gap-2 text-xs text-text-disabled"><span>{titleCase(item.category_id)}</span><span>·</span><span>{item.sale_unit || "portion"}</span>{item.allergens.map((allergen) => <span key={allergen} className="rounded-full bg-warning-light px-2 py-0.5 text-amber-700">{allergen}</span>)}</div></div><div className="flex items-center justify-between gap-3 sm:justify-end"><p className="min-w-28 text-right text-lg font-semibold text-primary">{currency(item.price, item.currency || "CDF")}</p><Button className="h-10 w-10 px-0" disabled={availabilityState.isLoading} onClick={() => toggle(item.item_id, item.is_available)} title="Changer la disponibilite">{item.is_available ? <ToggleRight className="h-5 w-5 text-success" /> : <ToggleLeft className="h-5 w-5" />}</Button></div></article>)}
          </div>
        </Panel>

        <Panel className="h-fit xl:sticky xl:top-24">
          <PanelHeader title="Nouveau produit" action={<ChefHat className="h-4 w-4 text-success" />} />
          <form className="grid gap-3 p-4" onSubmit={submitProduct}>
            <Field value={product.name} onChange={(event) => setProduct((current) => ({ ...current, name: event.target.value }))} placeholder="Nom du produit" required />
            <Field value={product.description} onChange={(event) => setProduct((current) => ({ ...current, description: event.target.value }))} placeholder="Description courte" />
            <Field value={product.category_id} onChange={(event) => setProduct((current) => ({ ...current, category_id: event.target.value }))} placeholder="Categorie" required />
            <div className="grid grid-cols-[1fr_0.5fr] gap-3"><Field type="number" min="0" step="0.01" value={product.price || ""} onChange={(event) => setProduct((current) => ({ ...current, price: Number(event.target.value) }))} placeholder="Prix" required /><Select value={product.currency} onChange={(event) => setProduct((current) => ({ ...current, currency: event.target.value as CurrencyCode }))}>{(settingsQuery.data?.accepted_currencies ?? ["CDF", "USD"]).map((code) => <option key={code}>{code}</option>)}</Select></div>
            <Select value={product.sale_unit} onChange={(event) => setProduct((current) => ({ ...current, sale_unit: event.target.value }))}>{["portion", "bouteille", "casier", "verre", "dose", "piece", "litre"].map((unit) => <option key={unit}>{unit}</option>)}</Select>
            <Field value={product.allergens} onChange={(event) => setProduct((current) => ({ ...current, allergens: event.target.value }))} placeholder="Allergenes separes par virgule" />
            <Button variant="primary" disabled={createState.isLoading}><Plus className="h-4 w-4" />{createState.isLoading ? "Creation" : "Ajouter au menu"}</Button>
          </form>
        </Panel>
      </div>
    </div>
  );
}
