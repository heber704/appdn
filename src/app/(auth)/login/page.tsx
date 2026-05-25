// src/app/(auth)/login/page.tsx
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { LoginForm } from './login-form'

export const metadata = { title: 'Login — App Development Notifier' }

export default async function LoginPage() {
  const session = await getServerSession(authOptions)
  if (session) redirect('/dashboard')

  return (
    <div className="animate-fade-up opacity-0" style={{ animationFillMode: 'forwards' }}>
      {/* Logo / Brand */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-accent/15 border border-accent/30 mb-4">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-accent">
            <path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <h1 className="font-display text-2xl font-bold text-text-primary tracking-tight">
          App Development Notifier
        </h1>
        <p className="text-text-secondary text-sm mt-1">Sistema de Testes de Software</p>
      </div>

      {/* Card do formulário */}
      <div className="card-elevated">
        <h2 className="font-display text-lg font-semibold text-text-primary mb-1">
          Acessar o sistema
        </h2>
        <p className="text-text-secondary text-sm mb-6">
          Digite suas credenciais para continuar
        </p>

        <LoginForm />

        <div className="divider" />

        <div className="flex items-center justify-between text-sm">
          <a href="/cadastro" className="text-text-secondary hover:text-accent transition-colors">
            Criar conta
          </a>
          <a href="/recuperar-senha" className="text-text-secondary hover:text-accent transition-colors">
            Esqueci minha senha
          </a>
        </div>
      </div>

      {/* Footer */}
      <p className="text-center text-text-muted text-xs mt-6">
        © {new Date().getFullYear()} App Development Notifier
      </p>
    </div>
  )
}
