document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const remoteVideo = document.getElementById('remoteVideo');
    const localVideo = document.getElementById('localVideo');
    const callUsername = document.getElementById('callUsername');
    const callAvatar = document.getElementById('callAvatar');
    const callStatus = document.getElementById('callStatus');
    const callTimer = document.getElementById('callTimer');
    const endCallBtn = document.getElementById('endCall');
    const toggleVideoBtn = document.getElementById('toggleVideo');
    const toggleMicBtn = document.getElementById('toggleMic');
    const toggleBeautyBtn = document.getElementById('toggleBeauty');
    const sendGiftBtn = document.getElementById('sendGift');
    const giftPanel = document.getElementById('giftPanel');
    const giftsContainer = document.getElementById('giftsContainer');

    // State variables
    let socket;
    let roomId;
    let peerConnection;
    let localStream;
    let remoteStream;
    let callStartTime;
    let timerInterval;
    let isVideoOn = true;
    let isMicOn = true;
    let isBeautyOn = false;
    let iceServers = {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            // Add TURN servers in production
        ]
    };

    // Sample gifts data
    const gifts = [
        { id: 'rose', name: 'Rose', value: 10, icon: 'fa-heart' },
        { id: 'kiss', name: 'Kiss', value: 20, icon: 'fa-kiss-wink-heart' },
        { id: 'chocolate', name: 'Chocolate', value: 50, icon: 'fa-candy-cane' },
        { id: 'diamond', name: 'Diamond', value: 100, icon: 'fa-gem' },
        { id: 'car', name: 'Sports Car', value: 500, icon: 'fa-car' }
    ];

    // Initialize the call
    init();

    async function init() {
        // Get room ID from URL
        roomId = getRoomIdFromUrl();
        if (!roomId) {
            alert('Invalid private call URL');
            window.location.href = '/';
            return;
        }

        // Connect to Socket.IO server
        socket = io();

        // Set up user media
        await setupMediaDevices();

        // Initialize WebRTC connection
        setupWebRTC();

        // Set up event listeners
        setupEventListeners();

        // Load gifts
        loadGifts();

        // Start call timer
        startCallTimer();
    }

    function getRoomIdFromUrl() {
        const params = new URLSearchParams(window.location.search);
        return params.get('roomId');
    }

    async function setupMediaDevices() {
        try {
            // Get user media
            localStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    facingMode: 'user'
                },
                audio: true
            });

            // Display local video stream
            localVideo.srcObject = localStream;

            // Enable beauty filter by default
            toggleBeautyEffect(true);
        } catch (error) {
            console.error('Error accessing media devices:', error);
            alert('Could not access camera or microphone. Please check permissions.');
        }
    }

    function setupWebRTC() {
        // Create peer connection
        peerConnection = new RTCPeerConnection(iceServers);

        // Add local stream to connection
        localStream.getTracks().forEach(track => {
            peerConnection.addTrack(track, localStream);
        });

        // Handle remote stream
        peerConnection.ontrack = (event) => {
            remoteStream = event.streams[0];
            remoteVideo.srcObject = remoteStream;
        };

        // ICE candidate handler
        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                socket.emit('ice-candidate', {
                    roomId,
                    candidate: event.candidate
                });
            }
        };

        // ICE connection state change handler
        peerConnection.oniceconnectionstatechange = () => {
            if (peerConnection.iceConnectionState === 'disconnected' || 
                peerConnection.iceConnectionState === 'failed') {
                endCall();
            }
        };

        // Set up socket events
        socket.on('offer', handleOffer);
        socket.on('answer', handleAnswer);
        socket.on('ice-candidate', handleNewIceCandidate);
        socket.on('call-ended', endCall);
        socket.on('gift-received', handleGiftReceived);

        // For the caller - create and send offer
        if (isCaller()) {
            createOffer();
        }
    }

    function isCaller() {
        // In a real app, you would determine who initiated the call
        // For this example, we'll assume the first to join is the caller
        return Math.random() > 0.5;
    }

    async function createOffer() {
        try {
            const offer = await peerConnection.createOffer();
            await peerConnection.setLocalDescription(offer);
            
            socket.emit('offer', {
                roomId,
                offer
            });
        } catch (error) {
            console.error('Error creating offer:', error);
        }
    }

    async function handleOffer(data) {
        try {
            await peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));
            
            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answer);
            
            socket.emit('answer', {
                roomId,
                answer
            });
        } catch (error) {
            console.error('Error handling offer:', error);
        }
    }

    async function handleAnswer(data) {
        try {
            await peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
        } catch (error) {
            console.error('Error handling answer:', error);
        }
    }

    async function handleNewIceCandidate(data) {
        try {
            if (data.candidate) {
                await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
            }
        } catch (error) {
            console.error('Error adding ICE candidate:', error);
        }
    }

    function setupEventListeners() {
        // Control buttons
        endCallBtn.addEventListener('click', endCall);
        toggleVideoBtn.addEventListener('click', toggleVideo);
        toggleMicBtn.addEventListener('click', toggleMic);
        toggleBeautyBtn.addEventListener('click', toggleBeauty);
        sendGiftBtn.addEventListener('click', () => {
            giftPanel.classList.toggle('active');
        });

        // Gift items
        giftsContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('gift-item')) {
                const giftId = e.target.dataset.giftId;
                sendGift(giftId);
            }
        });

        // Handle beforeunload to properly end call
        window.addEventListener('beforeunload', () => {
            if (roomId) {
                socket.emit('end-call', { roomId });
            }
        });
    }

    function loadGifts() {
        giftsContainer.innerHTML = '';
        gifts.forEach(gift => {
            const giftElement = document.createElement('div');
            giftElement.className = 'gift-item';
            giftElement.dataset.giftId = gift.id;
            giftElement.innerHTML = `
                <i class="fas ${gift.icon}"></i>
                <span>${gift.name} ($${gift.value})</span>
            `;
            giftsContainer.appendChild(giftElement);
        });
    }

    function sendGift(giftId) {
        socket.emit('send-gift', {
            roomId,
            giftId
        });
        giftPanel.classList.remove('active');
        showNotification(`Gift sent!`);
    }

    function handleGiftReceived(gift) {
        showGiftAnimation(gift);
        showNotification(`You received a ${gift.name} gift!`);
    }

    function showGiftAnimation(gift) {
        // Create floating heart animation
        const heart = document.createElement('div');
        heart.className = 'heart-effect';
        heart.innerHTML = `<i class="fas ${gift.icon}"></i>`;
        heart.style.left = `${Math.random() * 80 + 10}%`;
        document.body.appendChild(heart);

        // Remove after animation
        setTimeout(() => {
            heart.remove();
        }, 3000);
    }

    function toggleVideo() {
        const videoTrack = localStream.getVideoTracks()[0];
        if (videoTrack) {
            isVideoOn = !videoTrack.enabled;
            videoTrack.enabled = isVideoOn;
            toggleVideoBtn.innerHTML = `<i class="fas fa-video${isVideoOn ? '' : '-slash'}"></i>`;
            toggleVideoBtn.classList.toggle('active', !isVideoOn);
        }
    }

    function toggleMic() {
        const audioTrack = localStream.getAudioTracks()[0];
        if (audioTrack) {
            isMicOn = !audioTrack.enabled;
            audioTrack.enabled = isMicOn;
            toggleMicBtn.innerHTML = `<i class="fas fa-microphone${isMicOn ? '' : '-slash'}"></i>`;
        }
    }

    function toggleBeauty() {
        isBeautyOn = !isBeautyOn;
        toggleBeautyEffect(isBeautyOn);
        toggleBeautyBtn.innerHTML = `<i class="fas ${isBeautyOn ? 'fa-smile-beam' : 'fa-magic'}"></i>`;
        toggleBeautyBtn.classList.toggle('active', isBeautyOn);
    }

    function toggleBeautyEffect(enable) {
        // This is a placeholder - in a real app you would apply a filter to the video stream
        localVideo.style.filter = enable ? 'contrast(1.1) brightness(1.1) saturate(1.1)' : 'none';
    }

    function startCallTimer() {
        callStartTime = new Date();
        timerInterval = setInterval(updateCallTimer, 1000);
    }

    function updateCallTimer() {
        const elapsed = Math.floor((new Date() - callStartTime) / 1000);
        const minutes = Math.floor(elapsed / 60).toString().padStart(2, '0');
        const seconds = (elapsed % 60).toString().padStart(2, '0');
        callTimer.textContent = `${minutes}:${seconds}`;
    }

    function endCall() {
        // Stop media tracks
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
        }

        // Close peer connection
        if (peerConnection) {
            peerConnection.close();
        }

        // Clear timer
        clearInterval(timerInterval);

        // Notify server
        socket.emit('end-call', { roomId });

        // Redirect to home
        window.location.href = '/';
    }

    function showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 500);
        }, 3000);
    }
});