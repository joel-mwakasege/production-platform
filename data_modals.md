# Data Model

## 1. Modeling Principles

The database must represent the production workflow as connected data.

The core principle is:

> Production modules must operate on shared entities rather than isolated copies of the same production facts.

The source's initial conceptual schema includes users, organizations, projects, screenplays, scenes, production elements, schedules, contacts, locations, tasks, visual planning, media, documents, call sheets, collaboration, activity, and subscription entities. fileciteturn0file0L1391-L1443

## 2. Identity and Access Model

### `users`

Application-level profile associated with a Supabase Auth identity.

Conceptual fields:

```text
id
supabase_user_id
display_name
avatar_media_id
created_at
updated_at
```

`supabase_user_id` references the authenticated identity managed by Supabase Auth.

The application should not store a second password hash or implement its own authentication credential lifecycle.

### `organizations`

Tenant/workspace.

```text
id
name
slug
description
created_by
created_at
updated_at
```

### `organization_members`

Many-to-many relationship between users and organizations.

```text
id
organization_id
user_id
role
status
joined_at
created_at
updated_at
```

Roles:

```text
owner
administrator
manager
member
viewer
```

### `organization_invitations`

Invitation lifecycle.

```text
id
organization_id
email
role
invited_by
status
expires_at
accepted_at
created_at
```

The invitation flow must integrate with the Supabase-authenticated identity without creating a parallel authentication system.

## 3. Projects

### `projects`

```text
id
organization_id
name
description
project_type
client
status
start_date
end_date
created_by
created_at
updated_at
```

Project types:

```text
film
television
commercial
documentary
music_video
corporate_video
event
photoshoot
other
```

### `project_members`

```text
id
project_id
user_id
role
created_at
updated_at
```

Project membership supplements organization membership and controls access to project resources.

## 4. Screenwriting

### `screenplays`

```text
id
project_id
title
description
current_version_id
created_by
created_at
updated_at
```

### `screenplay_versions`

```text
id
screenplay_id
version_number
created_by
created_at
metadata
```

### `screenplay_elements`

Structured screenplay content.

```text
id
screenplay_id
version_id
scene_id
sequence
element_type
content
page_number
created_by
created_at
updated_at
```

Element types:

```text
scene_heading
action
character
dialogue
parenthetical
transition
shot
```

Do not store the screenplay as one giant HTML string.

### `scenes`

Scenes are first-class production entities.

```text
id
screenplay_id
scene_number
heading
location_id
interior_exterior
time_of_day
page_count
description
sequence
created_at
updated_at
```

A scene should remain addressable by all downstream production modules.

## 5. Breakdown

### `production_elements`

Reusable production entities.

```text
id
project_id
category
name
description
metadata
created_at
updated_at
```

Categories:

```text
cast
props
costumes
set_dressing
locations
vehicles
makeup
hair
sfx
vfx
camera
sound
special_equipment
extras
```

### `scene_elements`

Links scenes to production elements.

```text
id
scene_id
production_element_id
source_element_id
notes
created_at
updated_at
```

This relationship is what turns screenplay information into production data.

## 6. Scheduling

### `schedules`

```text
id
project_id
name
version_number
status
created_by
created_at
updated_at
```

### `schedule_days`

Represents shooting/prep days.

```text
id
schedule_id
day_number
date
label
general_call_time
notes
created_at
updated_at
```

### `schedule_scenes`

Links scenes to scheduled days.

```text
id
schedule_day_id
scene_id
sort_order
estimated_shoot_time
prep_time
company_move
notes
created_at
updated_at
```

This supports:

```text
Scene
 ↓
Schedule Scene
 ↓
Shoot Day
```

## 7. Contacts and Locations

### `contacts`

```text
id
project_id
name
role
department
company
email
phone
address
notes
category
created_at
updated_at
```

Categories:

```text
cast
crew
client
vendor
location
production
other
```

### `contact_tags`

```text
id
contact_id
tag
```

### `locations`

Locations may be modeled separately because they have production-specific attributes.

```text
id
project_id
name
address
description
parking
basecamp
nearest_hospital
notes
metadata
created_at
updated_at
```

## 8. Call Sheets

### `call_sheets`

```text
id
project_id
schedule_day_id
status
production_name
shoot_date
general_call_time
weather
location_id
nearest_hospital
parking
basecamp
notes
special_instructions
emergency_information
created_by
published_at
created_at
updated_at
```

### `call_sheet_scenes`

```text
id
call_sheet_id
scene_id
sort_order
notes
```

### `call_sheet_recipients`

```text
id
call_sheet_id
contact_id
individual_call_time
private_notes
delivery_status
viewed_at
confirmed_at
sent_at
created_at
updated_at
```

This supports personalized call times, recipient tracking, and future distribution channels.

## 9. Shot Lists

### `shot_lists`

```text
id
project_id
name
description
created_by
created_at
updated_at
```

### `shots`

```text
id
shot_list_id
scene_id
shot_number
shot_type
camera
lens
movement
framing
angle
description
time
notes
image_media_id
sort_order
shoot_time
prep_time
created_at
updated_at
```

A shot may reference a scene and may later be represented by storyboard frames.

## 10. Storyboards

### `storyboards`

```text
id
project_id
name
description
created_by
created_at
updated_at
```

### `storyboard_frames`

```text
id
storyboard_id
scene_id
shot_id
image_media_id
description
camera
lens
movement
audio
duration
notes
sort_order
aspect_ratio
created_at
updated_at
```

Annotations can be modeled separately if they become sufficiently complex.

## 11. Moodboards

### `moodboards`

```text
id
project_id
name
description
created_by
created_at
updated_at
```

### `moodboard_items`

```text
id
moodboard_id
media_file_id
item_type
x
y
width
height
rotation
text
notes
group_id
sort_order
created_at
updated_at
```

## 12. Tasks

### `tasks`

```text
id
project_id
title
description
assignee_user_id
department
priority
status
start_date
due_date
created_by
created_at
updated_at
```

Statuses:

```text
todo
in_progress
blocked
done
```

### `task_checklists`

```text
id
task_id
title
is_completed
sort_order
created_at
updated_at
```

### `task_attachments`

```text
id
task_id
media_file_id
created_at
```

## 13. Calendar

### `calendar_events`

```text
id
project_id
event_type
title
description
start_at
end_at
location_id
created_by
created_at
updated_at
```

Event types:

```text
shoot
prep
meeting
deadline
location_scout
client_review
task
custom
```

## 14. Media

### `media_files`

Database metadata for object storage.

```text
id
project_id
storage_key
file_name
mime_type
size_bytes
checksum
uploaded_by
folder
metadata
created_at
updated_at
```

The actual binary object is stored in object storage. Database access controls determine whether a user may retrieve the metadata/object.

## 15. Documents

### `documents`

```text
id
project_id
title
document_type
current_version_id
created_by
created_at
updated_at
```

### `document_versions`

```text
id
document_id
version_number
content
created_by
created_at
metadata
```

## 16. Reports

A report engine should generally use report definitions/templates rather than creating a permanent table for every report type.

Conceptual:

```text
Report Request
 ↓
Report Query
 ↓
Report Template
 ↓
Renderer
```

Report types:

```text
breakdown
element
shooting_schedule
one_liner
dood
cast
location
props
costume
equipment
```

## 17. Collaboration

### `comments`

```text
id
project_id
user_id
entity_type
entity_id
content
parent_comment_id
created_at
updated_at
```

The entity reference allows comments on supported production artifacts.

### `notifications`

```text
id
user_id
project_id
type
entity_type
entity_id
payload
read_at
created_at
```

Notification types include task assignment/completion, comments, mentions, document sharing, call-sheet publication/confirmation, schedule changes, and project invitations.

## 18. Activity and Audit

### `activity_logs`

```text
id
organization_id
project_id
user_id
action
entity_type
entity_id
old_value
new_value
created_at
```

Examples:

```text
User created Scene 14
User changed Scene 14
User moved Scene 14 to Shoot Day 3
User published Call Sheet 3
User confirmed Call Sheet 3
```

Important mutations should be recorded in a way that supports auditability.

## 19. Sharing and Permissions

A reusable sharing model may be introduced for production artifacts.

Conceptual entity:

### `shares`

```text
id
project_id
entity_type
entity_id
recipient_user_id
recipient_contact_id
permission
share_token
expires_at
created_by
created_at
```

Permissions:

```text
private
view
comment
edit
admin
```

The exact implementation can be finalized with the authorization architecture.

## 20. Subscriptions

### `plans`

```text
id
name
description
limits
features
created_at
updated_at
```

### `subscriptions`

```text
id
organization_id
plan_id
status
external_customer_id
external_subscription_id
current_period_start
current_period_end
created_at
updated_at
```

Usage limits should be configurable rather than hard-coded throughout the application.

## 21. Relationships

### Core production graph

```text
Organization
 ↓
Project
 ↓
Screenplay
 ↓
Scene
 ├── Scene Elements
 │      ↓
 │  Production Elements
 │
 ├── Schedule Scenes
 │      ↓
 │  Shoot Day
 │      ↓
 │  Call Sheet
 │
 └── Shots
        ↓
     Shot List
        ↓
     Storyboard
```

### Contacts graph

```text
Project
 ↓
Contacts
 ├── Cast
 ├── Crew
 ├── Client
 ├── Vendor
 └── Production
       ↓
Call Sheet Recipients
```

### Media graph

```text
Project
 ↓
Media Files
 ├── Moodboard Items
 ├── Shot Images
 ├── Storyboard Frames
 ├── Task Attachments
 └── Document Attachments
```

## 22. Key Integrity Rules

1. Every project belongs to exactly one organization.
2. Every organization membership references an existing application user.
3. Project membership cannot grant access outside its organization.
4. Every scene belongs to a screenplay/project context.
5. Production elements belong to a project.
6. Scene-element links must connect entities belonging to the same project.
7. Scheduled scenes must belong to the same project as their schedule.
8. Call sheets must belong to the same project as their shoot day.
9. Call-sheet recipients must resolve to project contacts/members with appropriate access.
10. Shots must reference scenes from the same project.
11. Storyboard frames must reference compatible project scenes/shots.
12. Media access must be checked against the owning project.
13. Audit records must preserve actor, action, entity, and timestamp.
14. Deletion behavior must be explicitly defined for every relationship; do not rely on accidental cascading deletes for critical production data.

## 23. Indexing Priorities

At minimum, index:

- `organization_members.organization_id`
- `organization_members.user_id`
- `projects.organization_id`
- `project_members.project_id`
- `project_members.user_id`
- `screenplays.project_id`
- `scenes.screenplay_id`
- `scenes.location_id`
- `production_elements.project_id`
- `scene_elements.scene_id`
- `scene_elements.production_element_id`
- `schedules.project_id`
- `schedule_days.schedule_id`
- `schedule_scenes.schedule_day_id`
- `schedule_scenes.scene_id`
- `contacts.project_id`
- `locations.project_id`
- `tasks.project_id`
- `tasks.assignee_user_id`
- `media_files.project_id`
- `documents.project_id`
- `call_sheets.project_id`
- `call_sheets.schedule_day_id`
- `activity_logs.organization_id`
- `activity_logs.project_id`
- `activity_logs.user_id`

Search-specific indexes can be added as requirements become concrete.

## 24. Transaction Boundaries

Important cross-module operations should be transactional where possible.

Examples:

### Accept organization invitation

```text
Validate invitation
→ Validate authenticated user
→ Create membership
→ Mark invitation accepted
```

### Move scene to shoot day

```text
Validate authorization
→ Validate schedule
→ Update schedule_scene
→ Record activity
```

### Publish call sheet

```text
Validate call sheet
→ Persist published state
→ Record publication event
→ Queue distribution
```

## 25. Supabase Consideration

Supabase is explicitly used for authentication. The rest of the infrastructure should remain aligned with the project's chosen architecture and can be finalized before implementation.

If Supabase PostgreSQL or Supabase Storage is adopted later, the logical model above remains applicable; the provider-specific implementation should not change the domain relationships.

## 26. Initial Conceptual Schema

```text
users
organizations
organization_members
organization_invitations
projects
project_members

screenplays
screenplay_versions
screenplay_elements
scenes

production_elements
scene_elements

schedules
schedule_days
schedule_scenes

contacts
locations

tasks
task_checklists
task_attachments
calendar_events

moodboards
moodboard_items

shot_lists
shots

storyboards
storyboard_frames

media_files

documents
document_versions

call_sheets
call_sheet_scenes
call_sheet_recipients

comments
notifications
activity_logs

shares
plans
subscriptions
```
