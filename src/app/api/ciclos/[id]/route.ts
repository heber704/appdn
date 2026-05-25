// src/app/api/ciclos/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const ciclo = await prisma.cicloTeste.findUnique({
    where: { id: Number(params.id) },
    include: {
      projeto: { select: { id: true, nome: true } },
      itens: {
        include: {
          casoTeste: {
            select: { id: true, titulo: true, tipo: true, prioridade: true, status: true },
          },
        },
      },
      execucoes: {
        select: { id: true, resultado: true, iniciadoEm: true, executor: { select: { nome: true } } },
        orderBy: { iniciadoEm: 'desc' },
        take: 20,
      },
      _count: { select: { itens: true, execucoes: true } },
    },
  })

  if (!ciclo) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

  // Calcula progresso
  const resultados = ciclo.execucoes.reduce((acc: any, e) => {
    acc[e.resultado] = (acc[e.resultado] || 0) + 1
    return acc
  }, {})

  return NextResponse.json({ ...ciclo, resultados })
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await req.json()
  const ciclo = await prisma.cicloTeste.update({
    where: { id: Number(params.id) },
    data: {
      ...(body.nome && { nome: body.nome }),
      ...(body.status && { status: body.status }),
      ...(body.dataInicio && { dataInicio: new Date(body.dataInicio) }),
      ...(body.dataFim && { dataFim: new Date(body.dataFim) }),
    },
  })
  return NextResponse.json(ciclo)
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  await prisma.cicloTeste.delete({ where: { id: Number(params.id) } })
  return NextResponse.json({ success: true })
}
