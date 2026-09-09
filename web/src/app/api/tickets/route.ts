// // backend/src/app/api/tickets/route.ts
// import { NextRequest } from 'next/server';
// import { ok, err, handleError } from '@/lib/api/response';
// import { prisma } from '@/lib/prisma';

// /**
//  * GET /api/tickets
//  * Lista bilhetes do utilizador ou todos (se admin).
//  * Query params:
//  *  - code: filtrar por código de bilhete
//  *  - checked: 'true' | 'false' (filtrar por check-in)
//  *  - sessionId: filtrar por sessão de filme
//  *  - limit: número de registos (default: 50)
//  *  - offset: para paginação (default: 0)
//  */
// export async function GET(request: NextRequest) {
//   try {
//     // const session = await auth();
//     // if (!session?.user?.id) {
//     //   return err('Não autenticado', 401);
//     // }

//     const searchParams = request.nextUrl.searchParams;
//     const code = searchParams.get('code');
//     const checkedFilter = searchParams.get('checked');
//     const sessionId = searchParams.get('sessionId');
//     const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
//     const offset = parseInt(searchParams.get('offset') || '0');

//     // Build where clause
//     const where: any = session.user.role === 'ADMIN'
//       ? {} // Admin vê todos
//       : {
//           order: {
//             userId: session.user.id,
//           },
//         };

//     if (code) {
//       where.code = {
//         contains: code.toUpperCase(),
//         mode: 'insensitive',
//       };
//     }

//     if (checkedFilter === 'true') {
//       where.checkedInAt = { not: null };
//     } else if (checkedFilter === 'false') {
//       where.checkedInAt = null;
//     }

//     if (sessionId) {
//       where.sessionTicket = {
//         sessionMovieId: sessionId,
//       };
//     }

//     // Fetch bilhetes
//     const tickets = await prisma.ticket.findMany({
//       where,
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
//               include: {
//                 movie: {
//                   select: {
//                     id: true,
//                     title: true,
//                     posterUrl: true,
//                   },
//                 },
//                 room: {
//                   select: {
//                     name: true,
//                   },
//                 },
//               },
//             },
//             seat: {
//               select: {
//                 row: true,
//                 number: true,
//               },
//             },
//           },
//         },
//         checkedInBy: {
//           select: {
//             name: true,
//           },
//         },
//       },
//       orderBy: {
//         createdAt: 'desc',
//       },
//       take: limit,
//       skip: offset,
//     });

//     // Count total
//     const total = await prisma.ticket.count({ where });

//     // Formatar resposta
//     const formattedTickets = tickets.map(ticket => ({
//       id: ticket.id,
//       code: ticket.code,
//       qrToken: ticket.qrToken,
//       paymentStatus: ticket.order.paymentStatus,
//       movie: {
//         id: ticket.sessionTicket.sessionMovie.movie.id,
//         title: ticket.sessionTicket.sessionMovie.movie.title,
//         poster: ticket.sessionTicket.sessionMovie.movie.posterUrl,
//       },
//       session: {
//         startTime: ticket.sessionTicket.sessionMovie.startTime,
//         roomName: ticket.sessionTicket.sessionMovie.room.name,
//       },
//       seat: `${ticket.sessionTicket.seat.row}${ticket.sessionTicket.seat.number}`,
//       checkedInAt: ticket.checkedInAt,
//       checkedInBy: ticket.checkedInBy?.name,
//     }));

//     return ok(
//       {
//         data: formattedTickets,
//         pagination: {
//           total,
//           limit,
//           offset,
//           hasMore: offset + limit < total,
//         },
//       },
//       200
//     );
//   } catch (error) {
//     return handleError(error);
//   }
// }