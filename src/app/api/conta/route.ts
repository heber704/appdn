// src/app/api/conta/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendEmail, templateDesativacaoConta } from '@/lib/email'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const usuario = await prisma.usuario.findUnique({
    where: { id: Number(session.user.id) },
    select: {
      id: true, nome: true, email: true, login: true,
      cargo: true, situacao: true, criadoEm: true,
      fotoPerfil: true,
    },
  })
  if (!usuario) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

  const { fotoPerfil, ...rest } = usuario
  return NextResponse.json({
    ...rest,
    temFoto: !!fotoPerfil,
  })
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await req.json()
  const { nome, email, login } = body

  if (!nome?.trim()) return NextResponse.json({ error: 'Nome obrigatório' }, { status: 400 })
  if (!email?.trim()) return NextResponse.json({ error: 'E-mail obrigatório' }, { status: 400 })
  if (!login?.trim()) return NextResponse.json({ error: 'Login obrigatório' }, { status: 400 })

  // Verifica duplicidade (excluindo o próprio)
  const existe = await prisma.usuario.findFirst({
    where: {
      OR: [{ login }, { email }],
      NOT: { id: Number(session.user.id) },
    },
  })
  if (existe) {
    return NextResponse.json({
      error: existe.login === login ? 'Login já em uso' : 'E-mail já em uso',
    }, { status: 409 })
  }

  const usuario = await prisma.usuario.update({
    where: { id: Number(session.user.id) },
    data: { nome: nome.trim(), email: email.trim(), login: login.trim() },
    select: { id: true, nome: true, email: true, login: true, cargo: true, situacao: true },
  })

  await prisma.auditoria.create({
    data: {
      usuarioId: Number(session.user.id),
      acao: 'EDITAR',
      entidade: 'usuarios',
      entidadeId: usuario.id,
      detalhes: 'Dados do perfil atualizados',
    },
  })

  return NextResponse.json(usuario)
}
