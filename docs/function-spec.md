# Field Book — Functional Specification

## Purpose

This document defines the functional behavior of the Field Book application.

It specifies:

* what the system does
* what users can do
* how core workflows operate
* what data is captured through user interaction

This document defines **features and workflows**, not implementation.

It does **not** define:

* database schema
* API structure
* internal architecture
* calculation algorithms

Those are defined in other documents.

---

## 1. Application Overview

Field Book is a digital field documentation system for construction site inspectors.

It allows users to:

* create and manage projects
* record daily field activity
* log structured notes
* capture and attach photos
* record survey leveling data
* review historical changes

The system is designed to:

* replace paper field books
* maintain legally reliable records
* support multiple inspectors working on the same project

---

## 2. Users and Roles

## 2.1 User Accounts

Users must:

* authenticate with login credentials
* have a persistent identity within the system

Each action performed in the system is attributed to a user.

---

## 2.2 Roles

The system supports three roles:

### Admin

* full access
* can manage system configuration (e.g. note categories)

### Inspector

* can create and edit:

  + projects
  + daily reports
  + notes
  + survey logs
  + photos

### ReadOnlyManager

* can view all data
* cannot modify any records

---

## 2.3 Visibility

* All users can view all projects (V1)
* All users can view all data within a project
* All records display the user responsible for creation and last modification

---

## 3. Projects

## 3.1 Create Project

User can create a project with:

* name (required)
* description (optional)
* code (optional)
* location (optional free-text field)

---

## 3.2 View Projects

User can:

* view a list of projects
* open a project to access its data

---

## 3.3 Project Contents

Each project contains:

* daily reports
* notes (via reports)
* survey logs
* photos

---

## 3.4 Project Lifecycle

Projects are soft-deletable.

Rules:

* deleting a project triggers a soft-delete of all associated:

  + daily reports
  + notes
  + survey logs
  + survey setups
  + survey shots
  + photos
* deleted projects are not visible in active views
* deleted projects remain recoverable internally

---

## 4. Daily Reports

## 4.1 Create or Open Daily Report

For a given project and date:

* If a report exists → open it
* If not → create it

There is only one active report per project per date.

---

## 4.2 Daily Report Fields

A daily report may include:

* weather summary (optional)
* general summary (optional)

---

## 4.3 Daily Report View

User can:

* view all notes for that day
* view survey logs for that day
* view photos attached to notes

---

## 4.4 Daily Report Lifecycle

Daily reports are soft-deletable.

Rules:

* deleting a daily report triggers a soft-delete of all associated:

  + notes
  + survey logs
  + survey setups
  + survey shots
  + note-photo associations
* deleted reports are not visible in active views
* deleted reports remain recoverable internally

---

## 5. Notes

## 5.1 Create Note

Notes are created within a specific daily report.

User creates a note with:

* category (required)
* text body (required)
* timestamp (defaults to current time, editable)

---

## 5.2 Note Categories

Available categories include:

* weather
* working day
* contractor
* labour
* equipment
* materials
* visitors
* general notes

Some categories may be:

* active (available)
* inactive (not selectable but still visible in existing notes)

---

## 5.3 Edit Note

User can:

* edit note content
* edit timestamp
* change category (if valid)

All edits are:

* saved
* attributed to user
* recorded in history

---

## 5.4 Delete Note

User can:

* delete a note

Deleted notes:

* are removed from active view
* remain recoverable internally

Additional rule:

* deleting a note automatically triggers a soft-delete of all photos attached to that note

---

## 5.5 Note Ordering

Notes are displayed:

* by timestamp (primary)
* by ascending creation ID (`id`) when timestamps match

---

## 6. Photos

## 6.1 Add Photo

User can:

* capture a photo (mobile)
* upload a photo (desktop)

---

## 6.2 Attach Photo

Photos must be:

* attached to a note

Relationship rule:

* each photo is associated with exactly one parent note
* a photo cannot be attached to multiple notes

---

## 6.3 View Photos

User can:

* view photos within a note
* view photos in context of a daily report

---

## 6.4 Photo Metadata

Each photo includes:

* capture time (if available)
* file name
* uploader

---

## 6.5 Delete Photo

User can:

* remove a photo from a note

Rules:

* removing a photo from a note triggers a soft-delete of the photo entity
* photos do not remain in a detached or orphaned state
* photos are not permanently erased in V1
* soft-deleted photos remain recoverable internally

---

## 7. Survey Logs

## 7.1 Create Survey Log

Within a daily report, user can:

* create a survey log
* assign a title

---

## 7.2 Survey Structure

A survey log contains:

* one or more setups
* each setup contains multiple shots

---

## 7.3 Survey Setup

User can:

* create setups
* define reference information (e.g. benchmark elevation)

---

## 7.4 Survey Shots

User can enter per shot:

* point / station
* description
* backsight
* intermediate sight
* foresight
* remarks
* timestamp (optional)

Validation rules:

* all sight and elevation inputs must be numeric values
* values must not be null when required for calculation
* acceptable value range is -10000 to +10000 (units consistent within a project)

The system:

* automatically calculates:

  + height of instrument (HI)
  + elevation
* calculation occurs when required input values are present:

  + HI is calculated when a valid reference elevation and backsight are provided
  + elevation is calculated when a valid HI and a foresight or intermediate sight are provided
* allows manual override of calculated values

---

## 7.5 Edit Survey Data

User can:

* edit any shot or setup
* modify inputs
* override calculated values

Changes:

* update calculated results where applicable
* manual overrides persist even if related input values change, unless the user explicitly removes the override

---

## 7.6 Delete Survey Data

User can:

* delete setups or shots

Deleted items:

* are removed from active view
* remain recoverable internally

---

## 7.7 Survey Log Lifecycle

Survey logs are soft-deletable.

Rules:

* deleting a survey log triggers a soft-delete of all associated:

  + survey setups
  + survey shots
* deleted survey logs are not visible in active views
* deleted survey logs remain recoverable internally

---

## 8. Audit / History

## 8.1 History Tracking

The system records changes to:

* notes
* survey data
* reports

---

## 8.2 View History

In V1, users can view change history for notes only.

History includes:

* who made the change
* when it occurred
* what changed

---

## 8.3 Edit Transparency

Edits do not overwrite history:

* previous states remain traceable

---

## 9. Offline Behavior (Deferred Implementation)

## 9.1 Offline Capability

The system will support:

* creating and editing data without internet
* local persistence
* later synchronization

---

## 9.2 Sync Visibility

Records will indicate:

* local only
* synced
* failed sync

---

## 9.3 Conflict Handling

Conflict handling described here applies to the deferred offline synchronization system and is not part of V1 implementation.

Planned behavior:

* last-write-wins

---

## 10. Permissions

## 10.1 Write Access

Only:

* Admin
* Inspector

Can create or modify data

---

## 10.2 Read Access

All roles can:

* view all data

---

## 10.3 Enforcement

Permissions must:

* be enforced by the backend
* not rely solely on UI restrictions

---

### 11. Category Management (Admin)

## 11.1 Category Lifecycle

Admins can:

* create new categories
* edit category label
* activate or deactivate categories

---

## 11.2 Category Creation

Creating a category requires:

* key (unique identifier)
* label (display name)

Rules:

* category keys are immutable after creation
* only label and active status may be modified
* notes reference categories by key, and displayed labels always reflect the current category label value

---

## 11.3 Category Deactivation

When a category is deactivated:

* it cannot be selected for new notes
* existing notes using the category remain unchanged

---

## 12. Export (Future)

The system will support:

* exporting reports
* exporting survey data
* exporting project records

Format is not defined in V1.

---

## 13. Explicit Non-Features (V1)

The following are NOT included in V1:

* real-time collaboration
* push notifications
* GPS tracking
* map integration
* advanced reporting
* AI-assisted entries
* cross-project permissions
* multi-tenant company isolation
* automatic weather integration

---

## 14. System Guarantees

The system must ensure:

1. All entries are attributable to a user
2. Data is not silently lost
3. Edits are traceable
4. Ordering is deterministic
5. Survey calculations are consistent
6. Manual overrides are respected
7. Data remains accessible even after deletion (soft delete behavior)

---

## 15. Final Constraint

If implementation behavior diverges from this specification:

* the divergence must be explicit
* the reason must be documented
* this document must be updated before the divergence is accepted

Otherwise, this document is fixed.
