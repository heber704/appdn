// src/app/api/requisitos/route.ts
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
  const status = searchParams.get('status')
  const q = searchParams.get('q')

  const requisitos = await prisma.requisito.findMany({
    where: {
      ...(projetoId && { projetoId: Number(projetoId) }),
      ...(tipo && { tipo }),
      ...(status && { status }),
      ...(q && { OR: [{ titulo: { contains: q } }, { codigo: { contains: q } }] }),
    },
    include: {
      projeto: { select: { id: true, nome: true } },
      _count: { select: { casosTeste: true, bugs: true } },
    },
    orderBy: { criadoEm: 'desc' },
  })

  return NextResponse.json(requisitos)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await req.json()
  const { codigo, titulo, descricao, tipo, status, projetoId } = body

  if (!titulo?.trim()) return NextResponse.json({ error: 'Título obrigatório' }, { status: 400 })
  if (!codigo?.trim()) return NextResponse.json({ error: 'Código obrigatório' }, { status: 400 })
  if (!projetoId) return NextResponse.json({ error: 'Projeto obrigatório' }, { status: 400 })

  const requisito = await prisma.requisito.create({
    data: {
      codigo: codigo.trim(),
      titulo: titulo.trim(),
      descricao: descricao?.trim() || null,
      tipo: tipo || 'Funcional',
      status: status || 'Pendente',
      projetoId: Number(projetoId),
    },
  })

  return NextResponse.json(requisito, { status: 201 })
}
