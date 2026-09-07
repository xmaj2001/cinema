import { client } from "@/lib/trigger/presale-notifications";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { movieId, sessionId, saleOpensAt } = body;

    if (!movieId || !sessionId || !saleOpensAt) {
      return NextResponse.json(
        {
          error: "Faltam campos obrigatórios: movieId, sessionId, saleOpensAt",
        },
        { status: 400 }
      );
    }

    // Dispara o evento no Trigger.dev
    const run = await client.sendEvent({
      name: "movie.presale.opened",
      data: {
        movieId,
        sessionId,
        saleOpensAt: new Date(saleOpensAt).toISOString(),
      },
    });

    console.log(`✅ Evento disparado com sucesso! Run ID: ${run.id}`);

    return NextResponse.json({
      success: true,
      runId: run.id,
      message: "Evento de pré-venda agendado com sucesso!",
    });
  } catch (error) {
    console.error("Pau ao disparar evento:", error);
    return NextResponse.json(
      { error: "Falha ao processar evento" },
      { status: 500 }
    );
  }
}