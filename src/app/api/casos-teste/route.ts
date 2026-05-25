// src/app/api/casos-teste/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const projetoId = searchParams.get('projeto')
  const tipo = searchParams.get('tipo')
  const prioridade = searchParams.get('prioridade')
  const q = searchParams.get('q')

  const casos = await prisma.casoTeste.findMany({
    where: {
      ...(projetoId && { projetoId: Number(projetoId) }),
      ...(tipo && { tipo }),
      ...(prioridade && { prioridade }),
      ...(q && { OR: [{ titulo: { contains: q } }, { descricao: { contains: q } }] }),
    },
    include: {
      projeto: { select: { id: true, nome: true } },
      requisito: { select: { id: true, titulo: true } },
      _count: { select: { passos: true, execucoes: true } },
    },
    orderBy: { criadoEm: 'desc' },
  })

  return NextResponse.json(casos)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await req.json()
  const { titulo, descricao, preCondicoes, posCondicoes, tipo, prioridade, projetoId, requisitoId, passos } = body

  if (!titulo?.trim()) return NextResponse.json({ error: 'Título obrigatório' }, { status: 400 })
  if (!projetoId) return NextResponse.json({ error: 'Projeto obrigatório' }, { status: 400 })

  const caso = await prisma.casoTeste.create({
    data: {
      titulo: titulo.trim(),
      descricao: descricao?.trim() || null,
      preCondicoes: preCondicoes?.trim() || null,
      posCondicoes: posCondicoes?.trim() || null,
      tipo: tipo || 'Funcional',
      prioridade: prioridade || 'Média',
      status: 'Pendente',
      projetoId: Number(projetoId),
      requisitoId: requisitoId ? Number(requisitoId) : null,
      passos: passos?.length > 0 ? {
        create: passos.map((p: any, i: number) => ({
          ordem: i + 1,
          descricao: p.descricao,
          resultadoEsperado: p.resultadoEsperado,
        })),
      } : undefined,
    },
    include: { passos: true },
  })

  return NextResponse.json(caso, { status: 201 })
}
