# Production Management Platform — Product Specification

## 1. Product Overview

The Production Management Platform is a production-management SaaS application inspired by the workflow and capabilities of StudioBinder, but implemented independently with its own codebase, architecture, database, UI, and terminology.

The product is intended for filmmakers, video-production companies, agencies, photographers, event-production teams, and other creative production teams.

The core workflow is:

**Idea → Script → Breakdown → Scheduling → Visualization → Planning → Call Sheets → Production**

The product is organized into five major areas:

1. **Write**
2. **Breakdown**
3. **Visualize**
4. **Plan**
5. **Shoot**

The central product principle is that all production tools operate on the same underlying project data. A screenplay scene should be able to flow into a breakdown, schedule, shooting day, call sheet, script side, and report. Script lines can connect to shots, storyboards, and shot lists; contacts can connect to cast/crew, call-sheet recipients, and production communication.

Source: PROJECT.md defines the product vision and connected workflow. fileciteturn0file0L15-L55

## 2. Product Hierarchy

```text
Authenticated User
      ↓
Organization
      ↓
Projects
      ↓
Production Modules
      ↓
Shared Production Data
      ↓
Documents / Reports / PDFs / Communications
```

A user does not directly own isolated projects. Organizations are the tenant boundary, and projects belong to organizations.

## 3. Authentication

### Authentication provider

**Supabase Auth is the authentication provider.**

Supabase Auth is responsible for the authentication lifecycle rather than a custom password/session implementation in the application backend.

Required account capabilities:

- Sign up
- Login
- Logout
- Password reset
- Email verification
- Session management
- User profile
- Account settings
- Avatar
- Organization membership
- Invitations
- Roles
- Permissions

The application should treat the authenticated Supabase identity as the identity of the application user and maintain its own application-level profile and organization membership records.

### Authorization

Authentication answers **who the user is**. Application authorization answers **what that user can access or change**.

Initial roles:

- Owner
- Administrator
- Manager
- Member
- Viewer

Authorization must enforce organization isolation, project membership, project-level permissions, and object-level access.

A user must never be able to access another organization's production data by manipulating an ID in an API request.

## 4. Organizations

Organizations are the primary tenant boundary.

Features:

- Create organization
- Organization settings
- Organization members
- Invite members
- Remove members
- Assign roles
- Organization switching
- Billing placeholder
- Organization activity

Hierarchy:

```text
Supabase Auth Identity
        ↓
Application User Profile
        ↓
Organization Membership
        ↓
Project Membership
        ↓
Production Data
```

## 5. Projects

Projects are the central production entity.

### Project creation

Required conceptual fields:

- Name
- Description
- Project type
- Client
- Start date
- End date
- Team

Supported project types may include:

- Film
- Television
- Commercial
- Documentary
- Music Video
- Corporate Video
- Event
- Photoshoot
- Other

### Project dashboard

The dashboard should display:

- Project name
- Project status
- Recent activity
- Upcoming tasks
- Upcoming shoot days
- Recent documents
- Production progress
- Team
- Quick actions

## 6. Project Navigation

```text
PROJECT
├── Overview
├── WRITE
│   ├── Screenplay
│   ├── AV Script
│   └── Docs
├── BREAKDOWN
│   ├── Breakdowns
│   ├── Stripboard
│   ├── Script Sides
│   └── Reports
├── VISUALIZE
│   ├── Moodboards
│   ├── Shot Lists
│   └── Storyboards
├── PLAN
│   ├── Contacts
│   ├── Calendar
│   ├── Tasks
│   └── Media
└── SHOOT
    └── Call Sheets
```

## 7. Production Modules

### Write

#### Screenplay

The screenplay editor is a structured editor, not one giant HTML string.

Supported elements:

- Scene heading
- Action
- Character
- Dialogue
- Parenthetical
- Transition
- Shot

Capabilities:

- Automatic formatting
- Keyboard shortcuts
- Page breaks
- Scene numbering
- Undo/redo
- Autosave
- Version history
- Comments
- Collaboration foundation
- Import
- Export

Data relationship:

```text
Screenplay
└── Scene
    ├── Scene Heading
    ├── Action
    ├── Character
    ├── Dialogue
    ├── Parenthetical
    ├── Transition
    └── Shot
```

#### AV Script

Two-column production script:

```text
VISUAL                    AUDIO
-----------------------------------------
Camera shot               Narration
B-roll                    Dialogue
Graphics                  Music
Screen recording          SFX
```

Features include organization, timing, audio/visual descriptions, client review, comments, versioning, and PDF export.

#### Production Documents

General document editor supporting:

- Rich text
- Headings
- Lists
- Tables
- Images
- Links
- Templates
- Comments
- Sharing
- Version history
- PDF export

Later extensions:

- Title-page designer
- Custom templates
- Organization branding

### Breakdown

Script breakdown converts screenplay information into production data.

Breakdown categories include:

- Cast
- Props
- Costumes
- Set dressing
- Locations
- Vehicles
- Makeup
- Hair
- SFX
- VFX
- Camera
- Sound
- Special equipment
- Extras

Core operations:

- Select script element
- Assign category
- Create production element
- Edit element
- Remove tag
- View element sidebar
- Generate breakdown reports
- View scene breakdown
- Maintain element inventory

### Scheduling

Convert screenplay scenes into schedule strips.

A strip contains:

- Scene number
- Location
- INT/EXT
- DAY/NIGHT
- Page count
- Cast
- Elements
- Estimated shoot time
- Prep time
- Shoot day

Capabilities:

- Generate strips from screenplay
- Drag and drop
- Reorder scenes
- Day breaks
- Company moves
- Shoot days
- Location grouping
- Cast grouping
- Time-of-day grouping
- Multiple schedules
- Schedule versions
- Schedule reports

### Script Sides

Generate selected pages/scenes for cast and crew.

Filters:

- Scene
- Character
- Location
- Shoot day

Outputs:

- Preview
- PDF
- Print
- Share

### Reports

Reusable report engine with:

- Breakdown report
- Element report
- Shooting schedule
- One-liner
- DOOD
- Cast report
- Location report
- Props report
- Costume report
- Equipment report

Architecture:

```text
Production Data
      ↓
Report Query
      ↓
Report Template
      ↓
Renderer
      ↓
PDF / Print / Screen
```

### Visualize

#### Moodboards

Capabilities:

- Create board
- Upload images
- Drag images
- Resize
- Reposition
- Text
- Notes
- Groups
- Share
- Export
- Image editing

#### Shot Lists

Shot fields:

- Shot number
- Scene
- Shot type
- Camera
- Lens
- Movement
- Framing
- Angle
- Description
- Characters
- Location
- Time
- Notes
- Image

Capabilities include editing, reordering, duplication, image attachment, camera setups, numbering, shoot/prep time, and PDF export.

#### Storyboards

Storyboard frames contain:

- Image
- Scene
- Shot
- Description
- Camera
- Lens
- Movement
- Audio
- Duration
- Notes

Capabilities:

- Add frame
- Upload image
- Generate from shot
- Reorder
- Draw annotations
- Arrows
- Text
- Audio/video descriptions
- Aspect ratio
- PDF export

### Plan

#### Contacts

Contact fields:

- Name
- Role
- Department
- Company
- Email
- Phone
- Address
- Notes
- Tags

Categories:

- Cast
- Crew
- Client
- Vendor
- Location
- Production
- Other

Features:

- CRUD
- Search
- Filters
- Groups
- Custom lists
- Import
- Export
- Project assignment

#### Calendar

Views:

- Month
- Week
- Day
- Timeline

Events:

- Shoot
- Prep
- Meeting
- Deadline
- Location scout
- Client review
- Task
- Custom event

#### Tasks

Views:

- Kanban
- List
- Calendar

Task fields:

- Title
- Description
- Assignee
- Department
- Priority
- Start date
- Due date
- Checklist
- Attachments
- Comments
- Status

Statuses:

- To Do
- In Progress
- Blocked
- Done

#### Media Library

Supported media:

- Images
- Videos
- Audio
- PDF
- Documents
- Other files

Features:

- Upload
- Folder/group organization
- Search
- Tags
- Preview
- Download
- Share
- Permissions
- Metadata

### Shoot

#### Call Sheets

Call sheets are generated from shared production data:

```text
Project
+
Shooting Schedule
+
Scenes
+
Locations
+
Cast
+
Crew
+
Contacts
+
Production Details
```

Call sheet data includes:

- Production
- Shoot day
- Date
- General call time
- Weather
- Location
- Nearest hospital
- Parking
- Basecamp
- Cast
- Crew
- Scenes
- Notes
- Special instructions
- Emergency information

#### Distribution

Capabilities:

- Select recipients
- Individual call times
- Private notes
- Attachments
- Email delivery
- SMS delivery
- Shareable link
- View tracking
- Confirmation tracking
- Delivery status
- Resend

## 8. Collaboration and Sharing

Collaboration is added after the core data model is stable.

Initial collaboration:

- Comments
- Mentions
- Activity feed
- Notifications
- User presence
- Shared documents
- Permission controls
- Version history

Later:

- Real-time editing
- Live cursors
- Conflict resolution

Major artifacts should support controlled sharing with permission levels:

- Private
- View Only
- Comment
- Edit
- Admin

## 9. Platform Services

### PDF Engine

One centralized PDF renderer should support:

- Documents
- Schedules
- Call sheets
- Storyboards
- Shot lists
- Script sides
- Reports

Requirements:

- Page layout
- Headers
- Footers
- Page numbers
- Logos
- Images
- Tables
- Custom templates
- Print-friendly output

### Search

Global search should cover:

- Projects
- Scripts
- Scenes
- Characters
- Contacts
- Locations
- Tasks
- Documents
- Shots
- Storyboards
- Media
- Call sheets

### Notifications

Types:

- Task assigned
- Task completed
- Comment
- Mention
- Document shared
- Call sheet published
- Call sheet confirmed
- Schedule changed
- Project invitation

Channels:

- In-app
- Email
- SMS

### Audit Log

Important actions must be traceable.

Audit records include:

- User
- Action
- Entity
- Entity ID
- Timestamp
- Old value
- New value

## 10. MVP

The first genuinely usable release should include:

### Authentication
- Signup
- Login
- Logout

### Organization
- Organization
- Members
- Invitations

### Projects
- Create project
- Project dashboard
- Project members

### Writing
- Screenplay editor
- Scene management
- Autosave
- Versioning

### Breakdown
- Scene breakdown
- Element tagging

### Scheduling
- Stripboard
- Shoot days
- Drag-and-drop scheduling

### Contacts
- Cast
- Crew
- Locations

### Call Sheets
- Generate call sheet
- Edit call sheet
- Export PDF
- Share call sheet

### Tasks
- Task board
- Assign tasks
- Due dates

The primary MVP journey is:

```text
Create account
→ Create organization
→ Create project
→ Create screenplay
→ Write scenes
→ Break down scenes
→ Create shooting schedule
→ Assign shoot days
→ Add cast/crew
→ Generate call sheet
→ Export/share call sheet
```

## 11. Non-MVP / Later Features

After MVP:

- Real-time collaboration
- Advanced scheduling
- Multiple schedule versions
- Advanced breakdown categories
- Advanced storyboards
- Image editing
- Camera setup management
- Advanced call-sheet builder
- Custom templates
- Custom branding
- Team messaging
- Shared inbox
- Advanced permissions
- Workflow automation
- Advanced analytics
- AI-assisted production workflows
- External integrations
- Billing
- Administration
- Advanced search and notifications

AI must suggest production data and never silently create authoritative production data.

## 12. Quality and Definition of Done

A feature is complete only when:

- Database implemented
- Backend implemented
- Frontend implemented
- Authentication enforced
- Authorization enforced
- Validation implemented
- Error handling implemented
- Loading states implemented
- Empty states implemented
- Tests written
- Production build succeeds
- Feature manually verified
- Documentation updated

The source explicitly states that a feature is not complete merely because its UI exists. fileciteturn0file0L1762-L1804

## 13. Implementation Order

1. Repository
2. Architecture
3. Database
4. Supabase Auth integration
5. Organizations
6. Projects
7. Design system
8. Project dashboard
9. Screenwriting
10. Scenes
11. Breakdown
12. Contacts
13. Locations
14. Stripboard
15. Shoot days
16. Call sheets
17. PDF engine
18. Tasks
19. Calendar
20. Media library
21. Shot lists
22. Storyboards
23. Moodboards
24. Documents
25. Reports
26. Collaboration
27. Sharing
28. Notifications
29. Search
30. Billing
31. Administration
32. Security hardening
33. Performance
34. Mobile
35. AI
36. Integrations

The source recommends starting with the platform foundation before the screenplay engine. fileciteturn0file0L1997-L2066
