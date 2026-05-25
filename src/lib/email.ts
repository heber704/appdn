// src/lib/email.ts
interface EmailPayload {
  to: string
  subject: string
  html: string
}

export async function sendEmail({ to, subject, html }: EmailPayload) {
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': process.env.BREVO_API_KEY!,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sender: { name: 'App Development Notifier', email: process.env.EMAIL_FROM },
      to: [{ email: to }],
      subject,
      htmlContent: html,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    console.error('Email error:', err)
    throw new Error('Falha ao enviar e-mail')
  }

  return res.json()
}

export function templateRecuperacaoSenha(token: string) {
  return `
    <div style="font-family: 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; background: #0a0a0f; color: #f0f0f8; padding: 40px; border-radius: 16px; border: 1px solid rgba(108,99,255,0.3);">
      <div style="text-align: center; margin-bottom: 32px;">
        <h1 style="color: #6c63ff; font-size: 28px; margin: 0;">App Development Notifier</h1>
        <p style="color: #8888aa; margin-top: 8px;">Recuperação de senha</p>
      </div>
      <p style="color: #f0f0f8; font-size: 16px;">Use o código abaixo para redefinir sua senha. Ele expira em <strong>60 segundos</strong>.</p>
      <div style="background: rgba(108,99,255,0.15); border: 1px solid rgba(108,99,255,0.4); border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
        <span style="font-size: 48px; font-weight: 800; letter-spacing: 8px; color: #6c63ff;">${token}</span>
      </div>
      <p style="color: #8888aa; font-size: 14px;">Se você não solicitou a recuperação de senha, ignore este e-mail.</p>
    </div>
  `
}

export function templateDesativacaoConta(nome: string, login: string) {
  return `
    <div style="font-family: 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; background: #0a0a0f; color: #f0f0f8; padding: 40px; border-radius: 16px; border: 1px solid rgba(239,68,68,0.3);">
      <h2 style="color: #ef4444;">Conta desativada</h2>
      <p>O usuário <strong>${nome}</strong> (login: <strong>${login}</strong>) desativou a própria conta em ${new Date().toLocaleString('pt-BR')}.</p>
      <p style="color: #8888aa; font-size: 14px;">Para reativar, acesse o sistema e altere a situação do usuário para <strong>Ativo</strong>.</p>
    </div>
  `
}
