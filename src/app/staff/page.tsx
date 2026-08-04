"use client";

import { FormEvent, useState } from "react";
import { ShieldCheck, Trash2, UserPlus } from "lucide-react";
import { useActiveRestaurant } from "@/lib/hooks/use-active-restaurant";
import {
  useAddEstablishmentMemberMutation,
  useListEstablishmentMembersQuery,
  useRemoveEstablishmentMemberMutation,
  useUpdateEstablishmentMemberMutation,
} from "@/lib/services/mezani-api";
import type { EstablishmentRole } from "@/lib/types";
import { initials } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState, Field, LoadingState, Select } from "@/components/ui/data-state";
import { PageHeading } from "@/components/ui/page-heading";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { StatusPill } from "@/components/ui/status-pill";

const roles: EstablishmentRole[] = [
  "MANAGER", "CASHIER", "WAITER", "BARTENDER", "KITCHEN", "STOREKEEPER", "ACCOUNTANT",
];

const emptyForm = { first_name: "", last_name: "", email: "", phone: "", role: "WAITER" as EstablishmentRole };

export default function StaffPage() {
  const { activeEstablishment, activeEstablishmentId } = useActiveRestaurant();
  const query = useListEstablishmentMembersQuery(activeEstablishmentId ?? "", { skip: !activeEstablishmentId });
  const [addMember, addState] = useAddEstablishmentMemberMutation();
  const [updateMember, updateState] = useUpdateEstablishmentMemberMutation();
  const [removeMember, removeState] = useRemoveEstablishmentMemberMutation();
  const [form, setForm] = useState(emptyForm);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activeEstablishmentId || (!form.email.trim() && !form.phone.trim())) return;
    try {
      await addMember({
        establishmentId: activeEstablishmentId,
        body: {
          first_name: form.first_name.trim(), last_name: form.last_name.trim(),
          email: form.email.trim() || undefined, phone: form.phone.trim() || undefined, role: form.role,
        },
      }).unwrap();
      setForm({ ...emptyForm, role: form.role });
    } catch {
      // The mutation state renders the authorization or validation error.
    }
  }

  const canInvite = activeEstablishment?.permissions?.includes("member:create") ?? false;
  const canUpdate = activeEstablishment?.permissions?.includes("member:update") ?? false;
  const canRemove = activeEstablishment?.permissions?.includes("member:remove") ?? false;

  async function changeMember(memberId: string, body: { role?: EstablishmentRole; status?: "ACTIVE" | "SUSPENDED" }) {
    if (!activeEstablishmentId) return;
    try {
      await updateMember({ establishmentId: activeEstablishmentId, membershipId: memberId, body }).unwrap();
    } catch {
      // The mutation state below exposes the backend refusal without optimistic drift.
    }
  }

  async function remove(memberId: string) {
    if (!activeEstablishmentId) return;
    try {
      await removeMember({ establishmentId: activeEstablishmentId, membershipId: memberId }).unwrap();
    } catch {
      // The backend remains authoritative, notably for the OWNER membership.
    }
  }

  return (
    <div>
      <PageHeading eyebrow="Accès établissement" title="Personnel et permissions">
        Chaque personne ne voit que les établissements auxquels une adhésion active la rattache.
      </PageHeading>
      <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <Panel>
          <PanelHeader title="Équipe" eyebrow={activeEstablishment?.name} action={<StatusPill tone="info">{query.data?.members.length ?? 0} membres</StatusPill>} />
          {query.isLoading ? <LoadingState /> : null}
          {query.isError ? <ErrorState detail="La liste est indisponible ou votre rôle ne possède pas member:read." /> : null}
          {!query.isLoading && (query.data?.members.length ?? 0) === 0 ? <EmptyState title="Aucun membre" /> : null}
          <div className="divide-y divide-border">
            {(query.data?.members ?? []).map((member) => (
              <div key={member.id} className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-primary text-xs font-semibold text-white">{initials(member.user.first_name, member.user.last_name)}</span>
                  <div className="min-w-0"><p className="truncate text-sm font-semibold text-primary">{member.user.first_name} {member.user.last_name}</p><p className="truncate text-xs text-text-secondary">{member.user.email || member.user.phone || member.user_id}</p></div>
                </div>
                <div className="flex flex-wrap items-center justify-end gap-2">
                  {canUpdate && member.role !== "OWNER" ? (
                    <Select
                      aria-label={`Rôle de ${member.user.first_name} ${member.user.last_name}`}
                      className="h-9 w-auto min-w-32"
                      disabled={updateState.isLoading}
                      value={member.role}
                      onChange={(event) => void changeMember(member.id, { role: event.target.value as EstablishmentRole })}
                    >
                      {roles.map((role) => <option key={role} value={role}>{role}</option>)}
                    </Select>
                  ) : (
                    <StatusPill tone="info">{member.role}</StatusPill>
                  )}
                  {canUpdate && member.role !== "OWNER" ? (
                    <Button
                      className="h-9 px-2 text-xs"
                      disabled={updateState.isLoading}
                      onClick={() => void changeMember(member.id, { status: member.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE" })}
                    >
                      {member.status === "ACTIVE" ? "Suspendre" : "Réactiver"}
                    </Button>
                  ) : (
                    <StatusPill tone={member.status === "ACTIVE" ? "ok" : "neutral"}>{member.status}</StatusPill>
                  )}
                  {canRemove && member.role !== "OWNER" ? (
                    <Button
                      className="h-9 w-9 px-0"
                      disabled={removeState.isLoading}
                      title="Retirer ce membre"
                      onClick={() => void remove(member.id)}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
          {updateState.isError || removeState.isError ? <p className="px-4 pb-4 text-sm font-medium text-danger">La modification du membre a été refusée par l’API.</p> : null}
        </Panel>

        <Panel>
          <PanelHeader title="Inviter un membre" eyebrow="Adhésion vérifiée par le backend" />
          {canInvite ? (
            <form className="grid gap-3 p-5" onSubmit={submit}>
              <div className="grid grid-cols-2 gap-3"><Field placeholder="Prénom" value={form.first_name} onChange={(event) => setForm((current) => ({ ...current, first_name: event.target.value }))} /><Field placeholder="Nom" value={form.last_name} onChange={(event) => setForm((current) => ({ ...current, last_name: event.target.value }))} /></div>
              <Field placeholder="email@exemple.com" type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} />
              <Field placeholder="+243…" value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} />
              <Select value={form.role} onChange={(event) => setForm((current) => ({ ...current, role: event.target.value as EstablishmentRole }))}>{roles.map((role) => <option key={role} value={role}>{role}</option>)}</Select>
              <Button disabled={addState.isLoading} type="submit" variant="primary"><UserPlus className="h-4 w-4" />{addState.isLoading ? "Invitation…" : "Créer l’adhésion"}</Button>
              {addState.isSuccess ? <p className="text-sm font-medium text-success">Membre ajouté à cet établissement uniquement.</p> : null}
              {addState.isError ? <p className="text-sm font-medium text-danger">Invitation refusée par l’API.</p> : null}
            </form>
          ) : (
            <div className="p-5"><ShieldCheck className="h-5 w-5 text-text-disabled" /><p className="mt-3 text-sm text-text-secondary">Votre rôle ne possède pas la permission `member:create`.</p></div>
          )}
        </Panel>
      </div>
    </div>
  );
}
