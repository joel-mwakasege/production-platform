import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './lib/supabase'
import { PreviewDashboard } from './components/PreviewDashboard'
import { WorkspaceDashboard } from './components/WorkspaceDashboard'
import './App.css'

type Organization = { id: string; name: string; slug: string }
type Project = {
  id: string
  name: string
  slug: string
  description?: string | null
  projectType?: string
  client?: string | null
  status?: string
  startDate?: string | null
  endDate?: string | null
}

const DEFAULT_ORG: Organization = {
  id: 'default-org',
  name: 'Northstar Films',
  slug: 'northstar-films',
}

const DEFAULT_PROJECT: Project = {
  id: 'default-project',
  name: 'The Last Light',
  slug: 'the-last-light',
  description: 'A young woman follows a photograph through one last day of secrets and light.',
  projectType: 'FILM',
  status: 'ACTIVE',
}

const API_URL = import.meta.env.VITE_API_URL || ''

async function readApiResponse<T>(response: Response): Promise<T> {
  const text = await response.text()
  try {
    return JSON.parse(text) as T
  } catch {
    throw new Error(`API returned ${response.status} ${response.statusText} instead of JSON`)
  }
}

export function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [organization, setOrganization] = useState<Organization>(DEFAULT_ORG)
  const [project, setProject] = useState<Project>(DEFAULT_PROJECT)
  const [projects, setProjects] = useState<Project[]>([DEFAULT_PROJECT])
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [confirmationEmail, setConfirmationEmail] = useState('')
  const [resendingConfirmation, setResendingConfirmation] = useState(false)

  // Listen to Supabase Auth state
  useEffect(() => {
    if (!supabase) return
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
    })
    const { data } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next)
    })
    return () => data.subscription.unsubscribe()
  }, [])

  // Background fetch real organizations & projects if available
  useEffect(() => {
    if (!supabase || !session) return
    let cancelled = false
    const accessToken = session.access_token

    async function fetchWorkspaceData() {
      try {
        const response = await fetch(`${API_URL}/api/organizations`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
        if (!response.ok) return
        const result = await readApiResponse<{ organizations: Organization[] }>(response)
        if (cancelled || !result.organizations?.length) return

        const nextOrg = result.organizations[0]
        setOrganization(nextOrg)

        const projectsResponse = await fetch(`${API_URL}/api/organizations/${nextOrg.id}/projects`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
        if (!cancelled && projectsResponse.ok) {
          const projectsResult = await readApiResponse<{ projects: Project[] }>(projectsResponse)
          if (projectsResult.projects?.length) {
            setProjects(projectsResult.projects)
            setProject(projectsResult.projects[0])
          }
        }
      } catch (err) {
        console.warn('Background workspace sync:', err)
      }
    }

    void fetchWorkspaceData()
    return () => {
      cancelled = true
    }
  }, [session])

  if (!supabase) return <PreviewDashboard />

  async function authenticate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!supabase) return
    const result =
      mode === 'signin'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password })
    setMessage(result.error?.message ?? (mode === 'signup' ? 'Check your email to confirm your account.' : ''))
    if (mode === 'signup' && !result.error) setConfirmationEmail(email)
  }

  async function resendConfirmation() {
    if (!supabase || !confirmationEmail) return
    setResendingConfirmation(true)
    const result = await supabase.auth.resend({ type: 'signup', email: confirmationEmail })
    setMessage(result.error?.message ?? 'A new confirmation link has been sent.')
    setResendingConfirmation(false)
  }

  async function signOut() {
    await supabase?.auth.signOut()
    setOrganization(DEFAULT_ORG)
    setProject(DEFAULT_PROJECT)
    setProjects([DEFAULT_PROJECT])
  }

  // 1. Unauthenticated Login / Sign up view
  if (!session) {
    return (
      <main className="auth-page">
        <div className="brand">FRAME <span>/ WORK</span></div>
        <section className="auth-panel">
          <p className="eyebrow">Production workspace</p>
          <h1>{mode === 'signin' ? 'Make the day shootable.' : 'Start a production.'}</h1>
          <p className="lede">One connected place for scripts, people, plans, and the work that gets you to set.</p>
          <form onSubmit={authenticate}>
            <label>
              Email
              <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </label>
            <label>
              Password
              <input required minLength={6} type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </label>
            <button className="primary" type="submit">
              {mode === 'signin' ? 'Sign in' : 'Create account'} <span>-&gt;</span>
            </button>
          </form>
          {message && <p className="message">{message}</p>}
          {confirmationEmail && (
            <button className="text-button" disabled={resendingConfirmation} type="button" onClick={() => void resendConfirmation()}>
              {resendingConfirmation ? 'Sending...' : 'Resend confirmation email'}
            </button>
          )}
          <button
            className="text-button"
            type="button"
            onClick={() => {
              setMode(mode === 'signin' ? 'signup' : 'signin')
              setConfirmationEmail('')
            }}
          >
            {mode === 'signin' ? 'Need an account? Create one' : 'Already have an account? Sign in'}
          </button>
        </section>
      </main>
    )
  }

  // 2. Direct entry into the live workspace dashboard!
  return (
    <WorkspaceDashboard
      organization={organization}
      project={project}
      projects={projects}
      onProjectChange={setProject}
      session={session}
      onSignOut={signOut}
    />
  )
}

export default App
