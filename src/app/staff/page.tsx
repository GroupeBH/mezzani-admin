"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Mail, ShieldCheck, UserPlus, UsersRound } from "lucide-react";
import { useActiveRestaurant } from "@/lib/hooks/use-active-restaurant";
import {
  useAssignStaffRoleMutation,
  useListRestaurantRolesQuery,
  useListStaffQuery,
} from "@/lib/services/mezani-api";
import { initials } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState, Field, LoadingState, Select } from "@/components/ui/data-state";
import { PageHeading } from "@/components/ui/page-heading";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { StatusPill } from "@/components/ui/status-pill";

const emptyForm = {
  user_id: "",
  role_id: "",
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
};

export default function StaffPage() {
  const { restaurant } = useActiveRestaurant();
  const restaurantId = restaurant?.id ?? "";
  const staffQuery = useListStaffQuery(restaurantId, { skip: !restaurantId });
  const rolesQuery = useListRestaurantRolesQuery(restaurantId, { skip: !restaurantId });
  const [assignStaffRole, assignState] = useAssignStaffRoleMutation();
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (!form.role_id && rolesQuery.data?.roles[0]?.id) {
      setForm((current) => ({ ...current, role_id: rolesQuery.data?.roles[0]?.id ?? "" }));
    }
  }, [form.role_id, rolesQuery.data?.roles]);

  const roleById = useMemo(() => {
    return new Map((rolesQuery.data?.roles ?? []).map((role) => [role.id, role]));
  }, [rolesQuery.data?.roles]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!restaurantId || !form.user_id || !form.role_id || !form.first_name || !form.last_name || !form.email) {
      return;
    }

    await assignStaffRole({ restaurantId, body: form }).unwrap();
    setForm({ ...emptyForm, role_id: form.role_id });
  }

  return (
    <div>
      <PageHeading eyebrow="RBAC" title="Personnel et permissions">
        Gestion des employes, roles systeme et acces operationnels de l'etablissement actif.
      </PageHeading>

      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <Panel>
          <PanelHeader
            title="Equipe"
            eyebrow={restaurant?.name}
            action={
              <StatusPill tone="ok">
                {(staffQuery.data?.staff.length ?? 0).toString()} membres
              </StatusPill>
            }
          />
          {staffQuery.isLoading ? <LoadingState /> : null}
          {staffQuery.isError ? <ErrorState detail="La liste du personnel n'a pas pu etre chargee." /> : null}
          {!staffQuery.isLoading && (staffQuery.data?.staff.length ?? 0) === 0 ? (
            <EmptyState title="Aucun membre" />
          ) : null}

          <div className="divide-y divide-ink/8">
            {(staffQuery.data?.staff ?? []).map((member) => {
              const role = roleById.get(member.role_id);
              return (
                <div key={member.id} className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-ink text-sm font-semibold text-white">
                      {initials(member.first_name, member.last_name)}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-ink">
                        {member.first_name} {member.last_name}
                      </p>
                      <p className="truncate text-xs text-ink/55">{member.email}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusPill tone="info">{role?.name ?? member.role_id}</StatusPill>
                    <StatusPill tone={member.status === "active" ? "ok" : "neutral"}>{member.status}</StatusPill>
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>

        <div className="space-y-5">
          <Panel>
            <PanelHeader title="Assigner un role" eyebrow="Admin API" />
            <form className="grid gap-3 p-4" onSubmit={onSubmit}>
              <Field
                placeholder="user_id"
                value={form.user_id}
                onChange={(event) => setForm((current) => ({ ...current, user_id: event.target.value }))}
                required
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <Field
                  placeholder="Prenom"
                  value={form.first_name}
                  onChange={(event) => setForm((current) => ({ ...current, first_name: event.target.value }))}
                  required
                />
                <Field
                  placeholder="Nom"
                  value={form.last_name}
                  onChange={(event) => setForm((current) => ({ ...current, last_name: event.target.value }))}
                  required
                />
              </div>
              <Field
                type="email"
                placeholder="email@mezani.app"
                value={form.email}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                required
              />
              <Field
                placeholder="+243..."
                value={form.phone}
                onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
              />
              <Select
                value={form.role_id}
                onChange={(event) => setForm((current) => ({ ...current, role_id: event.target.value }))}
                required
              >
                {(rolesQuery.data?.roles ?? []).map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </Select>
              <Button variant="primary" type="submit" disabled={assignState.isLoading || !restaurantId}>
                <UserPlus className="h-4 w-4" aria-hidden="true" />
                {assignState.isLoading ? "Enregistrement" : "Assigner"}
              </Button>
              {assignState.isSuccess ? <p className="text-sm font-medium text-basil">Membre enregistre.</p> : null}
              {assignState.isError ? <p className="text-sm font-medium text-wine">Assignation refusee par l'API.</p> : null}
            </form>
          </Panel>

          <Panel>
            <PanelHeader title="Roles disponibles" />
            <div className="grid gap-3 p-4">
              {(rolesQuery.data?.roles ?? []).map((role) => (
                <div key={role.id} className="rounded-lg border border-ink/8 bg-white/58 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-ink">{role.name}</p>
                      <p className="mt-1 text-xs leading-5 text-ink/55">{role.description}</p>
                    </div>
                    <ShieldCheck className="h-4 w-4 shrink-0 text-basil" aria-hidden="true" />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {role.permissions.slice(0, 4).map((permission) => (
                      <span key={permission} className="rounded-full bg-ink/6 px-2 py-1 text-xs text-ink/58">
                        {permission}
                      </span>
                    ))}
                    {role.permissions.length > 4 ? (
                      <span className="rounded-full bg-ink/6 px-2 py-1 text-xs text-ink/58">
                        +{role.permissions.length - 4}
                      </span>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-ink/10 bg-white/70 p-4">
              <UsersRound className="h-5 w-5 text-basil" aria-hidden="true" />
              <p className="mt-3 text-sm font-medium text-ink">Equipes de service</p>
              <p className="mt-1 text-sm text-ink/55">Serveurs, managers, cuisine et admins.</p>
            </div>
            <div className="rounded-lg border border-ink/10 bg-white/70 p-4">
              <Mail className="h-5 w-5 text-clay" aria-hidden="true" />
              <p className="mt-3 text-sm font-medium text-ink">Identites API</p>
              <p className="mt-1 text-sm text-ink/55">Association par user_id et email.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
