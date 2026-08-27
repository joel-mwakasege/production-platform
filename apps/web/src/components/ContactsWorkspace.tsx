import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { PhaseRail, type Phase } from './PhaseRail';

type Props = {
  organization: { id: string; name: string };
  project: { id: string; name: string };
  session: Session;
  onBack: () => void;
  onPhaseChange: (phase: Phase) => void;
};

type ContactCategory = 'CAST' | 'CREW' | 'CLIENT' | 'VENDOR' | 'LOCATION' | 'PRODUCTION' | 'OTHER';

type Contact = {
  id: string;
  name: string;
  role?: string | null;
  department?: string | null;
  company?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  notes?: string | null;
  category: ContactCategory;
};

type Location = {
  id: string;
  name: string;
  address?: string | null;
  description?: string | null;
  parking?: string | null;
  basecamp?: string | null;
  nearestHospital?: string | null;
  notes?: string | null;
};

const API_URL = import.meta.env.VITE_API_URL || '';

const categoryOptions: { label: string; value: ContactCategory }[] = [
  { label: 'Cast', value: 'CAST' },
  { label: 'Crew', value: 'CREW' },
  { label: 'Production', value: 'PRODUCTION' },
  { label: 'Vendor', value: 'VENDOR' },
  { label: 'Client', value: 'CLIENT' },
  { label: 'Other', value: 'OTHER' },
];

export function ContactsWorkspace({ organization, project, session, onBack, onPhaseChange }: Props) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [activeTab, setActiveTab] = useState<'ALL' | 'CAST' | 'CREW' | 'LOCATIONS' | 'VENDORS' | 'PRODUCTION'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [message, setMessage] = useState('');

  // Contact Modal State
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactName, setContactName] = useState('');
  const [contactRole, setContactRole] = useState('');
  const [contactDepartment, setContactDepartment] = useState('');
  const [contactCompany, setContactCompany] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactNotes, setContactNotes] = useState('');
  const [contactCategory, setContactCategory] = useState<ContactCategory>('CREW');
  const [isSubmittingContact, setIsSubmittingContact] = useState(false);
  const [contactError, setContactError] = useState('');

  // Location Modal State
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [locationName, setLocationName] = useState('');
  const [locationAddress, setLocationAddress] = useState('');
  const [locationDescription, setLocationDescription] = useState('');
  const [locationParking, setLocationParking] = useState('');
  const [locationBasecamp, setLocationBasecamp] = useState('');
  const [locationHospital, setLocationHospital] = useState('');
  const [locationNotes, setLocationNotes] = useState('');
  const [isSubmittingLocation, setIsSubmittingLocation] = useState(false);
  const [locationError, setLocationError] = useState('');

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch(`${API_URL}/api/organizations/${organization.id}/projects/${project.id}/contacts`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      }).then((res) => res.json()),
      fetch(`${API_URL}/api/organizations/${organization.id}/projects/${project.id}/locations`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      }).then((res) => res.json()),
    ])
      .then(([contactsData, locationsData]) => {
        if (cancelled) return;
        setContacts(contactsData.contacts ?? []);
        setLocations(locationsData.locations ?? []);
      })
      .catch(() => {
        if (!cancelled) setMessage('Could not load contacts & locations.');
      });
    return () => {
      cancelled = true;
    };
  }, [organization.id, project.id, session.access_token]);

  async function handleCreateContact(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!contactName.trim()) return;

    setIsSubmittingContact(true);
    setContactError('');

    try {
      const response = await fetch(`${API_URL}/api/organizations/${organization.id}/projects/${project.id}/contacts`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: contactName,
          role: contactRole || undefined,
          department: contactDepartment || undefined,
          company: contactCompany || undefined,
          email: contactEmail || undefined,
          phone: contactPhone || undefined,
          notes: contactNotes || undefined,
          category: contactCategory,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? 'Could not create contact.');

      setContacts((prev) => [...prev, result.contact]);
      setShowContactModal(false);
      setContactName('');
      setContactRole('');
      setContactDepartment('');
      setContactCompany('');
      setContactEmail('');
      setContactPhone('');
      setContactNotes('');
      setContactCategory('CREW');
    } catch (err) {
      setContactError(err instanceof Error ? err.message : 'Failed to create contact.');
    } finally {
      setIsSubmittingContact(false);
    }
  }

  async function handleDeleteContact(contactId: string) {
    const response = await fetch(`${API_URL}/api/organizations/${organization.id}/projects/${project.id}/contacts/${contactId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    if (response.ok) {
      setContacts((prev) => prev.filter((c) => c.id !== contactId));
    } else {
      setMessage('Failed to delete contact.');
    }
  }

  async function handleCreateLocation(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!locationName.trim()) return;

    setIsSubmittingLocation(true);
    setLocationError('');

    try {
      const response = await fetch(`${API_URL}/api/organizations/${organization.id}/projects/${project.id}/locations`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: locationName,
          address: locationAddress || undefined,
          description: locationDescription || undefined,
          parking: locationParking || undefined,
          basecamp: locationBasecamp || undefined,
          nearestHospital: locationHospital || undefined,
          notes: locationNotes || undefined,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? 'Could not create location.');

      setLocations((prev) => [...prev, result.location]);
      setShowLocationModal(false);
      setLocationName('');
      setLocationAddress('');
      setLocationDescription('');
      setLocationParking('');
      setLocationBasecamp('');
      setLocationHospital('');
      setLocationNotes('');
    } catch (err) {
      setLocationError(err instanceof Error ? err.message : 'Failed to create location.');
    } finally {
      setIsSubmittingLocation(false);
    }
  }

  async function handleDeleteLocation(locationId: string) {
    const response = await fetch(`${API_URL}/api/organizations/${organization.id}/projects/${project.id}/locations/${locationId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    if (response.ok) {
      setLocations((prev) => prev.filter((l) => l.id !== locationId));
    } else {
      setMessage('Failed to delete location.');
    }
  }

  // Filter contacts by active tab and search query
  const query = searchQuery.toLowerCase();
  const filteredContacts = contacts.filter((contact) => {
    const matchesSearch =
      contact.name.toLowerCase().includes(query) ||
      (contact.role && contact.role.toLowerCase().includes(query)) ||
      (contact.department && contact.department.toLowerCase().includes(query)) ||
      (contact.company && contact.company.toLowerCase().includes(query)) ||
      (contact.email && contact.email.toLowerCase().includes(query));

    if (!matchesSearch) return false;

    if (activeTab === 'ALL') return true;
    const cat = contact.category?.toUpperCase();
    if (activeTab === 'CAST') return cat === 'CAST';
    if (activeTab === 'CREW') return cat === 'CREW';
    if (activeTab === 'PRODUCTION') return cat === 'PRODUCTION';
    if (activeTab === 'VENDORS') return cat === 'VENDOR' || cat === 'CLIENT';
    return true;
  });

  const filteredLocations = locations.filter((location) => {
    if (activeTab !== 'ALL' && activeTab !== 'LOCATIONS') return false;
    return (
      location.name.toLowerCase().includes(query) ||
      (location.address && location.address.toLowerCase().includes(query)) ||
      (location.nearestHospital && location.nearestHospital.toLowerCase().includes(query))
    );
  });

  const castCount = contacts.filter((c) => c.category?.toUpperCase() === 'CAST').length;
  const crewCount = contacts.filter((c) => c.category?.toUpperCase() === 'CREW').length;
  const vendorCount = contacts.filter((c) => c.category?.toUpperCase() === 'VENDOR' || c.category?.toUpperCase() === 'CLIENT').length;
  const productionCount = contacts.filter((c) => c.category?.toUpperCase() === 'PRODUCTION').length;

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
          <h1>Contacts & Locations</h1>
        </div>
        <span className="script-save">
          {contacts.length} Contacts · {locations.length} Locations
        </span>
      </header>

      <PhaseRail activePhase="Plan" onPhaseChange={onPhaseChange} />

      <div className="contacts-page">
        {/* Action Header & Search */}
        <section className="contacts-toolbar">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search people, roles, departments, or locations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="actions-box">
            <button className="secondary" type="button" onClick={() => setShowLocationModal(true)}>
              + Location
            </button>
            <button className="primary" type="button" onClick={() => setShowContactModal(true)}>
              + Contact
            </button>
          </div>
        </section>

        {/* Category Tabs */}
        <div className="contacts-tabs">
          <button className={activeTab === 'ALL' ? 'tab-btn active' : 'tab-btn'} onClick={() => setActiveTab('ALL')}>
            All <span>({contacts.length + locations.length})</span>
          </button>
          <button className={activeTab === 'CAST' ? 'tab-btn active' : 'tab-btn'} onClick={() => setActiveTab('CAST')}>
            Cast <span>({castCount})</span>
          </button>
          <button className={activeTab === 'CREW' ? 'tab-btn active' : 'tab-btn'} onClick={() => setActiveTab('CREW')}>
            Crew <span>({crewCount})</span>
          </button>
          <button className={activeTab === 'LOCATIONS' ? 'tab-btn active' : 'tab-btn'} onClick={() => setActiveTab('LOCATIONS')}>
            Locations <span>({locations.length})</span>
          </button>
          <button className={activeTab === 'VENDORS' ? 'tab-btn active' : 'tab-btn'} onClick={() => setActiveTab('VENDORS')}>
            Vendors & Clients <span>({vendorCount})</span>
          </button>
          <button className={activeTab === 'PRODUCTION' ? 'tab-btn active' : 'tab-btn'} onClick={() => setActiveTab('PRODUCTION')}>
            Production <span>({productionCount})</span>
          </button>
        </div>

        {message && <p className="interaction-notice">{message}</p>}

        {/* Locations Grid */}
        {(activeTab === 'ALL' || activeTab === 'LOCATIONS') && (
          <div className="section-block">
            <div className="section-title">
              <p className="eyebrow">Locations</p>
              <h2>Shooting Locations ({filteredLocations.length})</h2>
            </div>
            {filteredLocations.length > 0 ? (
              <div className="location-grid">
                {filteredLocations.map((loc) => (
                  <article className="location-card" key={loc.id}>
                    <div className="location-card-header">
                      <div>
                        <span className="badge location-badge">Location</span>
                        <h3>{loc.name}</h3>
                      </div>
                      <button
                        className="delete-icon-btn"
                        type="button"
                        onClick={() => void handleDeleteLocation(loc.id)}
                        title="Delete Location"
                      >
                        ✕
                      </button>
                    </div>
                    {loc.address && <p className="card-address">📍 {loc.address}</p>}
                    {loc.description && <p className="card-desc">{loc.description}</p>}
                    <div className="card-meta">
                      {loc.nearestHospital && (
                        <div className="meta-item hospital">
                          <strong>Hospital</strong>
                          <span>{loc.nearestHospital}</span>
                        </div>
                      )}
                      {loc.parking && (
                        <div className="meta-item">
                          <strong>Parking</strong>
                          <span>{loc.parking}</span>
                        </div>
                      )}
                      {loc.basecamp && (
                        <div className="meta-item">
                          <strong>Basecamp</strong>
                          <span>{loc.basecamp}</span>
                        </div>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              activeTab === 'LOCATIONS' && (
                <div className="empty-state" style={{ padding: '32px 0' }}>
                  <strong>No locations found.</strong>
                  <small>Click "+ Location" to add your first shooting location.</small>
                </div>
              )
            )}
          </div>
        )}

        {/* Contacts Grid */}
        {activeTab !== 'LOCATIONS' && (
          <div className="section-block">
            <div className="section-title">
              <p className="eyebrow">People</p>
              <h2>Cast & Crew Directory ({filteredContacts.length})</h2>
            </div>

            {filteredContacts.length > 0 ? (
              <div className="contacts-grid">
                {filteredContacts.map((c) => {
                  const initials = c.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .substring(0, 2)
                    .toUpperCase();

                  return (
                    <article className="contact-card" key={c.id}>
                      <div className="contact-card-header">
                        <div className="contact-avatar">{initials}</div>
                        <div className="contact-info">
                          <div className="name-row">
                            <h3>{c.name}</h3>
                            <span className={`badge category-${c.category?.toLowerCase()}`}>
                              {c.category?.replaceAll('_', ' ')}
                            </span>
                          </div>
                          <p className="role-dept">
                            {c.role && <strong>{c.role}</strong>}
                            {c.role && c.department && <span> · </span>}
                            {c.department && <span>{c.department}</span>}
                            {c.company && <span> ({c.company})</span>}
                          </p>
                        </div>
                        <button
                          className="delete-icon-btn"
                          type="button"
                          onClick={() => void handleDeleteContact(c.id)}
                          title="Delete Contact"
                        >
                          ✕
                        </button>
                      </div>

                      <div className="contact-contact-info">
                        {c.email && (
                          <a href={`mailto:${c.email}`} className="info-link">
                            ✉ {c.email}
                          </a>
                        )}
                        {c.phone && (
                          <a href={`tel:${c.phone}`} className="info-link">
                            ☎ {c.phone}
                          </a>
                        )}
                        {c.notes && <p className="contact-notes">{c.notes}</p>}
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="empty-state" style={{ padding: '32px 0' }}>
                <strong>No contacts found in this view.</strong>
                <small>Click "+ Contact" to add cast and crew members to this production.</small>
              </div>
            )}
          </div>
        )}
      </div>

      {/* New Contact Modal */}
      {showContactModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Add Contact</h2>
            <p className="modal-subtitle">Add a cast member, crew member, vendor, or client to this project.</p>

            <form onSubmit={handleCreateContact}>
              <div className="form-group">
                <label>Full Name *</label>
                <input
                  required
                  maxLength={120}
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="e.g. Rachel Adams"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Category</label>
                  <select
                    value={contactCategory}
                    onChange={(e) => setContactCategory(e.target.value as ContactCategory)}
                  >
                    {categoryOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Department</label>
                  <input
                    maxLength={120}
                    value={contactDepartment}
                    onChange={(e) => setContactDepartment(e.target.value)}
                    placeholder="e.g. Camera / Directing"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Role / Character Title</label>
                  <input
                    maxLength={120}
                    value={contactRole}
                    onChange={(e) => setContactRole(e.target.value)}
                    placeholder="e.g. Lead Actress / DP"
                  />
                </div>

                <div className="form-group">
                  <label>Company / Agency</label>
                  <input
                    maxLength={120}
                    value={contactCompany}
                    onChange={(e) => setContactCompany(e.target.value)}
                    placeholder="e.g. Panavision"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Email Address</label>
                  <input
                    type="email"
                    maxLength={160}
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="rachel@example.com"
                  />
                </div>

                <div className="form-group">
                  <label>Phone Number</label>
                  <input
                    type="tel"
                    maxLength={40}
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="+1 (555) 019-2834"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Notes / Dietary / Emergency</label>
                <textarea
                  maxLength={1000}
                  value={contactNotes}
                  onChange={(e) => setContactNotes(e.target.value)}
                  placeholder="Any dietary restrictions, special call instructions, or private notes..."
                  style={{ minHeight: '60px' }}
                />
              </div>

              {contactError && <p className="message">{contactError}</p>}

              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary"
                  onClick={() => {
                    setShowContactModal(false);
                    setContactError('');
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="primary" disabled={isSubmittingContact}>
                  {isSubmittingContact ? 'Saving...' : 'Add Contact'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Location Modal */}
      {showLocationModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Add Location</h2>
            <p className="modal-subtitle">Add a shooting location, studio stage, or basecamp to the project.</p>

            <form onSubmit={handleCreateLocation}>
              <div className="form-group">
                <label>Location Name *</label>
                <input
                  required
                  maxLength={120}
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  placeholder="e.g. Downtown Warehouse - Stage B"
                />
              </div>

              <div className="form-group">
                <label>Physical Address</label>
                <input
                  maxLength={300}
                  value={locationAddress}
                  onChange={(e) => setLocationAddress(e.target.value)}
                  placeholder="e.g. 1420 Industrial Way, Austin, TX 78701"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Nearest Hospital / ER</label>
                  <input
                    maxLength={500}
                    value={locationHospital}
                    onChange={(e) => setLocationHospital(e.target.value)}
                    placeholder="e.g. Austin Regional ER, 1200 6th St"
                  />
                </div>

                <div className="form-group">
                  <label>Parking Instructions</label>
                  <input
                    maxLength={500}
                    value={locationParking}
                    onChange={(e) => setLocationParking(e.target.value)}
                    placeholder="e.g. Crew parking in Lot 3 via North Gate"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Basecamp & Staging</label>
                <input
                  maxLength={500}
                  value={locationBasecamp}
                  onChange={(e) => setLocationBasecamp(e.target.value)}
                  placeholder="e.g. Trailers in North Lot, Catering in Courtyard"
                />
              </div>

              <div className="form-group">
                <label>Location Notes & Access</label>
                <textarea
                  maxLength={1000}
                  value={locationNotes}
                  onChange={(e) => setLocationNotes(e.target.value)}
                  placeholder="Gate code, quiet hours, sound permit restrictions..."
                  style={{ minHeight: '60px' }}
                />
              </div>

              {locationError && <p className="message">{locationError}</p>}

              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary"
                  onClick={() => {
                    setShowLocationModal(false);
                    setLocationError('');
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="primary" disabled={isSubmittingLocation}>
                  {isSubmittingLocation ? 'Saving...' : 'Add Location'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
