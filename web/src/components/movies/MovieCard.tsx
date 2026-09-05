"use client";

import Image from "next/image";
import Link from "next/link";

import { getMoviesFormat } from "./utiles";
import { ApiMovie } from "@/lib/features/movies";

interface MovieCardProps {
  movie: ApiMovie;
  lang?: string;
  branchId?: string;
}

const DAY_NAMES_PT: Record<number, string> = {
  0: "Dom",
  1: "Seg",
  2: "Ter",
  3: "Qua",
  4: "Qui",
  5: "Sex",
  6: "Sáb",
};

export function MovieCard({ movie, lang = "pt", branchId }: MovieCardProps) {
  const sessions = (movie.sessionMovies ?? []).filter(
    (st) => !branchId || st.room.locationId === branchId,
  );

  // Check if movie has any PRE_ESTREIA sessions
  const isPreEstreia = sessions.some((st) => st.type === "PRE_ESTREIA");

  // Group sessions by day label → unique times per day, max 4 total
  const sessionEntries: { label: string; id: string }[] = [];
  for (const st of sessions) {
    if (sessionEntries.length >= 4) break;
    const date = new Date(st.startTime);
    const dayName = DAY_NAMES_PT[date.getDay()];
    const time = date.toLocaleTimeString("pt-PT", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const label = `${dayName} ${time}`;
    // avoid duplicate labels
    if (!sessionEntries.some((e) => e.label === label)) {
      sessionEntries.push({ label, id: st.id });
    }
  }

  const formats = getMoviesFormat(movie.sessionMovies ?? []);

  return (
    <div className="group relative flex flex-col">
      {/* Link Principal: Clicar no poster leva para a página geral do filme */}
      <Link href={`/${lang}/movies/${movie.id}`} className="block">
        <div
          className={`relative overflow-hidden rounded-md bg-card ${
            isPreEstreia
              ? "movie-card-pre-estreia border-2"
              : "border border-border"
          }`}
        >
          <div className="aspect-2/3 w-full relative">
            <Image
              src={movie.posterUrl}
              alt={`Poster do filme ${movie.title}`}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
              loading="lazy"
            />
          </div>

          {/* Badges de Formato no Topo */}
          {formats && formats.length > 0 && (
            <div className="absolute top-2 left-2 flex gap-1 z-10">
              {formats.map((fmt, i) => (
                <span
                  key={i}
                  className="rounded-sm bg-black/60 px-1.5 py-0.5 text-[9px] font-mono font-bold text-white/90 backdrop-blur-xs border border-white/10"
                >
                  {fmt}
                </span>
              ))}
            </div>
          )}

          {/* Badge Pré-Estreia */}
          {isPreEstreia && (
            <div className="absolute top-2 right-2 z-10">
              <span className="rounded-sm bg-amber-500/90 px-2 py-0.5 text-[9px] font-mono font-bold text-black uppercase tracking-wider backdrop-blur-xs">
                Pré-Estreia
              </span>
            </div>
          )}

          {/* Overlay com informação sobre o Poster */}
          <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/85 via-black/40 to-transparent p-3">
            <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-white/70">
              {movie.genres.flat().join(", ")}
            </div>
            <h3 className="mt-0.5 line-clamp-1 text-sm font-bold text-white group-hover:text-primary transition-colors">
              {movie.title}
            </h3>
          </div>
        </div>
      </Link>

      {/* Horários Rápidos com dia da semana */}
      {sessionEntries.length > 0 ? (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {sessionEntries.map((entry) => (
            <Link
              key={entry.label}
              href={`/${lang}/reserva/${entry.id}`}
              className={`rounded-sm border px-2 py-0.5 text-[10px] font-mono font-semibold transition-all duration-200 ${
                isPreEstreia
                  ? "border-amber-500/50 bg-amber-500/10 text-amber-400 hover:bg-amber-500 hover:text-black hover:border-amber-500"
                  : "border-border/80 bg-secondary/60 text-secondary-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary"
              }`}
              title="Clique para selecionar este horário e escolher assentos"
            >
              {entry.label}
            </Link>
          ))}
        </div>
      ) : (
        <div className="mt-2.5">
          
        </div>
      )}
    </div>
  );
}
