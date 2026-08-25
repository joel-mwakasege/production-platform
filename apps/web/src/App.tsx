import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './lib/supabase'
import { PreviewDashboard } from './components/PreviewDashboard'
import { WorkspaceDashboard } from './components/WorkspaceDashboard'
import './App.css'

const sections = ['Overview', 'Write', 'Breakdown', 'Visualize', 'Plan', 'Shoot']
const phases = ['Idea', 'Script', 'Breakdown', 'Schedule', 'Production']
type Organization = { id: string; name: string; slug: string }
type Project = { id: string; name: string; slug: string; description?: string | null; projectType?: string; client?: string | null; status?: string; startDate?: string | null; endDate?: string | null }
const API_URL = import.meta.env.VITE_API_URL || ''

async function readApiResponse<T>(response: Response): Promise<T> {
  const text = await response.text()
  try {
    return JSON.parse(text) as T
  } catch {
    throw new Error(`API returned ${response.status} ${response.statusText} instead of JSON`)
  }
}

function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [organization, setOrganization] = useState<{ id: string; name: string; slug: string } | null>(null)
  const [project, setProject] = useState<Project | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [loadingWorkspace, setLoadingWorkspace] = useState(Boolean(supabase))
  const [organizationName, setOrganizationName] = useState('')
  const [organizationMessage, setOrganizationMessage] = useState('')
  const [creatingOrganization, setCreatingOrganization] = useState(false)
  const [projectName, setProjectName] = useState('')
  const [projectDescription, setProjectDescription] = useState('')
  const [projectType, setProjectType] = useState('FILM')
  const [projectStatus, setProjectStatus] = useState('PLANNING')
  const [projectClient, setProjectClient] = useState('')
  const [projectStartDate, setProjectStartDate] = useState('')
  const [projectEndDate, setProjectEndDate] = useState('')
  const [projectMessage, setProjectMessage] = useState('')
  const [creatingProject, setCreatingProject] = useState(false)
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [confirmationEmail, setConfirmationEmail] = useState('')
  const [resendingConfirmation, setResendingConfirmation] = useState(false)

  useEffect(() => {
    if (!supabase) return
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      if (!data.session) setLoadingWorkspace(false)
    })
    const { data } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next)
      if (!next) {
        setOrganization(null)
        setProject(null)
        setProjects([])
        setLoadingWorkspace(false)
      }
    })
    return () => data.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!supabase || !session) return
    let cancelled = false
    const accessToken = session.access_token

    async function restoreWorkspace() {
      try {
        const response = await fetch(`${API_URL}/api/organizations`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
        const result = await readApiResponse<{ organizations: Organization[] }>(response)
        if (!response.ok || !result.organizations?.length || cancelled) return

        const nextOrganization = result.organizations[0]
        setOrganization(nextOrganization)
        const projectsResponse = await fetch(`${API_URL}/api/organizations/${nextOrganization.id}/projects`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
        const projectsResult = await readApiResponse<{ projects: Project[] }>(projectsResponse)
        if (!cancelled && projectsResponse.ok && projectsResult.projects?.length) {
          setProjects(projectsResult.projects)
          setProject(projectsResult.projects[0])
        }
      } catch {
        // Keep onboarding available when the API is unreachable.
      } finally {
        if (!cancelled) setLoadingWorkspace(false)
      }
    }

    void restoreWorkspace()
    return () => { cancelled = true }
  }, [session])

  if (!supabase) return <PreviewDashboard />

  async function authenticate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!supabase) return
    const result = mode === 'signin'
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
  }

  async function createOrganization(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!session) return

    setCreatingOrganization(true)
    setOrganizationMessage('')
    try {
      const response = await fetch(`${API_URL}/api/organizations`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: organizationName }),
      })
      const result = await readApiResponse<Organization & { error?: string; demoProject?: Project }>(response)
      if (!response.ok) throw new Error(result.error ?? 'Could not create your workspace.')
      setOrganization(result)
      if (result.demoProject) {
        setProjects([result.demoProject])
        setProject(result.demoProject)
      }
    } catch (error) {
      setOrganizationMessage(error instanceof Error ? error.message : 'Could not create your workspace.')
    } finally {
      setCreatingOrganization(false)
    }
  }

  async function createProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!session || !organization) return

    setCreatingProject(true)
    setProjectMessage('')
    try {
      const response = await fetch(`${API_URL}/api/organizations/${organization.id}/projects`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: projectName,
          description: projectDescription || undefined,
          projectType,
          status: projectStatus,
          client: projectClient || undefined,
          startDate: projectStartDate || undefined,
          endDate: projectEndDate || undefined,
        }),
      })
      const result = await readApiResponse<{ id: string; name: string; slug: string; description?: string | null; error?: string }>(response)
      if (!response.ok) throw new Error(result.error ?? 'Could not create your project.')
      setProjects((currentProjects) => [result, ...currentProjects])
      setProject(result)
    } catch (error) {
      setProjectMessage(error instanceof Error ? error.message : 'Could not create your project.')
    } finally {
      setCreatingProject(false)
    }
  }

  if (supabase && loadingWorkspace) return <main className="auth-page"><div className="brand">FRAME <span>/ WORK</span></div><section className="auth-panel"><p className="eyebrow">Production workspace</p><h1>Loading your workspace.</h1></section></main>

  if (!session && supabase) return <main className="auth-page"><div className="brand">FRAME <span>/ WORK</span></div><section className="auth-panel"><p className="eyebrow">Production workspace</p><h1>{mode === 'signin' ? 'Make the day shootable.' : 'Start a production.'}</h1><p className="lede">One connected place for scripts, people, plans, and the work that gets you to set.</p><form onSubmit={authenticate}><label>Email<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} /></label><label>Password<input required minLength={6} type="password" value={password} onChange={(event) => setPassword(event.target.value)} /></label><button className="primary" type="submit">{mode === 'signin' ? 'Sign in' : 'Create account'} <span>-&gt;</span></button></form>{message && <p className="message">{message}</p>}{confirmationEmail && <button className="text-button" disabled={resendingConfirmation} type="button" onClick={() => void resendConfirmation()}>{resendingConfirmation ? 'Sending...' : 'Resend confirmation email'}</button>}<button className="text-button" type="button" onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setConfirmationEmail('') }}>{mode === 'signin' ? 'Need an account? Create one' : 'Already have an account? Sign in'}</button></section></main>

  if (supabase && session && !organization) return <main className="auth-page"><div className="brand">FRAME <span>/ WORK</span></div><section className="auth-panel"><p className="eyebrow">One last thing</p><h1>Name your workspace.</h1><p className="lede">This is where your projects, people, and production plans will live.</p><form onSubmit={createOrganization}><label>Workspace name<input required minLength={2} maxLength={120} value={organizationName} onChange={(event) => setOrganizationName(event.target.value)} placeholder="Northstar Films" /></label><button className="primary" disabled={creatingOrganization} type="submit">{creatingOrganization ? 'Creating...' : 'Create workspace'} <span>-&gt;</span></button></form>{organizationMessage && <p className="message">{organizationMessage}</p>}</section></main>

  if (supabase && session && organization && !project) return <main className="auth-page"><div className="brand">FRAME <span>/ WORK</span></div><section className="auth-panel"><p className="eyebrow">Workspace ready</p><h1>Start your first project.</h1><p className="lede">Create a project inside {organization.name} and bring the production into focus.</p><form onSubmit={createProject}><label>Project name<input required minLength={2} maxLength={120} value={projectName} onChange={(event) => setProjectName(event.target.value)} placeholder="The Last Light" /></label><label>Project type<select value={projectType} onChange={(event) => setProjectType(event.target.value)}><option value="FILM">Film</option><option value="TELEVISION">Television</option><option value="COMMERCIAL">Commercial</option><option value="DOCUMENTARY">Documentary</option><option value="MUSIC_VIDEO">Music video</option><option value="CORPORATE_VIDEO">Corporate video</option><option value="EVENT">Event</option><option value="PHOTOSHOOT">Photoshoot</option><option value="OTHER">Other</option></select></label><label>Status<select value={projectStatus} onChange={(event) => setProjectStatus(event.target.value)}><option value="PLANNING">Planning</option><option value="ACTIVE">Active</option><option value="COMPLETED">Completed</option><option value="ARCHIVED">Archived</option></select></label><label>Client <span className="optional">Optional</span><input maxLength={160} value={projectClient} onChange={(event) => setProjectClient(event.target.value)} placeholder="Client or commissioning partner" /></label><div className="date-fields"><label>Start date <span className="optional">Optional</span><input type="date" value={projectStartDate} onChange={(event) => setProjectStartDate(event.target.value)} /></label><label>End date <span className="optional">Optional</span><input type="date" value={projectEndDate} onChange={(event) => setProjectEndDate(event.target.value)} /></label></div><label>Description <span className="optional">Optional</span><textarea maxLength={2000} value={projectDescription} onChange={(event) => setProjectDescription(event.target.value)} placeholder="A short description of the production." /></label><button className="primary" disabled={creatingProject} type="submit">{creatingProject ? 'Creating...' : 'Create project'} <span>-&gt;</span></button></form>{projectMessage && <p className="message">{projectMessage}</p>}</section></main>

    if (supabase && session && organization && project) return <WorkspaceDashboard organization={organization} project={project} projects={projects} onProjectChange={setProject} session={session} onSignOut={signOut} />

  return <main className="app-shell"><aside className="sidebar"><div className="brand">FRAME <span>/ WORK</span></div><div className="workspace"><b>N</b><span><strong>Northstar Films</strong><small>Personal workspace</small></span></div><p className="nav-label">Workspace</p><nav>{sections.map((section, index) => <button className={index === 0 ? 'nav selected' : 'nav'} key={section} type="button"><i>{['+', 'W', 'B', 'V', 'P', 'S'][index]}</i>{section}</button>)}</nav><div className="sidebar-footer"><button className="nav" type="button"><i>?</i>Help & resources</button><button className="profile" type="button"><b>JM</b><span><strong>Joel Mwakasege</strong><small>Account settings</small></span></button></div></aside><section className="content"><header className="topbar"><strong>PROJECTS / THE LAST LIGHT</strong><span>● All changes saved <button>Share</button></span></header><div className="page"><div className="heading"><div><p className="eyebrow">Tuesday, August 25, 2026</p><h1>The Last Light</h1><p className="lede">A short film by Northstar Films</p></div><button className="primary" type="button">+ New item</button></div><div className="phases">{phases.map((phase, index) => <div className={index < 2 ? 'done' : index === 2 ? 'active' : ''} key={phase}><span>{index + 1}</span>{phase}</div>)}</div><div className="grid"><section className="panel tasks"><p className="eyebrow">Today</p><h2>Next on the desk</h2>{['Review scene 08 breakdown', 'Confirm location hold', "Upload director's notes"].map((task, index) => <div className={index === 2 ? 'task complete' : 'task'} key={task}><span className="check">{index === 2 ? 'x' : ''}</span><span><strong>{task}</strong><small>{index === 0 ? 'Breakdown / due today' : index === 1 ? 'Planning / due today' : 'Write / completed'}</small></span><time>{index < 2 ? `${index ? '14' : '10'}:30` : ''}</time></div>)}</section><section className="panel pulse"><p className="eyebrow">Production pulse</p><h2>Moving with purpose.</h2><div className="number">42<span>%</span></div><div className="bar"><span /></div><p>18 of 43 production items complete</p><div className="stats"><b>6 <small>shoot days</small></b><b>24 <small>contacts</small></b></div></section><section className="panel activity"><p className="eyebrow">Latest</p><h2>Activity</h2><p><b>Ruth Mwangi</b> updated the <strong>scene 08 breakdown</strong><small>12 minutes ago</small></p><p><b>Alex Kim</b> joined the project<small>Yesterday at 16:42</small></p></section><section className="panel project"><p className="eyebrow">Project details</p><h2>Built for the whole day.</h2><p>Your production data stays connected from first thought to final call.</p><div className="meta"><span>Type<strong>Short film</strong></span><span>Prep starts<strong>Sep 14, 2026</strong></span></div></section></div></div></section></main>
}

export default App
