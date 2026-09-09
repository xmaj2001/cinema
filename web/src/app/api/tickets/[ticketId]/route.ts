// import { NextRequest } from 'next/server';
// import { ok, err, handleError } from '@/lib/api/response';
// import { prisma } from '@/lib/prisma';

// /**
//  * GET /api/tickets/[ticketId]
//  * Retorna detalhes completos de um bilhete.
//  * Validação: User é dono do bilhete OU é staff/admin
//  */
// export async function GET(
//   request: NextRequest,
//   { params }: { params: { ticketId: string } }
// ) {
//   try {
//     const session = await auth();
//     if (!session?.user?.id) {
//       return err('Não autenticado', 401);
//     }

//     const { ticketId } = params;

//     // Buscar bilhete completo
//     const ticket = await prisma.ticket.findUnique({
//       where: { id: ticketId },
//       include: {
//         order: {
//           select: {
//             id: true,
//             userId: true,
//             paymentStatus: true,
//             guestEmail: true,
//           },
//         },
//         sessionTicket: {
//           include: {
//             sessionMovie: {
//               include: {
//                 movie: {
//                   select: {
//                     id: true,
//                     title: true,
//                     posterUrl: true,
//                     ageRating: true,
//                     durationMin: true,
//                   },
//                 },
//                 room: {
//                   include: {
//                     location: {
//                       select: {
//                         id: true,
//                         name: true,
//                         city: true,
//                         address: true,
//                         phone: true,
//                         latitude: true,
//                         longitude: true,
//                       },
//                     },
//                   },
//                 },
//               },
//             },
//             seat: {
//               select: {
//                 row: true,
//                 number: true,
//                 type: true,
//               },
//             },
//           },
//         },
//         checkedInBy: {
//           select: {
//             id: true,
//             name: true,
//           },
//         },
//       },
//     });

//     if (!ticket) {
//       return err('Bilhete não encontrado', 404);
//     }

//     // Autorização
//     const isOwner = ticket.order.userId === session.user.id;
//     const isStaff = ['STAFF', 'ADMIN'].includes(session.user.role || '');

//     if (!isOwner && !isStaff) {
//       return err('Acesso negado', 403);
//     }

//     // Validação de pagamento (apenas owner vê se não pago)
//     if (!isStaff && ticket.order.paymentStatus !== 'PAID') {
//       return err('Pagamento não confirmado', 402);
//     }

//     // Formatar resposta
//     const formattedTicket = {
//       id: ticket.id,
//       code: ticket.code,
//       qrToken: ticket.qrToken,
//       paymentStatus: ticket.order.paymentStatus,
//       isValid:
//         ticket.order.paymentStatus === 'PAID' &&
//         !ticket.checkedInAt &&
//         new Date(ticket.sessionTicket.sessionMovie.startTime) > new Date(),
//       movie: {
//         id: ticket.sessionTicket.sessionMovie.movie.id,
//         title: ticket.sessionTicket.sessionMovie.movie.title,
//         ageRating: ticket.sessionTicket.sessionMovie.movie.ageRating,
//         duration: ticket.sessionTicket.sessionMovie.movie.durationMin,
//         poster: ticket.sessionTicket.sessionMovie.movie.posterUrl,
//       },
//       session: {
//         id: ticket.sessionTicket.sessionMovie.id,
//         startTime: ticket.sessionTicket.sessionMovie.startTime,
//         endTime: ticket.sessionTicket.sessionMovie.endTime,
//         room: {
//           id: ticket.sessionTicket.sessionMovie.room.id,
//           name: ticket.sessionTicket.sessionMovie.room.name,
//           format: ticket.sessionTicket.sessionMovie.room.format,
//           location: {
//             id: ticket.sessionTicket.sessionMovie.room.location.id,
//             name: ticket.sessionTicket.sessionMovie.room.location.name,
//             city: ticket.sessionTicket.sessionMovie.room.location.city,
//             address: ticket.sessionTicket.sessionMovie.room.location.address,
//             phone: ticket.sessionTicket.sessionMovie.room.location.phone,
//             coordinates: {
//               lat: ticket.sessionTicket.sessionMovie.room.location.latitude,
//               lng: ticket.sessionTicket.sessionMovie.room.location.longitude,
//             },
//           },
//         },
//       },
//       seat: {
//         row: ticket.sessionTicket.seat.row,
//         number: ticket.sessionTicket.seat.number,
//         type: ticket.sessionTicket.seat.type,
//         label: `${ticket.sessionTicket.seat.row}${ticket.sessionTicket.seat.number}`,
//       },
//       checkedIn: {
//         at: ticket.checkedInAt,
//         by: ticket.checkedInBy?.name,
//       },
//     };

//     return ok(formattedTicket, 200);
//   } catch (error) {
//     return handleError(error);
//   }
// }

// /**
//  * POST /api/tickets/[ticketId]
//  * Operações no bilhete (validate, check-in, etc)
//  * Body: { action: 'validate' | 'check-in' }
//  */
// export async function POST(
//   request: NextRequest,
//   { params }: { params: { ticketId: string } }
// ) {
//   try {
//     const session = await auth();
//     if (!session?.user?.id) {
//       return err('Não autenticado', 401);
//     }

//     const { ticketId } = params;
//     const body = await request.json();
//     const { action } = body;

//     // Validação
//     if (!action || !['validate', 'check-in'].includes(action)) {
//       return err('Ação inválida', 400);
//     }

//     // Buscar bilhete
//     const ticket = await prisma.ticket.findUnique({
//       where: { id: ticketId },
//       include: {
//         order: {
//           select: {
//             id: true,
//             paymentStatus: true,
//           },
//         },
//         sessionTicket: {
//           include: {
//             sessionMovie: {
//               select: {
//                 id: true,
//                 startTime: true,
//               },
//             },
//           },
//         },
//       },
//     });

//     if (!ticket) {
//       return err('Bilhete não encontrado', 404);
//     }

//     // ─────────────────────────────────────
//     // ACTION: VALIDATE
//     // ─────────────────────────────────────
//     if (action === 'validate') {
//       const now = new Date();
//       const sessionStart = new Date(
//         ticket.sessionTicket.sessionMovie.startTime
//       );
//       const sessionEnd = new Date(
//         new Date(ticket.sessionTicket.sessionMovie.startTime).getTime() +
//           180 * 60000
//       ); // +3h

//       const isValid =
//         ticket.order.paymentStatus === 'PAID' &&
//         !ticket.checkedInAt &&
//         now >= new Date(sessionStart.getTime() - 30 * 60000) && // 30min antes
//         now <= sessionEnd;

//       const validationResult = {
//         id: ticket.id,
//         code: ticket.code,
//         isValid,
//         reasons: {
//           paid: ticket.order.paymentStatus === 'PAID',
//           notCheckedIn: !ticket.checkedInAt,
//           sessionWindowOpen:
//             now >= new Date(sessionStart.getTime() - 30 * 60000) &&
//             now <= sessionEnd,
//         },
//       };

//       return ok(validationResult, 200);
//     }

//     // ─────────────────────────────────────
//     // ACTION: CHECK-IN
//     // ─────────────────────────────────────
//     if (action === 'check-in') {
//       // Apenas staff/admin pode fazer check-in
//       if (!['STAFF', 'ADMIN'].includes(session.user.role || '')) {
//         return err('Apenas staff pode fazer check-in', 403);
//       }

//       // Validações
//       if (ticket.order.paymentStatus !== 'PAID') {
//         return err('Pagamento não confirmado', 402);
//       }

//       if (ticket.checkedInAt) {
//         return err('Bilhete já foi utilizado', 409);
//       }

//       const now = new Date();
//       const sessionStart = new Date(
//         ticket.sessionTicket.sessionMovie.startTime
//       );
//       const sessionEnd = new Date(
//         new Date(ticket.sessionTicket.sessionMovie.startTime).getTime() +
//           180 * 60000
//       );

//       if (
//         now < new Date(sessionStart.getTime() - 30 * 60000) ||
//         now > sessionEnd
//       ) {
//         return err(
//           'Fora da janela de check-in (30min antes até 3h depois do início)',
//           409
//         );
//       }

//       // Fazer check-in
//       const updatedTicket = await prisma.ticket.update({
//         where: { id: ticketId },
//         data: {
//           checkedInAt: now,
//           checkedInById: session.user.id,
//         },
//         select: {
//           id: true,
//           code: true,
//           checkedInAt: true,
//         },
//       });

//       return ok(
//         {
//           message: 'Check-in realizado com sucesso',
//           ticket: updatedTicket,
//         },
//         200
//       );
//     }
//   } catch (error) {
//     return handleError(error);
//   }
// }