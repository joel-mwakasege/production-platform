# Feature Matrix

## Priority Legend

- **MVP** — required for the first genuinely usable release.
- **P1** — post-MVP core product capability.
- **P2** — advanced capability.
- **Future** — intentionally deferred.

## Platform and Account

| Area | Feature | Priority | Dependencies | Notes |
|---|---|---:|---|---|
| Authentication | Supabase Auth integration | MVP | Supabase project | Supabase owns authentication lifecycle |
| Authentication | Sign up | MVP | Supabase Auth | |
| Authentication | Login | MVP | Supabase Auth | |
| Authentication | Logout | MVP | Supabase Auth | |
| Authentication | Password reset | MVP | Supabase Auth | |
| Authentication | Email verification | MVP | Supabase Auth | |
| Authentication | Session management | MVP | Supabase Auth | Application consumes authenticated identity/session |
| Account | Profile | MVP | User profile | |
| Account | Settings | MVP | User profile | |
| Account | Avatar | MVP | Storage/profile | |
| Authorization | Roles | MVP | Organization membership | Owner, Administrator, Manager, Member, Viewer |
| Authorization | Permissions | MVP | Roles | Organization/project/object boundaries |
| Organizations | Create organization | MVP | Authentication | |
| Organizations | Members | MVP | Organization | |
| Organizations | Invitations | MVP | Organization + Auth | |
| Organizations | Role assignment | MVP | Organization | |
| Organizations | Organization switching | MVP | Membership | |
| Organizations | Activity | P1 | Audit log | |
| Billing | Billing placeholder | MVP | Organization | No full billing required initially |
| Billing | Subscriptions | Future | Billing provider | |
| Administration | User/org/project admin | Future | Authorization | |
| Administration | Feature flags | Future | Admin | |

## Projects

| Area | Feature | Priority | Dependencies |
|---|---|---:|---|
| Projects | Create project | MVP | Organization |
| Projects | Project dashboard | MVP | Project |
| Projects | Project members | MVP | Project + Organization |
| Projects | Project status | MVP | Project |
| Projects | Recent activity | MVP | Activity log |
| Projects | Upcoming tasks | MVP | Tasks |
| Projects | Upcoming shoot days | MVP | Scheduling |
| Projects | Recent documents | MVP | Documents |
| Projects | Production progress | MVP | Project modules |
| Projects | Quick actions | MVP | Project modules |

## Write

| Feature | Priority | Dependencies |
|---|---:|---|
| Structured screenplay editor | MVP | Project, screenplay data model |
| Scene management | MVP | Screenplay |
| Scene numbering | MVP | Screenplay |
| Automatic formatting | MVP | Editor |
| Autosave | MVP | Screenplay persistence |
| Versioning | MVP | Screenplay versions |
| Undo/redo | MVP | Editor |
| Keyboard shortcuts | MVP | Editor |
| Comments | P1 | Collaboration |
| Collaboration foundation | P1 | Document architecture |
| Import/export | P1 | Screenplay parser/renderer |
| AV script editor | P1 | Project |
| AV script timing | P1 | AV script |
| AV client review | P1 | Collaboration |
| Production document editor | P1 | Documents |
| Document templates | P1 | Documents |
| Custom title pages | P2 | Documents |
| Organization branding | P2 | Documents |

## Breakdown

| Feature | Priority | Dependencies |
|---|---:|---|
| Scene breakdown | MVP | Screenplay/scenes |
| Element tagging | MVP | Production elements |
| Element sidebar | MVP | Scene breakdown |
| Production element CRUD | MVP | Production elements |
| Breakdown report | P1 | Report engine |
| Element inventory | P1 | Production elements |
| Advanced breakdown categories | P2 | Breakdown |

## Scheduling

| Feature | Priority | Dependencies |
|---|---:|---|
| Stripboard | MVP | Scenes |
| Generate strips from screenplay | MVP | Screenplay |
| Shoot days | MVP | Schedule |
| Drag/drop scheduling | MVP | Stripboard |
| Reorder scenes | MVP | Stripboard |
| Day breaks | P1 | Schedule |
| Company moves | P1 | Schedule |
| Location grouping | P1 | Breakdown/locations |
| Cast grouping | P1 | Contacts/breakdown |
| Time-of-day grouping | P1 | Scenes |
| Multiple schedules | P2 | Schedule versions |
| Schedule versions | P2 | Schedule |

## Contacts and Locations

| Feature | Priority | Dependencies |
|---|---:|---|
| Contacts CRUD | MVP | Project |
| Cast contacts | MVP | Contacts |
| Crew contacts | MVP | Contacts |
| Locations | MVP | Project |
| Contact search | MVP | Contacts |
| Contact filters | P1 | Contacts |
| Groups/custom lists | P1 | Contacts |
| Import/export | P1 | Contacts |
| Project assignment | MVP | Contacts |
| Vendor/client contacts | P1 | Contacts |

## Call Sheets

| Feature | Priority | Dependencies |
|---|---:|---|
| Generate call sheet | MVP | Schedule, scenes, contacts, locations |
| Edit call sheet | MVP | Call sheet |
| Call sheet data population | MVP | Shared production data |
| PDF export | MVP | PDF engine |
| Share call sheet | MVP | Sharing |
| Recipient selection | P1 | Contacts |
| Individual call times | P1 | Call sheet recipients |
| Private notes | P2 | Call sheet recipients |
| Email delivery | P1 | Notification/email service |
| SMS delivery | P2 | SMS provider |
| Shareable link | P1 | Sharing |
| View tracking | P2 | Sharing |
| Confirmation tracking | P2 | Call sheet recipients |
| Delivery status | P2 | Notification service |
| Resend | P2 | Distribution |

## Tasks and Calendar

| Feature | Priority | Dependencies |
|---|---:|---|
| Task board | MVP | Project |
| Assign tasks | MVP | Members |
| Due dates | MVP | Tasks |
| Kanban | MVP | Tasks |
| List view | P1 | Tasks |
| Calendar view | P1 | Tasks + Calendar |
| Checklists | P1 | Tasks |
| Attachments | P1 | Media |
| Comments | P1 | Collaboration |
| Notifications | P1 | Notifications |
| Production calendar | P1 | Project |
| Month/week/day views | P1 | Calendar |
| Timeline | P2 | Calendar |
| Dependencies | Future | Calendar |

## Visualize

| Feature | Priority | Dependencies |
|---|---:|---|
| Moodboards | P1 | Media |
| Image upload | P1 | Storage |
| Drag/resize/reposition | P1 | Moodboard |
| Shot lists | P1 | Scenes |
| Shot numbering | P1 | Shot lists |
| Camera setups | P2 | Shot lists |
| Storyboards | P1 | Shot lists/scenes |
| Generate storyboard from shot | P2 | Storyboard + shots |
| Annotations | P2 | Storyboard |
| Image editing | P2 | Media |
| PDF export | P1 | PDF engine |

## Media, Documents, Reports

| Feature | Priority | Dependencies |
|---|---:|---|
| Media library | P1 | Object storage |
| Upload | P1 | Storage |
| Preview | P1 | Media |
| Search/tags | P1 | Media |
| Permissions | P1 | Authorization |
| General documents | P1 | Document editor |
| Report engine | P1 | Production data |
| Central PDF engine | MVP | Renderer |
| Custom PDF templates | P2 | PDF engine |

## Collaboration and Platform

| Feature | Priority | Dependencies |
|---|---:|---|
| Comments | P1 | Shared data |
| Mentions | P1 | Comments + users |
| Activity feed | P1 | Audit/activity |
| Notifications | P1 | Events |
| Version history | P1 | Versioned artifacts |
| Sharing | P1 | Authorization |
| Real-time editing | P2 | Stable document architecture |
| Live cursors | Future | Real-time editing |
| Conflict resolution | Future | Real-time editing |
| Global search | P1 | Search index/query layer |
| Audit log | P1 | Application events |
| Observability | P1 | Infrastructure |
| Performance optimization | P1 | Usage/data scale |
| Mobile responsive workflows | P1 | Frontend |

## Advanced / Future

| Feature | Priority |
|---|---:|
| Advanced scheduling | P2 |
| Advanced call-sheet builder | P2 |
| Custom branding | P2 |
| Team messaging | Future |
| Shared inbox | Future |
| Workflow automation | Future |
| Advanced analytics | Future |
| AI script analysis | Future |
| AI breakdown assistant | Future |
| AI scheduling assistant | Future |
| AI shot planning | Future |
| AI call-sheet validation | Future |
| Google Drive integration | Future |
| Dropbox integration | Future |
| Slack integration | Future |
| Google Calendar integration | Future |
| Microsoft Calendar integration | Future |
| Google Maps integration | Future |
| Final Draft integration | Future |
| Fountain integration | Future |
