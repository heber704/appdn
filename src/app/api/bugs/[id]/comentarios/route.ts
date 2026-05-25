// src/app/api/bugs/[id]/comentarios/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { texto } = await req.json()
  if (!texto?.trim()) return NextResponse.json({ error: 'Texto obrigatório' }, { status: 400 })

  const comentario = await prisma.comentarioBug.create({
    data: {
      bugId: Number(params.id),
      usuarioId: Number(session.user.id),
      texto: texto.trim(),
    },
    include: { usuario: { select: { id: true, nome: true } } },
  })

  return NextResponse.json(comentario, { status: 201 })
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { comentarioId } = await req.json()

  const comentario = await prisma.comentarioBug.findUnique({ where: { id: Number(comentarioId) } })
  if (!comentario) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

  // Só o autor ou admin pode excluir
  if (comentario.usuarioId !== Number(session.user.id) && session.user.cargo !== 'Administrador') {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  await prisma.comentarioBug.delete({ where: { id: Number(comentarioId) } })
  return NextResponse.json({ success: true })
}
