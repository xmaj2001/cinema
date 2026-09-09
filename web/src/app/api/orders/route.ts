// backend/src/app/api/orders/route.ts
import { NextRequest, NextResponse } from "next/server";
import { ok, err, handleError } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/orders
 * Lista pedidos do utilizador autenticado.
 * Query params:
 *  - status: PENDING | PAID | FAILED | REFUNDED (filtrar por status de pagamento)
 *  - limit: número de registos (default: 50)
 *  - offset: para paginação (default: 0)
 */
export async function GET(request: NextRequest) {
  try {
    // Autenticação
    // const session = await auth();
    // if (!session?.user?.id) {
    //   return err('Não autenticado', 401);
    // }

    // Query params
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
    const offset = parseInt(searchParams.get("offset") || "0");

    // Build where clause
    const where: any = {
      //   userId: session.user.id,
    };

    if (status && ["PENDING", "PAID", "FAILED", "REFUNDED"].includes(status)) {
      where.paymentStatus = status;
    }

    // Fetch pedidos com tickets
    const orders = await prisma.order.findMany({
      where,
      include: {
        tickets: {
          include: {
            sessionTicket: {
              include: {
                sessionMovie: {
                  include: {
                    movie: {
                      select: {
                        id: true,
                        title: true,
                        posterUrl: true,
                      },
                    },
                    room: {
                      select: {
                        id: true,
                        name: true,
                      },
                    },
                  },
                },
                seat: {
                  select: {
                    row: true,
                    number: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
      skip: offset,
    });

    // Count total para paginação
    const total = await prisma.order.count({ where });

    // Formatar resposta
    const formattedOrders = orders.map((order) => ({
      id: order.id,
      paymentStatus: order.paymentStatus,
      total: order.total,
      paymentMethod: order.paymentMethod,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      tickets: order.tickets.map((ticket) => ({
        id: ticket.id,
        code: ticket.code,
        movieTitle: ticket.sessionTicket.sessionMovie.movie.title,
        moviePoster: ticket.sessionTicket.sessionMovie.movie.posterUrl,
        roomName: ticket.sessionTicket.sessionMovie.room.name,
        seatLabel: `${ticket.sessionTicket.seat.row}${ticket.sessionTicket.seat.number}`,
        sessionTime: ticket.sessionTicket.sessionMovie.startTime,
        checkedInAt: ticket.checkedInAt,
      })),
    }));

    return ok(
      {
        data: formattedOrders,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total,
        },
      },
      200,
    );
  } catch (error) {
    return handleError(error);
  }
}

/**
 * POST /api/orders
 * Criar um novo pedido após checkout.
 * Body:
 * {
 *   seats: string[] (SessionTicket IDs)
 *   email?: string
 *   whatsapp?: string
 *   paymentMethod: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // const session = await auth();
    const body = await request.json();

    const { seats, email, whatsapp, paymentMethod } = body;

    // Validações
    if (!seats || !Array.isArray(seats) || seats.length === 0) {
      return err("Deve fornecer pelo menos 1 assento", 400);
    }

    if (!paymentMethod || typeof paymentMethod !== "string") {
      return err("Método de pagamento inválido", 400);
    }

    if (!email && !whatsapp) {
      return err("Deve fornecer email ou WhatsApp", 400);
    }

    // Validar que os assentos existem e estão disponíveis
    const sessionTickets = await prisma.sessionTicket.findMany({
      where: {
        id: { in: seats },
      },
      include: {
        sessionMovie: true,
      },
    });

    if (sessionTickets.length !== seats.length) {
      return err("Um ou mais assentos não foram encontrados", 404);
    }

    // Verificar se todos os assentos estão disponíveis
    const unavailableSeats = sessionTickets.filter(
      (st) => st.status !== "AVAILABLE",
    );
    if (unavailableSeats.length > 0) {
      return err(
        `${unavailableSeats.length} assento(s) não está(ão) disponível(eis)`,
        409,
      );
    }

    // Calcular total
    const uniqueSessions = new Set(
      sessionTickets.map((st) => st.sessionMovie.id),
    );

    if (uniqueSessions.size > 1) {
      return err("Todos os assentos devem ser da mesma sessão", 400);
    }

    const sessionId = Array.from(uniqueSessions)[0];
    const sessionMovie = await prisma.sessionMovie.findUnique({
      where: { id: sessionId },
    });

    if (!sessionMovie) {
      return err("Sessão não encontrada", 404);
    }

    const total = seats.length * sessionMovie.price;

    // Criar order e tickets em transação
    const order = await prisma.order.create({
      data: {
        // userId: session?.user?.id,
        guestEmail: email,
        guestWhatsapp: whatsapp,
        total,
        paymentMethod,
        paymentStatus: "PENDING",
        tickets: {
          create: sessionTickets.map((st, index) => ({
            sessionTicketId: st.id,
            code: generateTicketCode(),
            qrToken: generateQrToken(),
          })),
        },
      },
      include: {
        tickets: true,
      },
    });

    // Atualizar SessionTickets para SOLD
    await prisma.sessionTicket.updateMany({
      where: {
        id: { in: seats },
      },
      data: {
        status: "SOLD",
        reservedAt: new Date(),
      },
    });

    return ok(
      {
        id: order.id,
        paymentStatus: order.paymentStatus,
        total: order.total,
        ticketCount: order.tickets.length,
        createdAt: order.createdAt,
      },
      201,
    );
  } catch (error) {
    return handleError(error);
  }
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

/**
 * Gera código de bilhete curto (digitável na porta)
 * Formato: CZ-ABC123XY (10 caracteres)
 */
function generateTicketCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "CZ-";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Gera token longo para QR code
 * Formato: UUID-like token
 */
function generateQrToken(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}
