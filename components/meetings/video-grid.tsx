"use client";

import { Participant } from "livekit-client";
import { VideoTile } from "./video-tile";

interface VideoGridProps {
  participants: Participant[];
  localParticipant: Participant | null;
  activeSpeakers: Participant[];
  isScreenSharing: boolean;
  className?: string;
}

export function VideoGrid({
  participants,
  localParticipant,
  activeSpeakers,
  isScreenSharing,
  className = "",
}: VideoGridProps) {
  const allParticipants = [
    ...(localParticipant
      ? [
          {
            participant: localParticipant,
            isLocal: true,
          },
        ]
      : []),
    ...participants.map((p) => ({ participant: p, isLocal: false })),
  ];

  const isSpeakingMap = new Map<string, boolean>();
  for (const sp of activeSpeakers) {
    if (sp.identity) {
      isSpeakingMap.set(sp.identity, true);
    }
  }

  const count = allParticipants.length;
  let gridCols = "grid-cols-1";
  if (count === 2) gridCols = "grid-cols-1 sm:grid-cols-2";
  else if (count <= 4) gridCols = "grid-cols-1 sm:grid-cols-2";
  else if (count <= 6) gridCols = "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";
  else gridCols = "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";

  if (isScreenSharing && allParticipants.length > 1) {
    const sharerIndex = allParticipants.findIndex((p) =>
      Array.from(p.participant.videoTrackPublications.values()).some(
        (pub) => pub.track?.kind === "video"
      )
    );

    return (
      <div className={`w-full h-full flex flex-col md:flex-row gap-4 ${className}`}>
        <div className="flex-1 min-h-0">
          {sharerIndex >= 0 ? (
            <VideoTile
              participant={allParticipants[sharerIndex].participant}
              isSpeaking={isSpeakingMap.has(allParticipants[sharerIndex].participant.identity)}
              isLocal={allParticipants[sharerIndex].isLocal}
              className="w-full h-full"
            />
          ) : (
            <div className="w-full h-full rounded-2xl border border-indigo-500 bg-[var(--bg-secondary)] flex items-center justify-center text-sm text-indigo-400 font-semibold">
              Screen Share
            </div>
          )}
        </div>
        <div className="w-full md:w-56 flex flex-row md:flex-col gap-3 overflow-x-auto md:overflow-y-auto max-h-[140px] md:max-h-none flex-shrink-0">
          {allParticipants.map(({ participant, isLocal }, idx) => (
            <div key={participant.identity || idx} className="w-40 md:w-full h-24 flex-shrink-0">
              <VideoTile
                participant={participant}
                isSpeaking={isSpeakingMap.has(participant.identity)}
                isLocal={isLocal}
                className="w-full h-full"
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`w-full h-full max-w-5xl grid gap-4 ${gridCols} ${className}`}
    >
      {allParticipants.map(({ participant, isLocal }, idx) => (
        <VideoTile
          key={participant.identity || idx}
          participant={participant}
          isSpeaking={isSpeakingMap.has(participant.identity)}
          isLocal={isLocal}
        />
      ))}
    </div>
  );
}
