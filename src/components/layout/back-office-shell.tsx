"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  CalendarDays,
  ChefHat,
  ClipboardList,
  CreditCard,
  FileText,
  LayoutDashboard,
  Menu as MenuIcon,
  Package,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Store,
  UserRoundCog,
  Utensils,
} from "lucide-react";
import { setSelectedRestaurantId, setSidebarCollapsed } from "@/lib/features/app-slice";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { useListAdminRestaurantsQuery } from "@/lib/services/mezani-api";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/ui/status-pill";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/restaurants", label: "Restaurants", icon: Store },
  { href: "/operations", label: "Commandes", icon: ClipboardList },
  { href: "/pos", label: "POS", icon: Utensils },
  { href: "/menu", label: "Menu", icon: ChefHat },
  { href: "/stock", label: "Stocks", icon: Package },
  { href: "/reservations", label: "Reservations", icon: CalendarDays },
  { href: "/billing", label: "Facturation", icon: CreditCard },
  { href: "/reports", label: "Rapports", icon: BarChart3 },
  { href: "/staff", label: "Personnel", icon: UserRoundCog },
  { href: "/settings", label: "Parametres", icon: Settings },
];

export function BackOfficeShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const sidebarCollapsed = useAppSelector((state) => state.app.sidebarCollapsed);
  const selectedRestaurantId = useAppSelector((state) => state.app.selectedRestaurantId);
  const { data, isFetching, isError } = useListAdminRestaurantsQuery({});
  const restaurants = data?.restaurants ?? [];
  const selectedRestaurant = restaurants.find((restaurant) => restaurant.id === selectedRestaurantId) ?? restaurants[0];

  return (
    <div className="min-h-screen lg:flex">
      <aside
        className={cn(
          "sticky top-0 z-30 border-b border-ink/10 bg-paper/96 backdrop-blur lg:h-screen lg:border-b-0 lg:border-r",
          sidebarCollapsed ? "lg:w-[88px]" : "lg:w-[276px]",
        )}
      >
        <div className="flex h-16 items-center justify-between gap-3 px-4">
          <Link href="/dashboard" className="flex min-w-0 items-center gap-3" aria-label="MEZANI Admin">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-ink text-sm font-semibold text-white">
              MZ
            </span>
            <span className={cn("min-w-0", sidebarCollapsed && "lg:hidden")}>
              <span className="block truncate text-sm font-semibold text-ink">MEZANI Admin</span>
              <span className="block truncate text-xs text-ink/56">Restauration</span>
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

        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:block lg:space-y-1 lg:overflow-visible lg:pb-0">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                className={cn(
                  "flex h-10 shrink-0 items-center gap-3 rounded-md px-3 text-sm font-medium transition",
                  active
                    ? "bg-ink text-white"
                    : "text-ink/66 hover:bg-white/70 hover:text-ink",
                  sidebarCollapsed && "lg:justify-center lg:px-0",
                )}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span className={cn(sidebarCollapsed && "lg:hidden")}>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 border-b border-ink/10 bg-paper/88 backdrop-blur">
          <div className="flex min-h-16 flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:justify-between lg:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <MenuIcon className="h-5 w-5 text-ink/42 lg:hidden" aria-hidden="true" />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-ink">
                  {selectedRestaurant?.name ?? "Aucun etablissement"}
                </p>
                <p className="truncate text-xs text-ink/56">
                  {selectedRestaurant
                    ? `${selectedRestaurant.address.city}, ${selectedRestaurant.address.country}`
                    : "Backend en attente"}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <StatusPill tone={isError ? "danger" : isFetching ? "warn" : "ok"}>
                {isError ? "API hors ligne" : isFetching ? "Synchronisation" : "API connectee"}
              </StatusPill>
              <select
                className="h-10 min-w-56 rounded-md border border-ink/12 bg-white px-3 text-sm text-ink outline-none focus:border-basil focus:ring-2 focus:ring-basil/20"
                value={selectedRestaurant?.id ?? ""}
                onChange={(event) => dispatch(setSelectedRestaurantId(event.target.value || null))}
              >
                {restaurants.length === 0 ? <option value="">Aucun restaurant</option> : null}
                {restaurants.map((restaurant) => (
                  <option key={restaurant.id} value={restaurant.id}>
                    {restaurant.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1480px] px-4 py-5 lg:px-6">{children}</main>
      </div>
    </div>
  );
}
