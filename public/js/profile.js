document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const editProfileBtn = document.getElementById('editProfile');
  const editModal = document.getElementById('editModal');
  const closeModalBtn = document.getElementById('closeModal');
  const profileForm = document.getElementById('profileForm');
  const navItems = document.querySelectorAll('.nav-item');
  const contentSections = document.querySelectorAll('.content-section');
  const avatarEditBtn = document.querySelector('.avatar-edit');
  const profileAvatar = document.getElementById('profileAvatar');
  const darkModeToggle = document.getElementById('darkModeToggle');
  const upgradeBtn = document.getElementById('upgradeBtn');
  const loadMoreBroadcastsBtn = document.getElementById('loadMoreBroadcasts');
  const viewOptions = document.querySelectorAll('.view-option');
  const sortBroadcastsBtn = document.getElementById('sortBroadcasts');

  // State
  let currentBroadcastView = 'grid';
  let broadcastPage = 1;
  let isSortAscending = false;
  let userProfile = {
    name: "",
    username: "",
    bio: "",
    location: "",
    joinDate: "",
    followers: 0,
    following: 0,
    broadcasts: 0,
    balance: 0,
    isVIP: false,
    socialConnections: []
  };

  // Initialize
  loadProfileData();
  loadBroadcasts();
  loadGifts();
  loadTransactions();
  setupDarkMode();

  // Event Listeners
  editProfileBtn.addEventListener('click', openEditModal);
  closeModalBtn.addEventListener('click', closeEditModal);
  profileForm.addEventListener('submit', saveProfile);
  avatarEditBtn.addEventListener('click', changeAvatar);
  upgradeBtn.addEventListener('click', upgradeToVIP);
  loadMoreBroadcastsBtn.addEventListener('click', loadMoreBroadcasts);
  darkModeToggle.addEventListener('click', toggleDarkMode);
  sortBroadcastsBtn.addEventListener('click', toggleSortOrder);

  navItems.forEach(item => {
    item.addEventListener('click', () => switchSection(item.dataset.section));
  });

  viewOptions.forEach(option => {
    option.addEventListener('click', () => switchView(option.dataset.view));
  });

  // Functions
  async function loadProfileData() {
    try {
      // Fetch profile data from API
      const response = await fetch('/api/profile');
      const data = await response.json();
      
      // Update state
      userProfile = {
        ...userProfile,
        ...data,
        joinDate: formatJoinDate(data.joinDate)
      };

      // Update UI
      updateProfileUI();
      loadSocialConnections();

    } catch (error) {
      console.error('Error loading profile:', error);
      showNotification('Failed to load profile data', 'error');
    }
  }

  function updateProfileUI() {
    document.getElementById('profileName').textContent = userProfile.name;
    document.getElementById('profileUsername').textContent = userProfile.username;
    document.getElementById('profileBio').textContent = userProfile.bio;
    document.getElementById('profileLocation').textContent = userProfile.location;
    document.getElementById('joinDate').textContent = userProfile.joinDate;
    
    // Stats
    document.querySelectorAll('.stat-value')[0].textContent = formatNumber(userProfile.followers);
    document.querySelectorAll('.stat-value')[1].textContent = formatNumber(userProfile.following);
    document.querySelectorAll('.stat-value')[2].textContent = formatNumber(userProfile.broadcasts);
    
    // Wallet
    document.querySelector('.wallet-balance h3').innerHTML = 
      `${formatNumber(userProfile.balance)} <small>coins</small>`;
    
    // VIP Status
    if (userProfile.isVIP) {
      upgradeBtn.innerHTML = '<i class="fas fa-crown"></i> VIP Member';
      upgradeBtn.classList.add('vip-active');
    }
  }

  async function loadSocialConnections() {
    try {
      const response = await fetch('/api/profile/social');
      const connections = await response.json();
      userProfile.socialConnections = connections;

      connections.forEach(platform => {
        const btn = document.querySelector(`.social-btn[data-platform="${platform.name}"]`);
        if (btn) {
          btn.innerHTML = `<i class="fab fa-${platform.name}"></i> ${platform.username || 'Connected'}`;
          btn.classList.add('connected');
          btn.disabled = true; // Already connected
        }
      });
    } catch (error) {
      console.error('Error loading social connections:', error);
    }
  }

  async function loadBroadcasts() {
    try {
      const response = await fetch(`/api/profile/broadcasts?page=${broadcastPage}&sort=${isSortAscending ? 'asc' : 'desc'}`);
      const broadcasts = await response.json();
      
      const broadcastGrid = document.querySelector('.broadcast-grid');
      
      if (broadcastPage === 1) {
        broadcastGrid.innerHTML = ''; // Clear on first load
      }

      broadcasts.forEach(broadcast => {
        const item = document.createElement('div');
        item.className = `broadcast-item ${currentBroadcastView}-view`;
        item.innerHTML = `
          <img src="${broadcast.thumbnail || 'images/default-broadcast.jpg'}" alt="${broadcast.title}">
          <div class="broadcast-info">
            <h4>${broadcast.title}</h4>
            <p>${formatDate(broadcast.date)} • ${formatNumber(broadcast.viewers)} viewers</p>
            <div class="broadcast-stats">
              <span><i class="fas fa-heart"></i> ${formatNumber(broadcast.likes)}</span>
              <span><i class="fas fa-comment"></i> ${formatNumber(broadcast.comments)}</span>
            </div>
          </div>
        `;
        broadcastGrid.appendChild(item);
      });

      // Toggle load more button
      loadMoreBroadcastsBtn.disabled = broadcasts.length < 10;

    } catch (error) {
      console.error('Error loading broadcasts:', error);
      showNotification('Failed to load broadcasts', 'error');
    }
  }

  async function loadGifts() {
    try {
      const response = await fetch('/api/profile/gifts');
      const gifts = await response.json();
      
      const giftsContainer = document.querySelector('.gifts-container');
      giftsContainer.innerHTML = gifts.map(gift => `
        <div class="gift-item">
          <img src="images/gift-icons/${gift.type}.png" alt="${gift.type}">
          <div class="gift-details">
            <h4>${gift.name}</h4>
            <p>From ${gift.from} • ${formatDate(gift.date)}</p>
          </div>
          <span class="gift-value">${gift.value} coins</span>
        </div>
      `).join('');

    } catch (error) {
      console.error('Error loading gifts:', error);
      showNotification('Failed to load gifts', 'error');
    }
  }

  async function loadTransactions() {
    try {
      const response = await fetch('/api/profile/transactions');
      const transactions = await response.json();
      
      const transactionsContainer = document.querySelector('.recent-transactions');
      transactionsContainer.innerHTML += transactions.map(transaction => `
        <div class="transaction-item">
          <div class="transaction-details">
            <div class="transaction-title">${transaction.title}</div>
            <div class="transaction-date">${formatDate(transaction.date)}</div>
          </div>
          <div class="transaction-amount ${transaction.type === 'credit' ? 'positive' : 'negative'}">
            ${transaction.amount}
          </div>
        </div>
      `).join('');

    } catch (error) {
      console.error('Error loading transactions:', error);
    }
  }

  function openEditModal() {
    // Pre-fill form
    document.getElementById('editName').value = userProfile.name;
    document.getElementById('editUsername').value = userProfile.username;
    document.getElementById('editBio').value = userProfile.bio;
    document.getElementById('editLocation').value = userProfile.location;
    
    editModal.classList.add('active');
  }

  function closeEditModal() {
    editModal.classList.remove('active');
  }

  async function saveProfile(e) {
    e.preventDefault();
    
    try {
      const formData = {
        name: document.getElementById('editName').value,
        username: document.getElementById('editUsername').value,
        bio: document.getElementById('editBio').value,
        location: document.getElementById('editLocation').value
      };

      const response = await fetch('/api/profile/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        // Update local profile
        userProfile = { ...userProfile, ...formData };
        updateProfileUI();
        closeEditModal();
        showNotification('Profile updated successfully!');
      } else {
        throw new Error('Update failed');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      showNotification('Failed to update profile', 'error');
    }
  }

  async function changeAvatar() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      try {
        // In a real app, upload to server
        const formData = new FormData();
        formData.append('avatar', file);

        const response = await fetch('/api/profile/avatar', {
          method: 'POST',
          body: formData
        });

        const { avatarUrl } = await response.json();
        profileAvatar.src = avatarUrl;
        showNotification('Avatar updated successfully!');

      } catch (error) {
        console.error('Error uploading avatar:', error);
        showNotification('Failed to update avatar', 'error');
      }
    };

    input.click();
  }

  async function upgradeToVIP() {
    if (userProfile.isVIP) return;
    
    try {
      const response = await fetch('/api/profile/upgrade', {
        method: 'POST'
      });

      if (response.ok) {
        userProfile.isVIP = true;
        upgradeBtn.innerHTML = '<i class="fas fa-crown"></i> VIP Member';
        upgradeBtn.classList.add('vip-active');
        showNotification('VIP upgrade successful!');
      } else {
        throw new Error('Upgrade failed');
      }
    } catch (error) {
      console.error('Error upgrading to VIP:', error);
      showNotification('Failed to upgrade to VIP', 'error');
    }
  }

  function switchSection(sectionId) {
    // Update nav
    navItems.forEach(item => item.classList.remove('active'));
    document.querySelector(`.nav-item[data-section="${sectionId}"]`).classList.add('active');
    
    // Update content
    contentSections.forEach(section => section.classList.remove('active'));
    document.getElementById(`${sectionId}Section`).classList.add('active');
  }

  function switchView(view) {
    currentBroadcastView = view;
    
    // Update buttons
    viewOptions.forEach(option => option.classList.remove('active'));
    document.querySelector(`.view-option[data-view="${view}"]`).classList.add('active');
    
    // Update items
    document.querySelector('.broadcast-grid').className = `broadcast-grid ${view}-view`;
    document.querySelectorAll('.broadcast-item').forEach(item => {
      item.className = `broadcast-item ${view}-view`;
    });
  }

  function toggleSortOrder() {
    isSortAscending = !isSortAscending;
    sortBroadcastsBtn.innerHTML = `Sort by Date <i class="fas fa-sort-${isSortAscending ? 'up' : 'down'}"></i>`;
    broadcastPage = 1; // Reset to first page
    loadBroadcasts();
  }

  function loadMoreBroadcasts() {
    broadcastPage++;
    loadBroadcasts();
  }

  function setupDarkMode() {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const savedMode = localStorage.getItem('darkMode');
    
    if (savedMode === 'enabled' || (savedMode === null && prefersDark)) {
      enableDarkMode();
    }
  }

  function toggleDarkMode() {
    if (document.body.classList.contains('dark-mode')) {
      disableDarkMode();
    } else {
      enableDarkMode();
    }
  }

  function enableDarkMode() {
    document.body.classList.add('dark-mode');
    darkModeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    localStorage.setItem('darkMode', 'enabled');
  }

  function disableDarkMode() {
    document.body.classList.remove('dark-mode');
    darkModeToggle.innerHTML = '<i class="fas fa-moon"></i>';
    localStorage.setItem('darkMode', 'disabled');
  }

  // Helper functions
  function formatNumber(num) {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }

  function formatDate(dateString) {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  }

  function formatJoinDate(dateString) {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'long',
      year: 'numeric'
    }).format(date);
  }

  function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.classList.add('fade-out');
      setTimeout(() => notification.remove(), 500);
    }, 3000);
  }
});