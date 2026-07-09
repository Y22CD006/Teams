# Video Call Implementation — Task Tracker

## Infrastructure

- [x] Create `docker-compose.yml` (LiveKit Server + Redis)
- [x] Create `livekit.yaml` config (dev API key/secret, Redis connection)
- [x] Add LiveKit env vars to `.env`:
      - `NEXT_PUBLIC_LIVEKIT_URL=ws://localhost:7880`
      - `LIVEKIT_API_KEY=devkey`
      - `LIVEKIT_API_SECRET=devsecret`
- [ ] Verify LiveKit starts: `docker compose up`
- [ ] Verify token generation: `curl -X POST http://localhost:3000/api/livekit`

## Core Hook

- [x] Create `hooks/use-livekit.ts`:
      - [x] `connect(roomName, token)` — joins a LiveKit room
      - [x] `disconnect()` — leaves the room
      - [x] Expose `participants` (real-time `Map<string, RemoteParticipant>`)
      - [x] Expose `activeSpeakers` (from `RoomEvent.ActiveSpeakersChanged`)
      - [x] Expose `localTracks.isMicEnabled / isCameraEnabled`
      - [x] Expose `toggleMic()` — mute/unmute local audio
      - [x] Expose `toggleCamera()` — enable/disable local video
      - [x] Expose `toggleScreenShare()` — start/stop screen capture
      - [x] Expose `isConnected` — room connection state
      - [x] Cleanup on unmount (disconnect + stop tracks)

## New Components

- [x] Create `components/meetings/video-tile.tsx`:
      - [x] Render `VideoTrack` when participant has video
      - [x] Fallback initials avatar when camera is off
      - [x] Speaking indicator (border glow — reuse existing style)
      - [x] Mic-off indicator overlay
      - [x] Name label at bottom
      - [ ] Raise hand indicator
- [x] Rewrite `components/meetings/video-grid.tsx`:
      - [x] Dynamic grid layout by participant count (1×1, 2×1, 2×2, 3×3, etc.)
      - [x] Screen share overrides layout (full screen + side strip)
      - [x] Render `VideoTile` for each participant

- [x] Rewrite `components/meetings/call-controls.tsx`:
      - [x] Mic toggle → `toggleMic()`
      - [x] Camera toggle → `toggleCamera()`
      - [x] Screen share → `toggleScreenShare()`
      - [x] Leave → `disconnect()` + parent `onLeave()`
      - [x] Raise hand → local toggle (custom feature)

## MeetingView Refactor

- [x] Refactor `components/meetings/meeting-view.tsx`:
      - [x] Use `useLiveKit()` instead of mock state
      - [x] Replace hardcoded `participants` array with hook data
      - [x] Replace random `activeSpeaker` interval with `RoomEvent.ActiveSpeakersChanged`
      - [x] Wire camera/mic toggles to real track states
      - [x] Screen share mode renders real remote screen share track
      - [x] Keep existing UI shell: REC timer, layout toggles, raised hand banner, control rail
      - [x] Handle loading state (connecting to room)
      - [x] Handle error state (connection failed)
      - [x] Handle disconnect/room ended state

## Dashboard Integration

- [x] Update Redux `uiSlice`:
      - [x] Add `roomName`, `token`, `serverUrl` to `activeMeeting` state shape
- [x] Update `handleStartCall()` — POST `/api/livekit`, store token/room/url in Redux
- [x] Update `handleJoinMeeting()` — if meeting has room name, fetch fresh token, join
- [x] Update `handleDialCall()` — same flow as `handleStartCall`
- [x] Update `handleLeaveCall()` — dispatch `setActiveMeeting(null)`
- [x] Pass room/token/url to `MeetingView` component

## Wire Call Buttons

- [x] `chat-view.tsx` Video call button → `onStartCall(true)` → `handleStartCall(true)`
- [x] `chat-view.tsx` Audio call button → `onStartCall(false)` → `handleStartCall(false)`
- [x] `dashboard.tsx` `onJoinMeeting` → wired to `handleJoinMeeting`
- [x] `dashboard.tsx` `onDialCall` → wired to `handleDialCall`

## Polish & Edge Cases

- [ ] Handle page navigation while in a call (warn before leaving)
- [ ] Handle participant join/leave events (toast notification?)
- [ ] Handle connection loss / reconnection
- [ ] Disable call buttons when already in a call
- [ ] Responsive layout for the meeting view on mobile

## Testing

- [ ] Open two browser tabs as different users
- [ ] Start a call from chat → both users see each other's video
- [ ] Toggle mic/camera → reflected in real time
- [ ] Screen share → other user sees the shared screen
- [ ] Raise hand → indicator shows for other participants
- [ ] Leave call → both users return to dashboard
- [ ] Join a calendar meeting → enters the correct room
- [ ] Speed dial call from Calls tab → connects correctly

## Post-MVP (Not in First Pass)

- [ ] In-call chat (`meeting-chat.tsx`)
- [ ] LiveKit webhook processing (`/api/webhooks/livekit`)
- [ ] Dedicated `/meetings/[meetingId]` page route
- [ ] Meeting recording
- [ ] Self-hosted LiveKit on VPS (migration from Docker)
- [ ] Coturn TURN server for NAT traversal
