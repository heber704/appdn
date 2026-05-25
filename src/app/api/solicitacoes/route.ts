// src/app/api/solicitacoes/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const isAdmin = session.user.cargo === 'Administrador'

  const solicitacoes = await prisma.solicitacao.findMany({
    where: {
      ...(status && { status }),
      // Usuários comuns só veem as próprias
      ...(!isAdmin && { usuarioId: Number(session.user.id) }),
    },
    include: {
      usuario: { select: { id: true, nome: true } },
      projeto: { select: { id: true, nome: true } },
    },
    orderBy: { criadoEm: 'desc' },
  })

  return NextResponse.json(solicitacoes)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await req.json()
  const { titulo, descricao, passos, severidade, projetoId } = body

  if (!titulo?.trim()) return NextResponse.json({ error: 'Título obrigatório' }, { status: 400 })
  if (!descricao?.trim()) return NextResponse.json({ error: 'Descrição obrigatória' }, { status: 400 })

  const solicitacao = await prisma.solicitacao.create({
    data: {
      titulo: titulo.trim(),
      descricao: descricao.trim(),
      passos: passos?.trim() || null,
      severidade: severidade || 'Médio',
      status: 'Aguardando análise',
      usuarioId: Number(session.user.id),
      projetoId: projetoId ? Number(projetoId) : null,
    },
  })

  return NextResponse.json(solicitacao, { status: 201 })
}
