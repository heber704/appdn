// src/app/api/ciclos/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const projetoId = searchParams.get('projeto')
  const status = searchParams.get('status')

  const ciclos = await prisma.cicloTeste.findMany({
    where: {
      ...(projetoId && { projetoId: Number(projetoId) }),
      ...(status && { status }),
    },
    include: {
      projeto: { select: { id: true, nome: true } },
      _count: { select: { itens: true, execucoes: true } },
    },
    orderBy: { criadoEm: 'desc' },
  })

  return NextResponse.json(ciclos)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await req.json()
  const { nome, projetoId, dataInicio, dataFim, status } = body

  if (!nome?.trim()) return NextResponse.json({ error: 'Nome obrigatório' }, { status: 400 })
  if (!projetoId) return NextResponse.json({ error: 'Projeto obrigatório' }, { status: 400 })
  if (!dataInicio || !dataFim) return NextResponse.json({ error: 'Datas obrigatórias' }, { status: 400 })

  const ciclo = await prisma.cicloTeste.create({
    data: {
      nome: nome.trim(),
      projetoId: Number(projetoId),
      dataInicio: new Date(dataInicio),
      dataFim: new Date(dataFim),
      status: status || 'Planejado',
    },
  })

  return NextResponse.json(ciclo, { status: 201 })
}
