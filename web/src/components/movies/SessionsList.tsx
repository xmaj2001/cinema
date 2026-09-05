"use client";

import { Zap, Clock, MapPin } from "lucide-react";
import Link from "next/link";
import { FORMAT_MAP } from "@/components/movies/utiles";
import { ApiSessionMovie, SessionType } from "@/lib/features/movies";
import { formatPrice } from "@/lib/utils";

interface SessionsListProps {
  sessions: ApiSessionMovie[];
  lang: string;
}

const DAY_NAMES_PT: Record<number, string> = {
  0: "Domingo",
  1: "Segunda",
  2: "Terça",
  3: "Quarta",
  4: "Quinta",
  5: "Sexta",
  6: "Sábado",
};



function groupSessionsByDay(
  sessions: ApiSessionMovie[],
): Map<string, ApiSessionMovie[]> {
  const groups = new Map<string, ApiSessionMovie[]>();
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const sorted = [...sessions].sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
  );

  for (const session of sorted) {
    const date = new Date(session.startTime);
    const dateKey = date.toISOString().split("T")[0];

    let label: string;
    if (dateKey === today.toISOString().split("T")[0]) {
      label = "Hoje";
    } else if (dateKey === tomorrow.toISOString().split("T")[0]) {
      label = "Amanhã";
    } else {
      const dayName = DAY_NAMES_PT[date.getDay()] ?? "";
      label = `${dayName}, ${date.toLocaleDateString("pt-PT", {
        day: "numeric",
        month: "short",
      })}`;
    }

    if (!groups.has(label)) groups.set(label, []);
    groups.get(label)!.push(session);
  }

  return groups;
}

const TIER_LABELS: Record<string, string> = {
  WEEKDAY: "Dia útil",
  WEEKEND: "Fim-de-semana",
  HOLIDAY: "Feriado",
  STUDENT: "Estudante",
};

export function SessionsList({ sessions, lang }: SessionsListProps) {
  const grouped = groupSessionsByDay(sessions);

  if (sessions.length === 0) {
    return (
      <section id="sessoes" className="py-2">
        <h2 className="text-lg font-display font-bold uppercase tracking-wider text-foreground mb-6 flex items-center gap-2">
          Sessões Disponíveis
        </h2>
        <div className="rounded-xl border border-border bg-card/50 p-12 text-center">
          <p className="text-sm text-muted-foreground font-mono">
            Sem sessões disponíveis para este cinema.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section id="sessoes" className="py-2">
      <h2 className="text-lg font-display font-bold uppercase tracking-wider text-foreground mb-6 flex items-center gap-2">
        Sessões Disponíveis
      </h2>

      <div className="flex flex-col gap-8">
        {Array.from(grouped.entries()).map(([dayLabel, daySessions]) => (
          <div key={dayLabel}>
            {/* Day header */}
            <div className="flex items-center gap-3 mb-4">
              <h3 className="text-sm font-mono font-bold text-foreground uppercase tracking-widest">
                {dayLabel}
              </h3>
              <span
                className="flex-1 dotted-x text-foreground/15"
                aria-hidden
              />
              <span className="text-[10px] font-mono text-muted-foreground">
                {daySessions.length} sessão{daySessions.length > 1 ? "ões" : ""}
              </span>
            </div>

            {/* Session cards */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {daySessions.map((session) => {
                const startDate = new Date(session.startTime);
                const endDate = new Date(session.endTime);
                const formatInfo = FORMAT_MAP[session.room.format];
                const isPreEstreia = session.type === SessionType.PREMIERE;
                const tierLabel = TIER_LABELS[session.tier] ?? session.tier;
                const sessionHref = `/${lang}/sessions/${session.id}`;

                return (
                  <Link
                    key={session.id}
                    href={sessionHref}
                    className={`session-card group block hover:border-primary/60 hover:shadow-md hover:shadow-primary/10 transition-all duration-200 ${
                      isPreEstreia ? "border-amber-500/40" : ""
                    }`}
                  >
                    {/* Top: Time + Format */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-base font-bold font-mono text-foreground">
                          {startDate.toLocaleTimeString("pt-PT", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        <span className="text-xs text-muted-foreground font-mono">
                          →{" "}
                          {endDate.toLocaleTimeString("pt-PT", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>

                      {/* Format badge */}
                      {formatInfo && (
                        <span className="rounded-sm border border-border px-1.5 py-0.5 text-[10px] font-mono font-bold text-foreground/80">
                          {formatInfo.label}
                        </span>
                      )}
                    </div>

                    {/* Room + Location */}
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
                      <MapPin className="h-3 w-3" />
                      <span className="font-medium">{session.room.name}</span>
                    </div>

                    {/* Badges row */}
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {isPreEstreia && (
                        <span className="rounded-sm bg-amber-500/90 px-1.5 py-0.5 text-[9px] font-mono font-bold text-black uppercase tracking-wider">
                          Pré-Estreia
                        </span>
                      )}
                      <span className="rounded-sm bg-secondary px-1.5 py-0.5 text-[9px] font-mono text-secondary-foreground uppercase tracking-wider">
                        {tierLabel}
                      </span>
                    </div>

                    {/* Price + CTA */}
                    <div className="flex items-center justify-between pt-3 border-t border-border/50">
                      <span className="text-lg font-bold font-mono text-foreground">
                        {formatPrice(session.price)}
                      </span>

                      <div className="flex gap-2">
                        <span className="rounded-full bg-primary/90 group-hover:bg-primary px-4 py-1.5 text-[10px] font-mono font-bold text-primary-foreground transition-colors flex items-center gap-1">
                          <Zap className="h-3 w-3" />
                          Ver Sessão
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
