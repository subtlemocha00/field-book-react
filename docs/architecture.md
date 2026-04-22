# Field Book - System Architecture

## Core Principle

The system is modular, contract-driven, and layered so that major components can be replaced with minimal refactoring.

## Repo Structure

field-book/
  apps/
    web/
    api/
  packages/
    contracts/
    survey-core/
  docs/
  scripts/

## Boundary Rules

Frontend
UI components are presentation-only
Features orchestrate behavior
Data layer handles API and local storage
Domain logic is pure and framework-free
Backend
Routes handle HTTP only
Services orchestrate use cases
Repositories handle persistence
Domain models remain pure
Audit is a separate subsystem

## Shared Packages

contracts
Defines API schemas and DTOs
Used by both frontend and backend
survey-core
Contains all HI calculations and validation
Pure, deterministic, no external dependencies

## Critical Constraints

No business logic in React components
No direct fetch calls from UI
No SQL outside repositories
No infrastructure types in domain models
All mutations generate audit records
Sync logic is separate from feature logic

## Data Ownership

Backend is the system of record
Frontend is a local-first client
IndexedDB stores local working data
Sync reconciles local and remote state

## Sync Model

Explicit queue-based synchronization
Entity states:
local_only
synced
sync_failed
Queue states:
pending
processing
failed
completed
Conflict resolution: last-write-wins (Version 1)

## Audit Model

Append-only audit log
Every mutation creates an event
Field-level diffs stored
Optional snapshots for reconstruction
Survey recalculations separated from user edits

## Time Rules

All timestamps stored in UTC
report_date stored as calendar date
display uses local timezone
server is authoritative for sync ordering

## Storage

D1 for structured data
R2 for photo storage
Deterministic object key structure

## Development Approach

Build in micro-phases
Each phase must be testable
No speculative implementation
No cross-boundary leakage
Do not extract new shared packages prematurely
