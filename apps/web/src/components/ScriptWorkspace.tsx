import { useState } from "react";
import { useEffect } from "react";
import type { Session } from "@supabase/supabase-js";
import { PhaseRail, type Phase } from './PhaseRail';

type Project = { id: string; name: string; description?: string | null };
type Organization = { id: string; name: string };

type ScriptWorkspaceProps = {
  organization: Organization;
  project: Project;
  onBack: () => void;
  session: Session;
  onPhaseChange: (phase: Phase) => void;
};

type Scene = { id: number; heading: string; body: string };
const API_URL = import.meta.env.VITE_API_URL || "";

export function ScriptWorkspace({
  organization,
  project,
  onBack,
  session,
  onPhaseChange,
}: ScriptWorkspaceProps) {
  const [scenes, setScenes] = useState<Scene[]>([
    {
      id: 1,
      heading: "INT. KITCHEN - NIGHT",
      body: "A quiet kitchen. The refrigerator hums in the dark.",
    },
  ]);
  const [selectedSceneId, setSelectedSceneId] = useState(1);
  const [saved, setSaved] = useState(true);
  const [message, setMessage] = useState("");
  const selectedScene =
    scenes.find((scene) => scene.id === selectedSceneId) ?? scenes[0];

  useEffect(() => {
    let cancelled = false;
    fetch(
      `${API_URL}/api/organizations/${organization.id}/projects/${project.id}/screenplay`,
      {
        headers: { Authorization: `Bearer ${session.access_token}` },
      },
    )
      .then(async (response) => {
        const result = await response.json();
        if (!cancelled && response.ok && result.screenplay?.scenes?.length) {
          const loadedScenes = result.screenplay.scenes.map(
            (scene: {
              sceneNumber: number;
              heading: string;
              body: string;
            }) => ({
              id: scene.sceneNumber,
              heading: scene.heading,
              body: scene.body,
            }),
          );
          setScenes(loadedScenes);
          setSelectedSceneId(loadedScenes[0].id);
        }
      })
      .catch(() => {
        if (!cancelled) setMessage("Could not load the screenplay.");
      });
    return () => {
      cancelled = true;
    };
  }, [organization.id, project.id, session.access_token]);

  async function saveScreenplay(nextScenes = scenes) {
    setSaved(false);
    const response = await fetch(
      `${API_URL}/api/organizations/${organization.id}/projects/${project.id}/screenplay`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: "Screenplay",
          scenes: nextScenes.map((scene) => ({
            sceneNumber: scene.id,
            heading: scene.heading,
            body: scene.body,
          })),
        }),
      },
    );
    if (!response.ok) {
      setMessage("Could not save the screenplay.");
      return;
    }
    setSaved(true);
    setMessage("");
  }

  function updateScene(field: "heading" | "body", value: string) {
    setSaved(false);
    setScenes((currentScenes) =>
      currentScenes.map((scene) =>
        scene.id === selectedSceneId ? { ...scene, [field]: value } : scene,
      ),
    );
  }

  function addScene() {
    const id = Math.max(...scenes.map((scene) => scene.id), 0) + 1;
    setScenes((currentScenes) => [
      ...currentScenes,
      { id, heading: "INT. NEW LOCATION - DAY", body: "" },
    ]);
    setSelectedSceneId(id);
    setSaved(false);
    void saveScreenplay([
      ...scenes,
      { id, heading: "INT. NEW LOCATION - DAY", body: "" },
    ]);
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
          <h1>Screenplay</h1>
        </div>
        <span className="script-save">
          {saved ? "Saved" : "Unsaved changes"}
        </span>
      </header>
      <PhaseRail activePhase="Script" onPhaseChange={onPhaseChange} />
      <div className="script-layout">
        <aside className="scene-list">
          <div className="scene-list-heading">
            <strong>Scenes</strong>
            <button className="primary" type="button" onClick={addScene}>
              + Scene
            </button>
          </div>
          {scenes.map((scene) => (
            <button
              className={
                scene.id === selectedSceneId
                  ? "scene-row selected"
                  : "scene-row"
              }
              key={scene.id}
              type="button"
              onClick={() => setSelectedSceneId(scene.id)}
            >
              <b>{String(scene.id).padStart(2, "0")}</b>
              <span>{scene.heading}</span>
            </button>
          ))}
        </aside>
        <section className="script-editor">
          <p className="eyebrow">
            Scene {String(selectedScene.id).padStart(2, "0")}
          </p>
          <input
            className="scene-heading-input"
            value={selectedScene.heading}
            onChange={(event) => updateScene("heading", event.target.value)}
            onBlur={() => void saveScreenplay()}
          />
          <textarea
            className="script-body"
            value={selectedScene.body}
            onChange={(event) => updateScene("body", event.target.value)}
            onBlur={() => void saveScreenplay()}
            placeholder="Write the action of this scene..."
          />
          <p className="script-hint">
            {scenes.length} scene{scenes.length === 1 ? "" : "s"} in this
            screenplay
          </p>
          {message && <p className="message">{message}</p>}
        </section>
      </div>
    </main>
  );
}
