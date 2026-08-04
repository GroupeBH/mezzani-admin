"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Archive, Save } from "lucide-react";
import {
  useArchiveEstablishmentMutation,
  useGetEstablishmentQuery,
  useUpdateEstablishmentMutation,
} from "@/lib/services/mezani-api";
import { Button } from "@/components/ui/button";
import { ErrorState, Field, LoadingState, Select } from "@/components/ui/data-state";
import { PageHeading } from "@/components/ui/page-heading";
import { Panel, PanelHeader } from "@/components/ui/panel";

export default function EditEstablishmentPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const query = useGetEstablishmentQuery(params.id);
  const [update, updateState] = useUpdateEstablishmentMutation();
  const [archive, archiveState] = useArchiveEstablishmentMutation();
  const [form, setForm] = useState({ name: "", phone: "", email: "", address: "", commune: "", district: "", city: "", country: "", timezone: "Africa/Kinshasa" });
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!query.data) return;
    setForm({
      name: query.data.name,
      phone: query.data.phone ?? "",
      email: query.data.email ?? "",
      address: query.data.address ?? "",
      commune: query.data.commune ?? "",
      district: query.data.district ?? "",
      city: query.data.city,
      country: query.data.country,
      timezone: query.data.timezone,
    });
  }, [query.data]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    try {
      await update({ id: params.id, body: form }).unwrap();
      setMessage("Établissement mis à jour.");
    } catch {
      setMessage("La mise à jour a échoué.");
    }
  }

  async function onArchive() {
    if (!window.confirm("Archiver cet établissement ? Les données seront conservées.")) return;
    try {
      await archive(params.id).unwrap();
      router.push("/establishments");
    } catch {
      setMessage("L’archivage a échoué.");
    }
  }

  if (query.isLoading) return <LoadingState label="Chargement de l’établissement" />;
  if (query.isError || !query.data) return <ErrorState detail="Établissement introuvable ou non autorisé." />;

  return (
    <form onSubmit={submit}>
      <PageHeading eyebrow="Établissement" title={`Modifier ${query.data.name}`} action={<><Button disabled={updateState.isLoading} type="submit" variant="primary"><Save className="h-4 w-4" />Enregistrer</Button>{query.data.permissions?.includes("establishment:archive") ? <Button disabled={archiveState.isLoading} onClick={onArchive} type="button" variant="danger"><Archive className="h-4 w-4" />Archiver</Button> : null}</>}>
        Les commandes et paiements restent conservés lors d’un archivage.
      </PageHeading>
      <div className="grid gap-5 lg:grid-cols-2">
        <Panel><PanelHeader title="Identité" /><div className="grid gap-3 p-5"><Field value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} required /><Field value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} placeholder="Téléphone" /><Field value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} placeholder="Email" type="email" /></div></Panel>
        <Panel><PanelHeader title="Localisation" /><div className="grid gap-3 p-5"><Field value={form.address} onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))} placeholder="Adresse" /><div className="grid grid-cols-2 gap-3"><Field value={form.commune} onChange={(event) => setForm((current) => ({ ...current, commune: event.target.value }))} placeholder="Commune" /><Field value={form.district} onChange={(event) => setForm((current) => ({ ...current, district: event.target.value }))} placeholder="Quartier" /></div><div className="grid grid-cols-2 gap-3"><Field value={form.city} onChange={(event) => setForm((current) => ({ ...current, city: event.target.value }))} placeholder="Ville" /><Field value={form.country} onChange={(event) => setForm((current) => ({ ...current, country: event.target.value }))} placeholder="Pays" /></div><Select value={form.timezone} onChange={(event) => setForm((current) => ({ ...current, timezone: event.target.value }))}><option value="Africa/Kinshasa">Africa/Kinshasa</option><option value="Africa/Lubumbashi">Africa/Lubumbashi</option></Select></div></Panel>
      </div>
      {message ? <p className={`mt-4 text-sm font-medium ${message.includes("échoué") ? "text-danger" : "text-success"}`}>{message}</p> : null}
    </form>
  );
}
