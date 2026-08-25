import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { PhaseRail, type Phase } from './PhaseRail';

type Props = {
  organization: { id: string; name: string };
  project: { id: string; name: string };
  session: Session;
  onBack: () => void;
  onPhaseChange: (phase: Phase) => void;
};
type Scene = { id: string; sceneNumber: number; heading: string };
type ShootDay = {
  id: string;
  dayNumber: number;
  date: string;
  label?: string | null;
  scenes: { scene: Scene }[];
};
const API_URL = import.meta.env.VITE_API_URL || "";

export function ScheduleWorkspace({
  organization,
  project,
  session,
  onBack,
  onPhaseChange,
}: Props) {
  const [shootDays, setShootDays] = useState<ShootDay[]>([]);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [date, setDate] = useState("");
  const [sceneId, setSceneId] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch(
        `${API_URL}/api/organizations/${organization.id}/projects/${project.id}/schedule`,
        { headers: { Authorization: `Bearer ${session.access_token}` } },
      ).then((response) => response.json()),
      fetch(
        `${API_URL}/api/organizations/${organization.id}/projects/${project.id}/breakdown`,
        { headers: { Authorization: `Bearer ${session.access_token}` } },
      ).then((response) => response.json()),
    ])
      .then(([schedule, breakdown]) => {
        if (cancelled) return;
        setShootDays(schedule.shootDays ?? []);
        setScenes(
          (breakdown.scenes ?? []).map((scene: Scene) => ({
            id: scene.id,
            sceneNumber: scene.sceneNumber,
            heading: scene.heading,
          })),
        );
      })
      .catch(() => {
        if (!cancelled) setMessage("Could not load the schedule.");
      });
    return () => {
      cancelled = true;
    };
  }, [organization.id, project.id, session.access_token]);

  async function createDay(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!date) return;
    const response = await fetch(
      `${API_URL}/api/organizations/${organization.id}/projects/${project.id}/schedule/days`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ date }),
      },
    );
    const result = await response.json();
    if (!response.ok) {
      setMessage(result.error ?? "Could not create shoot day.");
      return;
    }
    setShootDays((currentDays) => [
      ...currentDays,
      { ...result.shootDay, scenes: [] },
    ]);
    setDate("");
    setMessage("Shoot day created");
  }

  async function assignScene(shootDayId: string) {
    if (!sceneId) return;
    const response = await fetch(
      `${API_URL}/api/organizations/${organization.id}/projects/${project.id}/schedule/days/${shootDayId}/scenes`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sceneId }),
      },
    );
    const result = await response.json();
    if (!response.ok) {
      setMessage(result.error ?? "Could not assign scene.");
      return;
    }
    setShootDays((currentDays) =>
      currentDays.map((day) =>
        day.id === shootDayId
          ? {
              ...day,
              scenes: [
                ...day.scenes.filter(({ scene }) => scene.id !== sceneId),
                { scene: result.assignment.scene },
              ],
            }
          : day,
      ),
    );
    setSceneId("");
    setMessage("Scene scheduled");
  }

  return (
    <main className="script-shell">
      <header className="script-header">
        <button className="text-button" type="button" onClick={onBack}>
          ← Dashboard
        </button>
        <div>
          <p className="eyebrow">
            {organization.name} / {project.name}
          </p>
          <h1>Schedule</h1>
        </div>
        <span className="script-save">{shootDays.length} shoot days</span>
      </header>
      <PhaseRail activePhase="Schedule" onPhaseChange={onPhaseChange} />
      <div className="schedule-page">
        <section className="panel schedule-create">
          <p className="eyebrow">Plan the shoot</p>
          <h2>Add a shoot day</h2>
          <form onSubmit={createDay}>
            <input
              required
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
            />
            <button className="primary" type="submit">
              + Shoot day
            </button>
          </form>
        </section>
        <section className="schedule-days">
          {shootDays.map((day) => (
            <article className="shoot-day" key={day.id}>
              <header>
                <div>
                  <p className="eyebrow">Day {day.dayNumber}</p>
                  <h2>
                    {new Intl.DateTimeFormat("en", {
                      dateStyle: "full",
                    }).format(new Date(day.date))}
                  </h2>
                </div>
                <span>
                  {day.scenes.length} scene{day.scenes.length === 1 ? "" : "s"}
                </span>
              </header>
              <div className="strip-list">
                {day.scenes.map(({ scene }) => (
                  <div className="scene-strip" key={scene.id}>
                    <b>{String(scene.sceneNumber).padStart(2, "0")}</b>
                    <span>{scene.heading}</span>
                  </div>
                ))}
                {!day.scenes.length && (
                  <p className="empty-state">No scenes assigned yet.</p>
                )}
              </div>
              <div className="assign-row">
                <select
                  value={sceneId}
                  onChange={(event) => setSceneId(event.target.value)}
                >
                  <option value="">Choose a scene</option>
                  {scenes
                    .filter(
                      (scene) =>
                        !day.scenes.some(
                          ({ scene: assigned }) => assigned.id === scene.id,
                        ),
                    )
                    .map((scene) => (
                      <option key={scene.id} value={scene.id}>
                        Scene {scene.sceneNumber}: {scene.heading}
                      </option>
                    ))}
                </select>
                <button
                  className="outline"
                  type="button"
                  onClick={() => void assignScene(day.id)}
                >
                  Assign scene
                </button>
              </div>
            </article>
          ))}
          {!shootDays.length && (
            <div className="empty-state">
              <strong>Your schedule starts here.</strong>
              <small>Create a shoot day, then assign scenes from Script.</small>
            </div>
          )}
        </section>
        {message && <p className="message">{message}</p>}
      </div>
    </main>
  );
}
