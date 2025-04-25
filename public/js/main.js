document.addEventListener('DOMContentLoaded', () => {
    // Sample data for live rooms
    const liveRooms = [
        {
            id: 'room1',
            title: 'Fun Chat with Friends',
            host: 'Jessica',
            viewers: 125,
            thumbnail: 'https://via.placeholder.com/300x200',
            avatar: 'https://via.placeholder.com/50'
        },
        {
            id: 'room2',
            title: 'Music Night',
            host: 'Alex',
            viewers: 89,
            thumbnail: 'https://via.placeholder.com/300x200',
            avatar: 'https://via.placeholder.com/50'
        },
        {
            id: 'room3',
            title: 'Q&A Session',
            host: 'Dr. Smith',
            viewers: 210,
            thumbnail: 'https://via.placeholder.com/300x200',
            avatar: 'https://via.placeholder.com/50'
        },
        {
            id: 'room4',
            title: 'Gaming Stream',
            host: 'ProGamer',
            viewers: 342,
            thumbnail: 'https://via.placeholder.com/300x200',
            avatar: 'https://via.placeholder.com/50'
        }
    ];

    // Render live rooms
    const roomsContainer = document.getElementById('liveRooms');
    
    liveRooms.forEach(room => {
        const roomCard = document.createElement('div');
        roomCard.className = 'room-card';
        roomCard.innerHTML = `
            <div class="room-thumbnail">
                <img src="${room.thumbnail}" alt="${room.title}">
                <div class="viewer-count">${room.viewers} viewers</div>
            </div>
            <div class="room-info">
                <h3 class="