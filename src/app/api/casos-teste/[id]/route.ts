import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const caso = await prisma.casoTeste.findUnique({
    where: { id: Number(params.id) },
    include: {
      projeto: { select: { id: true, nome: true } },
      requisito: { select: { id: true, codigo: true, titulo: true } },
      passos: { orderBy: { ordem: 'asc' } },
      _count: { select: { execucoes: true } },
    },
  })

  if (!caso) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })
  return NextResponse.json({ caso })
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await req.json()
  const { titulo, descricao, preCondicoes, posCondicoes, tipo, prioridade, projetoId, requisitoId, passos } = body

  if (!titulo?.trim()) return NextResponse.json({ error: 'Título obrigatório' }, { status: 400 })

  // Delete existing passos and recreate
  await prisma.passoTeste.deleteMany({ where: { casoTesteId: Number(params.id) } })

  const caso = await prisma.casoTeste.update({
    where: { id: Number(params.id) },
    data: {
      titulo: titulo.trim(),
      descricao: descricao?.trim() || null,
      preCondicoes: preCondicoes?.trim() || null,
      posCondicoes: posCondicoes?.trim() || null,
      tipo: tipo || 'Funcional',
      prioridade: prioridade || 'Média',
      ...(projetoId && { projetoId: Number(projetoId) }),
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

  return NextResponse.json(caso)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  await prisma.casoTeste.delete({ where: { id: Number(params.id) } })
  return NextResponse.json({ ok: true })
}
