# Field Book — Product Brief

## Overview

Field Book is a production-oriented, offline-capable web application designed for construction site inspectors working on road rehabilitation and farmland drainage projects.
It replaces traditional paper field books with a structured, reliable digital system that captures daily site activity, survey data, and photographic records in a consistent and auditable format.
The system must function in real field conditions, including intermittent or no internet access.

## Core Purpose

The application enables inspectors to:
Access shared project records
Create exactly one daily report per project per date
Record multiple timestamped notes within each report
Categorize notes (weather, labour, equipment, materials, visitors, general)
Attach photos to notes
Record structured survey logs using the Height of Instrument (HI) method
Capture survey setups and ordered shots with automatic calculations
Override calculated values when required
Maintain a complete and auditable history of all changes

## Users

The system supports authenticated users with roles:
Admin — full access, including configuration and category management
Inspector — create and edit operational data
ReadOnlyManager — view-only access for oversight
All users can access all projects in Version 1.

## Key Characteristics

*1. Shared System of Record*
All project data is shared among authenticated users
Every change records the user responsible
*2. Structured Daily Reporting*
One report per project per day
Notes are timestamped entries inside the report
Reports serve as both operational logs and legal records
*3. Structured Survey Logging*
Uses HI method only (Version 1)
Supports multiple setups per log
Maintains ordered shots with deterministic calculations
Allows manual override of calculated values
*4. Photo Integration*
Photos are attached to notes
Photos are part of the project record
*5. Auditability*
All mutations are tracked
Changes are reconstructable
Audit history is readable and attributable
*6. Offline Operation*
Users can create and edit data without internet access
Data is stored locally and synchronized when connectivity returns
Sync status is visible to the user

## System Behavior Model

Backend is the system of record
Frontend operates as a local-first client
User actions update local state immediately
Changes are queued and synchronized later
Sync conflicts use last-write-wins (Version 1)

## Technical Direction

Frontend: React + TypeScript (PWA)
Backend: Cloudflare Workers
Database: Cloudflare D1
File storage: Cloudflare R2
Local storage: IndexedDB (offline layer)

## Version 1 Priorities

Correctness and reliability
Clear structure and data integrity
Modular architecture with clean boundaries
Minimal refactoring pressure
Deterministic behavior

## Explicitly Out of Scope (Version 1 Initial Build)

Advanced search and reporting
Real-time collaboration
Multi-company tenancy
External API integrations (weather/maps)
App store packaging
Flexible/custom survey table systems

## Design Philosophy

This is not a prototype system.
It is a structured, production-ready application designed to:
evolve over time
maintain clean architectural boundaries
support real-world field conditions
preserve data integrity as a long-term record
