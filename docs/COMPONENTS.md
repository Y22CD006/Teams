# UI Components

Built with **shadcn/ui** + Tailwind CSS. All components reside in `components/` and follow the shadcn pattern.

---

## Layout Components

| Component | Description |
|-----------|-------------|
| `Sidebar` | Team list, channel list, DM list, user avatar |
| `TeamSwitcher` | Dropdown to switch between workspaces |
| `ChannelList` | Tree of channels within a team |
| `MainPanel` | Primary content area (messages, calendar, tasks) |
| `DetailPanel` | Side panel for threads, profiles, file previews |

## Messaging Components

| Component | Description |
|-----------|-------------|
| `MessageInput` | Rich text editor with @mention, emoji, file upload |
| `MessageBubble` | Individual message display with actions |
| `ThreadPanel` | Side panel showing thread replies |
| `DMChatWindow` | DM or group chat view |
| `TypingIndicator` | Shows who is currently typing |

## Meeting Components

| Component | Description |
|-----------|-------------|
| `VideoGrid` | Grid of participant video tiles |
| `CallControls` | Mute, camera toggle, screen share, hang up |
| `MeetingChat` | In-call chat sidebar |
| `RaiseHand` | Hand raise indicator |
| `ScreenShareView` | Full-screen or pinned screen share |

## Calendar Components

| Component | Description |
|-----------|-------------|
| `CalendarView` | Day/week/month calendar grid |
| `EventCard` | Single event display |
| `EventForm` | Create/edit event dialog |
| `SchedulingAssistant` | Free/busy grid for attendees |

## Task Components

| Component | Description |
|-----------|-------------|
| `KanbanBoard` | Three-column board (TODO / IN_PROGRESS / DONE) |
| `TaskCard` | Single task with assignee, priority, due date |
| `TaskForm` | Create/edit task dialog |

## Shared / Reusable

| Component | Description |
|-----------|-------------|
| `UserAvatar` | Profile picture with status dot |
| `UserTooltip` | Hover card with user details |
| `SearchBar` | Global search input |
| `FileUpload` | Drag-and-drop file uploader |
| `EmojiPicker` | Emoji selector popover |
| `MentionList` | @mention autocomplete dropdown |
