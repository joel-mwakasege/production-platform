# User Flows

## 1. Core System Flow

```text
Supabase Auth
     ↓
Application User
     ↓
Organization
     ↓
Project
     ↓
Production Modules
```

Supabase Auth establishes the authenticated identity. The application then resolves the user to its application profile and organization/project memberships.

## 2. Sign-Up and First-Time Setup

```text
User
 ↓
Sign Up
 ↓
Supabase Auth
 ↓
Email Verification (if required)
 ↓
Authenticated Session
 ↓
Create/Join Organization
 ↓
Organization Membership
 ↓
Create Project
 ↓
Project Dashboard
```

### Success criteria

- User has a valid Supabase-authenticated session.
- Application user profile exists.
- User belongs to at least one organization.
- User can access only organizations to which they belong.
- User can create or access permitted projects.

## 3. Login

```text
User
 ↓
Login
 ↓
Supabase Auth
 ↓
Authenticated Session
 ↓
Resolve Application User
 ↓
Resolve Organization Membership
 ↓
Open Organization / Project
```

If the user belongs to multiple organizations, organization switching is available.

## 4. Logout

```text
User
 ↓
Logout
 ↓
Supabase Auth session terminated
 ↓
Local application state cleared
 ↓
Public/auth screen
```

## 5. Organization Creation

```text
Authenticated User
 ↓
Create Organization
 ↓
Organization Record
 ↓
Create Owner Membership
 ↓
Organization Workspace
```

The creator receives the **Owner** role.

## 6. Invite Organization Member

```text
Owner/Admin
 ↓
Invite Member
 ↓
Invitation
 ↓
Recipient Authentication / Account
 ↓
Accept Invitation
 ↓
Organization Membership Created
 ↓
Assigned Role
```

Invitation acceptance must not bypass authorization boundaries.

## 7. Create Project

```text
Organization Member with Permission
 ↓
New Project
 ↓
Enter:
  Name
  Description
  Type
  Client
  Start Date
  End Date
  Team
 ↓
Create Project
 ↓
Assign Project Membership
 ↓
Project Dashboard
```

## 8. Project Access

Every protected project request follows the conceptual flow:

```text
Request
 ↓
Validate Supabase Authentication
 ↓
Resolve Application User
 ↓
Check Organization Membership
 ↓
Check Project Membership / Role
 ↓
Check Object-Level Permission
 ↓
Load or Mutate Resource
```

A project ID alone is never sufficient authorization.

## 9. Screenwriting Flow

```text
Project
 ↓
Create Screenplay
 ↓
Create Scene
 ↓
Write Structured Elements
 ↓
Autosave
 ↓
Scene Data
```

Structured elements may include scene headings, action, character, dialogue, parenthetical, transition, and shot.

## 10. Breakdown Flow

```text
Screenplay
 ↓
Scene
 ↓
Select Script Element
 ↓
Assign Breakdown Category
 ↓
Create/Select Production Element
 ↓
Scene Element Relationship
 ↓
Breakdown Complete
```

Example:

```text
Scene 14
 ↓
Script Element: "CAR"
 ↓
Category: Vehicle
 ↓
Production Element: Picture Car
```

## 11. Scheduling Flow

```text
Scenes
 ↓
Generate Strips
 ↓
Review Scene Information
 ↓
Drag Scenes
 ↓
Create Shoot Days
 ↓
Assign Scenes to Shoot Days
 ↓
Schedule
```

Scheduling should use shared scene, cast, location, and breakdown data instead of duplicating production facts.

## 12. Contacts and Cast/Crew Flow

```text
Project
 ↓
Contacts
 ↓
Create Contact
 ↓
Assign Category
 ↓
Cast / Crew / Vendor / Client / Other
 ↓
Use Contact in Production Modules
```

A cast/crew contact may subsequently become a call-sheet recipient or task assignee.

## 13. Call Sheet Generation Flow

```text
Shoot Day
 ↓
Generate Call Sheet
 ↓
Load Project Data
 ↓
Load Scheduled Scenes
 ↓
Load Locations
 ↓
Load Cast/Crew
 ↓
Load Contacts
 ↓
Load Production Details
 ↓
Build Call Sheet
 ↓
Edit / Validate
 ↓
Export PDF
 ↓
Share / Distribute
```

## 14. Call Sheet Distribution Flow

```text
Published Call Sheet
 ↓
Select Recipients
 ↓
Set Individual Call Times
 ↓
Add Private Notes / Attachments
 ↓
Choose Delivery
 ├── Email
 ├── SMS
 └── Shareable Link
 ↓
Send
 ↓
Track Delivery / View / Confirmation
```

## 15. Task Flow

```text
Project
 ↓
Create Task
 ↓
Set Assignee
 ↓
Set Priority
 ↓
Set Dates
 ↓
Add Checklist / Attachments
 ↓
To Do
 ↓
In Progress
 ↓
Blocked (optional)
 ↓
Done
```

## 16. Shot Planning Flow

```text
Scene
 ↓
Create Shot
 ↓
Set Shot Properties
 ↓
Add Image / Reference
 ↓
Add to Shot List
 ↓
Optional Camera Setup
 ↓
Create Storyboard Frame
```

## 17. Storyboard Flow

```text
Shot
 ↓
Generate / Create Frame
 ↓
Attach Image
 ↓
Add Camera / Lens / Movement
 ↓
Add Description / Audio / Notes
 ↓
Annotate
 ↓
Reorder
 ↓
Export
```

## 18. Media Flow

```text
Project
 ↓
Media Library
 ↓
Upload File
 ↓
Validate Permission
 ↓
Store Object
 ↓
Create Media Metadata
 ↓
Tag / Group
 ↓
Preview / Share / Download
```

## 19. Sharing Flow

```text
Artifact
 ↓
Share
 ↓
Select Recipient / Link
 ↓
Set Permission
 ├── Private
 ├── View Only
 ├── Comment
 ├── Edit
 └── Admin
 ↓
Recipient Access
 ↓
Authorization Check
 ↓
Artifact
```

## 20. Collaboration Flow

```text
User Action
 ↓
Application Mutation
 ↓
Persist Change
 ↓
Activity Event
 ↓
Optional Notification
 ↓
Comments / Mentions / Activity Feed
```

Real-time editing is intentionally deferred until the underlying document architecture is stable.

## 21. MVP End-to-End Journey

```text
Create Account
 ↓
Create Organization
 ↓
Create Project
 ↓
Create Screenplay
 ↓
Write Scenes
 ↓
Break Down Scenes
 ↓
Create Shooting Schedule
 ↓
Assign Shoot Days
 ↓
Add Cast/Crew
 ↓
Generate Call Sheet
 ↓
Export / Share Call Sheet
```

This is the primary success journey for the MVP.

## 22. Error and Authorization Flow

```text
Protected Request
 ↓
No Valid Supabase Session?
 ├── Yes → Authentication Error
 └── No
      ↓
Organization Access?
 ├── No → Forbidden
 └── Yes
      ↓
Project Access?
 ├── No → Forbidden
 └── Yes
      ↓
Object Permission?
 ├── No → Forbidden
 └── Yes → Execute
```

## 23. Recovery Principles

For all major workflows:

- Show loading state while data is being retrieved.
- Show empty state when no data exists.
- Show actionable errors when an operation fails.
- Avoid silently losing unsaved production data.
- Autosave where the module requires it.
- Keep version history for versioned documents.
- Record important mutations in the audit/activity system.
