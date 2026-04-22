# Field Book — Domain Rules Specification

## Purpose

This document defines the domain rules that govern deterministic system behavior in Field Book.

It is the source of truth for:
survey calculation rules
override behavior
note ordering rules
daily report reuse rules
audit classification rules
sync conflict rules
mutation/recalculation rules

This document defines how the system behaves logically.

It does not define:
UI layout
API route design
database schema details
storage implementation
service/module boundaries

Those are defined elsewhere.

*1*. Domain Rule Principles

## 1.1 Determinism

Given the same valid inputs and the same prior state, domain logic must produce the same result every time.

## 1.2 Explicit Override Priority

When a field is designated as manually overridden, recalculation logic must not silently replace it unless the override is explicitly removed.

## 1.3 Stable Ordering

Where ordered entities exist, ordering must be explicit and persisted. The system must not rely on incidental DB row order.

## 1.4 Server Authority

For persisted and synchronized data, the backend is authoritative for accepted state, revision, and canonical timestamps.

## 1.5 Auditability

Domain mutations must be classifiable as:
user-input changes
derived changes
system changes

The system must preserve this distinction.

*2*. Daily Report Rules

## 2.1 One Report Per Project Per Date

Rule:
a project may have exactly one active daily report for a given report_date

Implication:
create requests for an already-existing report date must resolve to the existing report, not create a duplicate

## 2.2 Report Date Semantics

Rule:
report_date represents the calendar day of site activity for that project record
report_date is not inferred from note timestamps

Implication:
notes with timestamps near midnight do not change the owning report automatically

## 2.3 Daily Report Mutability

Rule:
weather summary and general summary are mutable fields
updates increment revision
updates generate audit records

*3*. Note Rules

## 3.1 Required Note Content

A valid note requires:
a parent daily report
a category
a body
a timestamp

If any of these are absent, the note is invalid.

## 3.2 Note Timestamp Semantics

Rule:
note timestamp is the recorded time of the note entry or event as set by the user
it may default to current time, but becomes domain data once saved

## 3.3 Note Ordering

Primary order:
ascending note_timestamp

Tie-break order:
ascending sort_index

If both are equal:
ordering must fall back to the immutable primary key (id) assigned at record creation

## 3.4 Sort Index Rule

Rule:
sort_index exists only to preserve deterministic order when timestamps collide
it is not a user-facing business concept

## 3.5 Note Deletion

Rule:
deleting a note is a soft delete
deleted notes are excluded from active note views
deleted notes remain recoverable through persistence/audit mechanisms unless explicitly purged by a future retention policy

## 3.6 Note Edit Rule

Rule:
editing a note changes its current state
edit mutations increment revision
edit mutations generate audit records

*4*. Note Category Rules

## 4.1 Category Validity

A note category is valid for assignment only if:
it exists
it is active at the time of assignment

## 4.2 Historical Category Preservation

Rule:
if a category is later deactivated, existing notes using that category remain valid
deactivation only prevents new assignment

## 4.3 Category Stability

Rule:
category key is the stable machine identifier
category label is display-oriented and may change without changing the domain identity of the category

*5*. Photo Association Rules

## 5.1 Photo Ownership in V1

Rule:
in V1, a photo is operationally associated to exactly one note

Implication:
the persistence model may technically allow future reuse, but V1 behavior must treat note-photo association as singular in practice

## 5.2 Photo Finalization Rule

Rule:
a photo must be associated to a note before its final R2 object key is assigned

Implication:
final storage identity depends on note association

## 5.3 Photo Deletion Rule

Rule:
soft deletion of a note or photo requires corresponding soft deletion of the relationship record(s)
audit history remains intact

*6*. Survey Domain Model Rules

## 6.1 Survey Log Scope

Rule:
a survey log belongs to exactly one daily report

## 6.2 Setup Scope

Rule:
a survey setup belongs to exactly one survey log

## 6.3 Shot Scope

Rule:
a survey shot belongs to exactly one survey setup

## 6.4 Setup Ordering

Rule:
setups are ordered by setup_order
that order is persisted and authoritative

## 6.5 Shot Ordering

Rule:
shots are ordered by shot_order
that order is persisted and authoritative

## 6.6 Allowed Gaps

Rule:
gaps in setup_order or shot_order are allowed after soft deletion
the system does not need to renumber automatically

## 6.7 Reactivation Rule

Rule:
if a soft-deleted setup or shot is restored at the same persisted order value, restoration must occur by reactivating the existing row, not by inserting a duplicate order value

*7*. HI Survey Calculation Rules

## 7.1 Supported Method

V1 supports only:
Height of Instrument (HI) method

No rise-and-fall logic exists in V1.

## 7.2 Setup Start Rule

A setup may begin with:
a known benchmark elevation
or another known starting elevation/reference value carried into that setup

A setup without sufficient reference information is incomplete and cannot produce valid downstream calculated elevations.

## 7.3 HI Calculation Rule

If:
reference elevation exists
backsight exists
HI is not manually overridden

Then:
height_of_instrument = reference_elevation + backsight

## 7.4 Elevation Calculation Rule

If:
valid HI exists
intermediate sight exists
elevation is not manually overridden

Then:
elevation = HI - intermediate_sight

If:
valid HI exists
foresight exists
elevation is not manually overridden

Then:
elevation = HI - foresight

## 7.5 One Relevant Sight Value Per Shot

Rule:
a single shot must contain at most one of the following values:
backsight
intermediate sight
foresight

If more than one is populated:
the shot is invalid and must be rejected

## 7.6 Setup Transition Rule

For multi-setup logs:
the terminal valid reference/elevation from the prior setup becomes the starting reference context for the next setup, if the workflow explicitly carries forward that point

The system must not invent carry-forward values without persisted inputs or defined workflow context.

## 7.7 Incomplete Shot Rule

A shot may be persisted in incomplete form during editing, but:
it is not considered calculation-complete until required reference inputs exist
incomplete shots must not yield misleading derived values

## 7.8 Persisted Derived Values

Rule:
persisted height_of_instrument and elevation are part of the domain record
they may be system-derived or manually overridden
override flags determine whether recalculation may replace them

*8*. Manual Override Rules

## 8.1 Override Definition

A manual override exists when a user intentionally sets:
height_of_instrument
or elevation

and the corresponding override flag is enabled.

## 8.2 Override Protection Rule

If a field has manual override enabled:
recalculation must not overwrite it

## 8.3 Override Removal Rule

If a manual override is explicitly removed:
the field becomes eligible for recalculation from current valid inputs

## 8.4 Partial Override Rule

Manual override is field-specific:
overriding HI does not automatically override elevation
overriding elevation does not automatically override HI

## 8.5 Downstream Recalculation Rule

If a changed upstream input affects later derived values:
non-overridden downstream derived fields must be recalculated
overridden downstream fields must be preserved

*9*. Survey Recalculation Rules

## 9.1 Recalculation Triggers

Recalculation must occur when relevant user-input fields change, including:
benchmark elevation
carried reference elevation
backsight
intermediate sight
foresight
manual HI value
manual elevation value
override enable/disable state
ordering changes that alter calculation sequence

## 9.2 Recalculation Scope

Recalculation must be limited to:
the affected setup
and any downstream dependent records logically impacted by the change

The system must not recalculate unrelated setups or logs.

## 9.3 Recalculation Ordering

Recalculation proceeds in persisted order:
setup order
shot order within each setup

## 9.4 Invalid State Handling

If a required upstream value is missing or invalid:
dependent derived values must be treated as unresolved
the system must not generate substitute values

## 9.5 Deterministic Recompute

Recalculating the same setup/log with unchanged inputs must produce identical outputs.

*10*. Audit Classification Rules

## 10.1 Change Kind Classification

Every persisted mutation affecting auditable entities must classify field changes as one of:
user_input
derived
system

## 10.2 User Input Changes

A field change is user_input when it results directly from explicit user action on domain input fields.

Examples:
editing note body
changing note timestamp
entering backsight
changing benchmark elevation
enabling manual override
typing a manual HI value

## 10.3 Derived Changes

A field change is derived when it results from deterministic calculation based on user input or valid persisted context.

Examples:
recalculated HI
recalculated elevation
recalculated downstream values after upstream edit

## 10.4 System Changes

A field change is system when it is caused by platform/process behavior rather than direct user input or pure business derivation.

Examples:
sync metadata application
system-generated correction markers
internal lifecycle transitions where applicable

## 10.5 Classification Preservation Rule

Survey calculation flows must propagate origin metadata so the audit layer can distinguish:
the user-entered cause
the derived recalculated effect

The audit system must not record derived recalculations as if they were direct manual edits.

*11*. Sync and Conflict Rules

## 11.1 V1 Conflict Policy

V1 uses:
last-write-wins

The backend remains authoritative for accepted final state.

## 11.2 Canonical Ordering of Authority

For synchronized persisted state, the ordering of trust is:
accepted server revision/state
accepted server timestamps
local pending state

## 11.3 Local Mutation Rule

When offline/local behavior exists:
user actions update local working state immediately
changes enter the sync queue
local success does not imply server acceptance

## 11.4 Conflict Outcome Rule

If a local change conflicts with a later-accepted server change under LWW:
the server-accepted state wins
the local losing state must not silently remain presented as canonical

## 11.5 Failed Sync Visibility Rule

If synchronization fails:
the affected record must remain visibly marked as failed until retried or resolved

## 11.6 Retry Rule Boundary

Retry/backoff mechanics are implementation/architecture concerns, but conflict outcome remains a domain rule:
failed changes are not considered canonical persisted state

*12*. Reactivation Rules for Soft-Deleted Ordered/Association Records

## 12.1 Reactivation Instead of Duplicate Insert

For entities constrained by persistent identity/order uniqueness after soft deletion, restoration must occur by updating the existing row to clear deleted_at, not by inserting a duplicate constrained row.

This applies to:
survey_setups
Survey_shots

## 12.2 Relationship Consistency

If a parent entity is soft-deleted:
dependent association rows that must no longer appear active must also be soft-deleted or excluded consistently according to the persistence spec

*13*. Validity vs Completeness

## 13.1 Persistable but Incomplete

Some entities may be saved in an incomplete state during user workflow.

Examples:
an in-progress survey setup
a partially entered shot

## 13.2 Completeness Rule

Persisted incomplete state does not imply domain completeness.

The system must distinguish:
stored draft/incomplete values
valid calculable state
final displayed derived state

## 13.3 No Silent Fabrication

If the system lacks enough valid inputs to derive a value:
it must leave the derived value unresolved
it must not invent defaults

*14*. Domain Invariants Summary

The following invariants must always hold:
At most one active daily report exists per project per report date
Notes belong to exactly one daily report
Survey logs belong to exactly one daily report
Survey setups belong to exactly one survey log
Survey shots belong to exactly one survey setup
Ordered entities use persisted order fields
Manual overrides are never silently overwritten
Derived survey values must come only from valid upstream inputs
Audit classification must distinguish user, derived, and system changes
Soft-deleted constrained records are restored by reactivation, not duplication

*15*. What This Spec Intentionally Does Not Define

This spec does not define:

SQL schema
API routes
frontend layout
sync queue table design
retry interval constants
permission matrix details
export formatting
service/module implementation

Those are defined elsewhere.
