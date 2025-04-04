import { Room } from '@/components/room';

interface RoomPageProps {
  params: {
    id: string;
  };
}

export default function RoomPage({ params }: RoomPageProps) {
  return <Room roomId={params.id} />;
}
