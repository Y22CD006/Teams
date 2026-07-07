# Roadmap

## Phase 1: MVP — 20-Day Sprint

### Week 1: Foundation & Auth

| Day | Focus | Deliverables |
|-----|-------|-------------|
| 1–2 | Project scaffold | Next.js + Tailwind + shadcn/ui + Prisma setup |
| 3–4 | Auth & user profiles | Clerk integration, user onboarding, profile pages |
| 5 | Workspaces | Team CRUD, team switcher UI |
| 6–7 | Channels | Channel CRUD, channel list, channel membership |

### Week 2: Messaging & Real-Time

| Day | Focus | Deliverables |
|-----|-------|-------------|
| 8–9 | Messaging core | Message send/edit/delete, rich text, file uploads |
| 10 | Real-time | Pusher integration, live message updates |
| 11 | DMs & group chats | DM creation, group chat UI, message scoping |
| 12–13 | Threaded replies | Thread panel, reply chains, thread indicators |
| 14 | Presence | Online/away/offline status, typing indicators |

### Week 3: Meetings, Calendar & Tasks

| Day | Focus | Deliverables |
|-----|-------|-------------|
| 15 | Video calls | LiveKit Cloud integration, Meet Now, join/leave |
| 16 | In-call features | Screen share, mute, camera toggle |
| 17 | Calendar | Calendar view, event creation, event listing |
| 18 | Scheduling | Attendee picker, scheduling assistant |
| 19 | Task board | Kanban view, task CRUD, state transitions |
| 20 | Polish & integration | Cross-feature testing, bug fixes, UI polish |

---

## Phase 2: Scale-Out (Post-MVP)

### Milestone 1: Infrastructure Migration

- Provision bare-metal servers (Hetzner/OVH)
- Deploy self-hosted LiveKit SFU
- Deploy Coturn TURN server
- Set up Redis cluster for presence/caching
- Migrate off Pusher to self-hosted WebSocket

### Milestone 2: Advanced Features

- Threaded conversations (enhanced)
- Read receipts with background queues
- Global search with Elasticsearch
- File storage on S3-compatible cluster

### Milestone 3: Collaboration & Recording

- Collaborative document editing (OT/CRDT)
- Whiteboard canvas
- Headless recording engine (Puppeteer + FFmpeg)
- Meeting recording playback

---

## Future Considerations

- Mobile apps (React Native)
- Enterprise SSO / SAML
- Compliance exports (GDPR)
- Federation between self-hosted instances
- AI-powered meeting summaries & transcription
