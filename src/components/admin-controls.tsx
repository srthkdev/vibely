import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  MicOff, 
  VideoOff, 
  UserX, 
  ChevronDown, 
  ChevronUp,
  Shield 
} from 'lucide-react';

interface Participant {
  id: string;
  name: string;
  isMuted?: boolean;
  isVideoOff?: boolean;
  isAdmin?: boolean;
}
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface AdminControlsProps {
  participants: Participant[];
  isAdmin: boolean;
  onMuteParticipant: (participantId: string) => void;
  onDisableVideo: (participantId: string) => void;
  onKickParticipant: (participantId: string) => void;
}

export const AdminControls = ({
  participants,
  isAdmin,
  onMuteParticipant,
  onDisableVideo,
  onKickParticipant
}: AdminControlsProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!isAdmin) return null;

  return (
    <div className="bg-slate-900 p-4 rounded-lg shadow-lg mb-4">
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Admin Controls</h3>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-5 w-5" />
        ) : (
          <ChevronDown className="h-5 w-5" />
        )}
      </div>

      {isExpanded && (
        <div className="mt-4 space-y-2">
          <h4 className="text-sm font-medium text-slate-400">Participants</h4>
          {participants.length === 0 ? (
            <p className="text-sm text-slate-500">No participants in the room</p>
          ) : (
            <ul className="space-y-2">
              {participants.map((participant) => (
                <li 
                  key={participant.id} 
                  className="flex items-center justify-between bg-slate-800 p-2 rounded-md"
                >
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                      {participant.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-medium">{participant.name}</span>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        Actions
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onMuteParticipant(participant.id)}>
                        <MicOff className="h-4 w-4 mr-2" />
                        Mute
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onDisableVideo(participant.id)}>
                        <VideoOff className="h-4 w-4 mr-2" />
                        Disable Video
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => onKickParticipant(participant.id)}
                        className="text-destructive"
                      >
                        <UserX className="h-4 w-4 mr-2" />
                        Kick
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};
