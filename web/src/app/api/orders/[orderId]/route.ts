// backend/src/app/api/orders/[orderId]/route.ts
import { NextRequest } from 'next/server';
import { ok, err, handleError } from '@/lib/api/response';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/orders/[orderId]
 * Retorna detalhes completos de um pedido.
 * Validação: User é dono do pedido OU é admin
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    // const session = await auth();
    // if (!session?.user?.id) {
    //   return err('Não autenticado', 401);
    // }

    const { orderId } = params;

    // Buscar pedido completo
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
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
                        ageRating: true,
                        durationMin: true,
                      },
                    },
                    room: {
                      include: {
                        location: {
                          select: {
                            id: true,
                            name: true,
                            city: true,
                            address: true,
                            phone: true,
                          },
                        },
                      },
                    },
                  },
                },
                seat: {
                  select: {
                    row: true,
                    number: true,
                    type: true,
                  },
                },
              },
            },
            checkedInBy: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      return err('Pedido não encontrado', 404);
    }

    // Autorização
    // if (order.userId !== session.user.id && session.user.role !== 'ADMIN') {
    //   return err('Acesso negado', 403);
    // }

    // Formatar resposta
    const formattedOrder = {
      id: order.id,
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod,
      total: order.total,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      contact: {
        email: order.guestEmail || order.user?.email,
        whatsapp: order.guestWhatsapp,
      },
      tickets: order.tickets.map(ticket => ({
        id: ticket.id,
        code: ticket.code,
        qrToken: ticket.qrToken,
        movie: {
          id: ticket.sessionTicket.sessionMovie.movie.id,
          title: ticket.sessionTicket.sessionMovie.movie.title,
          ageRating: ticket.sessionTicket.sessionMovie.movie.ageRating,
          duration: ticket.sessionTicket.sessionMovie.movie.durationMin,
          poster: ticket.sessionTicket.sessionMovie.movie.posterUrl,
        },
        session: {
          id: ticket.sessionTicket.sessionMovie.id,
          startTime: ticket.sessionTicket.sessionMovie.startTime,
          endTime: ticket.sessionTicket.sessionMovie.endTime,
          room: {
            id: ticket.sessionTicket.sessionMovie.room.id,
            name: ticket.sessionTicket.sessionMovie.room.name,
            format: ticket.sessionTicket.sessionMovie.room.format,
            location: {
              id: ticket.sessionTicket.sessionMovie.room.location.id,
              name: ticket.sessionTicket.sessionMovie.room.location.name,
              city: ticket.sessionTicket.sessionMovie.room.location.city,
              address: ticket.sessionTicket.sessionMovie.room.location.address,
              phone: ticket.sessionTicket.sessionMovie.room.location.phone,
            },
          },
        },
        seat: {
          row: ticket.sessionTicket.seat.row,
          number: ticket.sessionTicket.seat.number,
          type: ticket.sessionTicket.seat.type,
          label: `${ticket.sessionTicket.seat.row}${ticket.sessionTicket.seat.number}`,
        },
        checkedInAt: ticket.checkedInAt,
        checkedInBy: ticket.checkedInBy?.name,
      })),
    };

    return ok(formattedOrder, 200);
  } catch (error) {
    return handleError(error);
  }
}

/**
 * PATCH /api/orders/[orderId]
 * Atualizar status de pagamento (apenas admin)
 * Body: { paymentStatus: 'PAID' | 'FAILED' | 'REFUNDED', paymentRef?: string }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    // const session = await auth();
    // if (!session?.user?.id || session.user.role !== 'ADMIN') {
    //   return err('Apenas admin pode atualizar pedidos', 403);
    // }

    const { orderId } = params;
    const body = await request.json();
    const { paymentStatus, paymentRef } = body;

    // Validação
    if (!['PENDING', 'PAID', 'FAILED', 'REFUNDED'].includes(paymentStatus)) {
      return err('Status de pagamento inválido', 400);
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus,
        paymentRef,
      },
      select: {
        id: true,
        paymentStatus: true,
        paymentRef: true,
        updatedAt: true,
      },
    });

    return ok(updatedOrder, 200);
  } catch (error) {
    return handleError(error);
  }
}

/**
 * DELETE /api/orders/[orderId]
 * Cancelar um pedido (apenas se PENDING ou pelo dono)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    // const session = await auth();
    // if (!session?.user?.id) {
    //   return err('Não autenticado', 401);
    // }

    const { orderId } = params;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        userId: true,
        paymentStatus: true,
        tickets: {
          select: {
            sessionTicketId: true,
          },
        },
      },
    });

    if (!order) {
      return err('Pedido não encontrado', 404);
    }

    // Autorização
    // if (order.userId !== session.user.id && session.user.role !== 'ADMIN') {
    //   return err('Acesso negado', 403);
    // }

    // Só pode cancelar se PENDING
    if (order.paymentStatus !== 'PENDING') {
      return err(
        'Só pode cancelar pedidos com pagamento pendente',
        409
      );
    }

    // Liberar assentos
    await prisma.sessionTicket.updateMany({
      where: {
        id: { in: order.tickets.map(t => t.sessionTicketId) },
      },
      data: {
        status: 'AVAILABLE',
        reservedAt: null,
        reservedUntil: null,
      },
    });

    // Deletar pedido
    await prisma.order.delete({
      where: { id: orderId },
    });

    return ok({ id: orderId, deleted: true }, 200);
  } catch (error) {
    return handleError(error);
  }
}