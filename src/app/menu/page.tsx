"use client";

import { ChefHat, ImagePlus, ListFilter, Plus, Search, ToggleLeft, ToggleRight } from "lucide-react";
import { useMemo, useState } from "react";
import { useActiveRestaurant } from "@/lib/hooks/use-active-restaurant";
import { useListMenuItemsQuery } from "@/lib/services/mezani-api";
import { currency, titleCase } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState, Field, LoadingState, Select } from "@/components/ui/data-state";
import { PageHeading } from "@/components/ui/page-heading";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { StatusPill } from "@/components/ui/status-pill";

export default function MenuPage() {
  const { restaurant } = useActiveRestaurant();
  const restaurantId = restaurant?.id ?? "";
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const menuQuery = useListMenuItemsQuery({ restaurantId, categoryId }, { skip: !restaurantId });
  const items = menuQuery.data?.items ?? [];

  const categories = useMemo(() => {
    return Array.from(new Set((menuQuery.data?.items ?? []).map((item) => item.category_id)));
  }, [menuQuery.data?.items]);

  const filteredItems = useMemo(() => {
    const term = search.trim().toLowerCase();
    return items.filter((item) => {
      if (!term) {
        return true;
      }
      return item.name.toLowerCase().includes(term) || item.description.toLowerCase().includes(term);
    });
  }, [items, search]);

  return (
    <div>
      <PageHeading
        eyebrow="Catalogue"
        title="Menus et produits"
        action={
          <Button variant="primary">
            <Plus className="h-4 w-4" aria-hidden="true" />
            Produit
          </Button>
        }
      >
        Catalogue des articles par categorie, disponibilite, allergenes et prix de vente.
      </PageHeading>

      <div className="grid gap-5 xl:grid-cols-[1.3fr_0.7fr]">
        <Panel>
          <PanelHeader
            title="Articles"
            eyebrow={restaurant?.name}
            action={
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/35" />
                  <Field
                    className="w-52 pl-9"
                    placeholder="Recherche"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                </div>
                <Select value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>
                  <option value="">Toutes categories</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {titleCase(category)}
                    </option>
                  ))}
                </Select>
              </div>
            }
          />
          {menuQuery.isLoading ? <LoadingState /> : null}
          {menuQuery.isError ? <ErrorState detail="La route publique menu n'a pas repondu." /> : null}
          {!menuQuery.isLoading && filteredItems.length === 0 ? <EmptyState title="Aucun article" /> : null}

          <div className="grid gap-3 p-4 md:grid-cols-2">
            {filteredItems.map((item) => (
              <article key={item.item_id} className="rounded-lg border border-ink/10 bg-white/70 p-4 transition hover:-translate-y-0.5 hover:shadow-lift">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-base font-semibold text-ink">{item.name}</p>
                    <p className="mt-1 line-clamp-2 text-sm leading-6 text-ink/58">{item.description}</p>
                  </div>
                  <StatusPill tone={item.is_available ? "ok" : "danger"}>
                    {item.is_available ? "Actif" : "Stop"}
                  </StatusPill>
                </div>
                <div className="mt-5 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xl font-semibold text-ink">{currency(item.price)}</p>
                    <p className="text-xs text-ink/48">{titleCase(item.category_id)}</p>
                  </div>
                  <Button className="h-9" variant="ghost" title="Changer la disponibilite">
                    {item.is_available ? <ToggleRight className="h-5 w-5 text-basil" /> : <ToggleLeft className="h-5 w-5" />}
                  </Button>
                </div>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {item.allergens.length === 0 ? (
                    <span className="rounded-full bg-ink/6 px-2 py-1 text-xs text-ink/48">Sans allergene signale</span>
                  ) : (
                    item.allergens.map((allergen) => (
                      <span key={allergen} className="rounded-full bg-clay/12 px-2 py-1 text-xs text-clay">
                        {allergen}
                      </span>
                    ))
                  )}
                </div>
              </article>
            ))}
          </div>
        </Panel>

        <div className="space-y-5">
          <Panel>
            <PanelHeader title="Categories" action={<ListFilter className="h-4 w-4 text-ink/45" />} />
            <div className="grid gap-2 p-4">
              {categories.length === 0 ? <EmptyState title="Aucune categorie" /> : null}
              {categories.map((category, index) => (
                <div key={category} className="flex items-center justify-between rounded-md border border-ink/8 bg-white/60 px-3 py-3">
                  <div>
                    <p className="text-sm font-medium text-ink">{titleCase(category)}</p>
                    <p className="text-xs text-ink/48">Ordre {index + 1}</p>
                  </div>
                  <span className="grid h-7 w-7 place-items-center rounded-md bg-ink/6 text-xs font-semibold text-ink/58">
                    {items.filter((item) => item.category_id === category).length}
                  </span>
                </div>
              ))}
            </div>
          </Panel>

          <Panel>
            <PanelHeader title="Fiche produit" eyebrow="Modele formulaire" />
            <div className="grid gap-3 p-4">
              <Field placeholder="Nom du produit" />
              <Field placeholder="Description courte" />
              <div className="grid grid-cols-2 gap-3">
                <Field type="number" placeholder="Prix" />
                <Select defaultValue="cat_mains">
                  <option value="cat_mains">Plats</option>
                  <option value="cat_drinks">Boissons</option>
                  <option value="cat_desserts">Desserts</option>
                </Select>
              </div>
              <button className="flex min-h-28 items-center justify-center gap-2 rounded-lg border border-dashed border-ink/20 bg-white/50 text-sm font-medium text-ink/55">
                <ImagePlus className="h-5 w-5" aria-hidden="true" />
                Photo
              </button>
              <Button>
                <ChefHat className="h-4 w-4" aria-hidden="true" />
                Enregistrer brouillon
              </Button>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
