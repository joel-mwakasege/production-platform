import type { Session } from '@supabase/supabase-js'

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

type DashboardProps = {
  organization: Organization
  project: Project
  projects: Project[]
  onProjectChange: (project: Project) => void
  session: Session
  onSignOut: () => void
}

const sections = ['Overview', 'Write', 'Breakdown', 'Visualize', 'Plan', 'Shoot']

function formatType(projectType?: string) {
  return projectType?.replaceAll('_', ' ').toLowerCase() ?? 'project'
}

function formatDate(date?: string | null) {
  if (!date) return 'Not set'
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(date))
}

export function Dashboard({ organization, project, projects, onProjectChange, session, onSignOut }: DashboardProps) {
  return <main className="app-shell"><aside className="sidebar"><div className="brand">FRAME <span>/ WORK</span></div><div className="workspace"><b>{organization.name.charAt(0).toUpperCase()}</b><span><strong>{organization.name}</strong><small>Personal workspace</small></span></div><label className="project-switcher">Project<select value={project.id} onChange={(event) => { const nextProject = projects.find((item) => item.id === event.target.value); if (nextProject) onProjectChange(nextProject) }}>{projects.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><p className="nav-label">Workspace</p><nav>{sections.map((section, index) => <button className={index === 0 ? 'nav selected' : 'nav'} key={section} type="button"><i>{['+', 'W', 'B', 'V', 'P', 'S'][index]}</i>{section}</button>)}</nav><div className="sidebar-footer"><button className="nav" type="button"><i>?</i>Help & resources</button><button className="profile" type="button" onClick={onSignOut}><b>{session.user.email?.slice(0, 2).toUpperCase() ?? 'U'}</b><span><strong>{session.user.email ?? 'Account'}</strong><small>Sign out</small></span></button></div></aside><section className="content"><header className="topbar"><strong>PROJECTS / {project.name.toUpperCase()}</strong><span>● All changes saved <button type="button">Share</button></span></header><div className="page"><div className="heading"><div><p className="eyebrow">{formatType(project.projectType)}</p><h1>{project.name}</h1><p className="lede">{project.description ?? `A production by ${organization.name}`}</p></div><button className="primary" type="button">+ New item</button></div><div className="phases">{['Idea', 'Script', 'Breakdown', 'Schedule', 'Production'].map((phase, index) => <div className={index === 0 ? 'active' : ''} key={phase}><span>{index + 1}</span>{phase}</div>)}</div><div className="grid"><section className="panel tasks"><p className="eyebrow">Today</p><h2>Next on the desk</h2><div className="empty-state"><strong>Your production starts here.</strong><small>Add tasks, scenes, and people as the project takes shape.</small></div></section><section className="panel pulse"><p className="eyebrow">Project status</p><h2>{project.status?.toLowerCase() ?? 'planning'}</h2><div className="number">0<span>%</span></div><div className="bar"><span /></div><p>No production items complete yet</p><div className="stats"><b>{formatDate(project.startDate)} <small>start date</small></b><b>{formatDate(project.endDate)} <small>end date</small></b></div></section><section className="panel activity"><p className="eyebrow">Project details</p><h2>Keep the signal clear.</h2><p><b>Client</b><small>{project.client ?? 'No client added'}</small></p><p><b>Workspace</b><small>{organization.name}</small></p></section><section className="panel project"><p className="eyebrow">Ready when you are</p><h2>Build the day.</h2><p>Your connected production workspace is ready for its first scene, contact, or task.</p><div className="meta"><span>Type<strong>{formatType(project.projectType)}</strong></span><span>Status<strong>{project.status?.toLowerCase() ?? 'planning'}</strong></span></div></section></div></div></section></main>
}
