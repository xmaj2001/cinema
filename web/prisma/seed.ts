/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import "dotenv/config";
import { faker } from "@faker-js/faker";
import { prisma } from "./seeds/_client";
import {
  MovieStatus,
  SeatType,
  TicketStatus,
  ScreenFormat,
  PricingTier,
  SessionMovieType,
  UserRole,
} from "../src/generated/prisma/client";

faker.seed(1984); // Resultados reprodutíveis

// ═══════════════════════════════════════════════════
// CONFIGURAÇÃO DE VOLUMES DE DADOS
// ═══════════════════════════════════════════════════
const CONFIG = {
  LOCATIONS_COUNT: Number(process.env.SEED_LOCATIONS) || 5,
  ROOMS_PER_LOCATION_MIN: 2,
  ROOMS_PER_LOCATION_MAX: 4,
  MOVIES_COUNT: Number(process.env.SEED_MOVIES) || 60, // Ajustado para um número realista de catálogo
  SESSIONS_PER_ROOM: Number(process.env.SEED_SESSIONS_PER_ROOM) || 20,
  ROWS_PER_ROOM: 6,
  SEATS_PER_ROW: 10,
};

async function main() {
  console.log("🌱 CloudBase Seed - Cinema Whitelabel\n");

  // ── 1. Limpar BD ────────────────────────────────────────────────────────────
  console.log("🗑️  A limpar a base de dados...");

  await prisma.ticket.deleteMany();
  await prisma.order.deleteMany();
  await prisma.sessionTicket.deleteMany();
  await prisma.sessionMovie.deleteMany();
  await prisma.presaleSubscription.deleteMany();
  await prisma.movieReview.deleteMany();
  await prisma.movie.deleteMany();
  await prisma.seat.deleteMany();
  await prisma.room.deleteMany();
  await prisma.verification.deleteMany();
  await prisma.oauthConsent.deleteMany();
  await prisma.oauthAccessToken.deleteMany();
  await prisma.oauthApplication.deleteMany();
  await prisma.account.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();
  await prisma.location.deleteMany();

  console.log("   ✅ Base de dados limpa\n");

  // ── 2. Localizações ─────────────────────────────────────────────────────────
  console.log(`📍 A criar ${CONFIG.LOCATIONS_COUNT} localizações...`);

  const provinces = ["Luanda", "Benguela", "Huambo", "Huíla", "Cabinda"];

  const locations = await Promise.all(
    Array.from({ length: CONFIG.LOCATIONS_COUNT }).map((_, i) =>
      prisma.location.create({
        data: {
          name: `Cinemax ${faker.location.street()}`,
          province: provinces[i % provinces.length],
          city: faker.location.city(),
          latitude: faker.location.latitude(),
          longitude: faker.location.longitude(),
          address: faker.location.streetAddress(),
        },
      }),
    ),
  );

  console.log(`   ✅ ${locations.length} localizações criadas\n`);

  // ── 3. Utilizadores ─────────────────────────────────────────────────────────
  console.log("👤 A criar utilizadores...");

  // Super Admin
  await prisma.user.create({
    data: {
      email: "admin@cloudbase.ao",
      name: "Super Admin",
      emailVerified: true,
      passwordHash: faker.string.alphanumeric(60),
      role: UserRole.ADMIN,
    },
  });

  // Gestores de Localização (Staff)
  const branchManagers = await Promise.all(
    locations.map((location) =>
      prisma.user.create({
        data: {
          email: faker.internet.email().toLowerCase(),
          name: faker.person.fullName(),
          emailVerified: true,
          passwordHash: faker.string.alphanumeric(60),
          role: UserRole.STAFF,
          locationId: location.id,
        },
      }),
    ),
  );

  // Utilizadores Cliente Normais
  const clients = await Promise.all(
    Array.from({ length: 10 }).map(() =>
      prisma.user.create({
        data: {
          email: faker.internet.email().toLowerCase(),
          name: faker.person.fullName(),
          emailVerified: true,
          passwordHash: faker.string.alphanumeric(60),
          role: UserRole.CLIENT,
        },
      }),
    ),
  );

  console.log(
    `   ✅ Utilizadores criados: 1 Admin, ${branchManagers.length} Staff e ${clients.length} Clientes\n`,
  );

  // ── 4. Salas e Cadeiras ─────────────────────────────────────────────────────
  console.log("🎬 A criar salas e cadeiras...");

  const rows = ["A", "B", "C", "D", "E", "F"].slice(0, CONFIG.ROWS_PER_ROOM);
  const seatsPerRow = CONFIG.SEATS_PER_ROW;
  const allRooms: { id: string; locationId: string }[] = [];

  for (const location of locations) {
    const roomCount = faker.number.int({
      min: CONFIG.ROOMS_PER_LOCATION_MIN,
      max: CONFIG.ROOMS_PER_LOCATION_MAX,
    });

    for (let r = 0; r < roomCount; r++) {
      const isImax = r === 0;
      const capacity = rows.length * seatsPerRow;

      const room = await prisma.room.create({
        data: {
          name: isImax ? "Sala 1 (IMAX)" : `Sala ${r + 1}`,
          capacity,
          locationId: location.id,
          format: isImax
            ? ScreenFormat.IMAX
            : faker.helpers.arrayElement([
              ScreenFormat.D2,
              ScreenFormat.D3,
              ScreenFormat.VIP,
            ]),
        },
      });

      allRooms.push({ id: room.id, locationId: location.id });

      const seatsData = rows.flatMap((row) =>
        Array.from({ length: seatsPerRow }, (_, i) => {
          const number = i + 1;
          const type: SeatType =
            row === "A"
              ? SeatType.RECLINER
              : row === rows[rows.length - 1] && number <= 2
                ? SeatType.ACCESSIBLE
                : SeatType.STANDARD;

          return { row, number, type, roomId: room.id };
        }),
      );

      await prisma.seat.createMany({ data: seatsData });
    }
  }

  console.log(
    `   ✅ ${allRooms.length} salas criadas, ${allRooms.length * rows.length * seatsPerRow} cadeiras geradas\n`,
  );

  // ── 5. Filmes ───────────────────────────────────────────────────────────────
  console.log(`🎞️  A criar ${CONFIG.MOVIES_COUNT} filmes...`);

  const ageRatings = ["Livre", "M/12", "M/14", "M/16", "M/18"];
  const now = new Date();

  const movies = await Promise.all(
    Array.from({ length: CONFIG.MOVIES_COUNT }).map((_, idx) => {
      // 60% Filmes Já Estreados, 40% Estreias Futuras
      const isAlreadyReleased = idx % 10 < 6;
      const releaseDate = isAlreadyReleased
        ? faker.date.past({ years: 1, refDate: now })
        : faker.date.soon({ days: 60, refDate: now });

      return prisma.movie.create({
        data: {
          title: faker.lorem
            .words({ min: 2, max: 4 })
            .replace(/\b\w/g, (c) => c.toUpperCase()),
          synopsis: faker.lorem.paragraph(),
          posterUrl: faker.image.urlPicsumPhotos({ width: 400, height: 600 }),
          bannerUrl: faker.image.urlPicsumPhotos({ width: 1200, height: 400 }),
          trailerUrl: `https://www.youtube.com/watch?v=${faker.string.alphanumeric(11)}`,
          durationMin: faker.number.int({ min: 85, max: 165 }),
          ageRating: faker.helpers.arrayElement(ageRatings),
          featured: idx % 5 === 0, // ~20% marcados como destaques
          status: MovieStatus.ACTIVE, // No schema apenas existe ACTIVE ou ARCHIVED
          director: faker.person.fullName(),
          language: faker.helpers.arrayElement(["pt", "en", "es", "fr"]),
          releaseDate,
        },
      });
    }),
  );

  console.log(`   ✅ ${movies.length} filmes criados\n`);

  // ── 6. Sessões (SessionMovies) e Bilhetes (SessionTickets) ────────────────
  console.log("🕒 A criar sessões para popular as secções...");

  let sessionMovieCount = 0;
  let ticketCount = 0;

  // Filtrar filmes por estreia para garantir sessões coerentes
  const releasedMovies = movies.filter((m) => m.releaseDate <= now);
  const futureMovies = movies.filter((m) => m.releaseDate > now);

  for (const room of allRooms) {
    for (let s = 0; s < CONFIG.SESSIONS_PER_ROOM; s++) {
      const scenario = s % 3;

      let movie;
      let startTime: Date;
      let saleOpensAt: Date;
      let type: SessionMovieType = SessionMovieType.NORMAL;

      if (scenario === 0) {
        // Cenário 0: EM CARTAZ (NOW_SHOWING)
        // Filme já estreou, sessão futura nos próximos 7 dias com venda aberta
        movie = faker.helpers.arrayElement(
          releasedMovies.length > 0 ? releasedMovies : movies,
        );
        startTime = faker.date.soon({ days: 7, refDate: now });
        saleOpensAt = faker.date.recent({ days: 5, refDate: now });
      } else if (scenario === 1) {
        // Cenário 1: PRÉ-VENDA (PRESALE)
        // Filme estreia no futuro, mas sessão e venda já estão abertas no sistema
        movie = faker.helpers.arrayElement(
          futureMovies.length > 0 ? futureMovies : movies,
        );
        startTime = faker.date.soon({ days: 36, refDate: movie.releaseDate });
        saleOpensAt = faker.date.recent({ days: 2, refDate: now }); // Venda aberta AGORA
        type = SessionMovieType.PREMIERE;
      } else {
        // Cenário 2: EM BREVE (COMING_SOON)
        // Filme estreia no futuro e as vendas abrem apenas mais tarde no futuro
        movie = faker.helpers.arrayElement(
          futureMovies.length > 0 ? futureMovies : movies,
        );
        saleOpensAt = new Date(now.getTime() + faker.number.int({ min: 7, max: 36 }) * 24 * 60 * 60 * 1000); // Venda abre no futuro
        startTime = new Date(saleOpensAt.getTime() + 3 * 24 * 60 * 60 * 1000);
      }

      const endTime = new Date(
        startTime.getTime() + movie.durationMin * 60_000,
      );

      const sessionMovie = await prisma.sessionMovie.create({
        data: {
          movieId: movie.id,
          roomId: room.id,
          startTime,
          endTime,
          saleOpensAt,
          price: faker.number.int({ min: 2500, max: 6000 }),
          tier: faker.helpers.arrayElement(Object.values(PricingTier)),
          type,
        },
      });

      sessionMovieCount++;

      // Gerar o mapa de cadeiras para cada sessão
      const seats = await prisma.seat.findMany({ where: { roomId: room.id } });

      const ticketsData = seats.map((seat) => ({
        sessionMovieId: sessionMovie.id,
        seatId: seat.id,
        status: TicketStatus.AVAILABLE,
      }));

      await prisma.sessionTicket.createMany({ data: ticketsData });
      ticketCount += ticketsData.length;
    }
  }

  console.log(
    `   ✅ ${sessionMovieCount} sessões criadas, ${ticketCount} bilhetes gerados\n`,
  );

  console.log("🚀 Seed concluído com sucesso!");
}

main()
  .catch((e) => {
    console.error("❌ Erro no seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });