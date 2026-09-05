"use client";

import { useMemo, useState, useRef } from "react";
import { Armchair, ChevronLeft, Ticket, Info } from "lucide-react";
import { ApiSessionDetail, SessionSeat } from "@/lib/features/sessions";
import { motion, AnimatePresence } from "framer-motion";
import { CheckoutModal } from "./CheckoutModal";
import { formatPrice } from "@/lib/utils";

interface SeatMapProps {
  session: ApiSessionDetail;
  onConfirm?: (selectedSeats: SessionSeat[]) => void;
}

export function SeatMap({ session, onConfirm }: SeatMapProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [ticketQuantity, setTicketQuantity] = useState<number>(1);
  const [isCheckoutOpen, setCheckoutOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Group seats by row
  const rows = useMemo(() => {
    const rowMap = new Map<string, SessionSeat[]>();
    session.seats.forEach(seat => {
      if (!rowMap.has(seat.row)) rowMap.set(seat.row, []);
      rowMap.get(seat.row)!.push(seat);
    });
    const sortedRows = Array.from(rowMap.keys()).sort();
    return sortedRows.map(row => ({
      row,
      seats: rowMap.get(row)!.sort((a, b) => a.number - b.number)
    }));
  }, [session.seats]);

  const handleSeatClick = (seat: SessionSeat) => {
    if (seat.status !== "AVAILABLE") return;
    const newSelected = new Set(selected);
    if (newSelected.has(seat.id)) {
      newSelected.delete(seat.id);
    } else {
      if (newSelected.size < ticketQuantity) {
        newSelected.add(seat.id);
      } else if (ticketQuantity === 1) {
        newSelected.clear();
        newSelected.add(seat.id);
      }
    }
    setSelected(newSelected);
  };

  const getSeatStyles = (seat: SessionSeat) => {
    if (selected.has(seat.id))
      return "text-primary fill-primary drop-shadow-[0_0_8px_rgba(var(--primary),0.8)]";
    switch (seat.status) {
      case "AVAILABLE":
        return "text-muted-foreground/60 hover:text-primary hover:scale-110 cursor-pointer";
      case "RESERVED":
        return "text-yellow-500/50 cursor-not-allowed";
      case "SOLD":
        return "text-muted-foreground/20 cursor-not-allowed";
      default:
        return "text-muted-foreground/40";
    }
  };

  const selectedSeats = useMemo(
    () => session.seats.filter(s => selected.has(s.id)),
    [selected, session.seats]
  );

  const totalPrice = selected.size * session.price;
  const allSelected = selected.size >= ticketQuantity;
  const canProceed = selected.size > 0;

  return (
    <>
      <div className="relative w-full h-[calc(100vh-64px)] min-h-[600px] overflow-hidden bg-background/95">

        {/* ── Subtle background grid ── */}
        <div className="absolute inset-0 z-0 opacity-[0.03]"
          style={{ backgroundImage: "radial-gradient(circle, currentColor 1px, transparent 1px)", backgroundSize: "32px 32px" }} />

        {/* ── TOP NAV BAR ── */}
        <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-3 bg-background/80 backdrop-blur-md border-b border-border/50">
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors group"
          >
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-card border border-border group-hover:border-foreground/30 transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </span>
            <span className="hidden sm:inline">Voltar à Sessão</span>
          </button>

          <div className="flex flex-col items-center">
            <span className="font-bold text-sm leading-tight truncate max-w-[180px] sm:max-w-xs">
              {session.movie.title}
            </span>
            <span className="text-xs text-muted-foreground">
              {session.room.name} &middot;{" "}
              {new Date(session.startTime).toLocaleTimeString("pt-PT", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-muted-foreground bg-card border border-border px-2.5 py-1 rounded-full hidden sm:flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" />
              {session.seats.filter(s => s.status === "AVAILABLE").length} disponíveis
            </span>
          </div>
        </div>

        {/* ── MAP CANVAS ── */}
        <div
          ref={containerRef}
          className="absolute inset-0 z-0 touch-none overflow-hidden"
          style={{ top: "57px", bottom: "132px" }}
        >
          <motion.div
            drag
            dragConstraints={containerRef}
            dragElastic={0.15}
            dragTransition={{ bounceStiffness: 500, bounceDamping: 25 }}
            className="w-full h-full flex flex-col items-center justify-center min-w-[700px] min-h-[500px] cursor-grab active:cursor-grabbing select-none"
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4, type: "spring", bounce: 0.3 }}
          >
            {/* Screen */}
            <div className="text-center mb-12 pointer-events-none">
              <div className="w-64 sm:w-96 mx-auto h-3 bg-gradient-to-b from-blue-400/70 via-blue-400/30 to-transparent rounded-t-full shadow-[0_8px_40px_rgba(96,165,250,0.5)]" />
              <span className="text-[10px] font-mono tracking-[0.35em] uppercase text-muted-foreground/60 mt-2 block">
                ECRÃ
              </span>
            </div>

            {/* Seats */}
            <div className="flex flex-col gap-3 pointer-events-auto">
              {rows.map((row, rowIdx) => (
                <motion.div
                  key={row.row}
                  className="flex items-center gap-3"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: rowIdx * 0.04, duration: 0.3 }}
                >
                  <span className="w-5 text-center text-xs font-bold text-muted-foreground/40 font-mono">
                    {row.row}
                  </span>
                  <div className="flex gap-2">
                    {row.seats.map(seat => (
                      <button
                        key={seat.id}
                        onClick={e => {
                          e.stopPropagation();
                          handleSeatClick(seat);
                        }}
                        disabled={seat.status !== "AVAILABLE"}
                        className={`p-1.5 transition-all duration-150 touch-manipulation rounded ${getSeatStyles(seat)}`}
                        title={`Fila ${seat.row} — Lugar ${seat.number}`}
                      >
                        <Armchair className="w-7 h-7 md:w-8 md:h-8 transition-all duration-150" />
                      </button>
                    ))}
                  </div>
                  <span className="w-5 text-center text-xs font-bold text-muted-foreground/40 font-mono">
                    {row.row}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* ── LEGEND PILL (top-right over canvas) ── */}
        <div className="absolute z-10 right-4 pointer-events-none flex flex-col gap-2" style={{ top: "70px" }}>
          <div className="hidden md:flex flex-col gap-1.5 bg-card/90 backdrop-blur-md border border-border/60 rounded-xl px-3 py-3 shadow-lg pointer-events-auto">
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/60 mb-1">Legenda</p>
            {[
              { color: "text-muted-foreground/60", label: "Disponível" },
              { color: "text-primary fill-primary", label: "Selecionado", fill: true },
              { color: "text-yellow-500/50", label: "Reservado" },
              { color: "text-muted-foreground/20", label: "Vendido" },
            ].map(({ color, label, fill }) => (
              <div key={label} className="flex items-center gap-2">
                <Armchair className={`w-4 h-4 ${color} ${fill ? "fill-primary" : ""}`} />
                <span className="text-xs text-muted-foreground">{label}</span>
              </div>
            ))}
          </div>

          {/* Drag hint */}
          <div className="hidden md:flex items-center gap-1.5 bg-card/80 backdrop-blur-md border border-border/50 rounded-lg px-3 py-2 shadow pointer-events-none">
            <Info className="w-3 h-3 text-muted-foreground/50 shrink-0" />
            <span className="text-[10px] text-muted-foreground/50">Arrasta para navegar</span>
          </div>
        </div>

        {/* ── BOTTOM ACTION BAR ── */}
        <div className="absolute bottom-0 left-0 right-0 z-20 bg-background/90 backdrop-blur-md border-t border-border/50">
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-4">

            {/* Ticket counter */}
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-muted-foreground hidden sm:block">Bilhetes</span>
              <div className="flex items-center gap-1 bg-card border border-border rounded-full px-1 py-1">
                <button
                  onClick={() => {
                    const newQty = Math.max(1, ticketQuantity - 1);
                    setTicketQuantity(newQty);
                    // trim selection if needed
                    if (selected.size > newQty) {
                      const arr = Array.from(selected).slice(0, newQty);
                      setSelected(new Set(arr));
                    }
                  }}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold hover:bg-accent transition-colors"
                >
                  −
                </button>
                <span className="font-bold text-sm min-w-[1.5rem] text-center tabular-nums">
                  {ticketQuantity}
                </span>
                <button
                  onClick={() => setTicketQuantity(Math.min(10, ticketQuantity + 1))}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold hover:bg-accent transition-colors"
                >
                  +
                </button>
              </div>
            </div>

            {/* Selected seats display */}
            <div className="flex-1 flex items-center gap-2 overflow-hidden">
              <AnimatePresence mode="popLayout">
                {selected.size === 0 ? (
                  <motion.p
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-xs text-muted-foreground/60 truncate"
                  >
                    Seleciona {ticketQuantity} lugar{ticketQuantity !== 1 ? "es" : ""} no mapa
                  </motion.p>
                ) : (
                  <>
                    {Array.from(selected).map(seatId => {
                      const seat = session.seats.find(s => s.id === seatId);
                      return seat ? (
                        <motion.span
                          key={seat.id}
                          layout
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          transition={{ type: "spring", bounce: 0.4, duration: 0.3 }}
                          className="shrink-0 text-xs font-bold bg-primary/15 text-primary border border-primary/30 px-2.5 py-1 rounded-full"
                        >
                          {seat.row}{seat.number}
                        </motion.span>
                      ) : null;
                    })}
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Price + CTA */}
            <div className="flex items-center gap-3 shrink-0">
              {selected.size > 0 && (
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-[10px] text-muted-foreground/60 font-mono uppercase tracking-wider">Total</span>
                  <span className="font-black text-base font-mono text-foreground">
                    {formatPrice(totalPrice)}
                  </span>
                </div>
              )}

              <button
                disabled={!canProceed}
                onClick={() => {
                  if (canProceed) {
                    onConfirm?.(selectedSeats);
                    setCheckoutOpen(true);
                  }
                }}
                className="flex items-center gap-2 bg-primary text-primary-foreground font-bold text-sm px-5 py-2.5 rounded-full shadow-lg shadow-primary/30 hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95"
              >
                <Ticket className="w-4 h-4" />
                <span className="hidden sm:inline">Confirmar</span>
                <span className="sm:hidden">OK</span>
                {!allSelected && selected.size > 0 && (
                  <span className="text-xs opacity-70">({selected.size}/{ticketQuantity})</span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onOpenChange={setCheckoutOpen}
        session={session}
        seats={selectedSeats}
      />
    </>
  );
}

