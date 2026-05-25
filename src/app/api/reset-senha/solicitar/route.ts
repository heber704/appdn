// src/app/api/reset-senha/solicitar/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendEmail, templateRecuperacaoSenha } from '@/lib/email'
import { randomInt } from 'crypto'

export async function POST(req: NextRequest) {
  try {
    const { login } = await req.json()
    if (!login) return NextResponse.json({ error: 'Login obrigatório' }, { status: 400 })

    const usuario = await prisma.usuario.findUnique({ where: { login } })

    if (!usuario) {
      // Resposta genérica por segurança
      return NextResponse.json({ success: true })
    }

    // Bloqueia se inativo por motivo que não seja tentativas
    if (usuario.situacao === 'Inativo' && usuario.bloqueioTipo !== 'tentativas') {
      return NextResponse.json({ error: 'Conta bloqueada. Contate o administrador.' }, { status: 403 })
    }

    // Remove tokens anteriores
    await prisma.resetSenha.deleteMany({ where: { usuarioId: usuario.id } })

    // Gera token de 6 dígitos
    const token = String(randomInt(100000, 999999))
    const expiraEm = new Date(Date.now() + 60 * 1000) // 60 segundos

    await prisma.resetSenha.create({
      data: { usuarioId: usuario.id, token, expiraEm },
    })

    // Envia e-mail
    await sendEmail({
      to: usuario.email,
      subject: 'Código de recuperação de senha',
      html: templateRecuperacaoSenha(token),
    })

    // Retorna e-mail mascarado
    const partes = usuario.email.split('@')
    const emailMascarado = `${partes[0][0]}***@${partes[1]}`

    return NextResponse.json({ success: true, emailMascarado })
  } catch {
    return NextResponse.json({ error: 'Erro ao enviar código' }, { status: 500 })
  }
}
