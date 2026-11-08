# SKCS Edge Project Dependency Map

Generated from `EDGE_MASTER_PROJECT_REGISTER.v1.json`.

## ECC-001 — Edge Control Center v1

Status: DONE
Governed by: ECC-001
Blocked by: none
Blocks: EPR-001

## EPR-001 — Edge Master Project Register

Status: TESTED
Governed by: EPR-001
Blocked by: ECC-001
Blocks: EDGE-GOV-001, ESA-001, EAC-001

## EDGE-GOV-001 — Edge Asset Work Sequence Policy

Status: DONE
Governed by: EDGE-GOV-001
Blocked by: EPR-001
Blocks: none

## ESA-001 — Edge System and Runtime Inventory

Status: TESTED
Governed by: ESA-001
Blocked by: EPR-001
Blocks: EAC-001, EMG-001, EFI-001, EST-001, ESEC-001, EPI-001, EGR-001, EAI-001, EUI-001, EOPS-001, FIP-001, SEM-GOV-001A

## EAC-001 — Edge Asset Classification and Repository Map

Status: TESTED
Governed by: EAC-001
Blocked by: EPR-001, ESA-001
Blocks: EAC-R1-001, EMG-001, ESA-RR-003

## EAC-R1-001 — EAC-001 B18 Manifest and Repository Map Alignment Repair

Status: DONE
Governed by: EAC-R1-001
Blocked by: EAC-001
Blocks: none

## EMG-001 — Scout-Edge Marriage Gate Contract

Status: APPROVED
Governed by: EMG-001
Blocked by: ESA-001, EAC-001
Blocks: EFI-001, EST-001, ESEC-001, FIP-001

## EFI-001 — FIP Intake Handshake

Status: TESTED
Governed by: EFI-001
Blocked by: ESA-001, EMG-001
Blocks: EPRV-001, E2E-001

## EST-001 — Supabase Storage and FIP Retention Contract

Status: TESTED
Governed by: EST-001
Blocked by: ESA-001, EMG-001
Blocks: EOPS-001, E2E-001, SEM-GOV-001D-UI3-I2

## ESEC-001 — Subscriber and Security Boundary

Status: PARTIAL
Governed by: ESEC-001
Blocked by: ESA-001, EMG-001
Blocks: EUI-001, EOPS-001, E2E-001

## EPI-001 — Prediction Pipeline Integrity

Status: TESTED
Governed by: EPI-001
Blocked by: ESA-001
Blocks: EGR-001, EAI-001, EUI-001, E2E-001, SEM-GOV-001A

## EPRV-001 — External Sports Provider Removal

Status: PARTIAL
Governed by: EPRV-001
Blocked by: EFI-001
Blocks: E2E-001

## EGR-001 — Grading and Accuracy Governance

Status: PROPOSED
Governed by: EGR-001
Blocked by: ESA-001, EPI-001
Blocks: none

## EAI-001 — AI Provider and EdgeMind Boundary

Status: PROPOSED
Governed by: EAI-001
Blocked by: ESA-001, EPI-001
Blocks: none

## EUI-001 — Subscriber UI and Prediction Delivery

Status: PROPOSED
Governed by: EUI-001
Blocked by: ESA-001, ESEC-001, EPI-001
Blocks: none

## ECU-001 — Edge Control Center Operator UI

Status: APPROVED
Governed by: ECU-001
Blocked by: none
Blocks: none

## EOPS-001 — Deployment and Operations Governance

Status: PROPOSED
Governed by: EOPS-001
Blocked by: ESA-001, EST-001, ESEC-001
Blocks: EOPS-001-A1

## FIP-001 — Scout FIP Authority Contract

Status: APPROVED
Governed by: FIP-001
Blocked by: ESA-001, EMG-001
Blocks: none

## E2E-001 — Scout to Edge End-to-End Proof

Status: BLOCKED
Governed by: E2E-001
Blocked by: EFI-001, EST-001, ESEC-001, EPI-001, EPRV-001
Blocks: none

## ESA-RR-001 — ESA-RR-001 Runtime Repair Base Contract (Approved)

Status: APPROVED
Governed by: ESA-RR-001
Blocked by: none
Blocks: none

## ESA-RR-002 — ESA-RR-002 Implementation Law Seal (Hold)

Status: TESTED
Governed by: ESA-RR-002
Blocked by: none
Blocks: ESA-RR-003

## SEM-GOV-001A — Canonical Lifecycle, Terminology, Rolling Eight-Day Funnel and Help Contract

Status: APPROVED
Governed by: SEM-GOV-001A
Blocked by: ESA-001, EPI-001
Blocks: SEM-GOV-001B, SEM-GOV-001D-UI1

## SEM-GOV-001B — Football Lifecycle Persistence Contract

Status: APPROVED
Governed by: SEM-GOV-001B
Blocked by: SEM-GOV-001A
Blocks: SEM-GOV-001B-I2

## SEM-GOV-001B-I2 — Lifecycle Governor Foundation Design Packet

Status: APPROVED
Governed by: SEM-GOV-001B-I2
Blocked by: SEM-GOV-001B
Blocks: SEM-GOV-001B-I3

## SEM-GOV-001B-I3 — Pure Lifecycle Governor Foundation

Status: APPROVED
Governed by: SEM-GOV-001B-I3
Blocked by: SEM-GOV-001B-I2
Blocks: SEM-GOV-001B-I4-CAP

## SEM-GOV-001B-I4-CAP — Supabase Free-Tier Capacity and Retention Design

Status: DONE
Governed by: SEM-GOV-001B-I4-CAP
Blocked by: SEM-GOV-001B-I3
Blocks: SEM-GOV-001B-I4-CAP2

## SEM-GOV-001B-I4-CAP2 — 50-Fixture Daily Admission Capacity and Enforcement Design

Status: DONE
Governed by: SEM-GOV-001B-I4-CAP2
Blocked by: SEM-GOV-001B-I4-CAP
Blocks: SEM-GOV-001B-I4

## SEM-GOV-001B-I4 — Lifecycle Persistence Implementation

Status: TESTED
Governed by: SEM-GOV-001B-I4
Blocked by: SEM-GOV-001B-I4-CAP2
Blocks: SEM-GOV-001D-UI1, SEM-GOV-001D-UI3-I1

## SEM-GOV-001D-UI1 — Sports Match Hub UI Information Architecture and Screen Contract

Status: PROPOSED
Governed by: SEM-GOV-001D-UI1
Blocked by: SEM-GOV-001A, SEM-GOV-001B-I4
Blocks: SEM-GOV-001D-UI2

## SEM-GOV-001D-UI2 — Static Sports Match Hub Implementation

Status: TESTED
Governed by: SEM-GOV-001D-UI2
Blocked by: SEM-GOV-001D-UI1
Blocks: SEM-GOV-001D-HOME1

## SEM-GOV-001D-HOME1 — Home Page Information Architecture and Visual Consolidation

Status: TESTED
Governed by: SEM-GOV-001D-HOME1
Blocked by: SEM-GOV-001D-UI2
Blocks: SEM-GOV-001D-UI3-I1

## SEM-GOV-001D-UI3-I1 — Lifecycle Read-Model API Inspection and Contract

Status: TESTED
Governed by: SEM-GOV-001D-UI3-I1
Blocked by: SEM-GOV-001D-HOME1, SEM-GOV-001B-I4
Blocks: SEM-GOV-001D-UI3-I2

## SEM-GOV-001D-UI3-I2 — Canonical Fixture Metadata Projection Inspection and Contract

Status: TESTED
Governed by: SEM-GOV-001D-UI3-I2
Blocked by: SEM-GOV-001D-UI3-I1, EST-001
Blocks: SEM-GOV-001D-UI3-I3

## SEM-GOV-001D-UI3-I3 — Source B Storage Policy and Retention Contract

Status: TESTED
Governed by: SEM-GOV-001D-UI3-I3
Blocked by: SEM-GOV-001D-UI3-I2
Blocks: SEM-GOV-001D-UI3-I4

## SEM-GOV-001D-UI3-I4 — Source B Schema and Persistence Implementation Design

Status: TESTED
Governed by: SEM-GOV-001D-UI3-I4
Blocked by: SEM-GOV-001D-UI3-I3
Blocks: SEM-GOV-001D-UI3-I5

## SEM-GOV-001D-UI3-I5 — Source B Migration and Isolated Persistence Implementation

Status: TESTED
Governed by: SEM-GOV-001D-UI3-I5
Blocked by: SEM-GOV-001D-UI3-I4
Blocks: SEM-GOV-001D-UI3-I6

## SEM-GOV-001D-UI3-I6 — EFI-001 Governed Intake Inspection and Adapter Contract

Status: TESTED
Governed by: SEM-GOV-001D-UI3-I6
Blocked by: SEM-GOV-001D-UI3-I5
Blocks: SEM-GOV-001D-UI3-I7

## SEM-GOV-001D-UI3-I7 — Governed FIP Intake Adapter Implementation

Status: TESTED
Governed by: SEM-GOV-001D-UI3-I7
Blocked by: SEM-GOV-001D-UI3-I6
Blocks: SEM-GOV-001D-UI3-I8

## SEM-GOV-001D-UI3-I8 — Durable Intake Evidence Storage and Isolated Implementation

Status: TESTED
Governed by: SEM-GOV-001D-UI3-I8
Blocked by: SEM-GOV-001D-UI3-I7
Blocks: SEM-GOV-001D-UI3-I9

## SEM-GOV-001D-UI3-I9 — Production Composition and M2M Auth Foundation

Status: TESTED
Governed by: SEM-GOV-001D-UI3-I9
Blocked by: SEM-GOV-001D-UI3-I8
Blocks: SEM-GOV-001D-UI3-I10

## SEM-GOV-001D-UI3-I10 — Migration Readiness and Controlled Apply

Status: TESTED
Governed by: SEM-GOV-001D-UI3-I10
Blocked by: SEM-GOV-001D-UI3-I9
Blocks: SEM-GOV-001D-UI3-I11

## SEM-GOV-001D-UI3-I11 — Controlled End-to-End Marriage Proof

Status: TESTED
Governed by: SEM-GOV-001D-UI3-I11
Blocked by: SEM-GOV-001D-UI3-I10
Blocks: SXE-FIP-LAB-001

## SXE-FIP-LAB-001 — Genuine Scout-to-Edge External FIP Controlled Proof

Status: IN_PROGRESS
Governed by: SXE-FIP-LAB-001
Blocked by: SEM-GOV-001D-UI3-I11
Blocks: none

## SXE-FIP-LAB-001B — Edge Canonical FIP Intake Boundary Hardening

Status: TESTED
Governed by: SXE-FIP-LAB-001B
Blocked by: none
Blocks: none

## SXE-FIP-LAB-001C — Edge Hardening Closure Verification

Status: TESTED
Governed by: SXE-FIP-LAB-001C
Blocked by: none
Blocks: none

## SXE-FIP-LAB-001D — Edge Post-Publication Metadata Reconciliation

Status: TESTED
Governed by: SXE-FIP-LAB-001D
Blocked by: none
Blocks: none

## ESA-RR-003 — ESA-RR-003 Irrecoverable Preserved-Candidate Resolution Contract

Status: TESTED
Governed by: ESA-RR-003
Blocked by: ESA-RR-002, EAC-001
Blocks: ESA-RR-004

## ESA-RR-004 - ESA-RR-004 Runtime Inventory Evidence-Only Reconciliation

Status: TESTED
Governed by: ESA-RR-004
Blocked by: ESA-RR-003
Blocks: none

## EPI-001-D1-R1 - EPI-001-D1-R1 Governed D1 Prediction Provenance Integration

Status: TESTED
Governed by: EPI-001-D1-R1
Blocked by: EPI-001, EFI-001, EST-001, ESA-RR-004
Blocks: E2E-001

## EPRV-001-C2 - EPRV-001-C2 FIP Replacement Mapping and Fail-Closed Provider Readiness Contract

Status: TESTED
Governed by: EPRV-001-C2
Blocked by: EFI-001, EPI-001-D1-R1, ESA-RR-004
Blocks: none

## EPRV-001-C3 - EPRV-001-C3 Upstream Context Availability Reconciliation

Status: TESTED
Governed by: EPRV-001-C3
Blocked by: EPRV-001-C2
Blocks: none

## EPRV-001-C4 - EPRV-001-C4 Governed Scout Context Transport Field Contract

Status: TESTED
Governed by: EPRV-001-C4
Blocked by: EPRV-001-C3
Blocks: none

## EOPS-001-A1 — Azure Migration Stage A - Inventory, Costed Candidate and Startup Safety

Status: TESTED
Governed by: EOPS-001-A1
Blocked by: ESA-001, EST-001
Blocks: none

## ESEC-001-I2 — Production Runtime Credential and Deployment Configuration Verification

Status: TESTED
Governed by: ESEC-001-I2
Blocked by: ESA-001, EOPS-001-A1
Blocks: none

## ESEC-001-I3 — Production Credential Remediation and Key Vault Integration

Status: TESTED
Governed by: ESEC-001-I3
Blocked by: ESA-001, ESEC-001-I2, EOPS-001-A1
Blocks: none

## ESEC-001-I4 — Production Secret Provisioning and Rotation Proof

Status: TESTED
Governed by: ESEC-001-I4
Blocked by: ESA-001, ESEC-001-I3, EOPS-001-A1
Blocks: none

## ESEC-001-I5 — Azure Scheduler and Refresh Credential Boundary Resolution

Status: TESTED
Governed by: ESEC-001-I5
Blocked by: ESA-001, ESEC-001-I4, EOPS-001-A1
Blocks: none

## ESEC-001-I6 — RLS-001 Server-Only Table Boundary and Privilege Hardening

Status: IN_PROGRESS
Governed by: ESEC-001-I6
Blocked by: ESA-001, ESEC-001-I5, SEM-GOV-001D-UI3-I10
Blocks: none
