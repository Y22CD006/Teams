# Teams-Like Collaboration Platform

A high-scale, real-time collaboration application — a complete clone of Microsoft Teams. This document serves as the single source of truth for the engineering roadmap, MVP requirements, architecture stack, and long-term vision.

---

## Project Overview & Strategy

The development strategy is split into two distinct execution phases:

1. **The 20-Day Velocity Sprint (MVP):** Leveraging managed, highly efficient cloud infrastructure to instantly ship a fully functioning application containing core workspace, chat, scheduling, and meeting features.
2. **The Production Scale-Out (Target Vision):** Transitioning heavy-traffic services to custom, self-hosted, bare-metal architectures capable of handling 1,000+ concurrent active video/audio users at minimal operational cost.

---

## Phase 1: Current MVP Scope (The 20-Day Build)

The immediate goal is a robust, modular, and fully integrated application layer focusing on the absolute essentials required for team collaboration.

### Core Feature Requirements

- **Workspaces & Standard Channels:** Top-level multi-tenant boundaries (Teams) containing flat, real-time text streams (Channels) to organize different operational departments or projects.
- **Direct Messaging (DMs) & Group Chats:** Private 1-on-1 messaging pipelines between users, alongside ad-hoc multi-user group chats that exist independently of rigid workspaces.
- **Calendar & Meeting Scheduling:** A clean, synchronized interface allowing users to create corporate events, set date/time constraints, assign attendees, and link dedicated meeting spaces.
- **Task & Kanban Management:** A built-in task board system allowing users to create, assign, update, and monitor project issues across specific states (`TODO`, `IN_PROGRESS`, `DONE`).
- **"Meet Now" Instant Video Rooms:** An on-demand video/audio conferencing bridge accessible directly inside any chat window or calendar invite, initializing communication instantly.

### The 20-Day Tech Stack

To meet the hard deadline, the architecture eliminates DevOps management overhead by utilizing zero-configuration backend tools:

| Layer | Technology Choice | Operational Role |
| --- | --- | --- |
| **Frontend Framework** | Next.js (App Router) | Handles application routing, Server Actions, and rendering highly responsive React UI layers. |
| **Styling & Components** | Tailwind CSS + `shadcn/ui` | Provides pre-built, robust UI layouts (Calendars, Modals, Lists) to bypass custom styling bottlenecks. |
| **Primary Database** | PostgreSQL (Hosted on Railway) | Serves as the relational storage engine for profiles, workspaces, messages, tasks, and events. |
| **Data Access Layer** | Prisma ORM | Manages database schemas, migrations, and strongly-typed queries across Next.js Server Actions. |
| **Identity & Auth** | Clerk | Outsources complete session management, user security, registration, and profile metadata. |
| **Real-Time Text Messaging** | Pusher (or Supabase Realtime) | Handles instant WebSocket event broadcasting for chat messages and presence tracking. |
| **Managed Video Engine** | LiveKit Cloud | Offloads complex SFU connection management, TURN firewall traversal, and video routing in the cloud. |

---

## Phase 2: Final Scale App (The Long-Term Vision)

Once the application mechanics are proven in Phase 1, the infrastructure transitions into a highly controlled enterprise ecosystem designed to absorb heavy system stress at mass scale.

### Target Operational Scale

- **Capacity:** 1,000+ concurrent active users.
- **Streaming Limits:** Handling heavy real-time multimedia rooms without relying on expensive, consumption-based third-party video APIs.

### The Self-Hosted Infrastructure Transition

To achieve extreme scale sustainably, the architecture migrates out of third-party cloud engines to self-hosted clusters:

```text
                           [ Next.js Frontend ]
                                    │
                    ┌───────────────┴───────────────┐
                    ▼                               ▼
       [ Orchestration Backend ]          [ Custom TURN Relay ]
         Node.js / Go API Server               (Coturn Server)
                    │                               │
        ┌───────────┴───────────┐                   │
        ▼                       ▼                   ▼
  [ PostgreSQL ]            [ Redis ] ──► [ Self-Hosted LiveKit SFU ]
Persistent Data          Presence Cache          (Go Media Engine)
                                                    │
                                                    ▼
                                          [ Headless Recorder Pool ]
                                           (Puppeteer + FFmpeg Node)
                                                    │
                                                    ▼
                                          [ S3 Storage Cluster ]
```

- **Self-Hosted SFU Layer:** Replacing LiveKit Cloud with an open-source LiveKit Server instance deployed directly on high-bandwidth bare-metal providers (e.g., Hetzner, OVH). This eliminates data transfer markups by running video streams across flat-rate unmetered networks.
- **High-Volume NAT Traversal:** Deploying dedicated **Coturn** instances to operate as self-hosted STUN/TURN nodes, guaranteeing connection stability for users sitting behind strict enterprise firewalls.
- **Automated Headless Recording Engine:** Launching a dedicated microservice pool utilizing headless Chromium processes (**Puppeteer/Playwright**) to dynamically join meetings, capture canvas elements, and compress recordings into single MP4 files via **FFmpeg** pipelines.
- **High-Performance State Engine:** Offloading chat routing and short-term user presence tracking (Active, Away, Offline heartbeats) to high-speed **Redis** clusters to insulate the main Postgres database from connection exhaustion.

### Advanced Enterprise Features

- **Threaded Conversations:** Introducing structured message replies to contain complex discussions to isolated side-panels, preserving primary channel legibility.
- **Read Receipts:** Scalable tracking systems capturing read markers per user per channel using high-throughput background queues.
- **Collaborative Document Editing:** Implementing Operational Transformation (OT) or CRDT-based engines to facilitate synchronized document and canvas collaboration directly within application views.
- **Global Full-Text Search:** Integrating **Elasticsearch** clusters to dynamically index and recall millions of messages, tasks, and files across all corporate workspaces instantly.

---

## Complete Feature Set

### 1. Teams & Channels (The Hierarchy)

How work is organized.

- **Workspaces (Teams):** The top-level grouping (e.g., "Engineering Dept" or "Project Alpha").
- **Standard Channels:** Open rooms within a Team (e.g., #general, #deployments).
- **Private Channels:** Hidden channels within a Team that only specific members can see and join.
- **Threaded Conversations:** Replying to specific messages to create isolated threads within a channel, keeping the main feed clean.

### 2. Chat & Messaging (Direct Communication)

- **1-on-1 DMs:** Private messages between two users.
- **Group Chats:** Ad-hoc private chats with 3+ people without needing to create a whole "Team" for it.
- **Rich Text & Media:** Formatting text, tagging people (@mentions), sharing GIFs, emojis, and file attachments.
- **Read Receipts:** The little eye icon showing who has seen your message.

### 3. Meetings & Calling (The WebRTC Layer)

- **Scheduled Meetings:** Video rooms tied to a specific calendar event.
- **"Meet Now":** Instant, ad-hoc voice/video calls launched directly from a chat or channel.
- **In-Call Features:** Screen sharing, background blur/replacement, raising hands, meeting chat, and live closed captions.
- **Recording:** Saving the meeting video.

### 4. Calendar & Scheduling

- **Personal Calendar:** A view of the user's upcoming day/week.
- **Scheduling Assistant:** A view that checks the free/busy status of attendees to find a time that works for everyone.

### 5. Presence & Identity

- **Live Status:** Green (Available), Red (Busy/In a Call), Yellow (Away), and Offline.
- **Custom Status Messages:** e.g., "Out for lunch until 1 PM."
- **User Profiles:** Clicking a user shows their timezone, contact info, and their place in the company organization chart.

### 6. Files & Collaboration

- **File Storage:** Every channel has a "Files" tab.
- **Collaborative Editing:** Opening a document or spreadsheet directly inside the app and editing it simultaneously with others.
- **Whiteboard:** A shared digital canvas for drawing during meetings.

### 7. Search & Extensibility

- **Global Search:** A massive search bar at the top to find specific messages, files, or people across the entire workspace.
