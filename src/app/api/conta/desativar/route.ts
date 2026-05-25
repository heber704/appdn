// src/app/api/conta/desativar/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendEmail, templateDesativacaoConta } from '@/lib/email'

export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const usuario = await prisma.usuario.findUnique({
    where: { id: Number(session.user.id) },
    select: { id: true, nome: true, login: true },
  })
  if (!usuario) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })

  // Desativa a conta
  await prisma.usuario.update({
    where: { id: usuario.id },
    data: { situacao: 'Inativo', bloqueioTipo: 'usuario' },
  })

  // Notifica o administrador por e-mail
  const admin = await prisma.usuario.findFirst({
    where: { cargo: 'Administrador', situacao: 'Ativo' },
    select: { email: true },
  })

  if (admin?.email) {
    await sendEmail({
      to: admin.email,
      subject: 'Conta desativada pelo usuário',
      html: templateDesativacaoConta(usuario.nome, usuario.login),
    }).catch(() => null) // Silencia erros de email
  }

  await prisma.auditoria.create({
    data: {
      usuarioId: usuario.id,
      acao: 'DESATIVAR_CONTA',
      entidade: 'usuarios',
      entidadeId: usuario.id,
      detalhes: `Usuário "${usuario.login}" desativou a própria conta`,
    },
  })

  return NextResponse.json({ success: true })
}
