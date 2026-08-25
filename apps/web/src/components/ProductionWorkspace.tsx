import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { PhaseRail, type Phase } from './PhaseRail'

type Props = { organization: { id: string; name: string }; project: { id: string; name: string; status?: string }; session: Session; onBack: () => void; onPhaseChange: (phase: Phase) => void }
type Task = { id: string; title: string; completed: boolean }
type ShootDay = { id: string; dayNumber: number; date: string; scenes: { scene: { sceneNumber: number; heading: string } }[] }
const API_URL = import.meta.env.VITE_API_URL || ''

export function ProductionWorkspace({ organization, project, session, onBack, onPhaseChange }: Props) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [shootDays, setShootDays] = useState<ShootDay[]>([])
  const [message, setMessage] = useState('')

  useEffect(() => {
    let cancelled = false
    Promise.all([
      fetch(`${API_URL}/api/organizations/${organization.id}/projects/${project.id}/tasks`, { headers: { Authorization: `Bearer ${session.access_token}` } }).then((response) => response.json()),
      fetch(`${API_URL}/api/organizations/${organization.id}/projects/${project.id}/schedule`, { headers: { Authorization: `Bearer ${session.access_token}` } }).then((response) => response.json()),
    ]).then(([taskResult, scheduleResult]) => {
      if (cancelled) return
      setTasks(taskResult.tasks ?? [])
      setShootDays(scheduleResult.shootDays ?? [])
    }).catch(() => { if (!cancelled) setMessage('Could not load production details.') })
    return () => { cancelled = true }
  }, [organization.id, project.id, session.access_token])

  async function toggleTask(task: Task) {
    const response = await fetch(`${API_URL}/api/organizations/${organization.id}/projects/${project.id}/tasks/${task.id}`, {
      method: 'PATCH', headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ completed: !task.completed }),
    })
    const result = await response.json()
    if (response.ok) setTasks((currentTasks) => currentTasks.map((currentTask) => currentTask.id === task.id ? result.task : currentTask))
    else setMessage(result.error ?? 'Could not update task.')
  }

  const completedTasks = tasks.filter((task) => task.completed).length
  const progress = tasks.length ? Math.round(completedTasks / tasks.length * 100) : 0

  return <main className="script-shell"><header className="script-header"><button className="text-button" type="button" onClick={onBack}>← Dashboard</button><div><p className="eyebrow">{organization.name} / {project.name}</p><h1>Production</h1></div><span className="script-save">{project.status?.toLowerCase() ?? 'planning'}</span></header><PhaseRail activePhase="Production" onPhaseChange={onPhaseChange} /><div className="production-page"><section className="production-hero"><div><p className="eyebrow">Ready for set</p><h2>Make the day happen.</h2><p>Track the final work between the plan and the shoot.</p></div><div className="production-score"><strong>{progress}%</strong><span>production readiness</span></div></section><div className="production-grid"><section className="panel production-tasks"><p className="eyebrow">Run of show</p><h2>Production checklist</h2>{tasks.map((task) => <button className={task.completed ? 'task task-button complete' : 'task task-button'} key={task.id} type="button" onClick={() => void toggleTask(task)}><span className="check">{task.completed ? 'x' : ''}</span><span><strong>{task.title}</strong><small>{task.completed ? 'Complete' : 'Mark complete'}</small></span></button>)}{!tasks.length && <div className="empty-state"><strong>No production tasks yet.</strong><small>Add tasks from the project dashboard.</small></div>}</section><section className="panel production-days"><p className="eyebrow">Call time</p><h2>Scheduled shoot days</h2>{shootDays.map((day) => <article className="production-day" key={day.id}><div><strong>Day {day.dayNumber}</strong><small>{new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(new Date(day.date))}</small></div><span>{day.scenes.length} scene{day.scenes.length === 1 ? '' : 's'}</span></article>)}{!shootDays.length && <div className="empty-state"><strong>No shoot days scheduled.</strong><small>Open Schedule to add the first day.</small></div>}</section></div>{message && <p className="message">{message}</p>}</div></main>
}
