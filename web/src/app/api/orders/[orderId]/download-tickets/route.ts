import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPdfGenerator, TicketPdfData } from "@/lib/features/ticketPdf";

/**
 * GET /api/orders/[orderId]/download-tickets
 * Gera e retorna PDF de bilhetes para um pedido
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> },
) {
  try {
    const { orderId } = await params;

    console.log("Order ID:", orderId);
    if (!orderId || typeof orderId !== "string") {
      return NextResponse.json(
        { error: "ID do pedido inválido" },
        { status: 400 },
      );
    }

    // Buscar pedido com todas as relações necessárias
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        tickets: {
          include: {
            sessionTicket: {
              include: {
                sessionMovie: {
                  include: {
                    movie: true,
                    room: {
                      include: {
                        location: true,
                      },
                    },
                  },
                },
                seat: true,
              },
            },
          },
        },
        user: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Pedido não encontrado" },
        { status: 404 },
      );
    }

    if (!order.tickets || order.tickets.length === 0) {
      return NextResponse.json(
        { error: "Nenhum bilhete associado a este pedido" },
        { status: 400 },
      );
    }

    if (order.paymentStatus !== "PAID") {
      return NextResponse.json(
        { error: "Pagamento não confirmado. Bilhetes indisponíveis." },
        { status: 403 },
      );
    }

    // Mapeamento dos dados para o PDF
    const ticketsPdfData: TicketPdfData[] = order.tickets.map((ticket) => {
      const { sessionTicket } = ticket;
      const { sessionMovie, seat } = sessionTicket;
      const { movie, room } = sessionMovie;
      const { location } = room;

      const formattedTime = new Intl.DateTimeFormat("pt-PT", {
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(sessionMovie.startTime));

      return {
        movieTitle: movie.title,
        movieAgeRating: movie.ageRating,
        movieDuration: movie.durationMin,
        roomName: room.name,
        roomFormat: room.format,
        locationName: location.name,
        sessionDate: sessionMovie.startTime,
        sessionTime: formattedTime,
        ticketCode: ticket.code,
        qrToken: ticket.qrToken,
        seatRow: seat.row,
        seatNumber: seat.number,
        seatType: seat.type,
        price: sessionMovie.price,
        email: order.guestEmail || order.user?.email,
        whatsapp: order.guestWhatsapp || order.user?.whatsapp,
        paymentMethod: order.paymentMethod || "Desconhecido",
      };
    });

    // Gerar PDF
    const pdfGenerator = await getPdfGenerator();
    const pdfBuffer =
      await pdfGenerator.generateMultipleTicketsPdf(ticketsPdfData);

    const rawMovieTitle =
      order.tickets[0]?.sessionTicket.sessionMovie.movie.title || "bilhete";
    const movieTitleSlug = rawMovieTitle
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-");

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="cinemax-bilhetes-${movieTitleSlug}.pdf"`,
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (error) {
    console.error("Erro ao gerar PDF de bilhetes:", error);
    return NextResponse.json(
      {
        error: "Erro ao gerar PDF de bilhetes",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 },
    );
  }
}

/**
 * POST /api/orders/[orderId]/download-tickets
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> },
) {
  try {
    const { deliveryMethod } = await request.json();

    if (!["email", "whatsapp"].includes(deliveryMethod)) {
      return NextResponse.json(
        { error: "Método de entrega inválido" },
        { status: 400 },
      );
    }

    return await GET(request, { params });
  } catch (error) {
    console.error("Erro no POST de bilhetes:", error);
    return NextResponse.json(
      { error: "Erro ao processar pedido" },
      { status: 500 },
    );
  }
}
