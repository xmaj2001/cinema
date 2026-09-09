"use client";

import { useState } from "react";
import { Dialog } from "@base-ui/react";
import {
  X,
  Loader2,
  CreditCard,
  Mail,
  Phone,
  AlertTriangle,
} from "lucide-react";
import { ApiSessionDetail, SessionSeat } from "@/lib/features/sessions";
import { formatPrice } from "@/lib/utils";
import { CinemaxTicket } from "./CinemaxTicket";

type CheckoutStep = "CONTACT" | "PAYMENT" | "PROCESSING" | "SUCCESS";

interface CheckoutModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  session: ApiSessionDetail;
  seats: SessionSeat[];
  randomlyAssigned?: boolean;
}

export function CheckoutModal({
  isOpen,
  onOpenChange,
  session,
  seats,
  randomlyAssigned = false,
}: CheckoutModalProps) {
  const [step, setStep] = useState<CheckoutStep>("CONTACT");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("multicaixa_express");

  const handleNext = () => {
    if (step === "CONTACT") setStep("PAYMENT");
    else if (step === "PAYMENT") {
      setStep("PROCESSING");
      setTimeout(() => setStep("SUCCESS"), 2500); // simula 2.5s de processamento
    }
  };

  const handleReset = () => {
    setStep("CONTACT");
    setEmail("");
    setWhatsapp("");
    setPaymentMethod("multicaixa_express");
  };

  const onOpenChangeHandler = (open: boolean) => {
    if (!open && step === "PROCESSING") return; // Impede fechar durante o processamento
    onOpenChange(open);
    if (!open) setTimeout(handleReset, 300); // reseta após a animação
  };

  const totalPrice = seats.length * session.price;
  const isContactValid = email.trim() !== "" || whatsapp.trim() !== "";

  // Banner de Aviso sobre o Modo de Simulação (MVP)
  const renderMvpSimulationBanner = () => (
    <div className="flex items-start gap-3 rounded-xl bg-amber-500/10 border border-amber-500/20 px-4 py-3 text-sm">
      <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
      <div>
        <p className="font-semibold text-amber-500 leading-tight">
          Modo Demonstração (MVP)
        </p>
        <p className="text-muted-foreground text-xs mt-0.5">
          O sistema de pagamentos reais está indisponível nesta versão. Este fluxo é apenas uma **simulação de compra**.
        </p>
      </div>
    </div>
  );

  // Banner de lugar atribuído aleatoriamente
  const renderRandomSeatBanner = () => {
    if (!randomlyAssigned || seats.length === 0) return null;

    return (
      <div className="flex items-start gap-3 rounded-xl bg-blue-500/10 border border-blue-500/20 px-4 py-3 text-sm">
        <span className="text-blue-400 mt-0.5 shrink-0">🎲</span>
        <div>
          <p className="font-semibold text-blue-400 leading-tight">
            Lugar atribuído aleatoriamente
          </p>
          <p className="text-muted-foreground text-xs mt-0.5">
            O sistema selecionou o lugar{" "}
            <span className="font-bold text-foreground">
              {seats.map((s) => `${s.row}${s.number}`).join(", ")}
            </span>{" "}
            para si. Preferes escolher manualmente? Fecha este ecrã e clica em
            «Escolher Assentos».
          </p>
        </div>
      </div>
    );
  };

  const renderContactStep = () => (
    <form
      className="flex flex-col gap-5 p-6"
      onSubmit={(e) => {
        e.preventDefault();
        if (isContactValid) handleNext();
      }}
    >
      <div className="flex flex-col gap-1 text-center">
        <Dialog.Title className="text-xl font-bold font-display text-foreground">
          Identificação
        </Dialog.Title>
        <Dialog.Description className="text-sm text-muted-foreground">
          Como pretende receber os seus bilhetes digitais?
        </Dialog.Description>
      </div>

      {/* AVISO MVP DE SIMULAÇÃO */}
      {renderMvpSimulationBanner()}

      {/* Banner de lugar atribuído aleatoriamente */}
      {renderRandomSeatBanner()}

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Mail className="h-4 w-4" /> E-mail
          </label>
          <input
            type="email"
            name="checkout-email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="exemplo@email.com"
            className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50"
          />
        </div>

        <div className="relative flex items-center py-1">
          <div className="grow border-t border-border"></div>
          <span className="shrink-0 mx-4 text-xs text-muted-foreground font-mono uppercase tracking-widest">
            Ou
          </span>
          <div className="grow border-t border-border"></div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Phone className="h-4 w-4" /> WhatsApp
          </label>
          <input
            type="tel"
            name="checkout-phone"
            autoComplete="tel"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            placeholder="+244 9XX XXX XXX"
            className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={!isContactValid}
        className="mt-2 w-full rounded-full bg-primary py-3 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:brightness-110 disabled:opacity-50 disabled:pointer-events-none"
      >
        Continuar para Pagamento (Simulação)
      </button>
    </form>
  );

  const renderPaymentStep = () => (
    <div className="flex flex-col gap-5 p-6">
      <div className="flex flex-col gap-1 text-center">
        <div className="flex items-center justify-center mb-2">
          <button
            type="button"
            onClick={() => setStep("CONTACT")}
            className="text-xs text-muted-foreground hover:text-foreground absolute left-6"
          >
            ← Voltar
          </button>
          <Dialog.Title className="text-xl font-bold font-display text-foreground">
            Pagamento
          </Dialog.Title>
        </div>
        <Dialog.Description className="text-sm text-muted-foreground">
          Escolha o seu método de pagamento preferido.
        </Dialog.Description>
      </div>

      {/* AVISO MVP DE SIMULAÇÃO */}
      {renderMvpSimulationBanner()}

      {/* Banner de lugar atribuído aleatoriamente */}
      {renderRandomSeatBanner()}

      <div className="flex flex-col gap-3">
        <label
          className={`flex cursor-pointer items-center justify-between rounded-xl border p-4 transition-all ${
            paymentMethod === "multicaixa_express"
              ? "border-primary bg-primary/10 ring-1 ring-primary/50"
              : "border-border bg-card hover:bg-muted/50"
          }`}
        >
          <div className="flex items-center gap-3">
            <CreditCard
              className={`h-5 w-5 ${
                paymentMethod === "multicaixa_express"
                  ? "text-primary"
                  : "text-muted-foreground"
              }`}
            />
            <span className="font-semibold text-sm">Multicaixa Express</span>
          </div>
          <input
            type="radio"
            name="payment"
            value="multicaixa_express"
            checked={paymentMethod === "multicaixa_express"}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="h-4 w-4 accent-primary"
          />
        </label>

        <label
          className={`flex cursor-pointer items-center justify-between rounded-xl border p-4 transition-all ${
            paymentMethod === "unitel_money"
              ? "border-primary bg-primary/10 ring-1 ring-primary/50"
              : "border-border bg-card hover:bg-muted/50"
          }`}
        >
          <div className="flex items-center gap-3">
            <Phone
              className={`h-5 w-5 ${
                paymentMethod === "unitel_money"
                  ? "text-primary"
                  : "text-muted-foreground"
              }`}
            />
            <span className="font-semibold text-sm">Unitel Money</span>
          </div>
          <input
            type="radio"
            name="payment"
            value="unitel_money"
            checked={paymentMethod === "unitel_money"}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="h-4 w-4 accent-primary"
          />
        </label>
      </div>

      <div className="rounded-xl bg-muted/50 p-4 flex flex-col gap-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">
            {seats.length}x Bilhete(s)
          </span>
          <span className="font-mono">{`${formatPrice(totalPrice)}`}</span>
        </div>
        <div className="h-px w-full bg-border" />
        <div className="flex justify-between font-bold">
          <span>Total a Simular</span>
          <span className="font-mono text-primary">
            {`${formatPrice(totalPrice)}`}
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={handleNext}
        className="mt-2 w-full rounded-full bg-primary py-3 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:brightness-110"
      >
        Simular Pagamento
      </button>
    </div>
  );

  const renderProcessingStep = () => (
    <div className="flex flex-col items-center justify-center gap-6 p-12 text-center min-h-87.5">
      <Loader2 className="h-16 w-16 animate-spin text-primary" />
      <div className="flex flex-col gap-2">
        <Dialog.Title className="text-xl font-bold font-display text-foreground">
          A simular pagamento...
        </Dialog.Title>
        <Dialog.Description className="text-sm text-muted-foreground">
          A gerar bilhete fictício para fins de teste.
        </Dialog.Description>
      </div>
    </div>
  );

  const renderSuccessStep = () => (
    <div className="flex flex-col gap-4 p-4 items-center max-h-[85vh] overflow-y-auto">
      <CinemaxTicket
        session={session}
        seats={seats}
        email={email}
        whatsapp={whatsapp}
        paymentMethod={paymentMethod}
      />
    </div>
  );

  return (
    <Dialog.Root open={isOpen} onOpenChange={onOpenChangeHandler}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-100 bg-black/80 backdrop-blur-sm transition-all duration-300 data-starting-style:opacity-0 data-ending-style:opacity-0" />
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 sm:p-6">
          <Dialog.Popup className="w-full max-w-md overflow-hidden rounded-3xl bg-background border border-border shadow-2xl transition-all duration-300 data-starting-style:scale-95 data-[starting-style]:opacity-0 data-[ending-style]:scale-95 data-[ending-style]:opacity-0">
            {step !== "PROCESSING" && step !== "SUCCESS" && (
              <Dialog.Close className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-card/80 text-muted-foreground hover:bg-card hover:text-foreground transition-all">
                <X className="h-4 w-4" />
              </Dialog.Close>
            )}

            <div className="relative">
              {step === "CONTACT" && renderContactStep()}
              {step === "PAYMENT" && renderPaymentStep()}
              {step === "PROCESSING" && renderProcessingStep()}
              {step === "SUCCESS" && renderSuccessStep()}
            </div>
          </Dialog.Popup>
        </div>
      </Dialog.Portal>
    </Dialog.Root>
  );
}