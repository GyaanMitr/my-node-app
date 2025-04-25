document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const localVideo = document.getElementById('localVideo');
    const roomIdElement = document.getElementById('roomId');
    const viewerCountElement = document.getElementById('viewerCount');
    const viewerListElement = document.getElementById('viewerList');
    const chatMessagesElement = document.getElementById('chatMessages');
    const messageInput = document.getElementById('messageInput');
    const sendMessageBtn = document.getElementById('sendMessage');
    const endBroadcastBtn = document.getElementById('endBroadcast');
    const toggleVideoBtn = document.getElementById('toggleVideo');
    const toggleMicBtn = document.getElementById('toggleMic');
    const toggleBeautyBtn = document.getElementById('toggleBeauty');
    const toggleEffectsBtn = document.getElementById('toggleEffects');
    const effectsPanel = document.getElementById('effectsPanel');
    const giftsContainer = document.getElementById('giftsContainer');
    const totalGiftsElement = document.getElementById('totalGifts');
    const viewerCountSide = document.getElementById('viewerCountSide');

    // State variables
    let localStream;
    let roomId;
    let viewers = [];
    let giftsReceived = [];
    let totalGiftsValue = 0;
    let isVideoOn = true;
    let isMicOn = true;
    let isBeautyOn = false;
    let socket;

    // Initialize the application
    init();

    async function init() {
        // Connect to Socket.IO server
        socket = io();

        // Create a new room
        createRoom();

        // Set up media devices
        await setupMediaDevices();

        // Set up event listeners
        setupEventListeners();
    }

    function createRoom() {
        // Generate a random username for demo purposes
        const randomUsername = `Host_${Math.floor(Math.random() * 1000)}`;
        
        // Set user data
        socket.emit('set-user-data', {
            username: randomUsername,
            avatar: `https://i.pravatar.cc/150?u=${randomUsername}`,
            isHost: true
        });

        // Create a new room
        socket.emit('host-create-room');
        
        // Listen for room creation confirmation
        socket.on('room-created', (data) => {
            roomId = data.roomId;
            roomIdElement.textContent = roomId;
            console.log(`Room created with ID: ${roomId}`);
        });
    }

    async function setupMediaDevices() {
        try {
            // Get user media
            localStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
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

    function setupEventListeners() {
        // Socket.IO event listeners
        socket.on('guest-joined', (guest) => {
            console.log(`Guest joined: ${guest.username}`);
            viewers.push(guest);
            updateViewerList();
            updateViewerCount();
            
            // Show notification
            showNotification(`${guest.username} joined the room`);
        });

        socket.on('guest-left', (socketId) => {
            viewers = viewers.filter(viewer => viewer.socketId !== socketId);
            updateViewerList();
            updateViewerCount();
        });

        socket.on('new-chat-message', (message) => {
            addChatMessage(message);
        });

        socket.on('new-gift', (gift) => {
            receiveGift(gift);
        });

        socket.on('special-effect', (effect) => {
            playSpecialEffect(effect);
        });

        // UI event listeners
        endBroadcastBtn.addEventListener('click', endBroadcast);
        toggleVideoBtn.addEventListener('click', toggleVideo);
        toggleMicBtn.addEventListener('click', toggleMic);
        toggleBeautyBtn.addEventListener('click', toggleBeauty);
        toggleEffectsBtn.addEventListener('click', toggleEffectsPanel);
        sendMessageBtn.addEventListener('click', sendMessage);
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendMessage();
        });

        // Add effect buttons
        document.querySelectorAll('.effect').forEach(effect => {
            effect.addEventListener('click', () => {
                const effectType = effect.getAttribute('data-effect');
                triggerEffect(effectType);
            });
        });
    }

    function updateViewerList() {
        viewerListElement.innerHTML = '';
        viewers.forEach(viewer => {
            const viewerElement = document.createElement('div');
            viewerElement.className = 'viewer-item';
            viewerElement.innerHTML = `
                <img src="${viewer.avatar}" alt="${viewer.username}" class="viewer-avatar">
                <span>${viewer.username}</span>
            `;
            viewerListElement.appendChild(viewerElement);
        });
    }

    function updateViewerCount() {
        const count = viewers.length;
        viewerCountElement.textContent = count;
        viewerCountSide.textContent = count;
    }

    function addChatMessage(message) {
        const messageElement = document.createElement('div');
        messageElement.className = 'message';
        messageElement.innerHTML = `
            <div class="message-user">
                <img src="${message.avatar}" alt="${message.username}" class="message-avatar">
                <span class="message-username">${message.username}</span>
                <span class="message-time">${formatTime(message.timestamp)}</span>
            </div>
            <div class="message-content">${message.message}</div>
        `;
        chatMessagesElement.appendChild(messageElement);
        chatMessagesElement.scrollTop = chatMessagesElement.scrollHeight;
    }

    function receiveGift(gift) {
        giftsReceived.push(gift);
        totalGiftsValue += gift.value;
        totalGiftsElement.textContent = totalGiftsValue;

        const giftElement = document.createElement('div');
        giftElement.className = 'gift-item';
        giftElement.innerHTML = `
            <div class="gift-icon">
                <i class="fas fa-gift"></i>
            </div>
            <div class="gift-value">$${gift.value}</div>
            <div class="gift-from">From ${gift.from}</div>
        `;
        giftsContainer.prepend(giftElement);

        // Show notification
        showNotification(`${gift.from} sent you a gift worth $${gift.value}!`);

        // Special effect for expensive gifts
        if (gift.value > 100) {
            playSpecialEffect({
                effectType: 'fireworks',
                duration: 3000
            });
        }
    }

    function playSpecialEffect(effect) {
        console.log(`Playing effect: ${effect.effectType}`);
        // Implement your effect animations here
    }

    function triggerEffect(effectType) {
        socket.emit('special-effect', {
            roomId,
            effectType
        });
        effectsPanel.classList.remove('active');
    }

    function sendMessage() {
        const message = messageInput.value.trim();
        if (message) {
            socket.emit('send-chat-message', {
                roomId,
                message
            });
            messageInput.value = '';
        }
    }

    function endBroadcast() {
        if (confirm('Are you sure you want to end the broadcast?')) {
            // Stop all media tracks
            localStream.getTracks().forEach(track => track.stop());
            
            // Notify server and viewers
            socket.emit('host-end-broadcast', { roomId });
            
            // Redirect to home page
            window.location.href = '/';
        }
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
            toggleMicBtn.classList.toggle('active', !isMicOn);
        }
    }

    function toggleBeauty() {
        isBeautyOn = !isBeautyOn;
        toggleBeautyEffect(isBeautyOn);
        toggleBeautyBtn.innerHTML = `<i class="fas fa-${isBeautyOn ? 'smile-beam' : 'magic'}"></i>`;
        toggleBeautyBtn.classList.toggle('active', isBeautyOn);
    }

    function toggleBeautyEffect(enable) {
        // This is a placeholder - in a real app you would apply a filter to the video stream
        console.log(`Beauty filter ${enable ? 'enabled' : 'disabled'}`);
        localVideo.style.filter = enable ? 'contrast(1.1) brightness(1.1) saturate(1.1)' : 'none';
    }

    function toggleEffectsPanel() {
        effectsPanel.classList.toggle('active');
    }

    function showNotification(message) {
        // Simple notification system
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 500);
        }, 3000);
    }

    function formatTime(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    // Handle beforeunload to properly end broadcast
    window.addEventListener('beforeunload', (e) => {
        if (roomId) {
            socket.emit('host-end-broadcast', { roomId });
        }
    });
});