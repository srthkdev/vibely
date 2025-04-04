import * as React from "react";
import { MicOff, VideoOff, UserX } from "lucide-react";

interface VideoContextMenuProps {
  children: React.ReactNode;
  participantId: string;
  isAdmin: boolean;
  onMute: (participantId: string) => void;
  onDisableVideo: (participantId: string) => void;
  onKick: (participantId: string) => void;
}

export function VideoContextMenu({
  children,
  participantId,
  isAdmin,
  onMute,
  onDisableVideo,
  onKick,
}: VideoContextMenuProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [position, setPosition] = React.useState({ x: 0, y: 0 });
  const menuRef = React.useRef<HTMLDivElement>(null);

  // Handle right-click to open context menu
  const handleContextMenu = (e: React.MouseEvent) => {
    if (!isAdmin) return;
    
    e.preventDefault();
    setIsOpen(true);
    setPosition({ x: e.clientX, y: e.clientY });
  };

  // Close menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  if (!isAdmin) {
    return <>{children}</>;
  }

  return (
    <div className="relative" onContextMenu={handleContextMenu}>
      {children}
      
      {isOpen && (
        <div 
          ref={menuRef}
          className="fixed z-50 min-w-[180px] bg-white dark:bg-[#212121] border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-md overflow-hidden"
          style={{ 
            left: `${position.x}px`, 
            top: `${position.y}px`,
          }}
        >
          <div 
            className="flex items-center gap-2 cursor-pointer p-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            onClick={() => {
              onMute(participantId);
              setIsOpen(false);
            }}
          >
            <MicOff className="h-4 w-4" />
            <span>Mute Participant</span>
          </div>
          <div 
            className="flex items-center gap-2 cursor-pointer p-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            onClick={() => {
              onDisableVideo(participantId);
              setIsOpen(false);
            }}
          >
            <VideoOff className="h-4 w-4" />
            <span>Disable Video</span>
          </div>
          <div 
            className="flex items-center gap-2 cursor-pointer p-2 hover:bg-gray-100 dark:hover:bg-gray-800 text-red-500 transition-colors"
            onClick={() => {
              onKick(participantId);
              setIsOpen(false);
            }}
          >
            <UserX className="h-4 w-4" />
            <span>Kick Participant</span>
          </div>
        </div>
      )}
    </div>
  );
}
