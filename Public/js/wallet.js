document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const rechargeBtn = document.getElementById('rechargeBtn');
    const withdrawBtn = document.getElementById('withdrawBtn');
    const transactionHistoryBtn = document.getElementById('transactionHistory');
    const viewAllBtn = document.getElementById('viewAll');
    const coinOptions = document.querySelectorAll('.coin-option');
    const paymentModal = document.getElementById('paymentModal');
    const closeModal = document.getElementById('closeModal');
    const confirmPayment = document.getElementById('confirmPayment');
    const transactionsList = document.getElementById('transactionsList');
    const selectedCoins = document.getElementById('selectedCoins');
    const selectedPrice = document.getElementById('selectedPrice');

    // Sample data
    const transactions = [
        {
            id: 1,
            title: 'Coin Purchase',
            date: '2023-05-15',
            amount: '+1000',
            type: 'credit'
        },
        {
            id: 2,
            title: 'Gift Sent',
            date: '2023-05-14',
            amount: '-200',
            type: 'debit'
        },
        {
            id: 3,
            title: 'Coin Purchase',
            date: '2023-05-10',
            amount: '+500',
            type: 'credit'
        },
        {
            id: 4,
            title: 'Withdrawal',
            date: '2023-05-05',
            amount: '-1000',
            type: 'debit'
        }
    ];

    // Initialize
    loadTransactions();

    // Event Listeners
    rechargeBtn.addEventListener('click', () => {
        // Scroll to recharge section
        document.querySelector('.quick-recharge').scrollIntoView({
            behavior: 'smooth'
        });
    });

    withdrawBtn.addEventListener('click', () => {
        alert('Withdrawal functionality coming soon!');
    });

    transactionHistoryBtn.addEventListener('click', () => {
        document.querySelector('.transactions').scrollIntoView({
            behavior: 'smooth'
        });
    });

    viewAllBtn.addEventListener('click', () => {
        // In a real app, this would show all transactions
        alert('Showing all transactions');
    });

    coinOptions.forEach(option => {
        option.addEventListener('click', () => {
            const coins = option.dataset.amount;
            const price = option.dataset.price;
            selectedCoins.textContent = coins;
            selectedPrice.textContent = `$${price}`;
            paymentModal.classList.add('active');
        });
    });

    closeModal.addEventListener('click', () => {
        paymentModal.classList.remove('active');
    });

    confirmPayment.addEventListener('click', () => {
        // In a real app, this would process payment
        const coins = selectedCoins.textContent;
        alert(`Payment confirmed! ${coins} coins added to your wallet.`);
        paymentModal.classList.remove('active');
        // Update balance (in real app, this would come from server)
        updateBalance(parseInt(coins));
        // Add transaction
        addTransaction({
            title: 'Coin Purchase',
            amount: `+${coins}`,
            type: 'credit'
        });
    });

    // Functions
    function loadTransactions() {
        transactionsList.innerHTML = '';
        transactions.slice(0, 3).forEach(transaction => {
            const transactionElement = document.createElement('div');
            transactionElement.className = 'transaction-item';
            transactionElement.innerHTML = `
                <div class="transaction-details">
                    <div class="transaction-title">${transaction.title}</div>
                    <div class="transaction-date">${transaction.date}</div>
                </div>
                <div class="transaction-amount ${transaction.type === 'credit' ? 'positive' : 'negative'}">
                    ${transaction.amount}
                </div>
            `;
            transactionsList.appendChild(transactionElement);
        });
    }

    function addTransaction(transaction) {
        const transactionElement = document.createElement('div');
        transactionElement.className = 'transaction-item';
        transactionElement.innerHTML = `
            <div class="transaction-details">
                <div class="transaction-title">${transaction.title}</div>
                <div class="transaction-date">${formatDate(new Date())}</div>
            </div>
            <div class="transaction-amount ${transaction.type === 'credit' ? 'positive' : 'negative'}">
                ${transaction.amount}
            </div>
        `;
        transactionsList.prepend(transactionElement);
    }

    function updateBalance(coinsToAdd) {
        const balanceElement = document.getElementById('balanceAmount');
        const currentBalance = parseInt(balanceElement.textContent.replace(/,/g, ''));
        const newBalance = currentBalance + coinsToAdd;
        balanceElement.textContent = newBalance.toLocaleString() + ' coins';
    }

    function formatDate(date) {
        return date.toISOString().split('T')[0];
    }
});