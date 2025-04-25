document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const searchInput = document.querySelector('.search-bar input');
    const searchBtn = document.querySelector('.search-bar button');
    const categoryBtns = document.querySelectorAll('.category');
    const roomCards = document.querySelectorAll('.room-card');
    const joinBtns = document.querySelectorAll('.join-btn');

    // Sample data (in real app, fetch from API)
    const rooms = [
        {
            id: 'room1',
            title: 'Late Night Chat',
            host: 'JessicaStreams',
            tags: ['chat', 'fun'],
            viewers: 1200,
            thumbnail: 'images/room1.jpg',
            avatar: 'https://i.pravatar.cc/50?u=user1'
        },
        // Add more room objects
    ];

    // Event Listeners
    searchBtn.addEventListener('click', handleSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSearch();
    });

    categoryBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            categoryBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            filterByCategory(btn.textContent);
        });
    });

    joinBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const roomCard = e.target.closest('.room-card');
            const roomId = roomCard.dataset.roomId; // Would come from data in real app
            window.location.href = `/guest.html?roomId=${roomId}`;
        });
    });

    // Functions
    function handleSearch() {
        const query = searchInput.value.trim().toLowerCase();
        if (query) {
            // In real app: API call with search query
            console.log('Searching for:', query);
            filterRooms(query);
        }
    }

    function filterRooms(query) {
        roomCards.forEach(card => {
            const title = card.querySelector('h3').textContent.toLowerCase();
            const host = card.querySelector('p').textContent.toLowerCase();
            const tags = card.querySelector('.tags').textContent.toLowerCase();
            
            if (title.includes(query) || host.includes(query) || tags.includes(query)) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    }

    function filterByCategory(category) {
        if (category === 'All') {
            roomCards.forEach(card => card.style.display = 'block');
            return;
        }
        
        roomCards.forEach(card => {
            const tags = card.querySelector('.tags').textContent.toLowerCase();
            if (tags.includes(category.toLowerCase())) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    }

    // Initialize with sample data (in real app, fetch from server)
    function loadRooms() {
        // This would be replaced with actual API fetch
        console.log('Loaded rooms:', rooms);
    }

    loadRooms();
});