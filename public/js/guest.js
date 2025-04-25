document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const hostVideo = document.getElementById('hostVideo');
    const roomNameElement = document.getElementById('roomName');
    const viewerCountElement = document.getElementById('viewerCount');
    const viewerListElement = document.getElementById('viewerList');
    const chatMessagesElement = document.getElementById('chatMessages');
    const messageInput = document.getElementById('messageInput');
    const sendMessageBtn = document.getElementById('sendMessage');
    const leaveRoomBtn = document.getElementById('leaveRoom');
    const openGiftPanelBtn = document.getElementById('openGiftPanel');
    const closeGiftPanelBtn = document.getElementById('closeGiftPanel');
    const giftPanel = document.getElementById('giftPanel');
    const giftsGrid = document.getElementById('giftsGrid');
    const hostAvatar = document.getElementById('hostAvatar');
    const hostUsername = document.getElementById('hostUsername');
    const privateCallModal = document.getElementById('privateCallModal');
    const acceptPrivateCallBtn = document.getElementById('acceptPrivateCall');
    const declinePrivateCallBtn = document.getElementById('declinePrivateCall');

    // State variables
    let socket;
    let roomId;
    let hostData;
    let viewers = [];
    let peerConnection;
    let localStream;
    let isInPrivateCall = false;
    let privateCallRoomId = null;

    // Sample gifts data
    const gifts = {
        popular: [
            { id: 'rose', name: 'Rose', value: 10, icon: 'fa-heart' },
            { id: 'kiss', name: 'Kiss', value: 20, icon: 'fa-kiss-wink-heart' },
            { id: 'chocolate', name: 'Chocolate', value: 50, icon: 'fa-candy-cane' },
            { id: 'diamond', name: 'Diamond', value: 100, icon: 'fa-gem' }
        ],
        luxury: [
            { id: 'car', name: 'Sports Car', value: 500, icon: 'fa-car' },
            { id: 'ring', name: 'Diamond Ring', value: 1000, icon: 'fa-ring' },
            { id: 'jet', name: 'Private Jet', value: 5000, icon: 'fa-plane' }
        ],
        special: [
            { id: 'rocket', name: 'Rocket', value: 10000, icon: 'fa-rocket' },
            { id: 'crown', name: 'Crown', value: 20000, icon: 'fa-crown' }
        ]
    };

    // Initialize the application
    init();

    async function init() {
        // Get room ID from URL
        roomId = getRoomIdFromUrl();
        if (!roomId) {
            alert('Invalid room URL');
            window.location.href = '/';
            return;
        }

        // Connect to Socket.IO server
        socket = io();

        // Generate random username for demo
        const randomUsername = `Guest_${Math.floor(Math.random() * 1000)}`;
        const userData = {
            username: randomUsername,
            avatar: `https://i.pravatar.cc/150?u=${randomUsername}`,
            isHost: false
        };

        // Set user data and join room
        socket.emit('set-user-data', userData);
        joinRoom(roomId, userData);

        // Set up event listeners
        setupEventListeners();
        loadGifts();
    }

    function getRoomIdFromUrl() {
        const params = new URLSearchParams(window.location.search);
        return params.get('roomId');
    }

    function joinRoom(roomId, userData) {
        socket.emit('guest-join-room', {
            roomId,
            username: userData.username
        });

        // Listen for room events
        socket.on('room-joined', (data) => {
            hostData = data.hostData;
            updateHostInfo();
            console.log(`Joined room: ${roomId}`);
        });

        socket.on('room-not-found', () => {
            alert('Room not found or has ended');
            window.location.href = '/';
        });

        socket.on('room-update', (data) => {
            viewers = data.guests;
            updateViewerList();
            updateViewerCount();
        });

        socket.on('new-chat-message', addChatMessage);
        socket.on('new-gift', showGiftAnimation);
        socket.on('special-effect', playSpecialEffect);
        socket.on('host-stream-started', () => {
            // In a real app, you would connect to the host's video stream here
            console.log('Host stream started');
        });

        socket.on('private-call-request', handlePrivateCallRequest);
        socket.on('private-call-accepted', startPrivateCall);
        socket.on('private-call-ended', endPrivateCall);
    }

    function updateHostInfo() {
        if (hostData) {
            hostUsername.textContent = hostData.username;
            hostAvatar.src = hostData.avatar;
            roomNameElement.textContent = hostData.username + "'s Room";
        }
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
        viewerCountElement.textContent = viewers.length;
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

    function setupEventListeners() {
        // UI event listeners
        leaveRoomBtn.addEventListener('click', leaveRoom);
        sendMessageBtn.addEventListener('click', sendMessage);
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendMessage();
        });

        // Gift panel
        openGiftPanelBtn.addEventListener('click', () => giftPanel.classList.add('active'));
        closeGiftPanelBtn.addEventListener('click', () => giftPanel.classList.remove('active'));

        // Gift category buttons
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                loadGifts(btn.dataset.category);
            });
        });

        // Private call buttons
        acceptPrivateCallBtn.addEventListener('click', acceptPrivateCall);
        declinePrivateCallBtn.addEventListener('click', declinePrivateCall);

        // Handle beforeunload to properly leave room
        window.addEventListener('beforeunload', () => {
            if (roomId) {
                socket.emit('leave-room', { roomId });
            }
        });
    }

    function loadGifts(category = 'popular') {
        giftsGrid.innerHTML = '';
        gifts[category].forEach(gift => {
            const giftElement = document.createElement('div');
            giftElement.className = 'gift-option';
            giftElement.innerHTML = `
                <i class="fas ${gift.icon} gift-icon"></i>
                <span class="gift-name">${gift.name}</span>
                <span class="gift-price">$${gift.value}</span>
            `;
            giftElement.addEventListener('click', () => sendGift(gift.id));
            giftsGrid.appendChild(giftElement);
        });
    }

    function sendGift(giftId) {
        socket.emit('send-gift', {
            roomId,
            giftId
        });
        giftPanel.classList.remove('active');
        showNotification(`You sent a gift to the host!`);
    }

    function showGiftAnimation(gift) {
        // In a real app, you would show an animation of the gift
        console.log(`Received gift: ${gift.id} from ${gift.from}`);
        showNotification(`${gift.from} sent a gift worth $${gift.value}!`);
    }

    function playSpecialEffect(effect) {
        console.log(`Playing effect: ${effect.effectType}`);
        // Implement effect animations here
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

    function leaveRoom() {
        if (confirm('Leave this room?')) {
            socket.emit('leave-room', { roomId });
            window.location.href = '/';
        }
    }

    function handlePrivateCallRequest(data) {
        privateCallRoomId = data.roomId;
        privateCallModal.classList.add('active');
    }

    function acceptPrivateCall() {
        privateCallModal.classList.remove('active');
        isInPrivateCall = true;
        socket.emit('accept-private-call', {
            roomId: privateCallRoomId
        });
        // In a real app, you would start WebRTC connection here
        console.log('Starting private call...');
    }

    function declinePrivateCall() {
        privateCallModal.classList.remove('active');
        privateCallRoomId = null;
    }

    function startPrivateCall(data) {
        isInPrivateCall = true;
        privateCallRoomId = data.privateRoomId;
        // In a real app, you would start WebRTC connection here
        console.log('Private call started in room:', privateCallRoomId);
        window.location.href = `/private.html?roomId=${privateCallRoomId}`;
    }

    function endPrivateCall() {
        isInPrivateCall = false;
        privateCallRoomId = null;
        // In a real app, you would clean up WebRTC connection here
        console.log('Private call ended');
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
});