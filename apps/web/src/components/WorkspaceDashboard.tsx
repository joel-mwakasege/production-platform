import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { ScriptWorkspace } from './ScriptWorkspace'
import { BreakdownWorkspace } from './BreakdownWorkspace'
import { ScheduleWorkspace } from './ScheduleWorkspace'
import type { Phase } from './PhaseRail'
import { ProductionWorkspace } from './ProductionWorkspace'

type Organization = { id: string; name: string; slug: string }
type Project = { id: string; name: string; slug: string; description?: string | null; projectType?: string; client?: string | null; status?: string; startDate?: string | null; endDate?: string | null }
type Task = { id: string; title: string; completed: boolean; dueDate?: string | null }

type WorkspaceDashboardProps = {
  organization: Organization
  project: Project
  projects: Project[]
  session: Session
  onProjectChange: (project: Project) => void
  onSignOut: () => void
}

const API_URL = import.meta.env.VITE_API_URL || ''
const sections = ['Overview', 'Write', 'Breakdown', 'Visualize', 'Plan', 'Shoot']

function formatType(projectType?: string) {
  return projectType?.replaceAll('_', ' ').toLowerCase() ?? 'project'
}

export function WorkspaceDashboard({ organization, project, projects, session, onProjectChange, onSignOut }: WorkspaceDashboardProps) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [taskTitle, setTaskTitle] = useState('')
  const [taskMessage, setTaskMessage] = useState('')
  const [creatingTask, setCreatingTask] = useState(false)
  const [selectedSection, setSelectedSection] = useState('Overview')
  const [notice, setNotice] = useState('')
  const [shared, setShared] = useState(false)
  const [selectedPhase, setSelectedPhase] = useState('Idea')
  const handlePhaseChange = (phase: Phase) => {
    setSelectedPhase(phase)
    setSelectedSection(phase === 'Idea' ? 'Overview' : phase)
  }

  useEffect(() => {
    let cancelled = false
    fetch(`${API_URL}/api/organizations/${organization.id}/projects/${project.id}/tasks`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    }).then(async (response) => {
      const result = await response.json()
      if (!cancelled && response.ok) setTasks(result.tasks ?? [])
    }).catch(() => {
      if (!cancelled) setTaskMessage('Tasks are unavailable right now.')
    })
    return () => { cancelled = true }
  }, [organization.id, project.id, session.access_token])

  async function createTask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!taskTitle.trim()) return
    setCreatingTask(true)
    setTaskMessage('')
    try {
      const response = await fetch(`${API_URL}/api/organizations/${organization.id}/projects/${project.id}/tasks`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: taskTitle }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error ?? 'Could not add task.')
      setTasks((currentTasks) => [...currentTasks, result.task])
      setTaskTitle('')
    } catch (error) {
      setTaskMessage(error instanceof Error ? error.message : 'Could not add task.')
    } finally {
      setCreatingTask(false)
    }
  }

  async function toggleTask(task: Task) {
    const response = await fetch(`${API_URL}/api/organizations/${organization.id}/projects/${project.id}/tasks/${task.id}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: !task.completed }),
    })
    const result = await response.json()
    if (response.ok) setTasks((currentTasks) => currentTasks.map((currentTask) => currentTask.id === task.id ? result.task : currentTask))
  }

  if (selectedPhase === 'Script') return <ScriptWorkspace organization={organization} project={project} session={session} onPhaseChange={handlePhaseChange} onBack={() => handlePhaseChange('Idea')} />
  if (selectedPhase === 'Breakdown') return <BreakdownWorkspace organization={organization} project={project} session={session} onPhaseChange={handlePhaseChange} onBack={() => handlePhaseChange('Idea')} />
  if (selectedPhase === 'Schedule') return <ScheduleWorkspace organization={organization} project={project} session={session} onPhaseChange={handlePhaseChange} onBack={() => handlePhaseChange('Idea')} />
  if (selectedPhase === 'Production') return <ProductionWorkspace organization={organization} project={project} session={session} onPhaseChange={handlePhaseChange} onBack={() => handlePhaseChange('Idea')} />

  return <main className="app-shell"><aside className="sidebar"><div className="brand">FRAME <span>/ WORK</span></div><div className="workspace"><b>{organization.name.charAt(0).toUpperCase()}</b><span><strong>{organization.name}</strong><small>Live workspace</small></span></div><label className="project-switcher">Project<select value={project.id} onChange={(event) => { const nextProject = projects.find((item) => item.id === event.target.value); if (nextProject) onProjectChange(nextProject) }}>{projects.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><p className="nav-label">Workspace</p><nav>{sections.map((section, index) => <button className={selectedSection === section ? 'nav selected' : 'nav'} key={section} type="button" onClick={() => { setSelectedSection(section); setNotice(`${section} selected`); if (section === 'Write') setSelectedPhase('Script'); if (section === 'Breakdown') setSelectedPhase('Breakdown') }}><i>{['+', 'W', 'B', 'V', 'P', 'S'][index]}</i>{section}</button>)}</nav><div className="sidebar-footer"><button className="nav" type="button" onClick={() => setNotice('Help is coming soon')}><i>?</i>Help & resources</button><button className="profile" type="button" onClick={onSignOut}><b>{session.user.email?.slice(0, 2).toUpperCase() ?? 'U'}</b><span><strong>{session.user.email ?? 'Account'}</strong><small>Sign out</small></span></button></div></aside><section className="content"><header className="topbar"><strong>PROJECTS / {project.name.toUpperCase()}</strong><span>{shared ? '● Shared with your team' : '● Live data'} <button type="button" onClick={() => setShared((currentShared) => !currentShared)}>{shared ? 'Unshare' : 'Share'}</button></span></header><div className="page"><div className="heading"><div><p className="eyebrow">{formatType(project.projectType)} / {selectedSection}</p><h1>{project.name}</h1><p className="lede">{project.description ?? `A production by ${organization.name}`}</p></div><button className="primary" type="button" onClick={() => document.querySelector<HTMLInputElement>('.quick-task input')?.focus()}>+ New item</button></div>{notice && <p className="interaction-notice" role="status">{notice}</p>}<div className="phases">{['Idea', 'Script', 'Breakdown', 'Schedule', 'Production'].map((phase, index) => <button className={selectedPhase === phase ? 'active' : ''} key={phase} type="button" onClick={() => { setSelectedPhase(phase); setNotice(`${phase} phase selected`) }}><span>{index + 1}</span>{phase}</button>)}</div><div className="grid"><section className="panel tasks"><p className="eyebrow">Today</p><h2>Next on the desk</h2><form className="quick-task" onSubmit={createTask}><input aria-label="New task title" value={taskTitle} onChange={(event) => setTaskTitle(event.target.value)} placeholder="Add a task" /><button className="primary" disabled={creatingTask} type="submit">{creatingTask ? 'Adding...' : 'Add'}</button></form>{tasks.map((task) => <button className={task.completed ? 'task task-button complete' : 'task task-button'} key={task.id} type="button" onClick={() => void toggleTask(task)}><span className="check">{task.completed ? 'x' : ''}</span><span><strong>{task.title}</strong><small>{task.completed ? 'Completed' : 'Click to complete'}</small></span></button>)}{!tasks.length && <div className="empty-state"><strong>Your production starts here.</strong><small>Add your first task above.</small></div>}{taskMessage && <p className="message">{taskMessage}</p>}</section><section className="panel pulse"><p className="eyebrow">Project status</p><h2>{project.status?.toLowerCase() ?? 'planning'}</h2><div className="number">{tasks.length ? Math.round(tasks.filter((task) => task.completed).length / tasks.length * 100) : 0}<span>%</span></div><div className="bar"><span style={{ width: `${tasks.length ? Math.round(tasks.filter((task) => task.completed).length / tasks.length * 100) : 0}%` }} /></div><p>{tasks.filter((task) => !task.completed).length} open production items</p></section><section className="panel activity"><p className="eyebrow">Project details</p><h2>Keep the signal clear.</h2><p><b>Client</b><small>{project.client ?? 'No client added'}</small></p><p><b>Workspace</b><small>{organization.name}</small></p></section><section className="panel project"><p className="eyebrow">Ready when you are</p><h2>Build the day.</h2><p>Your connected production workspace is ready for its first scene, contact, or task.</p><div className="meta"><span>Type<strong>{formatType(project.projectType)}</strong></span><span>Status<strong>{project.status?.toLowerCase() ?? 'planning'}</strong></span></div></section></div></div></section></main>
}
