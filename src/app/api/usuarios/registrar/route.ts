// src/app/api/usuarios/registrar/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const schema = z.object({
  nome: z.string().min(2, 'Nome muito curto'),
  email: z.string().email('E-mail inválido'),
  login: z.string().min(3, 'Login muito curto'),
  senha: z.string().min(6, 'Senha muito curta (mínimo 6 caracteres)'),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const data = schema.parse(body)

    // Verifica login duplicado
    const existe = await prisma.usuario.findUnique({ where: { login: data.login } })
    if (existe) {
      return NextResponse.json({ error: 'Login já existe' }, { status: 409 })
    }

    // Verifica e-mail duplicado
    const emailExiste = await prisma.usuario.findUnique({ where: { email: data.email } })
    if (emailExiste) {
      return NextResponse.json({ error: 'E-mail já cadastrado' }, { status: 409 })
    }

    const senhaHash = await hash(data.senha, 12)

    const usuario = await prisma.usuario.create({
      data: {
        nome: data.nome,
        email: data.email,
        login: data.login,
        senha: senhaHash,
        cargo: 'Administrador - Designar um cargo',
        situacao: 'Ativo',
      },
      select: { id: true, nome: true, login: true, email: true },
    })

    return NextResponse.json({ success: true, usuario }, { status: 201 })
  } catch (err: any) {
    if (err?.errors) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
