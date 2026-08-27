import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { PhaseRail, type Phase } from './PhaseRail';

type Props = {
  organization: { id: string; name: string };
  project: { id: string; name: string; status?: string };
  session: Session;
  onBack: () => void;
  onPhaseChange: (phase: Phase) => void;
};

type SceneItem = {
  id: string;
  sceneNumber: number;
  heading: string;
  body?: string | null;
};

type ShootDay = {
  id: string;
  dayNumber: number;
  date: string;
  label?: string | null;
  scenes: { scene: SceneItem }[];
};

type CastCall = {
  id?: string;
  castNumber?: string | null;
  characterName: string;
  actorName: string;
  status?: string | null;
  pickupTime?: string | null;
  hmuCall?: string | null;
  onSetCall?: string | null;
  notes?: string | null;
  position: number;
};

type CallSheet = {
  id?: string;
  projectId: string;
  shootDayId: string;
  title?: string | null;
  generalCrewCall?: string | null;
  breakfastTime?: string | null;
  firstShotTime?: string | null;
  lunchTime?: string | null;
  estimatedWrap?: string | null;
  weatherNotes?: string | null;
  locationName?: string | null;
  locationAddress?: string | null;
  parkingNotes?: string | null;
  basecampNotes?: string | null;
  nearestHospital?: string | null;
  generalNotes?: string | null;
  departmentNotes?: string | null;
  castCalls?: CastCall[];
  shootDay?: ShootDay;
};

type Contact = {
  id: string;
  name: string;
  role?: string | null;
  category: string;
};

type Location = {
  id: string;
  name: string;
  address?: string | null;
  parking?: string | null;
  basecamp?: string | null;
  nearestHospital?: string | null;
};

const API_URL = import.meta.env.VITE_API_URL || '';

export function ProductionWorkspace({ organization, project, session, onBack, onPhaseChange }: Props) {
  const [shootDays, setShootDays] = useState<ShootDay[]>([]);
  const [selectedDayId, setSelectedDayId] = useState<string | null>(null);
  const [callSheet, setCallSheet] = useState<CallSheet | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  // 1. Initial Data Fetching
  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    Promise.all([
      fetch(`${API_URL}/api/organizations/${organization.id}/projects/${project.id}/schedule`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      }).then((r) => (r.ok ? r.json().catch(() => ({})) : {})),
      fetch(`${API_URL}/api/organizations/${organization.id}/projects/${project.id}/contacts`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      }).then((r) => (r.ok ? r.json().catch(() => ({})) : {})),
      fetch(`${API_URL}/api/organizations/${organization.id}/projects/${project.id}/locations`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      }).then((r) => (r.ok ? r.json().catch(() => ({})) : {})),
    ])
      .then(([scheduleRes, contactsRes, locationsRes]: [any, any, any]) => {
        if (cancelled) return;
        const days = scheduleRes.shootDays ?? [];
        setShootDays(days);
        setContacts(contactsRes.contacts ?? []);
        setLocations(locationsRes.locations ?? []);

        if (days.length > 0 && !selectedDayId) {
          setSelectedDayId(days[0].id);
        }
      })
      .catch((err) => {
        console.error('Error fetching production schedule:', err);
        if (!cancelled) setMessage('Could not load production data.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [organization.id, project.id, session.access_token]);

  // 2. Fetch Call Sheet for the Selected Shoot Day
  useEffect(() => {
    if (!selectedDayId) return;
    let cancelled = false;

    fetch(`${API_URL}/api/organizations/${organization.id}/projects/${project.id}/callsheets/days/${selectedDayId}`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
      .then((r) => (r.ok ? r.json().catch(() => ({})) : {}))
      .then((data: any) => {
        if (cancelled) return;
        if (data.callSheet) {
          setCallSheet(data.callSheet);
        }
      })
      .catch((err) => {
        console.error('Error fetching day call sheet:', err);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedDayId, organization.id, project.id, session.access_token]);

  // 3. Save Call Sheet Handler
  async function handleSaveCallSheet(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!selectedDayId || !callSheet) return;

    setSaving(true);
    setMessage('');

    try {
      const response = await fetch(`${API_URL}/api/organizations/${organization.id}/projects/${project.id}/callsheets`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          shootDayId: selectedDayId,
          title: callSheet.title,
          generalCrewCall: callSheet.generalCrewCall,
          breakfastTime: callSheet.breakfastTime,
          firstShotTime: callSheet.firstShotTime,
          lunchTime: callSheet.lunchTime,
          estimatedWrap: callSheet.estimatedWrap,
          weatherNotes: callSheet.weatherNotes,
          locationName: callSheet.locationName,
          locationAddress: callSheet.locationAddress,
          parkingNotes: callSheet.parkingNotes,
          basecampNotes: callSheet.basecampNotes,
          nearestHospital: callSheet.nearestHospital,
          generalNotes: callSheet.generalNotes,
          departmentNotes: callSheet.departmentNotes,
          castCalls: callSheet.castCalls,
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? 'Failed to save call sheet.');

      setCallSheet(result.callSheet);
      setMessage('✓ Call sheet saved successfully');
      setTimeout(() => setMessage(''), 4000);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Could not save call sheet.');
    } finally {
      setSaving(false);
    }
  }

  // Quick-fill from saved location
  function handleSelectLocation(locationId: string) {
    const loc = locations.find((l) => l.id === locationId);
    if (!loc || !callSheet) return;

    setCallSheet({
      ...callSheet,
      locationName: loc.name,
      locationAddress: loc.address || '',
      parkingNotes: loc.parking || '',
      basecampNotes: loc.basecamp || '',
      nearestHospital: loc.nearestHospital || '',
    });
  }

  // Cast Call Table Operations
  function handleAddCastRow() {
    if (!callSheet) return;
    const currentList = callSheet.castCalls ?? [];
    const newRow: CastCall = {
      castNumber: String(currentList.length + 1),
      characterName: '',
      actorName: '',
      status: 'W',
      pickupTime: '06:30 AM',
      hmuCall: '07:00 AM',
      onSetCall: '07:45 AM',
      notes: '',
      position: currentList.length,
    };
    setCallSheet({
      ...callSheet,
      castCalls: [...currentList, newRow],
    });
  }

  function handleUpdateCastRow(index: number, field: keyof CastCall, value: any) {
    if (!callSheet || !callSheet.castCalls) return;
    const updated = [...callSheet.castCalls];
    updated[index] = { ...updated[index], [field]: value };
    setCallSheet({ ...callSheet, castCalls: updated });
  }

  function handleRemoveCastRow(index: number) {
    if (!callSheet || !callSheet.castCalls) return;
    const updated = callSheet.castCalls.filter((_, i) => i !== index);
    setCallSheet({ ...callSheet, castCalls: updated });
  }

  const activeDay = shootDays.find((d) => d.id === selectedDayId);
  const activeDayDate = activeDay ? new Date(activeDay.date) : new Date();
  const formattedDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(activeDayDate);

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
          <h1>Call Sheets & Set Operations</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button className="secondary" type="button" onClick={() => window.print()} title="Print / Export PDF Call Sheet">
            🖨️ Print / PDF
          </button>
          <button className="primary" type="button" onClick={() => void handleSaveCallSheet()} disabled={saving}>
            {saving ? 'Saving...' : 'Save Call Sheet'}
          </button>
        </div>
      </header>

      <PhaseRail activePhase="Production" onPhaseChange={onPhaseChange} />

      <div className="callsheet-container">
        {/* Day Selector Toolbar */}
        <div className="callsheet-toolbar">
          <div className="callsheet-tabs">
            {shootDays.map((day) => (
              <button
                key={day.id}
                type="button"
                className={selectedDayId === day.id ? 'tab-btn active' : 'tab-btn'}
                onClick={() => setSelectedDayId(day.id)}
              >
                Day {day.dayNumber}
                <span style={{ marginLeft: '4px' }}>
                  ({new Intl.DateTimeFormat('en', { month: 'numeric', day: 'numeric' }).format(new Date(day.date))})
                </span>
              </button>
            ))}
          </div>

          {shootDays.length === 0 && !loading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ color: 'var(--muted)', fontSize: '13px' }}>No shoot days scheduled yet.</span>
              <button className="secondary" type="button" onClick={() => onPhaseChange('Schedule')}>
                Go to Schedule →
              </button>
            </div>
          )}
        </div>

        {message && <p className="interaction-notice">{message}</p>}

        {/* The Industry-Standard Call Sheet Document */}
        {callSheet && activeDay && (
          <form onSubmit={handleSaveCallSheet} className="cs-sheet">
            {/* Sheet Header */}
            <div className="cs-header">
              <div className="cs-header-left">
                <input
                  type="text"
                  value={callSheet.title ?? ''}
                  onChange={(e) => setCallSheet({ ...callSheet, title: e.target.value })}
                  placeholder={`Day ${activeDay.dayNumber} Production Call Sheet`}
                  style={{
                    fontSize: '22px',
                    fontWeight: 700,
                    border: '0',
                    background: 'transparent',
                    width: '100%',
                    padding: '0',
                    marginBottom: '4px',
                  }}
                />
                <p>
                  <strong>{project.name.toUpperCase()}</strong> · {organization.name}
                </p>
              </div>

              <div className="cs-header-right">
                <strong>DAY {activeDay.dayNumber} OF {shootDays.length || 1}</strong>
                <span>{formattedDate}</span>
              </div>
            </div>

            {/* Key Call Times Grid */}
            <div className="cs-times-grid">
              <div className="cs-time-box">
                <label>Crew Call</label>
                <input
                  type="text"
                  value={callSheet.generalCrewCall ?? '07:00 AM'}
                  onChange={(e) => setCallSheet({ ...callSheet, generalCrewCall: e.target.value })}
                />
              </div>
              <div className="cs-time-box">
                <label>Breakfast</label>
                <input
                  type="text"
                  value={callSheet.breakfastTime ?? '06:30 AM'}
                  onChange={(e) => setCallSheet({ ...callSheet, breakfastTime: e.target.value })}
                />
              </div>
              <div className="cs-time-box">
                <label>First Shot</label>
                <input
                  type="text"
                  value={callSheet.firstShotTime ?? '08:00 AM'}
                  onChange={(e) => setCallSheet({ ...callSheet, firstShotTime: e.target.value })}
                />
              </div>
              <div className="cs-time-box">
                <label>Lunch</label>
                <input
                  type="text"
                  value={callSheet.lunchTime ?? '01:00 PM'}
                  onChange={(e) => setCallSheet({ ...callSheet, lunchTime: e.target.value })}
                />
              </div>
              <div className="cs-time-box">
                <label>Estimated Wrap</label>
                <input
                  type="text"
                  value={callSheet.estimatedWrap ?? '07:00 PM'}
                  onChange={(e) => setCallSheet({ ...callSheet, estimatedWrap: e.target.value })}
                />
              </div>
            </div>

            {/* Weather / Sun Bar */}
            <div className="cs-weather-bar">
              <span>☀️ Weather:</span>
              <input
                type="text"
                value={callSheet.weatherNotes ?? ''}
                onChange={(e) => setCallSheet({ ...callSheet, weatherNotes: e.target.value })}
                placeholder="e.g. Clear & Sunny, 72°F · Sunrise 06:12 AM · Sunset 07:45 PM"
              />
            </div>

            {/* Locations & Safety Alert */}
            <div className="cs-section">
              <div className="cs-section-title">
                <h3>📍 Set Locations & Basecamp</h3>
                {locations.length > 0 && (
                  <select
                    style={{ fontSize: '12px', padding: '4px 8px', border: '1px solid var(--line)', background: 'var(--white)' }}
                    onChange={(e) => handleSelectLocation(e.target.value)}
                    defaultValue=""
                  >
                    <option value="" disabled>
                      Select saved location to prefill...
                    </option>
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="cs-locations-grid">
                <div className="cs-location-card">
                  <h4>Shooting Set Location</h4>
                  <input
                    type="text"
                    value={callSheet.locationName ?? ''}
                    onChange={(e) => setCallSheet({ ...callSheet, locationName: e.target.value })}
                    placeholder="Location / Stage Name"
                    style={{ width: '100%', fontWeight: 700, marginBottom: '6px', border: '1px solid var(--line)', padding: '6px' }}
                  />
                  <input
                    type="text"
                    value={callSheet.locationAddress ?? ''}
                    onChange={(e) => setCallSheet({ ...callSheet, locationAddress: e.target.value })}
                    placeholder="Street Address, City, State ZIP"
                    style={{ width: '100%', border: '1px solid var(--line)', padding: '6px' }}
                  />
                </div>

                <div className="cs-location-card">
                  <h4>Parking & Basecamp Instructions</h4>
                  <input
                    type="text"
                    value={callSheet.parkingNotes ?? ''}
                    onChange={(e) => setCallSheet({ ...callSheet, parkingNotes: e.target.value })}
                    placeholder="Crew Parking Details"
                    style={{ width: '100%', marginBottom: '6px', border: '1px solid var(--line)', padding: '6px' }}
                  />
                  <input
                    type="text"
                    value={callSheet.basecampNotes ?? ''}
                    onChange={(e) => setCallSheet({ ...callSheet, basecampNotes: e.target.value })}
                    placeholder="Trucks / Basecamp Address"
                    style={{ width: '100%', border: '1px solid var(--line)', padding: '6px' }}
                  />
                </div>
              </div>

              {/* Nearest Emergency Hospital (High Priority) */}
              <div className="cs-hospital-alert">
                <strong style={{ color: 'var(--orange)', font: '700 12px "DM Mono", monospace', textTransform: 'uppercase' }}>
                  🏥 Nearest Emergency Hospital:
                </strong>
                <input
                  type="text"
                  value={callSheet.nearestHospital ?? ''}
                  onChange={(e) => setCallSheet({ ...callSheet, nearestHospital: e.target.value })}
                  placeholder="Hospital Name & ER Address (e.g. Cedars-Sinai Medical Center - 8700 Beverly Blvd)"
                />
              </div>
            </div>

            {/* Today's Scheduled Scenes (Auto-populated from Schedule) */}
            <div className="cs-section">
              <div className="cs-section-title">
                <h3>🎬 Today's Shooting Schedule ({activeDay.scenes?.length || 0} Scenes)</h3>
                <span style={{ font: '11px "DM Mono", monospace', color: 'var(--muted)' }}>
                  From Schedule Workspace
                </span>
              </div>

              <div className="cs-table-wrap">
                <table className="cs-table">
                  <thead>
                    <tr>
                      <th style={{ width: '70px' }}>Scene #</th>
                      <th>Heading / Location</th>
                      <th>Description</th>
                      <th style={{ width: '90px' }}>Day / Night</th>
                      <th style={{ width: '70px' }}>Pages</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeDay.scenes && activeDay.scenes.length > 0 ? (
                      activeDay.scenes.map(({ scene }, idx) => {
                        const heading = scene.heading || '';
                        const isNight = heading.toUpperCase().includes('NIGHT');
                        return (
                          <tr key={scene.id ?? idx}>
                            <td style={{ fontWeight: 700, textAlign: 'center', color: 'var(--orange)' }}>
                              {scene.sceneNumber}
                            </td>
                            <td>
                              <strong>{heading || 'Untitled Scene'}</strong>
                            </td>
                            <td>{scene.body ? scene.body.substring(0, 80) + '...' : '—'}</td>
                            <td>{isNight ? 'NIGHT' : 'DAY'}</td>
                            <td>1/8</td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={5} style={{ textAlign: 'center', padding: '20px', color: 'var(--muted)' }}>
                          No scenes assigned to Day {activeDay.dayNumber}. Assign scenes in the Schedule workspace.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Cast Calls Roster */}
            <div className="cs-section">
              <div className="cs-section-title">
                <h3>👥 Cast Calls Table</h3>
                <button
                  type="button"
                  className="secondary"
                  style={{ padding: '4px 10px', fontSize: '11px' }}
                  onClick={handleAddCastRow}
                >
                  + Add Cast Member
                </button>
              </div>

              <datalist id="cast-contacts">
                {contacts.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.role ? `${c.name} (${c.role})` : c.name}
                  </option>
                ))}
              </datalist>

              <div className="cs-table-wrap">
                <table className="cs-table">
                  <thead>
                    <tr>
                      <th style={{ width: '50px' }}>ID</th>
                      <th>Character</th>
                      <th>Actor / Contact</th>
                      <th style={{ width: '70px' }}>Status</th>
                      <th style={{ width: '90px' }}>Pickup</th>
                      <th style={{ width: '90px' }}>H/MU Call</th>
                      <th style={{ width: '90px' }}>On Set</th>
                      <th>Special Notes</th>
                      <th style={{ width: '40px' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {(callSheet.castCalls ?? []).map((cc, idx) => (
                      <tr key={cc.id ?? idx}>
                        <td>
                          <input
                            type="text"
                            value={cc.castNumber ?? ''}
                            onChange={(e) => handleUpdateCastRow(idx, 'castNumber', e.target.value)}
                            placeholder={String(idx + 1)}
                            style={{ textAlign: 'center' }}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            value={cc.characterName}
                            onChange={(e) => handleUpdateCastRow(idx, 'characterName', e.target.value)}
                            placeholder="Character Name"
                            style={{ fontWeight: 600 }}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            list="cast-contacts"
                            value={cc.actorName}
                            onChange={(e) => {
                              const val = e.target.value;
                              handleUpdateCastRow(idx, 'actorName', val);
                              const matched = contacts.find((c) => c.name.toLowerCase() === val.toLowerCase());
                              if (matched && matched.role && !cc.characterName) {
                                handleUpdateCastRow(idx, 'characterName', matched.role);
                              }
                            }}
                            placeholder="Actor Name"
                          />
                        </td>
                        <td>
                          <select
                            value={cc.status ?? 'W'}
                            onChange={(e) => handleUpdateCastRow(idx, 'status', e.target.value)}
                            style={{ fontWeight: 700 }}
                          >
                            <option value="W">W (Work)</option>
                            <option value="H">H (Hold)</option>
                            <option value="R">R (Rehearse)</option>
                            <option value="T">T (Travel)</option>
                            <option value="O">O (Off)</option>
                          </select>
                        </td>
                        <td>
                          <input
                            type="text"
                            value={cc.pickupTime ?? ''}
                            onChange={(e) => handleUpdateCastRow(idx, 'pickupTime', e.target.value)}
                            placeholder="06:30 AM"
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            value={cc.hmuCall ?? ''}
                            onChange={(e) => handleUpdateCastRow(idx, 'hmuCall', e.target.value)}
                            placeholder="07:00 AM"
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            value={cc.onSetCall ?? ''}
                            onChange={(e) => handleUpdateCastRow(idx, 'onSetCall', e.target.value)}
                            placeholder="07:45 AM"
                            style={{ fontWeight: 600 }}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            value={cc.notes ?? ''}
                            onChange={(e) => handleUpdateCastRow(idx, 'notes', e.target.value)}
                            placeholder="e.g. Wardrobe change after Scene 2"
                          />
                        </td>
                        <td>
                          <button
                            type="button"
                            className="delete-icon-btn"
                            onClick={() => handleRemoveCastRow(idx)}
                            title="Remove Row"
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                    ))}
                    {(callSheet.castCalls ?? []).length === 0 && (
                      <tr>
                        <td colSpan={9} style={{ textAlign: 'center', padding: '16px', color: 'var(--muted)' }}>
                          No cast calls added yet. Click "+ Add Cast Member" above.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Department Notes & General Instructions */}
            <div className="cs-dept-grid">
              <div className="cs-dept-box">
                <label>Department Instructions & Key Gear</label>
                <textarea
                  value={callSheet.departmentNotes ?? ''}
                  onChange={(e) => setCallSheet({ ...callSheet, departmentNotes: e.target.value })}
                  placeholder="e.g. Camera: 35mm & 50mm primes needed for Scene 4. Sound: Radio mics on all 3 diner tables. Grip: 12x12 bounce ready for morning sun."
                />
              </div>

              <div className="cs-dept-box">
                <label>General Production Notices & Safety Rules</label>
                <textarea
                  value={callSheet.generalNotes ?? ''}
                  onChange={(e) => setCallSheet({ ...callSheet, generalNotes: e.target.value })}
                  placeholder="e.g. Closed set during Scene 1. Please silence all cell phones. Hot lunch served at 1:00 PM in basecamp tent."
                />
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="modal-actions" style={{ borderTop: '1px solid var(--line)', paddingTop: '20px' }}>
              <button className="secondary" type="button" onClick={() => window.print()}>
                🖨️ Print / Export PDF
              </button>
              <button className="primary" type="submit" disabled={saving}>
                {saving ? 'Saving...' : 'Save Call Sheet'}
              </button>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}
