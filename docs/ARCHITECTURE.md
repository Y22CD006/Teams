# Architecture

## Phase 1 (MVP) Cloud Architecture

```
[ Client Browser ]
       │
       ├── Next.js (App Router) ──── Server Actions ──── Prisma ──── PostgreSQL (Railway)
       │                                                    │
       ├── Clerk (Auth) ────────────────────────────────────┘
       │
       ├── Pusher (WebSocket) ──── Real-time messaging, presence
       │
       └── LiveKit Cloud ──── WebRTC SFU, video/audio routing
```

### Data Flow

1. **User requests** flow through Next.js Server Actions or API routes.
2. **Auth** is handled by Clerk middleware wrapping all protected routes.
3. **Database queries** go through Prisma ORM to PostgreSQL.
4. **Real-time events** are published via Pusher channels on data mutations.
5. **Video calls** connect clients directly to LiveKit Cloud SFU.

---

## Phase 2 (Production) Architecture

```
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

### Key Differences from Phase 1

| Component | Phase 1 | Phase 2 |
|-----------|---------|---------|
| Video SFU | LiveKit Cloud | Self-hosted LiveKit on bare-metal |
| TURN/STUN | LiveKit managed | Dedicated Coturn instances |
| Recording | None | Puppeteer + FFmpeg pipeline |
| Presence | PostgreSQL | Redis cluster |
| Search | Basic DB queries | Elasticsearch |
| File Storage | Local/Cloud | S3-compatible cluster |

---

## Database Schema (Prisma)

### Core Models

- **User** — Profiles, auth metadata, status
- **Team** — Top-level workspace
- **TeamMember** — Membership and roles within a team
- **Channel** — Public or private room within a team
- **ChannelMember** — Channel-level membership for private channels
- **Message** — Text messages, attachments, thread parents
- **ThreadReply** — Replies within a threaded conversation
- **DirectMessage** — DM or group chat session
- **DMMember** — Participants in a DM/group chat
- **Event** — Calendar event with attendees
- **Task** — Kanban task with assignees and state
- **ReadReceipt** — Per-user per-message read tracking

---

## API Layer

### Server Actions (Mutation)

```
- createTeam, updateTeam, deleteTeam
- createChannel, updateChannel, deleteChannel
- sendMessage, editMessage, deleteMessage
- replyToThread
- createEvent, updateEvent, deleteEvent
- createTask, updateTaskState, assignTask
- startMeeting, joinMeeting
```

### API Routes (Read / External)

```
GET  /api/teams
GET  /api/teams/:id/channels
GET  /api/messages?channelId=
GET  /api/messages?dmId=
GET  /api/events?userId=
GET  /api/tasks?teamId=
POST /api/livekit/token
POST /api/pusher/auth
```
