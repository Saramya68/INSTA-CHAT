// ==================================================================================
// FILE: client/src/utils/peerConnection.js
// PURPOSE: WebRTC PeerConnection Manager & Candidate Queue Utility
// 
// INTERVIEW KEY CONCEPTS:
// 
// 1. WHAT IS WEBRTC?
//    - WebRTC (Web Real-Time Communication) is an open-source standard allowing browsers 
//      to stream audio, video, and data directly peer-to-peer (P2P) without routing media 
//      through a central server.
// 
// 2. WHAT IS A STUN SERVER? (Session Traversal Utilities for NAT)
//    - Most users are behind NAT routers or firewalls and have private IP addresses (e.g. 192.168.x.x).
//    - STUN servers tell a device its public IP address and port so that remote peers can connect to it.
//    - Here we use Google's free public STUN server: stun:stun.l.google.com:19302
// 
// 3. WHAT IS A TURN SERVER? (Traversal Using Relays around NAT)
//    - In strict symmetric NAT network environments (e.g. corporate firewalls, VPNs), direct P2P connection fails.
//    - TURN acts as a fallback relay server that routes encrypted media traffic when direct P2P is blocked.
// 
// 4. WHY IS ICE CANDIDATE QUEUEING MANDATORY?
//    - Race Condition Handling: ICE candidates can be generated and received via Socket.IO BEFORE 
//      `setRemoteDescription()` has finished processing the SDP offer/answer.
//    - Calling `pc.addIceCandidate()` before `setRemoteDescription()` causes a DOMException error!
//    - Solution: We store candidates in `iceCandidatesQueue` until `setRemoteDescription()` completes, 
//      then flush the queue.
// ==================================================================================

const defaultIceServers = {
  iceServers: [
    {
      urls: "stun:stun.l.google.com:19302", // Public Google STUN server
    },
  ],
};

export class PeerConnectionManager {
  constructor({
    iceServers = defaultIceServers.iceServers,
    onIceCandidate,
    onTrack,
    onConnectionStateChange,
  } = {}) {
    this.iceServers = iceServers;
    this.onIceCandidate = onIceCandidate;
    this.onTrack = onTrack;
    this.onConnectionStateChange = onConnectionStateChange;
    this.pc = null;
    this.iceCandidatesQueue = []; // Queue for candidates arriving before remote SDP description is set
    this.init();
  }

  /**
   * Initializes the RTCPeerConnection instance and attaches standard event handlers.
   */
  init() {
    // INTERVIEW POINT: Instantiating RTCPeerConnection with ICE servers configuration
    this.pc = new RTCPeerConnection({ iceServers: this.iceServers });

    // Fired whenever the browser discovers a local network path (ICE Candidate)
    this.pc.onicecandidate = (event) => {
      if (event.candidate && this.onIceCandidate) {
        this.onIceCandidate(event.candidate);
      }
    };

    // Fired when remote peer's media tracks (video/audio) start streaming in
    this.pc.ontrack = (event) => {
      if (event.streams && event.streams[0] && this.onTrack) {
        this.onTrack(event.streams[0]);
      }
    };

    // Tracks WebRTC connection lifecycle: 'new' | 'connecting' | 'connected' | 'disconnected' | 'failed' | 'closed'
    this.pc.onconnectionstatechange = () => {
      if (this.onConnectionStateChange) {
        this.onConnectionStateChange(this.pc.connectionState);
      }
    };
  }

  /**
   * Adds local camera and microphone tracks to the RTCPeerConnection object
   */
  addLocalStream(stream) {
    if (!this.pc || !stream) return;
    stream.getTracks().forEach((track) => {
      this.pc.addTrack(track, stream);
    });
  }

  /**
   * Creates an SDP (Session Description Protocol) Offer (Initiated by Caller)
   */
  async createOffer() {
    if (!this.pc) return null;
    const offer = await this.pc.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: true,
    });
    // Set local description stores local capabilities in this RTCPeerConnection instance
    await this.pc.setLocalDescription(offer);
    return offer;
  }

  /**
   * Creates an SDP Answer (Initiated by Receiver upon getting offer)
   */
  async createAnswer() {
    if (!this.pc) return null;
    const answer = await this.pc.createAnswer();
    await this.pc.setLocalDescription(answer);
    return answer;
  }

  /**
   * Sets the Remote Peer's SDP session description and flushes queued ICE candidates
   */
  async setRemoteDescription(sdp) {
    if (!this.pc) return;
    if (this.pc.signalingState === "closed") return;
    const rtcSessionDesc = new RTCSessionDescription(sdp);
    await this.pc.setRemoteDescription(rtcSessionDesc);
    
    // INTERVIEW POINT: Flush queued ICE candidates once remote SDP description is set!
    await this.processQueuedIceCandidates();
  }

  /**
   * Adds an ICE candidate or queues it if remote description is not set yet
   */
  async addIceCandidate(candidate) {
    if (!this.pc) return;
    // Check if remote description has been set
    if (this.pc.remoteDescription && this.pc.remoteDescription.type) {
      try {
        await this.pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.error("Error adding ICE candidate:", err);
      }
    } else {
      // Queue candidate for later processing
      this.iceCandidatesQueue.push(candidate);
    }
  }

  /**
   * Flushes all ICE candidates stored in the queue
   */
  async processQueuedIceCandidates() {
    while (this.iceCandidatesQueue.length > 0) {
      const candidate = this.iceCandidatesQueue.shift();
      try {
        await this.pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.error("Error flushing queued ICE candidate:", err);
      }
    }
  }

  /**
   * INTERVIEW QUESTION: How do you prevent memory leaks when destroying a WebRTC connection?
   * ANSWER: Remove all event listeners, call pc.close(), reset internal references, and clear candidate queues.
   */
  close() {
    if (this.pc) {
      this.pc.onicecandidate = null;
      this.pc.ontrack = null;
      this.pc.onconnectionstatechange = null;
      this.pc.close();
      this.pc = null;
    }
    this.iceCandidatesQueue = [];
  }
}
