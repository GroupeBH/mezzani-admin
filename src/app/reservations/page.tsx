"use client";

import { FormEvent, useState } from "react";
import { CalendarPlus, Move, Phone, Users } from "lucide-react";
import { floorTables } from "@/lib/data/mock";
import { useActiveRestaurant } from "@/lib/hooks/use-active-restaurant";
import { useCreateBookingMutation, useListBookingsQuery, useUpdateBookingStatusMutation } from "@/lib/services/mezani-api";
import type { BookingRecord, GuestDetails } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState, Field, LoadingState, Select } from "@/components/ui/data-state";
import { PageHeading } from "@/components/ui/page-heading";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { StatusPill } from "@/components/ui/status-pill";

const defaultGuest: GuestDetails = {
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
};

function kinshasaDate() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Kinshasa",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export default function ReservationsPage() {
  const { restaurant } = useActiveRestaurant();
  const restaurantId = restaurant?.id ?? "";
  const [guest, setGuest] = useState(defaultGuest);
  const [date, setDate] = useState(kinshasaDate);
  const [time, setTime] = useState("19:30");
  const [guests, setGuests] = useState(4);
  const [tableNumber, setTableNumber] = useState("T1");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [createBooking, createState] = useCreateBookingMutation();
  const [updateBookingStatus, updateState] = useUpdateBookingStatusMutation();
  const bookingsQuery = useListBookingsQuery(restaurantId, { skip: !restaurantId, pollingInterval: 30_000 });
  const bookings = (bookingsQuery.data?.bookings ?? [])
    .filter((booking) => booking.date === date)
    .sort((left, right) => left.time.localeCompare(right.time));

  async function submitBooking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!restaurantId) {
      return;
    }

    setFeedback(null);
    try {
      await createBooking({
        restaurantId,
        body: {
          date,
          time,
          table_number: tableNumber,
          number_of_guests: guests,
          guest_details: guest,
        },
      }).unwrap();
      setGuest(defaultGuest);
      setFeedback("Reservation ajoutee au planning.");
    } catch {
      setFeedback("Reservation refusee : cette table est peut-etre deja prise a cette heure.");
    }
  }

  async function changeStatus(booking: BookingRecord, status: "confirmed" | "seated" | "completed" | "cancelled") {
    setFeedback(null);
    try {
      await updateBookingStatus({ restaurantId, bookingId: booking.booking_id, status }).unwrap();
      setFeedback("Statut de la reservation mis a jour.");
    } catch {
      setFeedback("Ce changement de statut n'est pas autorise.");
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
            <div className="relative min-h-[520px] overflow-hidden rounded-lg border border-border bg-[linear-gradient(90deg,rgba(15,23,42,0.05)_1px,transparent_1px),linear-gradient(180deg,rgba(15,23,42,0.05)_1px,transparent_1px)] bg-[size:42px_42px]">
              <div className="absolute left-[6%] top-[8%] h-[84%] w-[5px] rounded-full bg-ink/18" />
              <div className="absolute bottom-[10%] left-[8%] right-[8%] h-[5px] rounded-full bg-ink/18" />
              {floorTables.map((table) => {
                const state = tableOperationalState(table.id, bookings);
                return (
                <button
                  type="button"
                  key={table.id}
                  className={`absolute grid h-24 w-24 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border text-center shadow-lift transition hover:scale-105 focus-visible:focus-ring ${tableNumber === table.id ? "border-ink ring-4 ring-info/25" : "border-white/80"}`}
                  style={{
                    left: `${table.x}%`,
                    top: `${table.y}%`,
                    background: state === "Libre"
                        ? "rgba(16,185,129,0.95)"
                        : state === "Reservee"
                          ? "rgba(245,158,11,0.95)"
                          : "rgba(239,68,68,0.95)",
                  }}
                  onClick={() => setTableNumber(table.id)}
                >
                  <span className="text-sm font-semibold text-white">{table.id}</span>
                  <span className="text-xs text-white/78">{table.seats} places · {state}</span>
                </button>
                );
              })}
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
              <div className="grid grid-cols-2 gap-3">
                <Select value={guests} onChange={(event) => setGuests(Number(event.target.value))}>
                  {[1, 2, 3, 4, 5, 6, 8, 10, 12].map((value) => (
                    <option key={value} value={value}>{value} couverts</option>
                  ))}
                </Select>
                <Select value={tableNumber} onChange={(event) => setTableNumber(event.target.value)}>
                  {floorTables.map((table) => <option key={table.id} value={table.id}>{table.id} · {table.seats} places</option>)}
                </Select>
              </div>
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
                placeholder="Email (facultatif)"
                value={guest.email}
                onChange={(event) => setGuest((current) => ({ ...current, email: event.target.value }))}
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
              {feedback ? <p className={`text-sm font-medium ${createState.isError || updateState.isError ? "text-danger" : "text-success"}`}>{feedback}</p> : null}
            </form>
          </Panel>

          <Panel>
            <PanelHeader title={`Planning du ${date}`} />
            <div className="divide-y divide-border">
              {bookingsQuery.isLoading ? <div className="p-4"><LoadingState label="Chargement des reservations" /></div> : null}
              {bookingsQuery.isError ? <div className="p-4"><ErrorState detail="Le planning n'est pas accessible pour ce role." /></div> : null}
              {!bookingsQuery.isLoading && !bookingsQuery.isError && bookings.length === 0 ? (
                <div className="p-4"><EmptyState title="Aucune reservation" detail="Les demandes du jour apparaitront ici." /></div>
              ) : null}
              {bookings.map((booking) => (
                <div key={booking.booking_id} className="flex items-center justify-between gap-3 px-4 py-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-md bg-ink/6 text-ink">
                      <Users className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-ink">{booking.time} - {booking.guest_name}</p>
                      <p className="text-xs text-ink/55">{booking.number_of_guests} couverts · {booking.table_number || "Table a attribuer"} · {booking.guest_phone}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center justify-end gap-1.5">
                    <StatusPill tone={bookingTone(booking.status)}>{bookingStatusLabel(booking.status)}</StatusPill>
                    {bookingActions(booking.status).map((action) => (
                      <Button key={action.status} className="h-7 px-2 text-xs" variant={action.status === "cancelled" ? "danger" : "secondary"} disabled={updateState.isLoading} onClick={() => changeStatus(booking, action.status)}>{action.label}</Button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <div className="rounded-lg border border-border bg-surface p-4 shadow-line">
            <Phone className="h-5 w-5 text-info" aria-hidden="true" />
            <p className="mt-3 text-sm font-semibold text-ink">Accueil</p>
            <p className="mt-1 text-sm leading-6 text-ink/58">Les nouvelles demandes API arrivent au statut pending dans le backend.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function tableOperationalState(tableNumber: string, bookings: BookingRecord[]) {
  const statuses = bookings.filter((booking) => booking.table_number === tableNumber).map((booking) => booking.status);
  if (statuses.includes("seated")) return "Occupee";
  if (statuses.some((status) => status === "pending" || status === "confirmed")) return "Reservee";
  return "Libre";
}

function bookingStatusLabel(status: string) {
  return ({ pending: "En attente", confirmed: "Confirmee", seated: "Installee", completed: "Terminee", cancelled: "Annulee" } as Record<string, string>)[status] ?? status;
}

function bookingTone(status: string): "ok" | "warn" | "danger" | "neutral" | "info" {
  if (status === "confirmed") return "ok";
  if (status === "pending") return "warn";
  if (status === "seated") return "info";
  if (status === "cancelled") return "danger";
  return "neutral";
}

function bookingActions(status: string): Array<{ status: "confirmed" | "seated" | "completed" | "cancelled"; label: string }> {
  if (status === "pending") return [{ status: "confirmed", label: "Confirmer" }, { status: "cancelled", label: "Annuler" }];
  if (status === "confirmed") return [{ status: "seated", label: "Installer" }, { status: "cancelled", label: "Annuler" }];
  if (status === "seated") return [{ status: "completed", label: "Terminer" }];
  return [];
}
