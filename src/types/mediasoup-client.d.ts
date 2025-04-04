declare module 'mediasoup-client' {
  export interface TransportOptions {
    id: string;
    iceParameters: any;
    iceCandidates: any;
    dtlsParameters: any;
  }

  export interface ProducerOptions {
    track: MediaStreamTrack;
  }

  export interface ConsumerOptions {
    producerId: string;
    rtpCapabilities: any;
  }

  export class Device {
    rtpCapabilities: any;
    load(params: { routerRtpCapabilities: any }): Promise<void>;
    createSendTransport(params: any): Transport;
    createRecvTransport(params: any): Transport;
  }

  export class Transport {
    id: string;
    closed: boolean;
    on(event: string, callback: (...args: any[]) => void): void;
    connect(params: { dtlsParameters: any }): Promise<void>;
    produce(params: { track: MediaStreamTrack }): Promise<Producer>;
    consume(params: { producerId: string; rtpCapabilities: any }): Promise<Consumer>;
    close(): void;
  }

  export class Producer {
    id: string;
    closed: boolean;
    track: MediaStreamTrack;
    close(): void;
    on(event: string, callback: (...args: any[]) => void): void;
  }

  export class Consumer {
    id: string;
    closed: boolean;
    audioTrack: MediaStreamTrack | null;
    close(): void;
    on(event: string, callback: (...args: any[]) => void): void;
  }
} 