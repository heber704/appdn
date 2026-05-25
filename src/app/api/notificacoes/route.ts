// src/app/api/notificacoes/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const notificacoes = await prisma.notificacao.findMany({
    where: { usuarioId: Number(session.user.id) },
    orderBy: { criadoEm: 'desc' },
    take: 50,
  })

  return NextResponse.json(notificacoes)
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { ids, todas } = await req.json()

  if (todas) {
    await prisma.notificacao.updateMany({
      where: { usuarioId: Number(session.user.id), lida: false },
      data: { lida: true },
    })
  } else if (ids?.length > 0) {
    await prisma.notificacao.updateMany({
      where: { id: { in: ids }, usuarioId: Number(session.user.id) },
      data: { lida: true },
    })
  }

  return NextResponse.json({ success: true })
}
