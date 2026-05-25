// src/lib/auth.ts
import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { compare } from 'bcryptjs'
import { prisma } from './prisma'

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt', maxAge: 8 * 60 * 60 }, // 8 horas
  pages: {
    signIn: '/login',
    error: '/login',
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        login: { label: 'Login', type: 'text' },
        senha: { label: 'Senha', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.login || !credentials?.senha) return null

        const usuario = await prisma.usuario.findUnique({
          where: { login: credentials.login },
        })

        if (!usuario) return null

        if (usuario.situacao === 'Inativo') {
          throw new Error('CONTA_INATIVA')
        }

        const senhaValida = await compare(credentials.senha, usuario.senha)
        if (!senhaValida) return null

        // Registra login na auditoria
        await prisma.auditoria.create({
          data: {
            usuarioId: usuario.id,
            acao: 'LOGIN',
            entidade: 'usuarios',
            entidadeId: usuario.id,
            detalhes: `Login realizado com sucesso`,
          },
        })

        return {
          id: String(usuario.id),
          name: usuario.nome,
          email: usuario.email,
          login: usuario.login,
          cargo: usuario.cargo,
          situacao: usuario.situacao,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.login = (user as any).login
        token.cargo = (user as any).cargo
        token.situacao = (user as any).situacao
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.login = token.login as string
        session.user.cargo = token.cargo as string
        session.user.situacao = token.situacao as string
      }
      return session
    },
  },
}

// Extend NextAuth types
declare module 'next-auth' {
  interface User {
    login?: string
    cargo?: string
    situacao?: string
  }
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      login: string
      cargo: string
      situacao: string
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string
    login?: string
    cargo?: string
    situacao?: string
  }
}
