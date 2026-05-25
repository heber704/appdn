// src/app/api/reset-senha/redefinir/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const { login, token, novaSenha } = await req.json()

    if (!login || !token || !novaSenha) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 })
    }

    if (novaSenha.length < 6) {
      return NextResponse.json({ error: 'Senha muito curta (mínimo 6 caracteres)' }, { status: 400 })
    }

    const usuario = await prisma.usuario.findUnique({ where: { login } })
    if (!usuario) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })

    const reset = await prisma.resetSenha.findFirst({
      where: {
        usuarioId: usuario.id,
        token,
        expiraEm: { gt: new Date() },
      },
    })

    if (!reset) {
      return NextResponse.json({ error: 'Código inválido ou expirado' }, { status: 400 })
    }

    const senhaHash = await hash(novaSenha, 12)

    // Salva nova senha, reativa conta e limpa bloqueio
    await prisma.usuario.update({
      where: { id: usuario.id },
      data: {
        senha: senhaHash,
        situacao: 'Ativo',
        bloqueioTipo: null,
      },
    })

    // Remove tokens usados
    await prisma.resetSenha.deleteMany({ where: { usuarioId: usuario.id } })

    return NextResponse.json({ success: true, login })
  } catch {
    return NextResponse.json({ error: 'Erro ao redefinir senha' }, { status: 500 })
  }
}
