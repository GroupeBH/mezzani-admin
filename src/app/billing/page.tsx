"use client";

import { FormEvent, useState } from "react";
import { Banknote, CreditCard, FileText, SplitSquareHorizontal } from "lucide-react";
import { invoices } from "@/lib/data/mock";
import { useProcessPaymentMutation } from "@/lib/services/mezani-api";
import { currency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Field, Select } from "@/components/ui/data-state";
import { PageHeading } from "@/components/ui/page-heading";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { StatusPill } from "@/components/ui/status-pill";

export default function BillingPage() {
  const [orderId, setOrderId] = useState("order_demo_101");
  const [amount, setAmount] = useState(38.5);
  const [paymentMethod, setPaymentMethod] = useState("mobile_money");
  const [processPayment, paymentState] = useProcessPaymentMutation();

  async function submitPayment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      await processPayment({
        order_id: orderId,
        amount,
        payment_method: paymentMethod,
        transaction_details: { source: "backoffice" },
      }).unwrap();
    } catch {
      // The mutation state renders feedback below the form.
    }
  }

  return (
    <div>
      <PageHeading
        eyebrow="Encaissement"
        title="Facturation et paiements"
        action={
          <Button variant="primary">
            <FileText className="h-4 w-4" aria-hidden="true" />
            Facture
          </Button>
        }
      >
        Apercu des additions, division de paiement et envoi vers le point d'entree paiement de l'API.
      </PageHeading>

      <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <Panel>
          <PanelHeader title="Factures recentes" />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left">
              <thead>
                <tr className="border-b border-ink/8 text-xs uppercase text-ink/45">
                  <th className="px-4 py-3">Facture</th>
                  <th className="px-4 py-3">Client</th>
                  <th className="px-4 py-3">Montant</th>
                  <th className="px-4 py-3">Methode</th>
                  <th className="px-4 py-3">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/8">
                {invoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <td className="px-4 py-4 font-medium text-ink">{invoice.id}</td>
                    <td className="px-4 py-4 text-sm text-ink/62">{invoice.customer}</td>
                    <td className="px-4 py-4 text-sm font-semibold text-ink">{currency(invoice.amount)}</td>
                    <td className="px-4 py-4 text-sm text-ink/62">{invoice.method}</td>
                    <td className="px-4 py-4">
                      <StatusPill tone={invoice.status === "Payee" ? "ok" : "warn"}>{invoice.status}</StatusPill>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <div className="space-y-5">
          <Panel>
            <PanelHeader title="Paiement API" eyebrow="POST /payments/process" />
            <form className="grid gap-3 p-4" onSubmit={submitPayment}>
              <Field value={orderId} onChange={(event) => setOrderId(event.target.value)} placeholder="order_id" />
              <Field
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(event) => setAmount(Number(event.target.value))}
                placeholder="Montant"
              />
              <Select value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)}>
                <option value="mobile_money">Mobile Money</option>
                <option value="card">Carte</option>
                <option value="cash">Especes</option>
              </Select>
              <Button variant="primary" disabled={paymentState.isLoading}>
                <CreditCard className="h-4 w-4" aria-hidden="true" />
                {paymentState.isLoading ? "Traitement" : "Traiter paiement"}
              </Button>
              {paymentState.isSuccess ? <p className="text-sm font-medium text-basil">Paiement accepte.</p> : null}
              {paymentState.isError ? <p className="text-sm font-medium text-wine">Paiement refuse par l'API.</p> : null}
            </form>
          </Panel>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <div className="rounded-lg border border-ink/10 bg-white/72 p-4">
              <SplitSquareHorizontal className="h-5 w-5 text-basil" aria-hidden="true" />
              <p className="mt-3 text-sm font-semibold text-ink">Division addition</p>
              <p className="mt-1 text-sm leading-6 text-ink/58">Par montant equitable ou par article selectionne.</p>
            </div>
            <div className="rounded-lg border border-ink/10 bg-white/72 p-4">
              <Banknote className="h-5 w-5 text-clay" aria-hidden="true" />
              <p className="mt-3 text-sm font-semibold text-ink">Rapprochement</p>
              <p className="mt-1 text-sm leading-6 text-ink/58">Carte, especes et Mobile Money dans une file unique.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
