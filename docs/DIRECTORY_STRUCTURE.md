# Directory Structure

```
teams/
│
├── app/                              # Next.js App Router — routing + UI only
│   ├── (auth)/                       #   Auth pages (login, signup)
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── signup/
│   │       └── page.tsx
│   ├── (dashboard)/                  #   Authenticated app shell (layout)
│   │   ├── teams/
│   │   │   └── [teamId]/
│   │   │       ├── channels/
│   │   │       │   └── [channelId]/
│   │   │       │       └── page.tsx
│   │   │       ├── calendar/
│   │   │       │   └── page.tsx
│   │   │       ├── tasks/
│   │   │       │   └── page.tsx
│   │   │       └── files/
│   │   │           └── page.tsx
│   │   ├── dms/
│   │   │   └── [dmId]/
│   │   │       └── page.tsx
│   │   ├── meetings/
│   │   │   └── [meetingId]/
│   │   │       └── page.tsx
│   │   ├── profile/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   ├── api/                          #   Route Handlers (thin HTTP wrappers → services)
│   │   ├── livekit/
│   │   │   └── route.ts              #     POST  /api/livekit/token
│   │   ├── pusher/
│   │   │   └── route.ts              #     POST  /api/pusher/auth
│   │   ├── upload/
│   │   │   └── route.ts              #     POST  /api/upload
│   │   └── webhooks/
│   │       ├── clerk/
│   │       │   └── route.ts          #     POST  /api/webhooks/clerk
│   │       └── livekit/
│   │           └── route.ts          #     POST  /api/webhooks/livekit
│   ├── layout.tsx
│   ├── page.tsx                     #   Landing / redirect
│   └── globals.css
│
├── components/                       # React UI Components (thin, no business logic)
│   ├── ui/                           #   shadcn/ui primitives (button, dialog, etc.)
│   ├── layout/                       #   Sidebar, TeamSwitcher, MainPanel, DetailPanel
│   ├── messages/                     #   MessageInput, MessageBubble, ThreadPanel
│   ├── meetings/                     #   VideoGrid, CallControls, MeetingChat
│   ├── calendar/                     #   CalendarView, EventCard, EventForm
│   ├── tasks/                        #   KanbanBoard, TaskCard, TaskForm
│   └── shared/                       #   UserAvatar, SearchBar, EmojiPicker
│
├── lib/                              # BACKEND — all business logic lives here
│   ├── services/                     #   Service layer (fat, testable, framework-agnostic)
│   │   ├── team-service.ts           #     Team CRUD, membership
│   │   ├── channel-service.ts        #     Channel CRUD, membership
│   │   ├── message-service.ts        #     Messages, threads, read receipts
│   │   ├── meeting-service.ts        #     LiveKit tokens, room management
│   │   ├── calendar-service.ts       #     Events, scheduling assistant
│   │   └── task-service.ts           #     Tasks, state transitions
│   ├── actions/                      #   Next.js Server Actions (thin wrappers → services)
│   │   ├── team-actions.ts
│   │   ├── channel-actions.ts
│   │   ├── message-actions.ts
│   │   ├── meeting-actions.ts
│   │   ├── calendar-actions.ts
│   │   └── task-actions.ts
│   ├── api/                          #   External API helpers
│   │   ├── livekit.ts                #     LiveKit token generation
│   │   ├── pusher.ts                 #     Pusher publish/subscribe
│   │   └── clerk.ts                  #     Clerk webhook verification
│   ├── prisma.ts                     #   Prisma client singleton
│   ├── pusher.ts                     #   Pusher server/client helpers
│   ├── clerk.ts                      #   Clerk webhook helpers
│   └── utils.ts                      #   General utility functions
│
├── prisma/                           # Database
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
│
├── public/                           # Static assets
│   ├── images/
│   └── icons/
│
├── docs/                             # Documentation
│   ├── ARCHITECTURE.md
│   ├── ROADMAP.md
│   ├── COMPONENTS.md
│   └── DIRECTORY_STRUCTURE.md
│
├── .env.example
├── .gitignore
├── next.config.ts
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```
