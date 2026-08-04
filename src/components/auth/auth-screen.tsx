"use client";

import { FormEvent, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  ArrowRight,
  Building2,
  KeyRound,
  LogIn,
  ShieldCheck,
  Smartphone,
  UserPlus,
} from "lucide-react";
import { saveAuthSession, setAuthSession, type AuthSession } from "@/lib/features/auth-slice";
import { setSelectedRestaurantId } from "@/lib/features/app-slice";
import { activationRegistrationRequest } from "@/lib/establishment-context";
import { useAppDispatch } from "@/lib/hooks";
import {
  useCreateSubscriptionCheckoutMutation,
  useListSubscriptionPlansQuery,
  useLoginAccountMutation,
  useRegisterWithActivationKeyMutation,
  useValidateActivationKeyMutation,
} from "@/lib/services/mezani-api";
import type { SubscriptionCheckout, SubscriptionPlan } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Field, Select } from "@/components/ui/data-state";
import { Panel, PanelHeader } from "@/components/ui/panel";

type AuthMode = "login" | "register";
type RegistrationStep = "payment" | "activation";

const emptyLoginForm = { identifier: "", password: "" };
const emptyRegisterForm = {
  key: "",
  name: "",
  organizationName: "",
  email: "",
  phone: "",
  password: "",
};
const emptyCheckoutForm = { planId: "", email: "", phone: "", paymentMethod: "mpesa" };

const paymentMethods = [
  { value: "mpesa", label: "M-Pesa" },
  { value: "airtel_money", label: "Airtel Money" },
  { value: "orange_money", label: "Orange Money" },
  { value: "bank_transfer", label: "Virement bancaire" },
  { value: "cash", label: "Paiement auprès de MEZANI" },
];

export function AuthScreen() {
  const dispatch = useAppDispatch();
  const pathname = usePathname();
  const [mode, setMode] = useState<AuthMode>(() =>
    pathname.startsWith("/auth/register") || pathname.startsWith("/auth/activate") || pathname.startsWith("/auth/subscribe")
      ? "register"
      : "login",
  );
  const [registrationStep, setRegistrationStep] = useState<RegistrationStep>(() =>
    pathname.startsWith("/auth/activate") ? "activation" : "payment",
  );
  const [loginForm, setLoginForm] = useState(emptyLoginForm);
  const [registerForm, setRegisterForm] = useState(emptyRegisterForm);
  const [checkoutForm, setCheckoutForm] = useState(emptyCheckoutForm);
  const [checkout, setCheckout] = useState<SubscriptionCheckout | null>(null);
  const plansQuery = useListSubscriptionPlansQuery();
  const [loginAccount, loginState] = useLoginAccountMutation();
  const [validateActivationKey, validationState] = useValidateActivationKeyMutation();
  const [registerWithActivationKey, registerState] = useRegisterWithActivationKeyMutation();
  const [createCheckout, checkoutState] = useCreateSubscriptionCheckoutMutation();
  const plans = plansQuery.data?.plans ?? [];

  useEffect(() => {
    if (!checkoutForm.planId && plans.length > 0) {
      setCheckoutForm((current) => ({ ...current, planId: plans[0].id }));
    }
  }, [checkoutForm.planId, plans]);

  function commitSession(session: AuthSession) {
    saveAuthSession(session);
    window.localStorage.removeItem("mezani.active-establishment.v1");
    dispatch(setSelectedRestaurantId(null));
    dispatch(setAuthSession(session));
  }

  async function onLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!loginForm.identifier.trim() || !loginForm.password) return;
    try {
      const session = await loginAccount({
        identifier: loginForm.identifier.trim(),
        password: loginForm.password,
      }).unwrap();
      commitSession(session);
    } catch {
      // The backend message is rendered below the form.
    }
  }

  async function onCheckout(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (
      !checkoutForm.planId ||
      (!checkoutForm.email.trim() && !checkoutForm.phone.trim()) ||
      !checkoutForm.paymentMethod
    ) return;
    try {
      const created = await createCheckout({
        plan_id: checkoutForm.planId,
        email: checkoutForm.email.trim() || undefined,
        phone: checkoutForm.phone.trim() || undefined,
        payment_method: checkoutForm.paymentMethod,
      }).unwrap();
      setCheckout(created);
      setRegisterForm((current) => ({
        ...current,
        email: checkoutForm.email.trim(),
        phone: checkoutForm.phone.trim(),
      }));
      setRegistrationStep("activation");
    } catch {
      // The backend message is rendered below the form.
    }
  }

  async function onRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (
      !registerForm.key.trim() ||
      !registerForm.name.trim() ||
      (!registerForm.email.trim() && !registerForm.phone.trim()) ||
      registerForm.password.length < 8
    ) return;
    try {
      await validateActivationKey({
        key: registerForm.key.trim(),
        email: registerForm.email.trim() || undefined,
        phone: registerForm.phone.trim() || undefined,
      }).unwrap();
      const session = await registerWithActivationKey(
        activationRegistrationRequest(registerForm),
      ).unwrap();
      commitSession(session);
    } catch {
      // Invalid, expired, revoked and already-used keys are rendered below.
    }
  }

  const error =
    mode === "login"
      ? apiErrorMessage(loginState.error, "Connexion refusée.")
      : registrationStep === "payment"
        ? apiErrorMessage(checkoutState.error ?? plansQuery.error, "La demande de paiement n’a pas pu être créée.")
        : apiErrorMessage(
            validationState.error ?? registerState.error,
            "La clé ne permet pas de créer ce compte.",
          );
  const isBusy =
    loginState.isLoading ||
    validationState.isLoading ||
    registerState.isLoading ||
    checkoutState.isLoading;

  return (
    <div className="min-h-screen bg-surface px-4 py-8 text-primary sm:px-6 lg:grid lg:grid-cols-[minmax(0,1fr)_560px] lg:gap-10 lg:px-10">
      <section className="flex min-h-[34vh] flex-col justify-between py-6 lg:min-h-[calc(100vh-4rem)]">
        <div>
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-md bg-primary text-sm font-bold text-white">MZ</span>
            <div>
              <p className="text-sm font-bold text-primary">MEZANI Admin</p>
              <p className="text-xs text-text-secondary">Gestion multi-établissements</p>
            </div>
          </div>

          <div className="mt-16 max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface-elevated px-3 py-1 text-xs font-semibold text-info">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
              Paiement contrôlé, accès protégé
            </div>
            <h1 className="mt-5 text-4xl font-semibold tracking-normal text-primary sm:text-5xl">
              Un forfait clair pour tous vos établissements
            </h1>
            <p className="mt-4 max-w-lg text-base leading-7 text-text-secondary">
              Choisissez votre capacité, effectuez le paiement puis utilisez la clé MEZANI reçue
              pour enregistrer le propriétaire et ouvrir ses établissements.
            </p>
          </div>
        </div>

        <div className="mt-12 grid max-w-xl gap-3 text-sm text-text-secondary sm:grid-cols-3">
          <AuthHint icon={Building2} label="1. Choisir le forfait" />
          <AuthHint icon={Smartphone} label="2. Confirmer le paiement" />
          <AuthHint icon={KeyRound} label="3. Activer le compte" />
        </div>
      </section>

      <section className="flex items-center">
        <Panel className="w-full">
          <PanelHeader
            title={mode === "login" ? "Connexion" : "Créer mon accès"}
            eyebrow={mode === "login" ? "Propriétaire et équipe" : "Forfait et clé d’activation"}
          />
          <div className="p-5">
            <div className="grid grid-cols-2 gap-1 rounded-md bg-surface-elevated p-1">
              {(["login", "register"] as const).map((item) => (
                <button
                  key={item}
                  className={cn(
                    "h-9 rounded-md text-sm font-semibold transition",
                    mode === item ? "bg-primary text-white shadow-sm" : "text-text-secondary hover:text-primary",
                  )}
                  type="button"
                  onClick={() => setMode(item)}
                >
                  {item === "login" ? "Connexion" : "Nouvelle inscription"}
                </button>
              ))}
            </div>

            {mode === "login" ? (
              <form className="mt-5 grid gap-3" onSubmit={onLogin}>
                <Field
                  autoComplete="username"
                  placeholder="Téléphone, email ou identifiant"
                  value={loginForm.identifier}
                  onChange={(event) => setLoginForm((current) => ({ ...current, identifier: event.target.value }))}
                  required
                />
                <Field
                  autoComplete="current-password"
                  placeholder="Mot de passe"
                  type="password"
                  value={loginForm.password}
                  onChange={(event) => setLoginForm((current) => ({ ...current, password: event.target.value }))}
                  required
                />
                <Button className="mt-2 h-10" disabled={isBusy} type="submit" variant="primary">
                  <LogIn className="h-4 w-4" aria-hidden="true" />
                  {loginState.isLoading ? "Connexion…" : "Entrer"}
                </Button>
              </form>
            ) : (
              <div className="mt-5">
                <div className="grid grid-cols-2 border-b border-border">
                  <StepButton
                    active={registrationStep === "payment"}
                    label="1. Forfait et paiement"
                    onClick={() => setRegistrationStep("payment")}
                  />
                  <StepButton
                    active={registrationStep === "activation"}
                    label="2. J’ai ma clé"
                    onClick={() => setRegistrationStep("activation")}
                  />
                </div>

                {registrationStep === "payment" ? (
                  <form className="mt-5 grid gap-4" onSubmit={onCheckout}>
                    <div className="max-h-52 divide-y divide-border overflow-y-auto border-y border-border">
                      {plans.map((plan) => (
                        <label key={plan.id} className="flex cursor-pointer items-center gap-3 px-2 py-3 hover:bg-surface-elevated">
                          <input
                            checked={checkoutForm.planId === plan.id}
                            name="subscription-plan"
                            type="radio"
                            value={plan.id}
                            onChange={() => setCheckoutForm((current) => ({ ...current, planId: plan.id }))}
                          />
                          <span className="min-w-0 flex-1">
                            <span className="block text-sm font-semibold text-primary">{plan.name}</span>
                            <span className="block text-xs text-text-secondary">
                              {plan.max_establishments} établissement{plan.max_establishments > 1 ? "s" : ""}
                            </span>
                          </span>
                          <span className="text-sm font-semibold text-info">{formatPrice(plan)}</span>
                        </label>
                      ))}
                      {!plansQuery.isLoading && plans.length === 0 ? (
                        <p className="px-2 py-4 text-sm text-text-secondary">
                          Les tarifs sont encore en configuration. Contactez l’équipe MEZANI.
                        </p>
                      ) : null}
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Field
                        autoComplete="email"
                        placeholder="email@exemple.com"
                        type="email"
                        value={checkoutForm.email}
                        onChange={(event) => setCheckoutForm((current) => ({ ...current, email: event.target.value }))}
                      />
                      <Field
                        autoComplete="tel"
                        placeholder="+243…"
                        value={checkoutForm.phone}
                        onChange={(event) => setCheckoutForm((current) => ({ ...current, phone: event.target.value }))}
                      />
                    </div>
                    <Select
                      aria-label="Moyen de paiement"
                      value={checkoutForm.paymentMethod}
                      onChange={(event) => setCheckoutForm((current) => ({ ...current, paymentMethod: event.target.value }))}
                    >
                      {paymentMethods.map((method) => (
                        <option key={method.value} value={method.value}>{method.label}</option>
                      ))}
                    </Select>
                    <p className="text-xs leading-5 text-text-secondary">
                      La demande ne crée pas encore la clé. MEZANI l’envoie au contact indiqué uniquement après confirmation réelle du paiement.
                    </p>
                    <Button disabled={isBusy || !checkoutForm.planId} type="submit" variant="primary">
                      {checkoutState.isLoading ? "Enregistrement…" : "Enregistrer la demande"}
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </form>
                ) : (
                  <form className="mt-5 grid gap-3" onSubmit={onRegister}>
                    {checkout ? (
                      <div className="border-l-4 border-success bg-success-light px-3 py-3 text-xs text-emerald-800">
                        <p className="font-semibold">Demande {checkout.id} enregistrée</p>
                        <p className="mt-1">Après confirmation du paiement, saisissez ici la clé reçue.</p>
                      </div>
                    ) : (
                      <p className="text-xs leading-5 text-text-secondary">
                        Vous avez déjà payé et reçu une clé ? Elle doit être utilisée avec le même email ou numéro de téléphone que la demande.
                      </p>
                    )}
                    <Field
                      autoComplete="off"
                      placeholder="Clé d’activation MEZANI"
                      value={registerForm.key}
                      onChange={(event) => setRegisterForm((current) => ({ ...current, key: event.target.value }))}
                      required
                    />
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Field
                        autoComplete="name"
                        placeholder="Nom complet"
                        value={registerForm.name}
                        onChange={(event) => setRegisterForm((current) => ({ ...current, name: event.target.value }))}
                        required
                      />
                      <Field
                        placeholder="Nom du groupe (facultatif)"
                        value={registerForm.organizationName}
                        onChange={(event) => setRegisterForm((current) => ({ ...current, organizationName: event.target.value }))}
                      />
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Field
                        autoComplete="email"
                        placeholder="email@exemple.com"
                        type="email"
                        value={registerForm.email}
                        onChange={(event) => setRegisterForm((current) => ({ ...current, email: event.target.value }))}
                      />
                      <Field
                        autoComplete="tel"
                        placeholder="+243…"
                        value={registerForm.phone}
                        onChange={(event) => setRegisterForm((current) => ({ ...current, phone: event.target.value }))}
                      />
                    </div>
                    <Field
                      autoComplete="new-password"
                      minLength={8}
                      placeholder="Mot de passe (8 caractères minimum)"
                      type="password"
                      value={registerForm.password}
                      onChange={(event) => setRegisterForm((current) => ({ ...current, password: event.target.value }))}
                      required
                    />
                    <Button className="mt-2 h-10" disabled={isBusy} type="submit" variant="primary">
                      <UserPlus className="h-4 w-4" aria-hidden="true" />
                      {validationState.isLoading || registerState.isLoading ? "Validation…" : "Activer le compte"}
                    </Button>
                  </form>
                )}
              </div>
            )}

            {error ? <p className="mt-4 text-sm font-medium text-danger">{error}</p> : null}
          </div>
        </Panel>
      </section>
    </div>
  );
}

function StepButton({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      className={cn(
        "border-b-2 px-2 pb-3 text-xs font-semibold transition",
        active ? "border-info text-info" : "border-transparent text-text-secondary hover:text-primary",
      )}
      type="button"
      onClick={onClick}
    >
      {label}
    </button>
  );
}

function AuthHint({ icon: Icon, label }: { icon: React.ComponentType<React.SVGProps<SVGSVGElement>>; label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-border bg-surface-elevated px-3 py-2">
      <Icon className="h-4 w-4 text-info" aria-hidden="true" />
      <span className="truncate">{label}</span>
    </div>
  );
}

function formatPrice(plan: SubscriptionPlan) {
  const value = new Intl.NumberFormat("fr-CD", {
    style: "currency",
    currency: plan.currency,
    maximumFractionDigits: plan.currency === "CDF" ? 0 : 2,
  }).format(plan.price_amount_minor / 100);
  return `${value}/${plan.billing_period_months > 1 ? `${plan.billing_period_months} mois` : "mois"}`;
}

function apiErrorMessage(error: unknown, fallback: string) {
  if (!error) return null;
  if (typeof error !== "object" || !("data" in error)) return fallback;
  const data = (error as { data?: unknown }).data;
  if (data && typeof data === "object") {
    if ("error" in data && typeof data.error === "string" && data.error.trim()) return data.error;
    if ("message" in data && typeof data.message === "string" && data.message.trim()) return data.message;
  }
  return fallback;
}
