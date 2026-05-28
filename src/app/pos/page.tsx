"use client";

import { FormEvent, useMemo, useState } from "react";
import { Minus, Plus, ReceiptText, Send, ShoppingCart, Trash2 } from "lucide-react";
import {
  addItem,
  clearCart,
  removeItem,
  setDeliveryAddress,
  setItemNote,
  setItemQuantity,
  setOrderType,
  setTableNumber,
} from "@/lib/features/pos-slice";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { useActiveRestaurant } from "@/lib/hooks/use-active-restaurant";
import { useCreateOrderMutation, useListMenuItemsQuery } from "@/lib/services/mezani-api";
import type { GuestDetails, OrderType } from "@/lib/types";
import { currency, titleCase } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState, Field, LoadingState, Select } from "@/components/ui/data-state";
import { PageHeading } from "@/components/ui/page-heading";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { StatusPill } from "@/components/ui/status-pill";

const defaultGuest: GuestDetails = {
  first_name: "Client",
  last_name: "Comptoir",
  email: "client@mezani.app",
  phone: "+243000000000",
};

export default function PosPage() {
  const dispatch = useAppDispatch();
  const { restaurant } = useActiveRestaurant();
  const restaurantId = restaurant?.id ?? "";
  const pos = useAppSelector((state) => state.pos);
  const [guest, setGuest] = useState(defaultGuest);
  const [createOrder, createState] = useCreateOrderMutation();
  const menuQuery = useListMenuItemsQuery({ restaurantId }, { skip: !restaurantId });
  const items = menuQuery.data?.items ?? [];

  const total = useMemo(() => {
    return pos.cart.reduce((sum, line) => sum + line.price * line.quantity, 0);
  }, [pos.cart]);

  async function submitOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!restaurantId || pos.cart.length === 0) {
      return;
    }

    try {
      await createOrder({
        restaurantId,
        body: {
          items: pos.cart.map((line) => ({ item_id: line.itemId, quantity: line.quantity })),
          order_type: pos.orderType,
          delivery_address: pos.orderType === "delivery" ? pos.deliveryAddress : undefined,
          table_number: pos.orderType === "table_order" ? pos.tableNumber : undefined,
          guest_details: guest,
        },
      }).unwrap();
      dispatch(clearCart());
    } catch {
      // The mutation state renders the error near the submit button.
    }
  }

  return (
    <div>
      <PageHeading eyebrow="Point of Sale" title="Prise de commande tactile">
        Grille produits, panier persistant, notes par ligne et creation de commande sur l'API client.
      </PageHeading>

      <div className="grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
        <Panel>
          <PanelHeader title="Produits disponibles" eyebrow={restaurant?.name} />
          {menuQuery.isLoading ? <LoadingState /> : null}
          {menuQuery.isError ? <ErrorState detail="Impossible de charger les articles du menu." /> : null}
          {!menuQuery.isLoading && items.length === 0 ? <EmptyState title="Aucun produit" /> : null}
          <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <button
                key={item.item_id}
                className="min-h-40 rounded-lg border border-ink/10 bg-white/72 p-4 text-left transition hover:-translate-y-0.5 hover:border-basil/40 hover:shadow-lift focus-visible:focus-ring disabled:opacity-45"
                disabled={!item.is_available}
                onClick={() => dispatch(addItem(item))}
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-md bg-basil/10 text-basil">
                    <Plus className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <StatusPill tone={item.is_available ? "ok" : "danger"}>
                    {item.is_available ? "Disponible" : "Indispo"}
                  </StatusPill>
                </div>
                <p className="mt-5 text-base font-semibold text-ink">{item.name}</p>
                <p className="mt-1 text-sm text-ink/55">{titleCase(item.category_id)}</p>
                <p className="mt-4 text-xl font-semibold text-ink">{currency(item.price)}</p>
              </button>
            ))}
          </div>
        </Panel>

        <form onSubmit={submitOrder}>
          <Panel className="sticky top-24">
            <PanelHeader
              title="Panier"
              eyebrow={`${pos.cart.length} lignes`}
              action={
                <Button type="button" variant="ghost" className="h-9" onClick={() => dispatch(clearCart())}>
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                  Vider
                </Button>
              }
            />
            <div className="space-y-4 p-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <Select
                  value={pos.orderType}
                  onChange={(event) => dispatch(setOrderType(event.target.value as OrderType))}
                >
                  <option value="table_order">Sur place</option>
                  <option value="pickup">A emporter</option>
                  <option value="delivery">Livraison</option>
                </Select>
                {pos.orderType === "table_order" ? (
                  <Field
                    value={pos.tableNumber}
                    onChange={(event) => dispatch(setTableNumber(event.target.value))}
                    placeholder="Table"
                  />
                ) : null}
              </div>
              {pos.orderType === "delivery" ? (
                <Field
                  value={pos.deliveryAddress}
                  onChange={(event) => dispatch(setDeliveryAddress(event.target.value))}
                  placeholder="Adresse livraison"
                />
              ) : null}

              <div className="grid gap-3 sm:grid-cols-2">
                <Field
                  value={guest.first_name}
                  onChange={(event) => setGuest((current) => ({ ...current, first_name: event.target.value }))}
                  placeholder="Prenom"
                  required
                />
                <Field
                  value={guest.last_name}
                  onChange={(event) => setGuest((current) => ({ ...current, last_name: event.target.value }))}
                  placeholder="Nom"
                  required
                />
                <Field
                  type="email"
                  value={guest.email}
                  onChange={(event) => setGuest((current) => ({ ...current, email: event.target.value }))}
                  placeholder="Email"
                  required
                />
                <Field
                  value={guest.phone}
                  onChange={(event) => setGuest((current) => ({ ...current, phone: event.target.value }))}
                  placeholder="Telephone"
                  required
                />
              </div>

              {pos.cart.length === 0 ? (
                <EmptyState title="Panier vide" detail="Ajouter un produit depuis la grille." />
              ) : (
                <div className="space-y-3">
                  {pos.cart.map((line) => (
                    <div key={line.itemId} className="rounded-lg border border-ink/8 bg-white/70 p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-ink">{line.name}</p>
                          <p className="text-xs text-ink/50">{currency(line.price)}</p>
                        </div>
                        <Button type="button" className="h-8 w-8 px-0" variant="ghost" onClick={() => dispatch(removeItem(line.itemId))}>
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        </Button>
                      </div>
                      <div className="mt-3 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            className="h-8 w-8 px-0"
                            onClick={() => dispatch(setItemQuantity({ itemId: line.itemId, quantity: line.quantity - 1 }))}
                          >
                            <Minus className="h-4 w-4" aria-hidden="true" />
                          </Button>
                          <span className="grid h-8 w-10 place-items-center text-sm font-semibold text-ink">
                            {line.quantity}
                          </span>
                          <Button
                            type="button"
                            className="h-8 w-8 px-0"
                            onClick={() => dispatch(setItemQuantity({ itemId: line.itemId, quantity: line.quantity + 1 }))}
                          >
                            <Plus className="h-4 w-4" aria-hidden="true" />
                          </Button>
                        </div>
                        <p className="text-sm font-semibold text-ink">{currency(line.price * line.quantity)}</p>
                      </div>
                      <Field
                        className="mt-3"
                        placeholder="Note cuisine"
                        value={line.note}
                        onChange={(event) => dispatch(setItemNote({ itemId: line.itemId, note: event.target.value }))}
                      />
                    </div>
                  ))}
                </div>
              )}

              <div className="rounded-lg bg-ink p-4 text-white">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white/68">Total</span>
                  <span className="text-2xl font-semibold">{currency(total)}</span>
                </div>
              </div>

              <Button className="w-full" variant="primary" disabled={createState.isLoading || pos.cart.length === 0}>
                {createState.isLoading ? <ReceiptText className="h-4 w-4" /> : <Send className="h-4 w-4" />}
                Envoyer commande
              </Button>
              {createState.isSuccess ? <p className="text-sm font-medium text-basil">Commande creee.</p> : null}
              {createState.isError ? <p className="text-sm font-medium text-wine">Creation refusee par l'API.</p> : null}
              <div className="flex items-center gap-2 text-xs text-ink/50">
                <ShoppingCart className="h-4 w-4" aria-hidden="true" />
                Panier conserve dans Redux Toolkit pendant la navigation.
              </div>
            </div>
          </Panel>
        </form>
      </div>
    </div>
  );
}
