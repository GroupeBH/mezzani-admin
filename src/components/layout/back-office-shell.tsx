"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  BarChart3,
  Bell,
  Building2,
  CalendarDays,
  ChevronDown,
  ClipboardList,
  HelpCircle,
  LayoutDashboard,
  Loader2,
  LogOut,
  Menu as MenuIcon,
  Monitor,
  Package,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Receipt,
  Search,
  Settings,
  Store,
  Users,
  UserRoundCog,
  UtensilsCrossed,
  WalletCards,
} from "lucide-react";
import {
  clearAuthSession,
  clearStoredAuthSession,
  isAccountSession,
  type AuthSession,
} from "@/lib/features/auth-slice";
import { setSelectedRestaurantId, setSidebarCollapsed } from "@/lib/features/app-slice";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { useActiveRestaurant } from "@/lib/hooks/use-active-restaurant";
import { offlineQueueEventName, readOfflineQueue } from "@/lib/offline-queue";
import { mezaniApi } from "@/lib/services/mezani-api";
import { cn, initials } from "@/lib/utils";
import { AuthScreen } from "@/components/auth/auth-screen";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/ui/status-pill";

const navItems = [
  { href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/establishments", label: "Établissements", icon: Building2 },
  { href: "/subscription", label: "Forfait", icon: WalletCards },
  { href: "/restaurant", label: "Mon etablissement", icon: Store },
  { href: "/menu", label: "Menu & Produits", icon: UtensilsCrossed },
  { href: "/stock", label: "Stocks & Inventaire", icon: Package, badge: "2" },
  { href: "/reservations", label: "Reservations", icon: CalendarDays },
  { href: "/operations", label: "Commandes", icon: ClipboardList, badge: "4" },
  { href: "/pos", label: "POS", icon: Monitor },
  { href: "/billing", label: "Facturation", icon: Receipt },
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/reports", label: "Rapports", icon: BarChart3 },
  { href: "/staff", label: "Personnel", icon: UserRoundCog },
  { href: "/settings", label: "Parametres", icon: Settings },
];

export function BackOfficeShell({ children }: { children: React.ReactNode }) {
  const { hydrated, session } = useAppSelector((state) => state.auth);

  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center gap-2 bg-surface text-sm font-medium text-text-secondary">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        Chargement
      </div>
    );
  }

  if (!session) {
    return <AuthScreen />;
  }

  return <BackOfficeWorkspace session={session}>{children}</BackOfficeWorkspace>;
}

function BackOfficeWorkspace({
  children,
  session,
}: {
  children: React.ReactNode;
  session: AuthSession;
}) {
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const sidebarCollapsed = useAppSelector((state) => state.app.sidebarCollapsed);
  const {
    activeEstablishment,
    establishments,
    setActiveEstablishment,
    canCreateEstablishment,
    subscription,
    restaurant: selectedRestaurant,
    restaurantsQuery,
  } = useActiveRestaurant();
  const { isFetching, isError } = restaurantsQuery;
  const [network, setNetwork] = useState({ online: true, pending: 0 });
  const accountSession = isAccountSession(session) ? session : null;
  const legacySession = !isAccountSession(session) ? session : null;
  const firstName = accountSession?.user.first_name ?? legacySession?.staff.first_name ?? "";
  const lastName = accountSession?.user.last_name ?? legacySession?.staff.last_name ?? "";
  const staffName =
    `${firstName} ${lastName}`.trim() ||
    accountSession?.user.username ||
    accountSession?.user.phone ||
    legacySession?.staff.username ||
    legacySession?.staff.phone ||
    "Compte MEZANI";
  const staffDetail = accountSession
    ? accountSession.organization_membership.role
    : legacySession?.staff.position ?? legacySession?.staff.username ?? legacySession?.staff.phone ?? "Compte MEZANI";
  const activeEstablishmentId = activeEstablishment?.id ?? null;

  useEffect(() => {
    const refresh = () =>
      setNetwork({
        online: navigator.onLine,
        pending: readOfflineQueue().filter((entry) => entry.restaurantId === activeEstablishmentId).length,
      });
    refresh();
    window.addEventListener("online", refresh);
    window.addEventListener("offline", refresh);
    window.addEventListener(offlineQueueEventName(), refresh);
    return () => {
      window.removeEventListener("online", refresh);
      window.removeEventListener("offline", refresh);
      window.removeEventListener(offlineQueueEventName(), refresh);
    };
  }, [activeEstablishmentId]);

  function onLogout() {
    clearStoredAuthSession();
    dispatch(clearAuthSession());
    dispatch(setSelectedRestaurantId(null));
    dispatch(mezaniApi.util.resetApiState());
    window.localStorage.removeItem("mezani.active-establishment.v1");
  }

  if (
    accountSession &&
    !restaurantsQuery.isLoading &&
    establishments.length === 0 &&
    !pathname.startsWith("/establishments/new") &&
    !pathname.startsWith("/onboarding/establishment") &&
    !pathname.startsWith("/subscription")
  ) {
    return (
      <div className="grid min-h-screen place-items-center bg-surface px-5">
        <div className="w-full max-w-xl border-l-4 border-info bg-surface-elevated px-6 py-8 shadow-line">
          <p className="text-xs font-semibold uppercase tracking-wide text-info">
            {canCreateEstablishment ? "Forfait activé" : "Activation requise"}
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-primary">
            {canCreateEstablishment ? "Créez votre premier établissement" : "Activez votre capacité d’établissement"}
          </h1>
          <p className="mt-3 max-w-lg text-sm leading-6 text-text-secondary">
            {canCreateEstablishment
              ? "Votre clé a activé le forfait. Renseignez maintenant la localisation, les devises et les opérations du premier site."
              : "Choisissez un forfait, effectuez le paiement puis saisissez la clé envoyée par MEZANI pour débloquer la création."}
          </p>
          {canCreateEstablishment ? (
            <Link className="mt-6 inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-white" href="/establishments/new">
              <Plus className="h-4 w-4" aria-hidden="true" />
              Créer l’établissement
            </Link>
          ) : (
            <div className="mt-5">
              <Link className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-white" href="/subscription">
                <WalletCards className="h-4 w-4" aria-hidden="true" />
                Choisir ou activer un forfait
              </Link>
              <p className="mt-3 text-xs text-text-secondary">Statut actuel : {subscription?.status ?? "non activé"}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen lg:flex">
      <aside
        className={cn(
          "sticky top-0 z-30 border-b border-border bg-surface-elevated lg:h-screen lg:border-b-0 lg:border-r",
          sidebarCollapsed ? "lg:w-16" : "lg:w-60",
        )}
      >
        <div className="flex h-16 items-center justify-between gap-3 border-b border-border px-4">
          <Link href="/dashboard" className="flex min-w-0 items-center gap-3" aria-label="MEZANI Admin">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-primary text-xs font-bold text-white">
              MZ
            </span>
            <span className={cn("min-w-0", sidebarCollapsed && "lg:hidden")}>
              <span className="block truncate text-sm font-bold text-primary">MEZANI Admin</span>
              <span className="block truncate text-xs text-text-secondary">Restauration</span>
            </span>
          </Link>
          <Button
            className="hidden h-9 w-9 px-0 lg:inline-flex"
            variant="ghost"
            title={sidebarCollapsed ? "Ouvrir la navigation" : "Reduire la navigation"}
            onClick={() => dispatch(setSidebarCollapsed(!sidebarCollapsed))}
          >
            {sidebarCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </Button>
        </div>

        <nav className="flex gap-1 overflow-x-auto px-3 py-3 lg:block lg:space-y-1 lg:overflow-visible">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                className={cn(
                  "flex h-10 shrink-0 items-center gap-3 rounded-md px-3 text-sm font-medium transition duration-100",
                  active
                    ? "bg-primary text-white"
                    : "text-text-secondary hover:bg-surface hover:text-primary",
                  sidebarCollapsed && "lg:justify-center lg:px-0",
                )}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span className={cn("min-w-0 flex-1 truncate", sidebarCollapsed && "lg:hidden")}>{item.label}</span>
                {"badge" in item && item.badge ? (
                  <span
                    className={cn(
                      "grid h-5 min-w-5 place-items-center rounded-full px-1.5 text-[11px] font-semibold",
                      active ? "bg-primary-inverse/20 text-white" : "bg-info-light text-info",
                      sidebarCollapsed && "lg:hidden",
                    )}
                  >
                    {item.badge}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className={cn("hidden px-3 lg:block", sidebarCollapsed && "lg:hidden")}>
          <div className="border-t border-border py-3">
            <p className="px-3 text-xs font-semibold uppercase text-text-disabled">Raccourcis</p>
            <div className="mt-2 grid gap-2">
              <Link href="/pos" className="flex h-9 items-center justify-between rounded-md bg-success-light px-3 text-sm font-semibold text-emerald-700">
                Nouvelle commande
                <span className="font-mono text-xs">N</span>
              </Link>
              <Link href="/reservations" className="flex h-9 items-center justify-between rounded-md bg-warning-light px-3 text-sm font-semibold text-amber-700">
                Nouvelle reservation
                <span className="font-mono text-xs">R</span>
              </Link>
            </div>
          </div>
          <div className="border-t border-border py-3">
            <p className="px-3 text-xs font-semibold uppercase text-text-disabled">Alertes</p>
            <div className="mt-2 space-y-2 px-3 text-xs text-text-secondary">
              <div className="flex items-center justify-between">
                <span>Stocks critiques</span>
                <span className="rounded-full bg-danger-light px-2 py-0.5 font-semibold text-danger">2</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Reservations attente</span>
                <span className="rounded-full bg-warning-light px-2 py-0.5 font-semibold text-amber-700">1</span>
              </div>
            </div>
          </div>
        </div>

        <div className={cn("absolute bottom-0 hidden w-full border-t border-border p-3 text-xs text-text-disabled lg:block", sidebarCollapsed && "lg:hidden")}>
          Version 0.1 - Support
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 border-b border-border bg-surface">
          <div className="flex min-h-16 flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:justify-between lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <MenuIcon className="h-5 w-5 text-text-secondary lg:hidden" aria-hidden="true" />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-primary">
                  {selectedRestaurant?.name ?? "Aucun etablissement"}
                </p>
                <p className="truncate text-xs text-text-secondary">
                  {selectedRestaurant
                    ? `${selectedRestaurant.address.city}, ${selectedRestaurant.address.country}`
                    : "Backend en attente"}
                </p>
              </div>
            </div>

            <div className="flex min-w-0 flex-1 items-center justify-end gap-3">
              <label className="relative hidden w-full max-w-80 lg:block">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-disabled" aria-hidden="true" />
                <input
                  className="h-10 w-full rounded-full border border-border bg-surface-elevated pl-9 pr-14 text-sm text-primary outline-none transition placeholder:text-text-disabled focus:border-info focus:shadow-focus"
                  placeholder="Recherche globale"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 rounded border border-border bg-surface px-1.5 py-0.5 font-mono text-[11px] text-text-disabled">
                  Cmd K
                </span>
              </label>
              <StatusPill tone={!network.online || isError ? "danger" : isFetching || network.pending > 0 ? "warn" : "ok"}>
                {!network.online
                  ? `Hors ligne${network.pending ? ` · ${network.pending} en attente` : ""}`
                  : isError
                    ? "API indisponible"
                    : network.pending > 0
                      ? `${network.pending} a synchroniser`
                      : isFetching
                        ? "Synchronisation"
                        : "Synchronise"}
              </StatusPill>
              <div className="hidden h-10 items-center gap-2 rounded-md border border-border bg-surface px-3 text-sm text-primary lg:flex">
                {activeEstablishment?.logo_url ? (
                  <span
                    className="h-5 w-5 shrink-0 rounded bg-cover bg-center"
                    style={{ backgroundImage: `url(${activeEstablishment.logo_url})` }}
                    role="img"
                    aria-label={`Logo de ${activeEstablishment.name}`}
                  />
                ) : (
                  <Store className="h-4 w-4 text-text-secondary" aria-hidden="true" />
                )}
                {establishments.length > 1 ? (
                  <select
                    className="max-w-52 bg-transparent pr-2 text-sm font-medium outline-none"
                    aria-label="Établissement actif"
                    value={activeEstablishment?.id ?? ""}
                    onChange={(event) => setActiveEstablishment(event.target.value)}
                  >
                    {establishments.map((item) => (
                      <option key={item.id} value={item.id}>{item.name}</option>
                    ))}
                  </select>
                ) : (
                  <span className="max-w-48 truncate">{selectedRestaurant?.name ?? "Aucun établissement"}</span>
                )}
              </div>
              <Link className="hidden h-9 items-center rounded-md px-2 text-xs font-semibold text-text-secondary hover:bg-surface-pressed hover:text-primary xl:flex" href="/establishments">
                Gérer
              </Link>
              {canCreateEstablishment ? (
                <Link className="hidden h-9 items-center gap-1.5 rounded-md px-2 text-xs font-semibold text-info hover:bg-info-light lg:flex" href="/establishments/new">
                  <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                  Ajouter
                </Link>
              ) : null}
              <button className="relative grid h-9 w-9 shrink-0 place-items-center rounded-md text-text-secondary hover:bg-surface-pressed hover:text-primary" title="Notifications">
                <Bell className="h-4 w-4" aria-hidden="true" />
                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-danger" />
              </button>
              <button className="grid h-9 w-9 shrink-0 place-items-center rounded-md text-text-secondary hover:bg-surface-pressed hover:text-primary" title="Aide">
                <HelpCircle className="h-4 w-4" aria-hidden="true" />
              </button>
              <div className="hidden h-9 shrink-0 items-center gap-2 rounded-md border border-border bg-surface px-2 text-sm font-medium text-primary sm:flex">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-primary text-[10px] font-bold text-white">
                  {initials(firstName, lastName)}
                </span>
                <span className="max-w-32 truncate">{staffName}</span>
                <ChevronDown className="h-4 w-4 text-text-disabled" aria-hidden="true" />
              </div>
              <button
                className="grid h-9 w-9 shrink-0 place-items-center rounded-md text-text-secondary hover:bg-surface-pressed hover:text-primary"
                title={`Deconnexion - ${staffDetail}`}
                onClick={onLogout}
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1680px] px-4 py-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
