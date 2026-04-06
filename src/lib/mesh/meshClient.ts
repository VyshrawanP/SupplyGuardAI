import type { MeshAlert, MeshWireMessage } from './types';
import { isMeshWireMessage } from './types';

type MeshClientOptions = {
  signalingUrl: string; // ws(s)://.../mesh
  peerName?: string;
  maxRelayRttMs?: number; // rough proximity filter; undefined disables
};

type PeerState = {
  id: string;
  pc: RTCPeerConnection;
  dc: RTCDataChannel | null;
  lastSeenAt: number;
  rttMs: number | null;
};

type MeshClientEvents = {
  onPeerCount?: (count: number) => void;
  onAlert?: (alert: MeshAlert, meta: { fromPeerId: string }) => void;
  onDebug?: (message: string, extra?: unknown) => void;
};

type SignalMessage =
  | { type: 'welcome'; id: string; peers: string[] }
  | { type: 'peer-join'; id: string }
  | { type: 'peer-leave'; id: string }
  | { type: 'signal'; from: string; to: string; payload: unknown };

const safeJsonParse = (raw: string): unknown => {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export class MeshClient {
  private readonly options: MeshClientOptions;
  private readonly events: MeshClientEvents;
  private ws: WebSocket | null = null;
  private selfId: string | null = null;
  private peers = new Map<string, PeerState>();
  private pingTimer: number | null = null;

  constructor(options: MeshClientOptions, events: MeshClientEvents = {}) {
    this.options = options;
    this.events = events;
  }

  get id() {
    return this.selfId;
  }

  getPeerSnapshot() {
    return Array.from(this.peers.values()).map((peer) => ({
      id: peer.id,
      lastSeenAt: peer.lastSeenAt,
      rttMs: peer.rttMs,
      connected: peer.pc.connectionState,
      channel: peer.dc?.readyState ?? 'none',
    }));
  }

  async connect() {
    if (this.ws) return;

    const ws = new WebSocket(this.options.signalingUrl);
    this.ws = ws;

    ws.onopen = () => {
      this.events.onDebug?.('mesh_ws_open');
    };

    ws.onclose = () => {
      this.events.onDebug?.('mesh_ws_close');
      this.ws = null;
      this.stopPings();
      for (const peer of this.peers.values()) {
        peer.pc.close();
      }
      this.peers.clear();
      this.events.onPeerCount?.(0);
    };

    ws.onerror = (event) => {
      this.events.onDebug?.('mesh_ws_error', event);
    };

    ws.onmessage = async (event) => {
      const msg = safeJsonParse(String(event.data)) as SignalMessage | null;
      if (!msg || typeof msg !== 'object') return;

      if (msg.type === 'welcome') {
        this.selfId = msg.id;
        this.events.onDebug?.('mesh_welcome', msg);
        for (const peerId of msg.peers) {
          this.ensurePeer(peerId);
        }
        this.events.onPeerCount?.(this.peers.size);
        this.startPings();
        return;
      }

      if (msg.type === 'peer-join') {
        if (!this.selfId || msg.id === this.selfId) return;
        this.ensurePeer(msg.id);
        this.events.onPeerCount?.(this.peers.size);
        return;
      }

      if (msg.type === 'peer-leave') {
        this.dropPeer(msg.id);
        this.events.onPeerCount?.(this.peers.size);
        return;
      }

      if (msg.type === 'signal') {
        if (!this.selfId || msg.to !== this.selfId) return;
        await this.onSignal(msg.from, msg.payload);
        return;
      }
    };
  }

  disconnect() {
    this.ws?.close();
  }

  broadcastWireMessage(message: MeshWireMessage, exceptPeerId?: string) {
    for (const peer of this.peers.values()) {
      if (exceptPeerId && peer.id === exceptPeerId) continue;
      if (this.options.maxRelayRttMs != null && peer.rttMs != null && peer.rttMs > this.options.maxRelayRttMs) {
        continue;
      }
      if (peer.dc?.readyState === 'open') {
        peer.dc.send(JSON.stringify(message));
      }
    }
  }

  private ensurePeer(peerId: string) {
    if (!this.selfId || peerId === this.selfId) return;
    if (this.peers.has(peerId)) return;

    const pc = new RTCPeerConnection({
      iceServers: [], // offline-first: use host candidates on LAN/hotspot
    });

    const state: PeerState = {
      id: peerId,
      pc,
      dc: null,
      lastSeenAt: Date.now(),
      rttMs: null,
    };
    this.peers.set(peerId, state);

    pc.onconnectionstatechange = () => {
      this.events.onDebug?.('mesh_pc_state', { peerId, state: pc.connectionState });
      if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        this.dropPeer(peerId);
        this.events.onPeerCount?.(this.peers.size);
      }
    };

    pc.onicecandidate = (event) => {
      if (!event.candidate) return;
      this.sendSignal(peerId, { t: 'ice', c: event.candidate });
    };

    pc.ondatachannel = (event) => {
      state.dc = event.channel;
      this.bindDataChannel(peerId, event.channel);
    };

    // Deterministic initiator: lower id starts.
    if (this.selfId < peerId) {
      const dc = pc.createDataChannel('mesh');
      state.dc = dc;
      this.bindDataChannel(peerId, dc);
      void this.createOffer(peerId);
    }
  }

  private dropPeer(peerId: string) {
    const peer = this.peers.get(peerId);
    if (!peer) return;
    try {
      peer.dc?.close();
    } catch {
      // ignore
    }
    try {
      peer.pc.close();
    } catch {
      // ignore
    }
    this.peers.delete(peerId);
  }

  private bindDataChannel(peerId: string, dc: RTCDataChannel) {
    dc.onopen = () => this.events.onDebug?.('mesh_dc_open', { peerId });
    dc.onclose = () => this.events.onDebug?.('mesh_dc_close', { peerId });
    dc.onerror = (event) => this.events.onDebug?.('mesh_dc_error', { peerId, event });
    dc.onmessage = (event) => {
      const parsed = safeJsonParse(String(event.data));
      if (!isMeshWireMessage(parsed)) return;
      this.onWireMessage(peerId, parsed);
    };
  }

  private onWireMessage(fromPeerId: string, message: MeshWireMessage) {
    const peer = this.peers.get(fromPeerId);
    if (peer) peer.lastSeenAt = Date.now();

    if (message.kind === 'ping') {
      this.sendToPeer(fromPeerId, { kind: 'pong', t: message.t });
      return;
    }

    if (message.kind === 'pong') {
      const rtt = Date.now() - message.t;
      if (peer) peer.rttMs = rtt;
      return;
    }

    if (message.kind === 'mesh_alert') {
      this.events.onAlert?.(message.alert, { fromPeerId });
      return;
    }
  }

  private sendToPeer(peerId: string, message: MeshWireMessage) {
    const peer = this.peers.get(peerId);
    if (peer?.dc?.readyState === 'open') {
      peer.dc.send(JSON.stringify(message));
    }
  }

  private async createOffer(peerId: string) {
    const peer = this.peers.get(peerId);
    if (!peer) return;

    const offer = await peer.pc.createOffer();
    await peer.pc.setLocalDescription(offer);
    this.sendSignal(peerId, { t: 'sdp', d: peer.pc.localDescription });
  }

  private async onSignal(fromPeerId: string, payload: unknown) {
    if (!payload || typeof payload !== 'object') return;
    const type = (payload as { t?: unknown }).t;
    const peerId = fromPeerId;
    this.ensurePeer(peerId);
    const peer = this.peers.get(peerId);
    if (!peer) return;

    if (type === 'sdp') {
      const desc = (payload as { d?: RTCSessionDescriptionInit }).d;
      if (!desc) return;
      await peer.pc.setRemoteDescription(desc);
      if (desc.type === 'offer') {
        const answer = await peer.pc.createAnswer();
        await peer.pc.setLocalDescription(answer);
        this.sendSignal(peerId, { t: 'sdp', d: peer.pc.localDescription });
      }
      return;
    }

    if (type === 'ice') {
      const cand = (payload as { c?: RTCIceCandidateInit }).c;
      if (!cand) return;
      try {
        await peer.pc.addIceCandidate(cand);
      } catch (error) {
        this.events.onDebug?.('mesh_ice_add_failed', { peerId, error });
      }
      return;
    }
  }

  private sendSignal(toPeerId: string, payload: unknown) {
    if (!this.ws || !this.selfId) return;
    this.ws.send(JSON.stringify({ type: 'signal', to: toPeerId, from: this.selfId, payload }));
  }

  private startPings() {
    if (this.pingTimer != null) return;
    this.pingTimer = window.setInterval(() => {
      const now = Date.now();
      const msg: MeshWireMessage = { kind: 'ping', t: now };
      this.broadcastWireMessage(msg);
    }, 3500);
  }

  private stopPings() {
    if (this.pingTimer == null) return;
    window.clearInterval(this.pingTimer);
    this.pingTimer = null;
  }
}

