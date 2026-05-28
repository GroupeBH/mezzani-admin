"use client";

import { FormEvent, useState } from "react";
import { CalendarPlus, Move, Phone, Users } from "lucide-react";
import { floorTables, reservations } from "@/lib/data/mock";
import { useActiveRestaurant } from "@/lib/hooks/use-active-restaurant";
import { useCreateBookingMutation } from "@/lib/services/mezani-api";
import type { GuestDetails } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Field, Select } from "@/components/ui/data-state";
import { PageHeading } from "@/components/ui/page-heading";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { StatusPill } from "@/components/ui/status-pill";

const defaultGuest: GuestDetails = {
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
};

export default function ReservationsPage() {
  const { restaurant } = useActiveRestaurant();
  const restaurantId = restaurant?.id ?? "";
  const [guest, setGuest] = useState(defaultGuest);
  const [date, setDate] = useState("2026-05-28");
  const [time, setTime] = useState("19:30");
  const [guests, setGuests] = useState(4);
  const [createBooking, createState] = useCreateBookingMutation();

  async function submitBooking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!restaurantId) {
      return;
    }

    try {
      await createBooking({
        restaurantId,
        body: {
          date,
          time,
          number_of_guests: guests,
          guest_details: guest,
        },
      }).unwrap();
      setGuest(defaultGuest);
    } catch {
      // The mutation state renders feedback below the button.
    }
  }

  return (
    <div>
      <PageHeading eyebrow="Salle" title="Reservations et plan de salle">
        Vue planning, etat des tables et saisie rapide des reservations prises par telephone.
      </PageHeading>

      <div className="grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
        <Panel>
          <PanelHeader title="Plan de salle" eyebrow={restaurant?.name} action={<Move className="h-4 w-4 text-ink/45" />} />
          <div className="p-4">
            <div className="relative min-h-[520px] overflow-hidden rounded-lg border border-ink/10 bg-[linear-gradient(90deg,rgba(21,21,21,0.05)_1px,transparent_1px),linear-gradient(180deg,rgba(21,21,21,0.05)_1px,transparent_1px)] bg-[size:42px_42px]">
              <div className="absolute left-[6%] top-[8%] h-[84%] w-[5px] rounded-full bg-ink/18" />
              <div className="absolute bottom-[10%] left-[8%] right-[8%] h-[5px] rounded-full bg-ink/18" />
              {floorTables.map((table) => (
                <button
                  key={table.id}
                  className="absolute grid h-24 w-24 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-white/80 text-center shadow-lift transition hover:scale-105 focus-visible:focus-ring"
                  style={{
                    left: `${table.x}%`,
                    top: `${table.y}%`,
                    background:
                      table.status === "Libre"
                        ? "rgba(39,116,95,0.9)"
                        : table.status === "Reservee"
                          ? "rgba(215,163,61,0.92)"
                          : "rgba(138,51,69,0.92)",
                  }}
                >
                  <span className="text-sm font-semibold text-white">{table.id}</span>
                  <span className="text-xs text-white/78">{table.seats} places</span>
                </button>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <StatusPill tone="ok">Libre</StatusPill>
              <StatusPill tone="warn">Reservee</StatusPill>
              <StatusPill tone="danger">Occupee</StatusPill>
            </div>
          </div>
        </Panel>

        <div className="space-y-5">
          <Panel>
            <PanelHeader title="Saisie reservation" eyebrow="Telephone" />
            <form className="grid gap-3 p-4" onSubmit={submitBooking}>
              <div className="grid grid-cols-2 gap-3">
                <Field type="date" value={date} onChange={(event) => setDate(event.target.value)} required />
                <Field type="time" value={time} onChange={(event) => setTime(event.target.value)} required />
              </div>
              <Select value={guests} onChange={(event) => setGuests(Number(event.target.value))}>
                {[1, 2, 3, 4, 5, 6, 8, 10, 12].map((value) => (
                  <option key={value} value={value}>
                    {value} couverts
                  </option>
                ))}
              </Select>
              <div className="grid grid-cols-2 gap-3">
                <Field
                  placeholder="Prenom"
                  value={guest.first_name}
                  onChange={(event) => setGuest((current) => ({ ...current, first_name: event.target.value }))}
                  required
                />
                <Field
                  placeholder="Nom"
                  value={guest.last_name}
                  onChange={(event) => setGuest((current) => ({ ...current, last_name: event.target.value }))}
                  required
                />
              </div>
              <Field
                type="email"
                placeholder="email"
                value={guest.email}
                onChange={(event) => setGuest((current) => ({ ...current, email: event.target.value }))}
                required
              />
              <Field
                placeholder="Telephone"
                value={guest.phone}
                onChange={(event) => setGuest((current) => ({ ...current, phone: event.target.value }))}
                required
              />
              <Button variant="primary" disabled={createState.isLoading || !restaurantId}>
                <CalendarPlus className="h-4 w-4" aria-hidden="true" />
                {createState.isLoading ? "Creation" : "Creer reservation"}
              </Button>
              {createState.isSuccess ? <p className="text-sm font-medium text-basil">Reservation transmise.</p> : null}
              {createState.isError ? <p className="text-sm font-medium text-wine">Reservation refusee par l'API.</p> : null}
            </form>
          </Panel>

          <Panel>
            <PanelHeader title="Planning du soir" />
            <div className="divide-y divide-ink/8">
              {reservations.map((reservation) => (
                <div key={`${reservation.time}-${reservation.guest}`} className="flex items-center justify-between gap-3 px-4 py-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-md bg-ink/6 text-ink">
                      <Users className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-ink">{reservation.time} - {reservation.guest}</p>
                      <p className="text-xs text-ink/55">
                        {reservation.guests} couverts - {reservation.table}
                      </p>
                    </div>
                  </div>
                  <StatusPill tone={reservation.status === "Confirmee" ? "ok" : "warn"}>{reservation.status}</StatusPill>
                </div>
              ))}
            </div>
          </Panel>

          <div className="rounded-lg border border-ink/10 bg-white/70 p-4">
            <Phone className="h-5 w-5 text-basil" aria-hidden="true" />
            <p className="mt-3 text-sm font-semibold text-ink">Accueil</p>
            <p className="mt-1 text-sm leading-6 text-ink/58">Les nouvelles demandes API arrivent au statut pending dans le backend.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
