import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { ScriptWorkspace } from './ScriptWorkspace';
import { BreakdownWorkspace } from './BreakdownWorkspace';
import { ScheduleWorkspace } from './ScheduleWorkspace';
import { ContactsWorkspace } from './ContactsWorkspace';
import { PhaseRail, type Phase } from './PhaseRail';
import { ProductionWorkspace } from './ProductionWorkspace';

type Organization = { id: string; name: string; slug: string };
type Project = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  projectType?: string;
  client?: string | null;
  status?: string;
  startDate?: string | null;
  endDate?: string | null;
};
type Task = { id: string; title: string; completed: boolean; dueDate?: string | null };
type Contact = { id: string; name: string; role?: string | null; department?: string | null; category: string };
type Location = { id: string; name: string; address?: string | null; nearestHospital?: string | null };
type ShootDay = { id: string; dayNumber: number; date: string };

type WorkspaceDashboardProps = {
  organization: Organization;
  project: Project;
  projects: Project[];
  session: Session;
  onProjectChange: (project: Project) => void;
  onSignOut: () => void;
};

const API_URL = import.meta.env.VITE_API_URL || '';
const sections = ['Overview', 'Write', 'Breakdown', 'Visualize', 'Plan', 'Shoot'];

function formatType(projectType?: string) {
  return projectType?.replaceAll('_', ' ').toLowerCase() ?? 'project';
}

export function WorkspaceDashboard({
  organization,
  project,
  projects,
  session,
  onProjectChange,
  onSignOut,
}: WorkspaceDashboardProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [shootDays, setShootDays] = useState<ShootDay[]>([]);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskMessage, setTaskMessage] = useState('');
  const [creatingTask, setCreatingTask] = useState(false);
  const [selectedSection, setSelectedSection] = useState('Overview');
  const [notice, setNotice] = useState('');
  const [shared, setShared] = useState(false);
  const [selectedPhase, setSelectedPhase] = useState<Phase>('Idea');

  // Local state for projects so we can update the dropdown instantly
  const [activeProjects, setActiveProjects] = useState<Project[]>(projects);

  // New Project Modal State
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [isSubmittingProject, setIsSubmittingProject] = useState(false);
  const [newProjectError, setNewProjectError] = useState('');

  useEffect(() => {
    setActiveProjects(projects);
  }, [projects]);

  const handlePhaseChange = (phase: Phase) => {
    setSelectedPhase(phase);
    if (phase === 'Idea') setSelectedSection('Overview');
    else if (phase === 'Script') setSelectedSection('Write');
    else if (phase === 'Breakdown') setSelectedSection('Breakdown');
    else if (phase === 'Plan') setSelectedSection('Plan');
    else if (phase === 'Schedule') setSelectedSection('Schedule');
    else if (phase === 'Production') setSelectedSection('Shoot');
  };

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch(`${API_URL}/api/organizations/${organization.id}/projects/${project.id}/tasks`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      }).then((r) => r.json()),
      fetch(`${API_URL}/api/organizations/${organization.id}/projects/${project.id}/contacts`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      }).then((r) => r.json()),
      fetch(`${API_URL}/api/organizations/${organization.id}/projects/${project.id}/locations`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      }).then((r) => r.json()),
      fetch(`${API_URL}/api/organizations/${organization.id}/projects/${project.id}/schedule`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      }).then((r) => r.json()),
    ])
      .then(([taskRes, contactRes, locRes, schedRes]) => {
        if (cancelled) return;
        setTasks(taskRes.tasks ?? []);
        setContacts(contactRes.contacts ?? []);
        setLocations(locRes.locations ?? []);
        setShootDays(schedRes.shootDays ?? []);
      })
      .catch(() => {
        if (!cancelled) setTaskMessage('Some production data is unavailable.');
      });

    return () => {
      cancelled = true;
    };
  }, [organization.id, project.id, session.access_token]);

  async function createTask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!taskTitle.trim()) return;
    setCreatingTask(true);
    setTaskMessage('');
    try {
      const response = await fetch(`${API_URL}/api/organizations/${organization.id}/projects/${project.id}/tasks`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: taskTitle }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? 'Could not add task.');
      setTasks((currentTasks) => [...currentTasks, result.task]);
      setTaskTitle('');
    } catch (error) {
      setTaskMessage(error instanceof Error ? error.message : 'Could not add task.');
    } finally {
      setCreatingTask(false);
    }
  }

  async function toggleTask(task: Task) {
    const response = await fetch(`${API_URL}/api/organizations/${organization.id}/projects/${project.id}/tasks/${task.id}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: !task.completed }),
    });
    const result = await response.json();
    if (response.ok) {
      setTasks((currentTasks) => currentTasks.map((currentTask) => (currentTask.id === task.id ? result.task : currentTask)));
    }
  }

  async function handleCreateProject(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!newProjectName.trim()) return;

    setIsSubmittingProject(true);
    setNewProjectError('');

    try {
      const response = await fetch(`${API_URL}/api/organizations/${organization.id}/projects`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newProjectName,
          projectType: 'FILM',
          status: 'PLANNING',
        }),
      });
      const result = await response.json();

      if (!response.ok) throw new Error(result.error ?? 'Could not create project.');

      setActiveProjects((current) => [result, ...current]);
      setShowNewProjectModal(false);
      setNewProjectName('');
    } catch (error) {
      setNewProjectError(error instanceof Error ? error.message : 'Failed to create project.');
    } finally {
      setIsSubmittingProject(false);
    }
  }

  // Workspace Routing
  if (selectedPhase === 'Script' || selectedSection === 'Write') {
    return (
      <ScriptWorkspace
        organization={organization}
        project={project}
        session={session}
        onPhaseChange={handlePhaseChange}
        onBack={() => handlePhaseChange('Idea')}
      />
    );
  }
  if (selectedPhase === 'Breakdown' || selectedSection === 'Breakdown') {
    return (
      <BreakdownWorkspace
        organization={organization}
        project={project}
        session={session}
        onPhaseChange={handlePhaseChange}
        onBack={() => handlePhaseChange('Idea')}
      />
    );
  }
  if (selectedPhase === 'Plan' || selectedSection === 'Plan') {
    return (
      <ContactsWorkspace
        organization={organization}
        project={project}
        session={session}
        onPhaseChange={handlePhaseChange}
        onBack={() => handlePhaseChange('Idea')}
      />
    );
  }
  if (selectedPhase === 'Schedule' || selectedSection === 'Schedule') {
    return (
      <ScheduleWorkspace
        organization={organization}
        project={project}
        session={session}
        onPhaseChange={handlePhaseChange}
        onBack={() => handlePhaseChange('Idea')}
      />
    );
  }
  if (selectedPhase === 'Production' || selectedSection === 'Shoot') {
    return (
      <ProductionWorkspace
        organization={organization}
        project={project}
        session={session}
        onPhaseChange={handlePhaseChange}
        onBack={() => handlePhaseChange('Idea')}
      />
    );
  }

  const completedTasks = tasks.filter((task) => task.completed).length;
  const progressPercent = tasks.length ? Math.round((completedTasks / tasks.length) * 100) : 0;

  return (
    <>
      <main className="app-shell">
        <aside className="sidebar">
          <div className="brand">
            FRAME <span>/ WORK</span>
          </div>
          <div className="workspace">
            <b>{organization.name.charAt(0).toUpperCase()}</b>
            <span>
              <strong>{organization.name}</strong>
              <small>Live workspace</small>
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', padding: '0 24px' }}>
            <label className="project-switcher" style={{ flex: 1, padding: 0 }}>
              Project
              <select
                value={project.id}
                onChange={(event) => {
                  const nextProject = activeProjects.find((item) => item.id === event.target.value);
                  if (nextProject) onProjectChange(nextProject);
                }}
              >
                {activeProjects.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={() => setShowNewProjectModal(true)}
              style={{
                height: '42px',
                width: '42px',
                borderRadius: '6px',
                border: '1px solid #333',
                background: '#111',
                color: '#fff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
              }}
              title="Create new project"
            >
              +
            </button>
          </div>

          <p className="nav-label">Workspace</p>
          <nav>
            {sections.map((section, index) => (
              <button
                className={selectedSection === section ? 'nav selected' : 'nav'}
                key={section}
                type="button"
                onClick={() => {
                  setSelectedSection(section);
                  setNotice(`${section} selected`);
                  if (section === 'Overview') setSelectedPhase('Idea');
                  else if (section === 'Write') setSelectedPhase('Script');
                  else if (section === 'Breakdown') setSelectedPhase('Breakdown');
                  else if (section === 'Plan') setSelectedPhase('Plan');
                  else if (section === 'Shoot') setSelectedPhase('Production');
                }}
              >
                <i>{['+', 'W', 'B', 'V', 'P', 'S'][index]}</i>
                {section}
              </button>
            ))}
          </nav>
          <div className="sidebar-footer">
            <button className="nav" type="button" onClick={() => setNotice('Help is coming soon')}>
              <i>?</i>Help & resources
            </button>
            <button className="profile" type="button" onClick={onSignOut}>
              <b>{session.user.email?.slice(0, 2).toUpperCase() ?? 'U'}</b>
              <span>
                <strong>{session.user.email ?? 'Account'}</strong>
                <small>Sign out</small>
              </span>
            </button>
          </div>
        </aside>

        <section className="content">
          <header className="topbar">
            <strong>PROJECTS / {project.name.toUpperCase()}</strong>
            <span>
              {shared ? '● Shared with your team' : '● Live data'}{' '}
              <button type="button" onClick={() => setShared((currentShared) => !currentShared)}>
                {shared ? 'Unshare' : 'Share'}
              </button>
            </span>
          </header>
          <div className="page">
            <div className="heading">
              <div>
                <p className="eyebrow">
                  {formatType(project.projectType)} / {selectedSection}
                </p>
                <h1>{project.name}</h1>
                <p className="lede">{project.description ?? `A production by ${organization.name}`}</p>
              </div>
              <button
                className="primary"
                type="button"
                onClick={() => document.querySelector<HTMLInputElement>('.quick-task input')?.focus()}
              >
                + New item
              </button>
            </div>

            {notice && (
              <p className="interaction-notice" role="status">
                {notice}
              </p>
            )}

            {/* Continuous 6-Phase Production Rail */}
            <div style={{ margin: '32px 0 24px', background: '#fff', border: '1px solid var(--line)', borderRadius: '6px' }}>
              <PhaseRail activePhase={selectedPhase} onPhaseChange={handlePhaseChange} />
            </div>

            <div className="grid">
              {/* Panel 1: Tasks */}
              <section className="panel tasks">
                <p className="eyebrow">Today</p>
                <h2>Next on the desk</h2>
                <form className="quick-task" onSubmit={createTask}>
                  <input
                    aria-label="New task title"
                    value={taskTitle}
                    onChange={(event) => setTaskTitle(event.target.value)}
                    placeholder="Add a task"
                  />
                  <button className="primary" disabled={creatingTask} type="submit">
                    {creatingTask ? 'Adding...' : 'Add'}
                  </button>
                </form>
                {tasks.map((task) => (
                  <button
                    className={task.completed ? 'task task-button complete' : 'task task-button'}
                    key={task.id}
                    type="button"
                    onClick={() => void toggleTask(task)}
                  >
                    <span className="check">{task.completed ? 'x' : ''}</span>
                    <span>
                      <strong>{task.title}</strong>
                      <small>{task.completed ? 'Completed' : 'Click to complete'}</small>
                    </span>
                  </button>
                ))}
                {!tasks.length && (
                  <div className="empty-state">
                    <strong>Your production starts here.</strong>
                    <small>Add your first task above.</small>
                  </div>
                )}
                {taskMessage && <p className="message">{taskMessage}</p>}
              </section>

              {/* Panel 2: Production Pulse */}
              <section className="panel pulse">
                <p className="eyebrow">Project status</p>
                <h2>{project.status?.toLowerCase() ?? 'planning'}</h2>
                <div className="number">
                  {progressPercent}
                  <span>%</span>
                </div>
                <div className="bar">
                  <span style={{ width: `${progressPercent}%` }} />
                </div>
                <p>{tasks.filter((task) => !task.completed).length} open tasks remaining</p>
                <div className="stats" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '20px' }}>
                  <button className="stat-pill" type="button" onClick={() => handlePhaseChange('Schedule')}>
                    <b>{shootDays.length}</b>
                    <small>shoot days</small>
                  </button>
                  <button className="stat-pill" type="button" onClick={() => handlePhaseChange('Plan')}>
                    <b>{contacts.length}</b>
                    <small>cast & crew</small>
                  </button>
                  <button className="stat-pill" type="button" onClick={() => handlePhaseChange('Plan')}>
                    <b>{locations.length}</b>
                    <small>locations</small>
                  </button>
                </div>
              </section>

              {/* Panel 3: Key People & Cast / Crew (Integrated with Plan) */}
              <section className="panel">
                <div className="panel-header-action">
                  <div>
                    <p className="eyebrow">Team & Talent</p>
                    <h2 style={{ margin: '4px 0 0' }}>Cast & Crew</h2>
                  </div>
                  <button className="panel-link" type="button" onClick={() => handlePhaseChange('Plan')}>
                    Manage Directory ({contacts.length}) →
                  </button>
                </div>
                <div className="dashboard-list">
                  {contacts.slice(0, 3).map((c) => {
                    const initials = c.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .substring(0, 2)
                      .toUpperCase();
                    return (
                      <div className="dashboard-item" key={c.id}>
                        <div className="dashboard-item-main">
                          <div className="dashboard-avatar">{initials}</div>
                          <div className="dashboard-item-text">
                            <strong>{c.name}</strong>
                            <small>
                              {c.role ?? c.department ?? c.category.toLowerCase()}
                            </small>
                          </div>
                        </div>
                        <span className={`badge category-${c.category.toLowerCase()}`}>
                          {c.category.replaceAll('_', ' ')}
                        </span>
                      </div>
                    );
                  })}
                  {!contacts.length && (
                    <div className="empty-state" style={{ padding: '24px 0' }}>
                      <strong>No team or cast added yet.</strong>
                      <small>
                        <button className="panel-link" style={{ marginTop: '6px' }} type="button" onClick={() => handlePhaseChange('Plan')}>
                          + Add first cast/crew member
                        </button>
                      </small>
                    </div>
                  )}
                </div>
              </section>

              {/* Panel 4: Shooting Locations (Integrated with Plan) */}
              <section className="panel">
                <div className="panel-header-action">
                  <div>
                    <p className="eyebrow">Production Sets</p>
                    <h2 style={{ margin: '4px 0 0' }}>Locations</h2>
                  </div>
                  <button className="panel-link" type="button" onClick={() => handlePhaseChange('Plan')}>
                    Manage Locations ({locations.length}) →
                  </button>
                </div>
                <div className="dashboard-list">
                  {locations.slice(0, 2).map((loc) => (
                    <div className="dashboard-item" key={loc.id}>
                      <div className="dashboard-item-text">
                        <strong>📍 {loc.name}</strong>
                        {loc.address && <small>{loc.address}</small>}
                        {loc.nearestHospital && (
                          <small style={{ color: 'var(--orange)', marginTop: '4px' }}>
                            🏥 ER: {loc.nearestHospital}
                          </small>
                        )}
                      </div>
                    </div>
                  ))}
                  {!locations.length && (
                    <div className="empty-state" style={{ padding: '24px 0' }}>
                      <strong>No shooting locations added.</strong>
                      <small>
                        <button className="panel-link" style={{ marginTop: '6px' }} type="button" onClick={() => handlePhaseChange('Plan')}>
                          + Add first location
                        </button>
                      </small>
                    </div>
                  )}
                </div>
              </section>
            </div>
          </div>
        </section>
      </main>

      {/* Project Creation Modal */}
      {showNewProjectModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
        >
          <div
            style={{
              backgroundColor: '#1a1a1a',
              padding: '32px',
              borderRadius: '12px',
              width: '100%',
              maxWidth: '440px',
              border: '1px solid #333',
            }}
          >
            <h2 style={{ margin: '0 0 8px 0', fontSize: '24px', color: '#fff' }}>New Project</h2>
            <p style={{ margin: '0 0 24px 0', color: '#888', fontSize: '14px' }}>
              Create a new production inside {organization.name}.
            </p>

            <form onSubmit={handleCreateProject}>
              <label style={{ display: 'block', marginBottom: '24px', color: '#ccc', fontSize: '14px' }}>
                Project Name
                <input
                  required
                  minLength={2}
                  maxLength={120}
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="e.g. The Next Big Thing"
                  style={{
                    width: '100%',
                    marginTop: '8px',
                    padding: '12px',
                    borderRadius: '6px',
                    border: '1px solid #333',
                    backgroundColor: '#000',
                    color: '#fff',
                    fontSize: '16px',
                  }}
                />
              </label>

              {newProjectError && <p style={{ color: '#ff4444', fontSize: '14px', marginBottom: '16px' }}>{newProjectError}</p>}

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowNewProjectModal(false);
                    setNewProjectError('');
                    setNewProjectName('');
                  }}
                  style={{
                    padding: '10px 16px',
                    borderRadius: '6px',
                    border: '1px solid #333',
                    backgroundColor: 'transparent',
                    color: '#fff',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingProject}
                  className="primary"
                  style={{ padding: '10px 24px', cursor: isSubmittingProject ? 'not-allowed' : 'pointer' }}
                >
                  {isSubmittingProject ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
