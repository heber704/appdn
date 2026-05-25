// src/app/api/execucoes/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { casoTesteId, cicloId, resultado, observacoes, resultadosPassos } = await req.json()
  if (!casoTesteId) return NextResponse.json({ error: 'Caso de teste obrigatório' }, { status: 400 })

  const execucao = await prisma.execucaoTeste.create({
    data: {
      casoTesteId: Number(casoTesteId),
      cicloId: cicloId ? Number(cicloId) : null,
      executorId: Number(session.user.id),
      resultado: resultado || 'Não executado',
      observacoes: observacoes?.trim() || null,
      finalizadoEm: new Date(),
      resultadosPassos: resultadosPassos?.length > 0 ? {
        create: resultadosPassos.map((r: any) => ({
          passoId: r.passoId,
          resultado: r.resultado,
          observacao: r.observacao?.trim() || null,
        })),
      } : undefined,
    },
    include: {
      casoTeste: { select: { titulo: true } },
      executor: { select: { nome: true } },
    },
  })

  // Se reprovado, atualiza status do caso
  if (resultado === 'Reprovado') {
    await prisma.casoTeste.update({
      where: { id: Number(casoTesteId) },
      data: { status: 'Reprovado' },
    })
  } else if (resultado === 'Aprovado') {
    await prisma.casoTeste.update({
      where: { id: Number(casoTesteId) },
      data: { status: 'Aprovado' },
    })
  }

  return NextResponse.json(execucao, { status: 201 })
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const cicloId = searchParams.get('cicloId')
  const casoTesteId = searchParams.get('casoTesteId')

  const execucoes = await prisma.execucaoTeste.findMany({
    where: {
      ...(cicloId && { cicloId: Number(cicloId) }),
      ...(casoTesteId && { casoTesteId: Number(casoTesteId) }),
    },
    include: {
      casoTeste: { select: { id: true, titulo: true } },
      executor: { select: { id: true, nome: true } },
    },
    orderBy: { iniciadoEm: 'desc' },
    take: 100,
  })

  return NextResponse.json({ execucoes })
}
