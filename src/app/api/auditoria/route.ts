// src/app/api/auditoria/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.cargo !== 'Administrador') {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const usuarioId = searchParams.get('usuario')
  const acao = searchParams.get('acao')
  const entidade = searchParams.get('entidade')
  const page = Number(searchParams.get('page') || 1)
  const limit = 30

  const where: any = {
    ...(usuarioId && { usuarioId: Number(usuarioId) }),
    ...(acao && { acao }),
    ...(entidade && { entidade }),
  }

  const [logs, total] = await Promise.all([
    prisma.auditoria.findMany({
      where,
      include: { usuario: { select: { id: true, nome: true, login: true } } },
      orderBy: { criadoEm: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.auditoria.count({ where }),
  ])

  return NextResponse.json({ logs, total, pages: Math.ceil(total / limit) })
}
