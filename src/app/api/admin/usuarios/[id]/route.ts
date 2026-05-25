// src/app/api/usuarios/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.cargo !== 'Administrador') {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  const body = await req.json()
  const { nome, email, login, cargo, situacao, bloqueioTipo } = body

  const usuario = await prisma.usuario.update({
    where: { id: Number(params.id) },
    data: {
      ...(nome && { nome }),
      ...(email && { email }),
      ...(login && { login }),
      ...(cargo && { cargo }),
      ...(situacao && { situacao }),
      ...(bloqueioTipo !== undefined && { bloqueioTipo }),
    },
    select: { id: true, nome: true, login: true, cargo: true, situacao: true, bloqueioTipo: true },
  })

  await prisma.auditoria.create({
    data: {
      usuarioId: Number(session.user.id),
      acao: 'EDITAR',
      entidade: 'usuarios',
      entidadeId: usuario.id,
      detalhes: `Usuário "${usuario.login}" editado pelo admin`,
    },
  })

  return NextResponse.json(usuario)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.cargo !== 'Administrador') {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  if (String(params.id) === session.user.id) {
    return NextResponse.json({ error: 'Não pode excluir a própria conta' }, { status: 400 })
  }

  const usuario = await prisma.usuario.findUnique({ where: { id: Number(params.id) } })
  if (!usuario) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

  await prisma.usuario.delete({ where: { id: Number(params.id) } })

  await prisma.auditoria.create({
    data: {
      usuarioId: Number(session.user.id),
      acao: 'EXCLUIR',
      entidade: 'usuarios',
      entidadeId: Number(params.id),
      detalhes: `Usuário "${usuario.login}" excluído`,
    },
  })

  return NextResponse.json({ success: true })
}
