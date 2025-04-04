declare module 'mediasoup' {
  export type DtlsState = 'new' | 'connecting' | 'connected' | 'failed' | 'closed';

  export class Worker {
    static create(options: {
      logLevel?: 'debug' | 'warn' | 'error' | 'none';
      logTags?: string[];
      rtcMinPort?: number;
      rtcMaxPort?: number;
    }): Promise<Worker>;
    createRouter(options: { mediaCodecs: any[] }): Promise<Router>;
    close(): void;
  }

  export class Router {
    rtpCapabilities: any;
    createWebRtcTransport(options: {
      listenIps: Array<{ ip: string; announcedIp: string | null }>;
      enableUdp: boolean;
      enableTcp: boolean;
      preferUdp: boolean;
    }): Promise<WebRtcTransport>;
  }

  export class WebRtcTransport {
    id: string;
    iceParameters: any;
    iceCandidates: any;
    dtlsParameters: any;
    on(event: 'dtlsstatechange', callback: (dtlsState: DtlsState) => void): void;
    connect(options: { dtlsParameters: any }): Promise<void>;
    produce(options: { kind: string; rtpParameters: any }): Promise<Producer>;
    consume(options: { producerId: string; rtpCapabilities: any }): Promise<Consumer>;
  }

  export class Producer {
    id: string;
    kind: string;
    on(event: 'transportclose', callback: () => void): void;
    close(): void;
  }

  export class Consumer {
    id: string;
    kind: string;
    rtpParameters: any;
    on(event: 'transportclose', callback: () => void): void;
    close(): void;
  }
} 