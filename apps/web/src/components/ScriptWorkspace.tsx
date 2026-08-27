import { useState, useEffect } from "react";
import type { Session } from "@supabase/supabase-js";
import { PhaseRail, type Phase } from './PhaseRail';

type Project = { id: string; name: string; description?: string | null };
type Organization = { id: string; name: string };

type ScreenplayElementType = 'SCENE_HEADING' | 'ACTION' | 'CHARACTER' | 'DIALOGUE' | 'PARENTHETICAL' | 'TRANSITION' | 'SHOT';

type ScriptElement = { 
  id: string; 
  type: ScreenplayElementType; 
  content: string;
};

type Scene = { 
  id: number; 
  heading: string; 
  body: string; 
  scriptElements: ScriptElement[];
};

type ScriptWorkspaceProps = {
  organization: Organization;
  project: Project;
  onBack: () => void;
  session: Session;
  onPhaseChange: (phase: Phase) => void;
};

const API_URL = import.meta.env.VITE_API_URL || "";

// Industry-standard screenplay margins translated to CSS
function getStyleForType(type: ScreenplayElementType): React.CSSProperties {
  const baseStyle: React.CSSProperties = {
    width: '100%',
    minHeight: '24px',
    background: 'transparent',
    border: '1px solid transparent',
    color: '#ffffff',
    fontFamily: '"Courier Prime", "Courier New", Courier, monospace',
    fontSize: '16px',
    lineHeight: '1.4',
    resize: 'none',
    overflow: 'hidden',
    padding: '4px 8px',
    transition: 'border 0.2s',
  };

  switch (type) {
    case 'CHARACTER':
      return { ...baseStyle, marginLeft: '35%', width: '40%', textTransform: 'uppercase', fontWeight: 'bold' };
    case 'DIALOGUE':
      return { ...baseStyle, marginLeft: '15%', width: '70%' };
    case 'PARENTHETICAL':
      return { ...baseStyle, marginLeft: '25%', width: '50%', fontStyle: 'italic' };
    case 'TRANSITION':
      return { ...baseStyle, marginLeft: '65%', width: '35%', textTransform: 'uppercase' };
    case 'SHOT':
      return { ...baseStyle, textTransform: 'uppercase', fontWeight: 'bold' };
    case 'ACTION':
    case 'SCENE_HEADING':
    default:
      return { ...baseStyle };
  }
}

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
      heading: "INT. NEW LOCATION - DAY",
      body: "",
      scriptElements: []
    },
  ]);
  const [selectedSceneId, setSelectedSceneId] = useState(1);
  const [saved, setSaved] = useState(true);
  const [message, setMessage] = useState("");
  
  const selectedScene = scenes.find((scene) => scene.id === selectedSceneId) ?? scenes[0];

  useEffect(() => {
    let cancelled = false;
    fetch(
      `${API_URL}/api/organizations/${organization.id}/projects/${project.id}/screenplay`,
      {
        headers: { Authorization: `Bearer ${session.access_token}` },
      }
    )
      .then(async (response) => {
        const result = await response.json();
        if (!cancelled && response.ok && result.screenplay?.scenes?.length) {
          const loadedScenes = result.screenplay.scenes.map((scene: any) => ({
            id: scene.sceneNumber,
            heading: scene.heading,
            body: scene.body,
            scriptElements: scene.scriptElements?.map((el: any) => ({
              id: el.id,
              type: el.type,
              content: el.content
            })) || []
          }));
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
            body: scene.body, // Kept for backwards compatibility
            scriptElements: scene.scriptElements.map(el => ({
              type: el.type,
              content: el.content
            }))
          })),
        }),
      }
    );
    if (!response.ok) {
      setMessage("Could not save the screenplay.");
      return;
    }
    setSaved(true);
    setMessage("");
  }

  function updateSceneHeading(value: string) {
    setSaved(false);
    setScenes((current) =>
      current.map((scene) =>
        scene.id === selectedSceneId ? { ...scene, heading: value } : scene
      )
    );
  }

  function addScene() {
    const id = Math.max(...scenes.map((scene) => scene.id), 0) + 1;
    const newScene: Scene = { id, heading: "INT. NEW LOCATION - DAY", body: "", scriptElements: [] };
    const nextScenes = [...scenes, newScene];
    
    setScenes(nextScenes);
    setSelectedSceneId(id);
    setSaved(false);
    void saveScreenplay(nextScenes);
  }

  // --- NEW: Structured Element Handlers ---
  function updateElement(elementId: string, content: string, type?: ScreenplayElementType) {
    setSaved(false);
    setScenes((current) => current.map((scene) => {
      if (scene.id !== selectedSceneId) return scene;
      return {
        ...scene,
        scriptElements: scene.scriptElements.map((el) => 
          el.id === elementId ? { ...el, content: content ?? el.content, type: type ?? el.type } : el
        )
      };
    }));
  }

  function addElement(type: ScreenplayElementType) {
    setSaved(false);
    const newElement: ScriptElement = { 
      id: Math.random().toString(36).substring(7), // Temporary client-side ID
      type, 
      content: '' 
    };
    
    setScenes((current) => current.map((scene) => {
      if (scene.id !== selectedSceneId) return scene;
      return { ...scene, scriptElements: [...scene.scriptElements, newElement] };
    }));
  }

  function removeElement(elementId: string) {
    setSaved(false);
    setScenes((current) => current.map((scene) => {
      if (scene.id !== selectedSceneId) return scene;
      return {
        ...scene,
        scriptElements: scene.scriptElements.filter(el => el.id !== elementId)
      };
    }));
    void saveScreenplay(); // Auto-save on delete
  }

  // Auto-resize textarea to fit content
  const handleInputResize = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    e.target.style.height = 'auto';
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

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
              className={scene.id === selectedSceneId ? "scene-row selected" : "scene-row"}
              key={scene.id}
              type="button"
              onClick={() => setSelectedSceneId(scene.id)}
            >
              <b>{String(scene.id).padStart(2, "0")}</b>
              <span>{scene.heading || 'UNTITLED SCENE'}</span>
            </button>
          ))}
        </aside>
        
        <section className="script-editor" style={{ paddingBottom: '100px' }}>
          <p className="eyebrow">
            Scene {String(selectedScene.id).padStart(2, "0")}
          </p>
          
          <input
            className="scene-heading-input"
            value={selectedScene.heading}
            onChange={(event) => updateSceneHeading(event.target.value)}
            onBlur={() => void saveScreenplay()}
            placeholder="INT. LOCATION - DAY"
            style={{ marginBottom: '24px' }}
          />

          {/* NEW: Map out the structured blocks */}
          <div className="script-elements" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {selectedScene.scriptElements.map((el) => (
              <div key={el.id} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', position: 'relative' }}>
                
                {/* Invisible dropdown to change type on the fly */}
                <select 
                  value={el.type}
                  onChange={(e) => {
                    updateElement(el.id, el.content, e.target.value as ScreenplayElementType);
                    void saveScreenplay();
                  }}
                  style={{ width: '120px', padding: '4px', fontSize: '11px', background: '#222', color: '#ffffff', border: '1px solid #555', borderRadius: '4px', marginTop: '4px' }}
                >
                  <option value="ACTION">Action</option>
                  <option value="CHARACTER">Character</option>
                  <option value="DIALOGUE">Dialogue</option>
                  <option value="PARENTHETICAL">Parenthetical</option>
                  <option value="TRANSITION">Transition</option>
                  <option value="SHOT">Shot</option>
                </select>

                <textarea
                  value={el.content}
                  onChange={(event) => {
                    handleInputResize(event);
                    updateElement(el.id, event.target.value);
                  }}
                  onBlur={() => void saveScreenplay()}
                  placeholder={`Write ${el.type.toLowerCase()}...`}
                  style={getStyleForType(el.type)}
                  rows={1}
                />

                <button 
                  onClick={() => removeElement(el.id)}
                  style={{ background: 'transparent', border: 'none', color: '#ff4444', cursor: 'pointer', padding: '4px 8px', marginTop: '4px' }}
                  title="Remove block"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          {/* NEW: Block Addition Toolbar */}
          <div style={{ marginTop: '32px', padding: '16px', background: '#111', borderRadius: '8px', border: '1px dashed #333', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ width: '100%', fontSize: '12px', color: '#666', marginBottom: '8px' }}>ADD BLOCK</span>
            <button className="secondary" type="button" onClick={() => addElement('ACTION')}>+ Action</button>
            <button className="secondary" type="button" onClick={() => addElement('CHARACTER')}>+ Character</button>
            <button className="secondary" type="button" onClick={() => addElement('DIALOGUE')}>+ Dialogue</button>
            <button className="secondary" type="button" onClick={() => addElement('PARENTHETICAL')}>+ Parenthetical</button>
            <button className="secondary" type="button" onClick={() => addElement('TRANSITION')}>+ Transition</button>
          </div>

          {message && <p className="message" style={{ marginTop: '24px' }}>{message}</p>}
        </section>
      </div>
    </main>
  );
}