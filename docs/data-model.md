# Field Book — Data Model + Persistence Specification

## Purpose

This document defines the persistent data model for the Field Book application.

It is the source of truth for:
persistent entities
relationships
field definitions
required vs optional data
constraints
revisioning
soft deletion
audit-relevant persistence behavior

This document defines what is stored and how it is structured.

It does not define:
UI behavior
route design
service orchestration
sync engine implementation details
survey calculation algorithms

Those belong in other specifications.

*1*. Persistence Principles

## 1.1 System of Record

Cloudflare D1 is the system of record for structured data
Cloudflare R2 stores photo binaries only
Photo metadata is stored in D1

## 1.2 Source of Truth

Backend persistence is authoritative
Client-side local storage is a temporary working layer introduced in later phases
Local data models must reconcile to this persistent schema

## 1.3 Soft Delete Policy

For soft-deletable entities:
use deleted_at nullable
active rows have deleted_at = null
deleted rows remain queryable for audit/recovery purposes where appropriate

Exception:
lookup/reference tables may use lifecycle flags instead of deleted_at where deactivation is preferred over soft deletion
note_categories uses is_active for this reason

## 1.4 Revision Policy

All mutable domain entities must include:
revision INTEGER NOT NULL

Rules:
revision starts at 1
revision increments on every successful mutation
revision is server-assigned
revision is used for reconciliation and audit association

## 1.5 Timestamp Policy

All timestamps are stored in UTC.
Use ISO-compatible UTC values at the application boundary.

Distinguish between:
timestamp fields (created_at, updated_at, note/survey times)
calendar-date fields (report_date, start_date, end_date)

Calendar-date fields must use the text format:
YYYY-MM-DD

## 1.6 ID Policy

Each persistent entity has a stable primary key:
id TEXT PRIMARY KEY

Exact ID generation strategy may be UUID, ULID, or equivalent, but must be:
globally unique
stable
generated server-side unless explicitly defined otherwise later

## 1.7 Nullability Rule

A field is nullable only when the business domain genuinely permits absence.
Nullable fields must not be used as a substitute for incomplete design.

*2*. Entity Overview

The persistent model contains these major entities:
users
roles
user_roles
projects
note_categories
daily_reports
notes
photos
note_photos
survey_logs
survey_setups
survey_shots
audit_events
audit_event_fields
audit_snapshots

*3*. Core Identity and Access Entities

## 3.1 users

Purpose:
authenticated users of the application

Fields:
id TEXT PRIMARY KEY
email TEXT NOT NULL UNIQUE
display_name TEXT NOT NULL
password_hash TEXT NOT NULL
status TEXT NOT NULL
created_at TEXT NOT NULL
updated_at TEXT NOT NULL
revision INTEGER NOT NULL

Rules:
email must be unique
display_name is the human-readable name shown in records/history
password_hash stores only hashed passwords, never plaintext
status is an application-controlled lifecycle field (e.g. active, disabled)

Deletion:
users are not hard-deleted in normal operation
access disabling should be handled through status

## 3.2 roles

Purpose:
defines role types used for authorization

Fields:
id TEXT PRIMARY KEY
key TEXT NOT NULL UNIQUE
description TEXT NOT NULL
revision INTEGER NOT NULL

Required seeded values:
Admin
Inspector
ReadOnlyManager

## 3.3 user_roles

Purpose:
associates users with one or more roles

Fields:
user_id TEXT NOT NULL
role_id TEXT NOT NULL
deleted_at TEXT NULL
revision INTEGER NOT NULL

Constraints:
composite primary key (user_id, role_id)
foreign key to users(id)
foreign key to roles(id)

Rules:
a user may have one or more roles
V1 authorization logic may treat one role as dominant if needed, but persistence remains explicit
if a previously soft-deleted user-role association must be restored, reactivation MUST be performed by UPDATE to set deleted_at = null on the existing row rather than by inserting a new row

*4*. Project Entities

## 4.1 projects

Purpose:
top-level project container

Fields:
id TEXT PRIMARY KEY
name TEXT NOT NULL
code TEXT NULL
description TEXT NULL
location_text TEXT NULL
status TEXT NOT NULL
start_date TEXT NULL
end_date TEXT NULL
created_at TEXT NOT NULL
updated_at TEXT NOT NULL
deleted_at TEXT NULL
revision INTEGER NOT NULL

Rules:
name is required
code may be optional in V1
location_text is optional free text only
status is required
start_date and end_date are calendar-date values if present
soft delete applies

Relationships:
one project has many daily reports
one project has many photos

Indexes recommended:
index on status
index on deleted_at
optional index on code

*5*. Category Entities

## 5.1 note_categories

Purpose:
defines available categories for notes

Fields:
id TEXT PRIMARY KEY
key TEXT NOT NULL UNIQUE
label TEXT NOT NULL
sort_order INTEGER NOT NULL
is_active INTEGER NOT NULL
created_at TEXT NOT NULL
updated_at TEXT NOT NULL
revision INTEGER NOT NULL

Initial seeded categories:
weather
working_day
contractor
labour
equipment
materials
visitors
general_notes

Rules:
key is stable and machine-oriented
label is display-oriented
is_active is boolean-like (0/1)
deactivated categories remain valid for old notes

Deletion:
categories should not be physically deleted in normal operation
use is_active = 0 instead

*6*. Daily Report Entities

## 6.1 daily_reports

Purpose:
one daily report per project per date

Fields:
id TEXT PRIMARY KEY
project_id TEXT NOT NULL
report_date TEXT NOT NULL
weather_summary TEXT NULL
general_summary TEXT NULL
created_by_user_id TEXT NOT NULL
updated_by_user_id TEXT NOT NULL
created_at TEXT NOT NULL
updated_at TEXT NOT NULL
deleted_at TEXT NULL
revision INTEGER NOT NULL

Constraints:
foreign key to projects(id)
foreign key to users(id) for created_by_user_id
foreign key to users(id) for updated_by_user_id
unique (project_id, report_date)

Rules:
exactly one daily report per project per date in V1
report_date is a calendar date, not a timestamp
weather_summary and general_summary are optional free text
soft delete applies

Relationships:
one daily report has many notes
one daily report has many survey logs

Indexes recommended:
unique index on (project_id, report_date)
index on project_id
index on deleted_at

*7*. Note Entities

## 7.1 notes

Purpose:
timestamped entries within a daily report

Fields:
id TEXT PRIMARY KEY
daily_report_id TEXT NOT NULL
category_id TEXT NOT NULL
body TEXT NOT NULL
note_timestamp TEXT NOT NULL
sort_index INTEGER NOT NULL
created_by_user_id TEXT NOT NULL
updated_by_user_id TEXT NOT NULL
created_at TEXT NOT NULL
updated_at TEXT NOT NULL
deleted_at TEXT NULL
revision INTEGER NOT NULL

Constraints:
foreign key to daily_reports(id)
foreign key to note_categories(id)
foreign key to users(id) for creator/updater

Rules:
body is required
note_timestamp is required and stored in UTC
sort_index provides deterministic ordering fallback when timestamps collide
notes are soft-deletable
mutation increments revision

Relationships:
one note has many attached photos through note_photos

Indexes recommended:
index on daily_report_id
index on (daily_report_id, note_timestamp, sort_index)
index on deleted_at

*8*. Photo Entities

## 8.1 photos

Purpose:
stores metadata for photo objects stored in R2

Fields:
id TEXT PRIMARY KEY
project_id TEXT NOT NULL
uploaded_by_user_id TEXT NOT NULL
r2_object_key TEXT NOT NULL UNIQUE
filename_original TEXT NOT NULL
mime_type TEXT NOT NULL
size_bytes INTEGER NOT NULL
width INTEGER NULL
height INTEGER NULL
captured_at TEXT NULL
gps_lat REAL NULL
gps_lng REAL NULL
created_at TEXT NOT NULL
updated_at TEXT NOT NULL
deleted_at TEXT NULL
revision INTEGER NOT NULL

Constraints:
foreign key to projects(id)
foreign key to users(id) for uploader
unique r2_object_key

Rules:
binary file contents are not stored in D1
filename_original is preserved for display/reference only
uniqueness must come from r2_object_key, not original filename
GPS and image dimensions are optional
soft delete applies

Indexes recommended:
index on project_id
index on deleted_at

## 8.2 note_photos

Purpose:
join table linking photos to notes

Fields:
id TEXT PRIMARY KEY
note_id TEXT NOT NULL
photo_id TEXT NOT NULL
sort_order INTEGER NOT NULL
created_at TEXT NOT NULL
deleted_at TEXT NULL
revision INTEGER NOT NULL

Constraints:
foreign key to notes(id)
foreign key to photos(id)
unique (note_id, photo_id)

Rules:
one note may have multiple photos
a photo may be associated to one note in V1
if multi-note reuse is ever needed later, this table already supports it
soft delete applies
if a parent note or photo is soft-deleted, related note_photos rows must also be soft-deleted by the application layer to preserve consistency without hard-deleting relationship history

Indexes recommended:
index on note_id
index on photo_id
index on deleted_at

*9*. Survey Entities

## 9.1 survey_logs

Purpose:
survey log container within a daily report

Fields:
id TEXT PRIMARY KEY
daily_report_id TEXT NOT NULL
title TEXT NOT NULL
method TEXT NOT NULL
created_by_user_id TEXT NOT NULL
updated_by_user_id TEXT NOT NULL
created_at TEXT NOT NULL
updated_at TEXT NOT NULL
deleted_at TEXT NULL
revision INTEGER NOT NULL

Constraints:
foreign key to daily_reports(id)
foreign key to users(id) for creator/updater

Rules:
method is required
in V1, method must always be HI
soft delete applies

Relationships:
one survey log has many survey setups

Indexes recommended:
index on daily_report_id
index on deleted_at

## 9.2 survey_setups

Purpose:
one instrument setup within a survey log

Fields:
id TEXT PRIMARY KEY
survey_log_id TEXT NOT NULL
setup_order INTEGER NOT NULL
benchmark_reference TEXT NULL
benchmark_elevation REAL NULL
instrument_point_description TEXT NULL
created_at TEXT NOT NULL
updated_at TEXT NOT NULL
deleted_at TEXT NULL
revision INTEGER NOT NULL

Constraints:
foreign key to survey_logs(id)
unique (survey_log_id, setup_order)

Rules:
setups are ordered within a survey log
benchmark fields are optional because some workflows may define reference context differently
soft delete applies
if a soft-deleted setup must be restored or reused at the same setup_order, reactivation MUST be performed by UPDATE to set deleted_at = null on the existing row rather than by inserting a new row
order index gaps created by soft deletion are allowed unless an existing row is explicitly reactivated

Relationships:
one survey setup has many survey shots

Indexes recommended:
index on survey_log_id
unique index on (survey_log_id, setup_order)
index on deleted_at

## 9.3 survey_shots

Purpose:
ordered shots within a survey setup

Fields:
id TEXT PRIMARY KEY
survey_setup_id TEXT NOT NULL
shot_order INTEGER NOT NULL
shot_number TEXT NULL
point_or_station TEXT NULL
description TEXT NULL
backsight REAL NULL
intermediate_sight REAL NULL
foresight REAL NULL
height_of_instrument REAL NULL
elevation REAL NULL
is_manual_hi_override INTEGER NOT NULL
is_manual_elevation_override INTEGER NOT NULL
remarks TEXT NULL
shot_timestamp TEXT NULL
created_by_user_id TEXT NOT NULL
updated_by_user_id TEXT NOT NULL
created_at TEXT NOT NULL
updated_at TEXT NOT NULL
deleted_at TEXT NULL
revision INTEGER NOT NULL

Constraints:
foreign key to survey_setups(id)
foreign key to users(id) for creator/updater
unique (survey_setup_id, shot_order)

Rules:
shots are ordered within a setup
backsight, intermediate_sight, and foresight are nullable because only relevant values are present on a given shot
height_of_instrument and elevation are persisted because they are part of the audit/reconciliation record
is_manual_hi_override and is_manual_elevation_override are boolean-like (0/1)
soft delete applies
if a soft-deleted shot must be restored or reused at the same shot_order, reactivation MUST be performed by UPDATE to set deleted_at = null on the existing row rather than by inserting a new row
order index gaps created by soft deletion are allowed unless an existing row is explicitly reactivated

Important persistence rule:
persisted height_of_instrument and elevation may be system-derived or manually overridden
override flags determine whether recalculation may replace stored values

Indexes recommended:
index on survey_setup_id
unique index on (survey_setup_id, shot_order)
index on deleted_at

*10*. Audit Entities

## 10.1 audit_events

Purpose:
append-only audit event header for entity mutations

Fields:
id TEXT PRIMARY KEY
entity_type TEXT NOT NULL
entity_id TEXT NOT NULL
parent_entity_type TEXT NULL
parent_entity_id TEXT NULL
operation TEXT NOT NULL
changed_by_user_id TEXT NOT NULL
changed_at TEXT NOT NULL
source TEXT NOT NULL
change_summary TEXT NULL
entity_revision INTEGER NOT NULL
correlation_id TEXT NULL

Constraints:
foreign key to users(id) for changed_by_user_id

Rules:
audit is append-only
operation is one of: create, update, delete, restore
source distinguishes web/sync/system-originated changes
entity_revision ties the event to the persisted entity version

Indexes recommended:
index on (entity_type, entity_id)
index on (parent_entity_type, parent_entity_id)
index on changed_at
index on changed_by_user_id

## 10.2 audit_event_fields

Purpose:
field-level before/after changes for an audit event

Fields:
id TEXT PRIMARY KEY
audit_event_id TEXT NOT NULL
field_path TEXT NOT NULL
old_value_text TEXT NULL
new_value_text TEXT NULL
change_kind TEXT NOT NULL

Constraints:
foreign key to audit_events(id)

Rules:
change_kind is one of: user_input, derived, system
values are stored as text representations for diff readability
this table is optimized for readable history rather than perfect type reconstruction

Indexes recommended:
index on audit_event_id

## 10.3 audit_snapshots

Purpose:
reconstruction snapshot associated with selected audit events

Fields:
id TEXT PRIMARY KEY
audit_event_id TEXT NOT NULL
snapshot_json TEXT NOT NULL

Constraints:
foreign key to audit_events(id)

Rules:
snapshot creation is controlled by the architecture rules, not by arbitrary feature code
snapshots are not required for every mutation

Indexes recommended:
index on audit_event_id

*11*. Relationship Summary

Primary relationships

user ↔ roles: many-to-many through user_roles
project → daily_reports: one-to-many
project → photos: one-to-many
daily_report → notes: one-to-many
daily_report → survey_logs: one-to-many
note → photos: many-to-many through note_photos (effectively one-to-many in V1 usage)
survey_log → survey_setups: one-to-many
survey_setup → survey_shots: one-to-many

*12*. Persistence Constraints and Behavioral Implications

## 12.1 One Daily Report Per Day

Persistence constraint:
unique (project_id, report_date)

Implication:
application must reuse the existing report rather than creating duplicates

## 12.2 Deterministic Note Ordering

Persistence fields:
note_timestamp
sort_index

Implication:
notes remain stable in ordering even when timestamps collide

## 12.3 Deterministic Survey Ordering

Persistence fields:
setup_order
shot_order

Implication:
survey display and recalculation use stable persisted ordering

## 12.4 Override Preservation

Persistence fields:
is_manual_hi_override
is_manual_elevation_override

Implication:
recalculation logic must respect stored override state

## 12.5 Audit Coupling

Persistence implication:
every mutable domain entity must support association with audit records through stable id + revision

*13*. Recommended Enumeration Domains

These may be implemented as constrained text fields in D1 for V1.

users.status

Suggested values:
active
disabled

projects.status

Suggested values:
active
complete
archived

survey_logs.method

Allowed value in V1:
HI

audit_events.operation

Allowed values:
create
update
delete
restore

audit_events.source

Allowed values:
web
sync
system

audit_event_fields.change_kind

Allowed values:
user_input
derived
system

*14*. R2 Persistence Boundary

R2 stores:
binary photo objects only

D1 stores:
photo metadata
relationships to projects/notes
audit references where applicable

Object key pattern:
projects/{projectId}/notes/{noteId}/photos/{photoId}

Rules:
object key must be deterministic
original filename is not used for uniqueness
photo records must be associated with a note before the final R2 object key is assigned
deleting a photo record must not imply silent hard deletion of the audit trail

*15*. What This Spec Intentionally Does Not Define

This spec does not define:
route paths
API payload formats
sync queue schema in IndexedDB
frontend view models
exact survey calculation formulas
exact retry/backoff mechanics
authorization logic details
export formatting

Those are defined elsewhere.
