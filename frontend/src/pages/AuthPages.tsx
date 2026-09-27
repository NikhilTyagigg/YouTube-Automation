import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Check, Eye, EyeOff, LockKeyhole, Mail, Sparkles } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuthStore } from '../store/authStore'
import { Button, Field } from '../components/ui'
import { authService } from '../services/authService'
import { getApiError } from '../services/api'

const loginSchema = z.object({ email: z.string().email('Enter a valid email address.'), password: z.string().min(1, 'Enter your password.') })
const signupSchema = z.object({ name: z.string().min(2, 'Enter your name.'), email: z.string().email('Enter a valid email address.'), password: z.string().min(10, 'Use at least 10 characters.') })
type LoginValues = z.infer<typeof loginSchema>
type SignupValues = z.infer<typeof signupSchema>

function AuthFrame({ eyebrow, title, subtitle, children, footer }: { eyebrow: string; title: string; subtitle: string; children: React.ReactNode; footer: React.ReactNode }) {
  return <div className="auth-form-wrap"><Link to="/login" className="auth-brand-mobile"><span className="brand-icon"><Sparkles size={17} /></span>framewise</Link><div className="auth-form-head"><div className="eyebrow">{eyebrow}</div><h2>{title}</h2><p>{subtitle}</p></div>{children}<div className="auth-form-footer">{footer}</div></div>
}

export function LoginPage() {
  const [visible, setVisible] = useState(false)
  const [authError, setAuthError] = useState('')
  const setSession = useAuthStore((state) => state.setSession)
  const setBootstrapped = useAuthStore((state) => state.setBootstrapped)
  const navigate = useNavigate()
  const location = useLocation()
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) })
  const submit = handleSubmit(async ({ email, password }) => {
    setAuthError('')
    try {
      const { data } = await authService.login(email, password)
      setSession(data.accessToken, data.user)
      setBootstrapped(true)
      navigate((location.state as { from?: string } | null)?.from || '/', { replace: true })
    } catch (error) { setAuthError(getApiError(error)) }
  })
  return <AuthFrame eyebrow="WELCOME BACK" title="Good to see you." subtitle="Sign in to pick up where your next idea left off." footer={<>New to Framewise? <Link to="/signup">Create an account <ArrowRight size={14} /></Link></>}>
    <form className="auth-form" onSubmit={submit}>
      <Field label="Email address"><div className="input-icon-wrap"><Mail size={16} /><input type="email" autoComplete="email" placeholder="you@studio.com" {...register('email')} /></div>{errors.email && <span className="field-error">{errors.email.message}</span>}</Field>
      <Field label="Password"><div className="input-icon-wrap"><LockKeyhole size={16} /><input type={visible ? 'text' : 'password'} autoComplete="current-password" placeholder="At least 10 characters" {...register('password')} /><button type="button" className="input-action" onClick={() => setVisible(!visible)} aria-label={visible ? 'Hide password' : 'Show password'}>{visible ? <EyeOff size={16} /> : <Eye size={16} />}</button></div>{errors.password && <span className="field-error">{errors.password.message}</span>}</Field>
      <div className="form-inline"><label className="checkbox-label"><input type="checkbox" defaultChecked /> Remember me</label><Link to="/forgot-password">Forgot password?</Link></div>
      {authError && <div className="auth-error" role="alert">{authError}</div>}
      <Button className="auth-submit" disabled={isSubmitting}>Sign in <ArrowRight size={16} /></Button>
      <p className="auth-terms">By continuing, you agree to our <a href="#terms">Terms</a> and <a href="#privacy">Privacy Policy</a>.</p>
    </form>
  </AuthFrame>
}

export function SignupPage() {
  const [visible, setVisible] = useState(false)
  const [authError, setAuthError] = useState('')
  const setSession = useAuthStore((state) => state.setSession)
  const setBootstrapped = useAuthStore((state) => state.setBootstrapped)
  const navigate = useNavigate()
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<SignupValues>({ resolver: zodResolver(signupSchema) })
  const submit = handleSubmit(async ({ name, email, password }) => {
    setAuthError('')
    try {
      const { data } = await authService.signup(name, email, password)
      setSession(data.accessToken, data.user)
      setBootstrapped(true)
      navigate('/')
    } catch (error) { setAuthError(getApiError(error)) }
  })
  return <AuthFrame eyebrow="GET STARTED" title="Build something worth watching." subtitle="Set up your studio and make room for more of your best ideas." footer={<>Already have an account? <Link to="/login">Sign in <ArrowRight size={14} /></Link></>}>
    <form className="auth-form" onSubmit={submit}>
      <Field label="Your name"><input className="text-input" autoComplete="name" placeholder="Alex Morgan" {...register('name')} />{errors.name && <span className="field-error">{errors.name.message}</span>}</Field>
      <Field label="Work email"><div className="input-icon-wrap"><Mail size={16} /><input type="email" autoComplete="email" placeholder="you@studio.com" {...register('email')} /></div>{errors.email && <span className="field-error">{errors.email.message}</span>}</Field>
      <Field label="Create a password"><div className="input-icon-wrap"><LockKeyhole size={16} /><input type={visible ? 'text' : 'password'} autoComplete="new-password" placeholder="At least 8 characters" {...register('password')} /><button type="button" className="input-action" onClick={() => setVisible(!visible)} aria-label="Toggle password visibility">{visible ? <EyeOff size={16} /> : <Eye size={16} />}</button></div>{errors.password && <span className="field-error">{errors.password.message}</span>}</Field>
      <div className="password-note"><Check size={14} />Use 10 or more characters with a mix of letters and numbers</div>
      {authError && <div className="auth-error" role="alert">{authError}</div>}
      <Button className="auth-submit" disabled={isSubmitting}>Create your studio <ArrowRight size={16} /></Button>
      <p className="auth-terms">By continuing, you agree to our <a href="#terms">Terms</a> and <a href="#privacy">Privacy Policy</a>.</p>
    </form>
  </AuthFrame>
}

export function ForgotPasswordPage() {
  const [sent, setSent] = useState(false)
  const [authError, setAuthError] = useState('')
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<{ email: string }>({ resolver: zodResolver(z.object({ email: z.string().email('Enter a valid email address.') })) })
  const submit = handleSubmit(async ({ email }) => { setAuthError(''); try { await authService.forgotPassword(email); setSent(true) } catch (error) { setAuthError(getApiError(error)) } })
  return <AuthFrame eyebrow="ACCOUNT RECOVERY" title={sent ? 'Check your inbox.' : 'Forgot your password?'} subtitle={sent ? 'If an account exists for that address, a reset link is on its way.' : 'We’ll send you a secure link to choose a new password.'} footer={<Link to="/login"><ArrowLeft size={14} /> Back to sign in</Link>}>
    {sent ? <div className="sent-panel"><span className="sent-check"><Check size={22} /></span><strong>Reset link sent</strong><p>Check your inbox and follow the link to get back into your studio.</p><button onClick={() => setSent(false)}>Try another email</button></div> : <form className="auth-form" onSubmit={submit}><Field label="Email address"><div className="input-icon-wrap"><Mail size={16} /><input type="email" autoComplete="email" placeholder="you@studio.com" {...register('email')} /></div>{errors.email && <span className="field-error">{errors.email.message}</span>}</Field>{authError && <div className="auth-error" role="alert">{authError}</div>}<Button className="auth-submit" disabled={isSubmitting}>Send reset link <ArrowRight size={16} /></Button></form>}
  </AuthFrame>
}

export function ResetPasswordPage() {
  const [done, setDone] = useState(false)
  const [visible, setVisible] = useState(false)
  const [authError, setAuthError] = useState('')
  const resetToken = new URLSearchParams(useLocation().search).get('token')
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<{ password: string; confirm: string }>({ resolver: zodResolver(z.object({ password: z.string().min(10, 'Use at least 10 characters.'), confirm: z.string() }).refine((values) => values.password === values.confirm, { path: ['confirm'], message: 'Passwords do not match.' })) })
  const submit = handleSubmit(async ({ password }) => {
    setAuthError('')
    try {
      if (!resetToken) throw new Error('This password reset link is invalid or has expired.')
      await authService.resetPassword(resetToken, password)
      setDone(true)
    } catch (error) { setAuthError(getApiError(error)) }
  })
  return <AuthFrame eyebrow="ACCOUNT RECOVERY" title={done ? 'You’re all set.' : 'Choose a new password.'} subtitle={done ? 'Your password has been updated. Head back to your studio.' : 'Make it something strong, memorable, and yours.'} footer={<Link to="/login"><ArrowLeft size={14} /> Back to sign in</Link>}>
    {done ? <div className="sent-panel"><span className="sent-check"><Check size={22} /></span><strong>Password updated</strong><p>You can now sign in with your new password.</p><Link to="/login" className="reset-link">Continue to sign in <ArrowRight size={14} /></Link></div> : <form className="auth-form" onSubmit={submit}><Field label="New password"><div className="input-icon-wrap"><LockKeyhole size={16} /><input type={visible ? 'text' : 'password'} autoComplete="new-password" placeholder="At least 8 characters" {...register('password')} /><button type="button" className="input-action" onClick={() => setVisible(!visible)} aria-label="Toggle password visibility">{visible ? <EyeOff size={16} /> : <Eye size={16} />}</button></div>{errors.password && <span className="field-error">{errors.password.message}</span>}</Field><Field label="Confirm new password"><input className="text-input" type="password" autoComplete="new-password" {...register('confirm')} />{errors.confirm && <span className="field-error">{errors.confirm.message}</span>}</Field>{authError && <div className="auth-error" role="alert">{authError}</div>}<Button className="auth-submit" disabled={isSubmitting}>Reset password <ArrowRight size={16} /></Button></form>}
  </AuthFrame>
}