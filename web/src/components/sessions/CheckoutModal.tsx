"use client";

import { useState } from "react";
import { Dialog } from "@base-ui/react";
import {
  X,
  Loader2,
  CheckCircle2,
  Ticket as TicketIcon,
  Download,
  CreditCard,
  Mail,
  Phone,
} from "lucide-react";
import Image from "next/image";
import { ApiSessionDetail, SessionSeat } from "@/lib/features/sessions";
import { formatPrice } from "@/lib/utils";

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
      setTimeout(() => setStep("SUCCESS"), 2500); // simulate 2.5s processing
    }
  };

  const handleReset = () => {
    setStep("CONTACT");
    setEmail("");
    setWhatsapp("");
    setPaymentMethod("multicaixa_express");
  };

  const onOpenChangeHandler = (open: boolean) => {
    if (!open && step === "PROCESSING") return; // Prevent closing while processing
    onOpenChange(open);
    if (!open) setTimeout(handleReset, 300); // reset after animation
  };

  const handlePrint = () => {
    window.print();
  };

  const totalPrice = seats.length * session.price;
  const isContactValid = email.trim() !== "" || whatsapp.trim() !== "";

  const renderContactStep = () => (
    <form 
      className="flex flex-col gap-6 p-6"
      onSubmit={(e) => {
        e.preventDefault();
        if (isContactValid) handleNext();
      }}
    >
      <div className="flex flex-col gap-2 text-center">
        <Dialog.Title className="text-xl font-bold font-display text-foreground">
          Identificação
        </Dialog.Title>
        <Dialog.Description className="text-sm text-muted-foreground">
          Como pretende receber os seus bilhetes digitais?
        </Dialog.Description>
      </div>

      {/* Randomly assigned seat banner */}
      {randomlyAssigned && seats.length > 0 && (
        <div className="flex items-start gap-3 rounded-xl bg-blue-500/10 border border-blue-500/20 px-4 py-3 text-sm">
          <span className="text-blue-400 mt-0.5 shrink-0">🎲</span>
          <div>
            <p className="font-semibold text-blue-400 leading-tight">Lugar atribuído aleatoriamente</p>
            <p className="text-muted-foreground text-xs mt-0.5">
              O sistema selecionou o lugar{" "}
              <span className="font-bold text-foreground">
                {seats.map(s => `${s.row}${s.number}`).join(", ")}
              </span>{" "}
              para si. Preferes escolher manualmente? Fecha este ecrã e clica em «Escolher Assentos».
            </p>
          </div>
        </div>
      )}

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

        <div className="relative flex items-center py-2">
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
        Continuar para Pagamento
      </button>
    </form>
  );

  const renderPaymentStep = () => (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-2 text-center">
        <div className="flex items-center justify-center mb-2">
          <button
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
          <span className="font-mono">
            {`${formatPrice(totalPrice)}`}
          </span>
        </div>
        <div className="h-px w-full bg-border" />
        <div className="flex justify-between font-bold">
          <span>Total a Pagar</span>
          <span className="font-mono text-primary">
            {`${formatPrice(totalPrice)}`}
          </span>
        </div>
      </div>

      <button
        onClick={handleNext}
        className="mt-2 w-full rounded-full bg-primary py-3 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:brightness-110"
      >
        Confirmar Pagamento
      </button>
    </div>
  );

  const renderProcessingStep = () => (
    <div className="flex flex-col items-center justify-center gap-6 p-12 text-center min-h-87.5">
      <Loader2 className="h-16 w-16 animate-spin text-primary" />
      <div className="flex flex-col gap-2">
        <Dialog.Title className="text-xl font-bold font-display text-foreground">
          A processar...
        </Dialog.Title>
        <Dialog.Description className="text-sm text-muted-foreground">
          Por favor, valide o pagamento na sua aplicação bancária.
        </Dialog.Description>
      </div>
    </div>
  );

  const renderSuccessStep = () => (
    <div className="flex flex-col gap-6 p-6 items-center">
      <div className="flex flex-col items-center gap-3 text-center mb-2">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-500">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <div>
          <Dialog.Title className="text-2xl font-bold font-display text-foreground">
            Compra Concluída!
          </Dialog.Title>
          <Dialog.Description className="text-sm text-muted-foreground mt-1">
            Os seus bilhetes foram enviados para{" "}
            <span className="font-semibold text-foreground">
              {email || whatsapp}
            </span>
            .
          </Dialog.Description>
        </div>
      </div>

      {/* Ticket Mockup */}
      <div className="relative w-full overflow-hidden rounded-2xl border-2 border-border/60 bg-linear-to-br from-card to-background shadow-2xl">
        {/* Tear holes */}
        <div className="absolute -left-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-background border-r-2 border-border/60" />
        <div className="absolute -right-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-background border-l-2 border-border/60" />

        <div className="flex border-b-2 border-dashed border-border/60 p-5">
          <div className="relative h-24 w-16 overflow-hidden rounded-md shrink-0">
            <Image
              src={session.movie.posterUrl}
              alt={session.movie.title}
              fill
              className="object-cover"
            />
          </div>
          <div className="ml-4 flex flex-col justify-center">
            <h4 className="font-display text-lg font-black leading-tight line-clamp-2">
              {session.movie.title}
            </h4>
            <p className="mt-1 text-xs font-mono text-muted-foreground">
              {session.room.location.name} • {session.room.name}
            </p>
          </div>
        </div>

        <div className="p-5 flex justify-between items-center bg-card/40">
          <div className="flex flex-col gap-3">
            <div>
              <p className="text-[10px] uppercase font-mono tracking-widest text-muted-foreground">
                Data & Hora
              </p>
              <p className="font-bold text-sm">
                {new Date(session.startTime).toLocaleString("pt-PT", {
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-mono tracking-widest text-muted-foreground">
                Lugares
              </p>
              <p className="font-bold text-sm text-primary">
                {seats.map((s) => `${s.row}${s.number}`).join(", ")}
              </p>
            </div>
          </div>
          
          {/* Mock QR Code */}
          <div className="flex h-20 w-20 items-center justify-center bg-white rounded-lg p-1">
            <div className="w-full h-full bg-[url('https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=MockTicket123')] bg-cover" />
          </div>
        </div>
      </div>

      <div className="flex w-full gap-3 mt-2">
        <button
          onClick={handlePrint}
          className="flex-1 flex items-center justify-center gap-2 rounded-full border border-border bg-card py-2.5 text-sm font-semibold transition-all hover:bg-muted"
        >
          <Download className="h-4 w-4" /> Guardar PDF
        </button>
        <Dialog.Close className="flex-1 rounded-full bg-foreground py-2.5 text-sm font-bold text-background transition-all hover:bg-foreground/90">
          Fechar
        </Dialog.Close>
      </div>
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
