import { useState, useEffect, useRef, useCallback } from 'react';
import { socket } from '../socket.js';

/**
 * WebRTC Voice Chat Hook for 4-player mesh network
 * Each player connects directly to every other player (P2P mesh)
 */

const ICE_SERVERS = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
    ]
};

export function useVoiceChat() {
    const [isVoiceActive, setIsVoiceActive] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [peers, setPeers] = useState({}); // { peerId: { connection, stream } }
    const [error, setError] = useState(null);

    const localStreamRef = useRef(null);
    const peerConnectionsRef = useRef({}); // { peerId: RTCPeerConnection }
    const audioElementsRef = useRef({}); // { peerId: HTMLAudioElement }

    // Create peer connection for a specific peer
    const createPeerConnection = useCallback((peerId) => {
        const pc = new RTCPeerConnection(ICE_SERVERS);

        // Add local audio tracks to the connection
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => {
                pc.addTrack(track, localStreamRef.current);
            });
        }

        // Handle incoming audio stream
        pc.ontrack = (event) => {
            const [remoteStream] = event.streams;
            
            // Create or reuse audio element for this peer
            if (!audioElementsRef.current[peerId]) {
                const audio = new Audio();
                audio.autoplay = true;
                audio.playsInline = true;
                audioElementsRef.current[peerId] = audio;
            }
            audioElementsRef.current[peerId].srcObject = remoteStream;

            setPeers(prev => ({
                ...prev,
                [peerId]: { connected: true, stream: remoteStream }
            }));
        };

        // Handle ICE candidates
        pc.onicecandidate = (event) => {
            if (event.candidate) {
                socket.emit('voice-ice-candidate', {
                    targetId: peerId,
                    candidate: event.candidate
                });
            }
        };

        // Connection state changes
        pc.onconnectionstatechange = () => {
            if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
                cleanupPeer(peerId);
            }
        };

        peerConnectionsRef.current[peerId] = pc;
        return pc;
    }, []);

    // Cleanup a specific peer connection
    const cleanupPeer = useCallback((peerId) => {
        const pc = peerConnectionsRef.current[peerId];
        if (pc) {
            pc.close();
            delete peerConnectionsRef.current[peerId];
        }
        
        const audio = audioElementsRef.current[peerId];
        if (audio) {
            audio.srcObject = null;
            delete audioElementsRef.current[peerId];
        }

        setPeers(prev => {
            const next = { ...prev };
            delete next[peerId];
            return next;
        });
    }, []);

    // Join voice chat
    const joinVoice = useCallback(async () => {
        try {
            setError(null);
            
            // Request microphone access
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }, 
                video: false 
            });
            
            localStreamRef.current = stream;
            setIsVoiceActive(true);
            
            // Tell server we're joining voice
            socket.emit('voice-join');
            
        } catch (err) {
            console.error('Failed to access microphone:', err);
            setError('Microphone access denied');
        }
    }, []);

    // Leave voice chat
    const leaveVoice = useCallback(() => {
        // Stop local stream
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => track.stop());
            localStreamRef.current = null;
        }

        // Close all peer connections
        Object.keys(peerConnectionsRef.current).forEach(cleanupPeer);

        // Notify server
        socket.emit('voice-leave');
        
        setIsVoiceActive(false);
        setIsMuted(false);
        setPeers({});
    }, [cleanupPeer]);

    // Toggle mute
    const toggleMute = useCallback(() => {
        if (localStreamRef.current) {
            const audioTrack = localStreamRef.current.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setIsMuted(!audioTrack.enabled);
            }
        }
    }, []);

    // Socket event handlers
    useEffect(() => {
        // Receive list of existing peers when we join
        const handlePeers = async ({ peers: peerIds }) => {
            for (const peerId of peerIds) {
                const pc = createPeerConnection(peerId);
                
                // Create and send offer
                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);
                
                socket.emit('voice-offer', { targetId: peerId, offer });
            }
        };

        // New peer joined - they will send us an offer
        const handlePeerJoined = ({ peerId }) => {
            if (!isVoiceActive) return;
            // Just prepare - they will initiate the connection
            setPeers(prev => ({ ...prev, [peerId]: { connected: false } }));
        };

        // Receive offer from a peer
        const handleOffer = async ({ fromId, offer }) => {
            if (!isVoiceActive || !localStreamRef.current) return;
            
            const pc = createPeerConnection(fromId);
            
            await pc.setRemoteDescription(new RTCSessionDescription(offer));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            
            socket.emit('voice-answer', { targetId: fromId, answer });
        };

        // Receive answer from a peer
        const handleAnswer = async ({ fromId, answer }) => {
            const pc = peerConnectionsRef.current[fromId];
            if (pc) {
                await pc.setRemoteDescription(new RTCSessionDescription(answer));
            }
        };

        // Receive ICE candidate from a peer
        const handleIceCandidate = async ({ fromId, candidate }) => {
            const pc = peerConnectionsRef.current[fromId];
            if (pc && candidate) {
                await pc.addIceCandidate(new RTCIceCandidate(candidate));
            }
        };

        // Peer left voice chat
        const handlePeerLeft = ({ peerId }) => {
            cleanupPeer(peerId);
        };

        socket.on('voice-peers', handlePeers);
        socket.on('voice-peer-joined', handlePeerJoined);
        socket.on('voice-offer', handleOffer);
        socket.on('voice-answer', handleAnswer);
        socket.on('voice-ice-candidate', handleIceCandidate);
        socket.on('voice-peer-left', handlePeerLeft);

        return () => {
            socket.off('voice-peers', handlePeers);
            socket.off('voice-peer-joined', handlePeerJoined);
            socket.off('voice-offer', handleOffer);
            socket.off('voice-answer', handleAnswer);
            socket.off('voice-ice-candidate', handleIceCandidate);
            socket.off('voice-peer-left', handlePeerLeft);
        };
    }, [isVoiceActive, createPeerConnection, cleanupPeer]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            leaveVoice();
        };
    }, [leaveVoice]);

    return {
        isVoiceActive,
        isMuted,
        peers,
        error,
        peerCount: Object.keys(peers).filter(id => peers[id]?.connected).length,
        joinVoice,
        leaveVoice,
        toggleMute
    };
}
