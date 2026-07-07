export function VideoRoom({ roomName }: { roomName: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center bg-black">
      <p className="mb-4 text-lg text-white">Room: {roomName}</p>
      <p className="text-sm text-gray-400">LiveKit video room will render here.</p>
    </div>
  );
}
