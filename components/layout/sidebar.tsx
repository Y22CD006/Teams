import { TeamSwitcher } from "./team-switcher";
import { ChannelList } from "./channel-list";

export function Sidebar() {
  return (
    <aside className="flex w-60 flex-col border-r bg-muted/30">
      <TeamSwitcher />
      <ChannelList />
    </aside>
  );
}
