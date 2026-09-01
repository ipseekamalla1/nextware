# Nextware

### ERP / WMS Business Management Platform

**Nextware** is a commercial-grade ERP/WMS platform designed to help small and medium-sized businesses manage inventory, warehouse operations, purchasing, sales, orders, shipping, and related business workflows from a single system.

The product is being designed as an **installable desktop application** rather than a traditional browser-only web application. The goal is to provide businesses with software that feels like a professional operational system used every day by warehouse, office, purchasing, sales, and management teams.

> **Project Status:** Phase 7 — Master Data (in progress)
> **Version:** 0.1 — Draft
> **Started:** August 18, 2026
> **Last Updated:** September 1, 2026

---

## What is Nextware?

Nextware is being built as a reusable ERP/WMS product rather than a one-off application for a single company.

The initial implementation will be driven by the real-world requirements of the first commercial client. However, the underlying architecture is being designed so that the same core product can eventually support multiple companies through configuration and company-scoped data.

### Long-Term Vision

```text
                    NEXTWARE
                       │
        ┌──────────────┼──────────────┐
        │              │              │
    Inventory      Purchasing       Sales
        │              │              │
        └──────────────┼──────────────┘
                       │
                  Warehouse
                       │
              Shipping / Logistics
                       │
                  Reporting
                       │
              Administration
```

The long-term goal is to create a flexible business platform that can grow from a focused inventory and warehouse solution into a broader ERP ecosystem.

---

# Product Goals

Nextware is being designed around several core principles:

* Build around real business workflows.
* Start with a focused MVP rather than attempting to build a complete ERP immediately.
* Maintain strong inventory and data integrity.
* Keep business logic separate from the user interface.
* Make important business actions auditable.
* Use role-based permissions.
* Support multiple users working with shared company data.
* Integrate with warehouse hardware where required.
* Keep the architecture modular and extensible.
* Build reusable functionality that can support future clients.
* Avoid unnecessary complexity and premature microservices.
* Treat security, testing, backups, and reliability as foundational concerns.

---

# Target Users

Nextware is intended to support different roles within a business, including:

| Role                  | Typical Responsibilities                        |
| --------------------- | ----------------------------------------------- |
| Company Administrator | Users, permissions, company settings            |
| Warehouse Manager     | Warehouse operations and inventory oversight    |
| Warehouse Employee    | Receiving, put-away, picking, packing, shipping |
| Inventory Manager     | Stock accuracy, adjustments, cycle counts       |
| Purchasing Employee   | Vendors and purchase orders                     |
| Sales Employee        | Customers and sales orders                      |
| Logistics Coordinator | Shipments, carriers, dispatch and delivery      |
| Accounting            | Invoices and financial-related workflows        |
| Management            | Reports, dashboards and business visibility     |

The exact roles and permissions will be determined during the requirements phase based on the first client's organization.

---

# Core Functional Areas

The eventual platform may include:

### Authentication & Administration

* User authentication
* User management
* Roles
* Permissions
* Company configuration
* Audit logs

### Master Data

* Products
* Categories
* Units of measure
* Customers
* Vendors
* Warehouses
* Warehouse zones
* Storage locations
* Carriers
* Drivers

### Inventory

* On-hand inventory
* Available inventory
* Allocated inventory
* Reserved inventory
* Inventory movements
* Inventory adjustments
* Inventory transfers
* In-transit inventory
* Inventory history
* Cycle counting
* Inventory ledger

### Purchasing

* Purchase requisitions
* Purchase orders
* Purchase approvals
* Receiving
* Vendor management
* Purchase history

### Sales

* Customers
* Sales orders
* Order allocation
* Picking
* Packing
* Shipping
* Delivery
* Invoicing

### Warehouse Management

* Receiving
* Product scanning
* Put-away
* Bin/location management
* Picking
* Packing
* Shipping
* Cycle counting

### Logistics

* Shipments
* Carrier management
* Driver management
* Dispatch
* Tracking
* Proof of Delivery
* Bills of Lading

### Reporting

* Inventory reports
* Stock movement
* Low-stock reports
* Purchasing reports
* Sales reports
* Receiving reports
* Shipping reports
* Warehouse activity
* Management dashboards

> The complete module list is a future product catalog, not the Phase 1 MVP commitment.

---

# Architecture

Nextware is planned as a **modular monolith** for the initial product.

The high-level architecture is:

```text
┌─────────────────────────────────────────────┐
│              Nextware Desktop               │
│                                             │
│        Tauri + React + TypeScript           │
└──────────────────────┬──────────────────────┘
                       │
                       │ HTTPS / REST API
                       ▼
┌─────────────────────────────────────────────┐
│              Nextware Backend               │
│                                             │
│              Spring Boot API                │
│                                             │
│  Authentication                             │
│  Master Data                                │
│  Inventory                                  │
│  Purchasing                                 │
│  Sales                                      │
│  Warehouse                                  │
│  Shipping                                   │
│  Logistics                                  │
│  Reporting                                  │
└──────────────────────┬──────────────────────┘
                       │
                       │
                       ▼
┌─────────────────────────────────────────────┐
│                PostgreSQL                   │
│                                             │
│         Business & Transaction Data         │
└─────────────────────────────────────────────┘
```

### Desktop Application

The end-user application will be packaged as a native desktop application using **Tauri**.

The intended experience is:

```text
Download Installer
       ↓
Install Nextware
       ↓
Desktop Shortcut
       ↓
Open Nextware
       ↓
Login
       ↓
Use ERP / WMS
```

The application is intended to support:

* Windows
* macOS

---

# Technology Stack

| Layer              | Technology                    |
| ------------------ | ----------------------------- |
| Desktop Shell      | Tauri                         |
| Frontend           | React                         |
| Language           | TypeScript                    |
| UI                 | Tailwind CSS                  |
| Build Tool         | Vite                          |
| Backend            | Java 17                       |
| Backend Framework  | Spring Boot                   |
| Security           | Spring Security               |
| Authentication     | JWT / secure session strategy |
| ORM                | Spring Data JPA / Hibernate   |
| Database           | PostgreSQL                    |
| Database Migration | Flyway                        |
| API                | REST                          |
| Containers         | Docker                        |
| Version Control    | Git / GitHub                  |
| API Testing        | Postman                       |
| CI/CD              | GitHub Actions                |
| Server             | Linux / Cloud / On-Premise    |

---

# Why a Desktop Application?

Nextware is specifically being designed as an installed business application.

This is important because warehouse and business environments may require interaction with physical equipment such as:

* Barcode scanners
* Thermal label printers
* Standard printers
* Warehouse computers
* Other local hardware

The desktop architecture also provides a professional installed-software experience while allowing the business logic and data to remain centralized.

The desktop application will **not connect directly to PostgreSQL**.

Instead:

```text
Employee Computer
       │
       ▼
Nextware Desktop
       │
       ▼
Secure REST API
       │
       ▼
Spring Boot
       │
       ▼
PostgreSQL
```

This keeps business rules, security, authorization, transactions, and data integrity centralized.

---

# Inventory Philosophy

One of the most important architectural principles of Nextware is that inventory should be treated as a **transactional ledger**, rather than simply storing one mutable quantity.

Instead of relying only on:

```text
product.quantity = 100
```

the system records inventory movements such as:

```text
RECEIPT       +100
TRANSFER       -20
TRANSFER       +20
PICK           -10
ADJUSTMENT      +5
────────────────────
ON-HAND         95
```

Every important movement can contain information such as:

* Product
* Quantity
* Location
* Transaction type
* Reference document
* User
* Timestamp
* Reason

This provides traceability, auditability, historical reporting, and a reliable way to investigate inventory discrepancies.

---

# Product Architecture Philosophy

Nextware will initially use a **modular monolith**.

```text
Nextware
│
├── Authentication
├── Users
├── Master Data
├── Customers
├── Vendors
├── Products
├── Inventory
├── Purchasing
├── Sales
├── Warehouse
├── Shipping
├── Logistics
├── Reporting
└── Administration
```

Modules will have clear responsibilities and communicate through defined service boundaries.

Microservices are intentionally **not** part of the initial architecture because the project does not currently require the operational complexity of distributed services.

---

# Multi-Client Product Vision

Nextware is being developed with a long-term productization strategy.

The objective is to avoid creating a codebase that only works for one company.

Conceptually:

```text
                 Nextware Core
                      │
        ┌─────────────┼─────────────┐
        │             │             │
     Client A      Client B      Client C
        │             │             │
   Configuration  Configuration  Configuration
        │             │             │
      Data          Data          Data
```

The core business logic should remain reusable while company-specific information is handled through configuration and company-scoped records.

The first client will therefore act as the initial real-world validation of the product.

---

# Development Roadmap

Nextware is being developed in phases.

| Phase | Description              | Status     |
| ----- | ------------------------ | ---------- |
| 0     | Foundation & Blueprint   | 🟡 Current |
| 1     | Client Discovery         | ⚪ Planned  |
| 2     | Requirements             | ⚪ Planned  |
| 3     | Business Process Mapping | ⚪ Planned  |
| 4     | Architecture             | ⚪ Planned  |
| 5     | Project Setup            | ⚪ Planned  |
| 6     | Authentication           | ⚪ Planned  |
| 7     | Master Data              | ⚪ Planned  |
| 8     | Inventory                | ⚪ Planned  |
| 9     | Purchasing               | ⚪ Planned  |
| 10    | Warehouse                | ⚪ Planned  |
| 11    | Sales                    | ⚪ Planned  |
| 12    | Shipping & Logistics     | ⚪ Planned  |
| 13    | Reporting                | ⚪ Planned  |
| 14    | Security Hardening       | ⚪ Planned  |
| 15    | Testing                  | ⚪ Planned  |
| 16    | Desktop Packaging        | ⚪ Planned  |
| 17    | Deployment               | ⚪ Planned  |
| 18    | Client UAT               | ⚪ Planned  |
| 19    | Production               | ⚪ Planned  |
| 20    | Productization           | ⚪ Planned  |
| 21    | Additional Clients       | ⚪ Future   |

---

# Project Documentation

The repository will contain detailed documentation for each phase of development.

### Foundation

* **Phase 0 — Foundation & Blueprint**

  * Product vision
  * Architecture direction
  * Technology evaluation
  * ERP/WMS concepts
  * Security foundation
  * Deployment strategy
  * Productization strategy
  * Development roadmap

### Discovery & Planning

* **Phase 1 — Client Discovery**
* **Phase 2 — Requirements**
* **Phase 3 — Business Process Mapping**
* **Phase 4 — Architecture**

### Implementation

* **Phase 5 — Project Setup**
* **Phase 6 — Authentication**
* **Phase 7 — Master Data**
* **Phase 8 — Inventory**
* **Phase 9 — Purchasing**
* **Phase 10 — Warehouse**
* **Phase 11 — Sales**
* **Phase 12 — Shipping & Logistics**

### Release

* **Phase 13 — Reporting**
* **Phase 14 — Security Hardening**
* **Phase 15 — Testing**
* **Phase 16 — Desktop Packaging**
* **Phase 17 — Deployment**
* **Phase 18 — Client UAT**
* **Phase 19 — Production**

### Productization

* **Phase 20 — Productization**
* **Phase 21 — Additional Clients**

Detailed documentation will live in the `/docs` directory.

---

# Current Status

## Phase 0 — Foundation

The current stage is focused on establishing the foundation before implementation begins.

### Completed

* [x] Product concept defined
* [x] Desktop application requirement established
* [x] Initial technology stack selected
* [x] High-level architecture defined
* [x] Modular monolith selected
* [x] ERP/WMS terminology established
* [x] Inventory ledger philosophy established
* [x] Initial module catalog defined
* [x] Security foundation defined
* [x] Deployment models evaluated
* [x] Productization strategy defined
* [x] Initial development roadmap established

### Next

* [ ] Client Discovery
* [ ] Requirements gathering
* [ ] Business process mapping
* [ ] Technical architecture
* [ ] Project initialization
* [ ] Begin implementation

---

# Repository Structure

The intended repository structure will evolve as development progresses.

```text
nextware/
│
├── README.md
│
├── docs/
│   ├── phase-0-foundation/
│   ├── phase-1-discovery/
│   ├── phase-2-requirements/
│   ├── phase-3-process-mapping/
│   └── phase-4-architecture/
│
├── backend/
│
├── desktop/
│
├── infrastructure/
│
└── .github/
    └── workflows/
```

The exact structure will be finalized during the Project Setup and Architecture phases.

---

# Project Status Legend

| Symbol | Meaning      |
| ------ | ------------ |
| 🟢     | Completed    |
| 🟡     | In Progress  |
| 🔵     | Ready / Next |
| ⚪      | Planned      |
| 🔴     | Blocked      |

---

# Important Principles

> **Build the smallest useful system first.**

Nextware is intentionally not attempting to build every ERP feature at once.

The project will follow:

```text
Real Client
     ↓
Discovery
     ↓
Requirements
     ↓
Validated Workflows
     ↓
Architecture
     ↓
MVP
     ↓
Testing
     ↓
Client UAT
     ↓
Production
     ↓
Productization
```

The goal is not simply to produce a large amount of code.

The goal is to build **reliable business software that a real company can trust with its daily operations.**

---

# Documentation

For the complete foundation and architectural reasoning, see:

**Phase 0 — Master Foundation & Blueprint**

This README provides the high-level overview. Detailed technical, business, architectural, and implementation decisions will be documented separately as the project progresses.

---

# License

License and commercial distribution terms will be determined as the product approaches its first production release.

---

## Project

**Project Name:** Nextware
**Product Type:** ERP / WMS Platform
**Architecture:** Desktop Client + REST API + PostgreSQL
**Desktop:** Tauri + React + TypeScript
**Backend:** Spring Boot + Java 17
**Database:** PostgreSQL
**Status:** Foundation Phase
