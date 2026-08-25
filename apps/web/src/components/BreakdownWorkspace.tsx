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
type Element = { id: string; name: string; category: string };
type Scene = {
  id: string;
  sceneNumber: number;
  heading: string;
  body: string;
  elements: { element: Element }[];
};
const API_URL = import.meta.env.VITE_API_URL || "";
const categories = [
  "CAST",
  "CREW",
  "LOCATION",
  "PROP",
  "COSTUME",
  "VEHICLE",
  "SET_DRESSING",
  "OTHER",
];

export function BreakdownWorkspace({
  organization,
  project,
  session,
  onBack,
  onPhaseChange,
}: Props) {
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [selectedSceneId, setSelectedSceneId] = useState("");
  const [elementName, setElementName] = useState("");
  const [category, setCategory] = useState("PROP");
  const [message, setMessage] = useState("");
  const selectedScene =
    scenes.find((scene) => scene.id === selectedSceneId) ?? scenes[0];

  useEffect(() => {
    let cancelled = false;
    fetch(
      `${API_URL}/api/organizations/${organization.id}/projects/${project.id}/breakdown`,
      { headers: { Authorization: `Bearer ${session.access_token}` } },
    )
      .then(async (response) => {
        const result = await response.json();
        if (!cancelled && response.ok) {
          setScenes(result.scenes ?? []);
          if (result.scenes?.length) setSelectedSceneId(result.scenes[0].id);
        }
      })
      .catch(() => {
        if (!cancelled) setMessage("Could not load the breakdown.");
      });
    return () => {
      cancelled = true;
    };
  }, [organization.id, project.id, session.access_token]);

  async function addElement(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedScene || !elementName.trim()) return;
    const response = await fetch(
      `${API_URL}/api/organizations/${organization.id}/projects/${project.id}/breakdown/elements`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sceneId: selectedScene.id,
          name: elementName,
          category,
        }),
      },
    );
    const result = await response.json();
    if (!response.ok) {
      setMessage(result.error ?? "Could not add element.");
      return;
    }
    setScenes((currentScenes) =>
      currentScenes.map((scene) =>
        scene.id === selectedScene.id
          ? {
              ...scene,
              elements: [
                ...scene.elements,
                { element: result.sceneElement.element },
              ],
            }
          : scene,
      ),
    );
    setElementName("");
    setMessage("Element added");
  }

  async function removeElement(elementId: string) {
    if (!selectedScene) return;
    const response = await fetch(
      `${API_URL}/api/organizations/${organization.id}/projects/${project.id}/breakdown/scenes/${selectedScene.id}/elements/${elementId}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${session.access_token}` },
      },
    );
    if (response.ok)
      setScenes((currentScenes) =>
        currentScenes.map((scene) =>
          scene.id === selectedScene.id
            ? {
                ...scene,
                elements: scene.elements.filter(
                  ({ element }) => element.id !== elementId,
                ),
              }
            : scene,
        ),
      );
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
          <h1>Breakdown</h1>
        </div>
        <span className="script-save">{scenes.length} scenes</span>
      </header>
      <PhaseRail activePhase="Breakdown" onPhaseChange={onPhaseChange} />
      <div className="breakdown-layout">
        <aside className="scene-list">
          <div className="scene-list-heading">
            <strong>Scenes</strong>
          </div>
          {scenes.map((scene) => (
            <button
              className={
                scene.id === selectedScene?.id
                  ? "scene-row selected"
                  : "scene-row"
              }
              key={scene.id}
              type="button"
              onClick={() => setSelectedSceneId(scene.id)}
            >
              <b>{String(scene.sceneNumber).padStart(2, "0")}</b>
              <span>{scene.heading}</span>
            </button>
          ))}
          {!scenes.length && (
            <p className="empty-state">Create scenes in Script first.</p>
          )}
        </aside>
        <section className="breakdown-editor">
          {selectedScene ? (
            <>
              <p className="eyebrow">
                Scene {String(selectedScene.sceneNumber).padStart(2, "0")}
              </p>
              <h2>{selectedScene.heading}</h2>
              <p className="scene-preview">
                {selectedScene.body || "No scene action yet."}
              </p>
              <form className="element-form" onSubmit={addElement}>
                <input
                  value={elementName}
                  onChange={(event) => setElementName(event.target.value)}
                  placeholder="Add production element"
                />
                <select
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                >
                  {categories.map((item) => (
                    <option key={item}>{item.replaceAll("_", " ")}</option>
                  ))}
                </select>
                <button className="primary" type="submit">
                  Tag element
                </button>
              </form>
              <div className="element-list">
                {selectedScene.elements.map(({ element }) => (
                  <button
                    className="element-chip"
                    key={element.id}
                    type="button"
                    onClick={() => void removeElement(element.id)}
                  >
                    <strong>{element.name}</strong>
                    <small>
                      {element.category.replaceAll("_", " ")} · remove
                    </small>
                  </button>
                ))}
                {!selectedScene.elements.length && (
                  <p className="empty-state">
                    No production elements tagged yet.
                  </p>
                )}
              </div>
            </>
          ) : (
            <div className="empty-state">
              <strong>No screenplay scenes found.</strong>
              <small>Open Script and add your first scene.</small>
            </div>
          )}
          {message && <p className="message">{message}</p>}
        </section>
      </div>
    </main>
  );
}
