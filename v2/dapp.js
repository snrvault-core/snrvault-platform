const SNR_TOKEN_ADDRESS = "0x5ce1427f77d8c58f97f5e18b36804fd54aa72718";
const STAKING_CONTRACT_ADDRESS = "0x59a7098D86ac1548dAF3b14aAfC43858D274f543";

const STAKING_ABI = [
    "function users(address) view returns (bool isActive, uint256 participation, uint256 currentRank, uint256 totalRewardClaimed, uint256 directActiveCount, uint256 groupVolume, uint256 durationEnd, uint256 lastUpdate, uint256 dailyYieldBP, address mentor)",
    "function leaderRewards(address) view returns (uint256)",
    "event RewardHarvested(address indexed user, uint256 netToCompound, uint256 netToReadyWD)",
    "event RankUpgraded(address indexed user, uint256 newRank)",
    "event AssetActivated(address indexed user, uint8 atype, uint256 value, uint8 path)"
];

const ERC20_ABI = [
    "event Transfer(address indexed from, address indexed to, uint256 value)",
    "function balanceOf(address) view returns (uint256)"
];

let provider;
let signer;
let stakingContract;
let snrContract;
let currentUserAddress;

async function connectWallet() {
    if (typeof window.ethereum !== 'undefined') {
        try {
            await window.ethereum.request({ method: 'eth_requestAccounts' });
            provider = new ethers.providers.Web3Provider(window.ethereum);
            signer = provider.getSigner();
            currentUserAddress = await signer.getAddress();
            
            stakingContract = new ethers.Contract(STAKING_CONTRACT_ADDRESS, STAKING_ABI, provider);
            snrContract = new ethers.Contract(SNR_TOKEN_ADDRESS, ERC20_ABI, provider);

            const connectBtn = document.getElementById('btn-connect-wallet');
            if(connectBtn) {
                connectBtn.innerHTML = '<i data-lucide="check-circle" class="w-4 h-4"></i> ' + currentUserAddress.substring(0,6) + '...' + currentUserAddress.substring(currentUserAddress.length - 4);
                if(typeof lucide !== 'undefined') lucide.createIcons();
            }

            const bnbBalance = await provider.getBalance(currentUserAddress);
            document.getElementById('ui-bnb-balance').innerText = parseFloat(ethers.utils.formatEther(bnbBalance)).toFixed(4);

            await updateDashboardBalances();
            await loadTransactionHistory();

        } catch (error) {
            console.error("User denied account access", error);
        }
    } else {
        alert("Please install MetaMask or a compatible Web3 Wallet to connect.");
    }
}

async function updateDashboardBalances() {
    if(!stakingContract || !currentUserAddress) return;

    try {
        const snrBal = await snrContract.balanceOf(currentUserAddress);
        document.getElementById('ui-snr-balance').innerText = parseFloat(ethers.utils.formatUnits(snrBal, 18)).toFixed(2);
        
        const u = await stakingContract.users(currentUserAddress);
        
        const participation = parseFloat(ethers.utils.formatUnits(u.participation, 18));
        document.getElementById('stk-modal').innerText = participation.toFixed(2);
        
        const claimed = parseFloat(ethers.utils.formatUnits(u.totalRewardClaimed, 18));
        document.getElementById('stk-reward-claimed').innerText = claimed.toFixed(2);

        let lockDays = "-";
        if(u.dailyYieldBP == 100) lockDays = "30";
        else if(u.dailyYieldBP == 120) lockDays = "60";
        else if(u.dailyYieldBP == 150) lockDays = "90";
        document.getElementById('stk-lock-period').innerText = lockDays;
        
        const statusEl = document.getElementById('stk-status-badge');
        if(u.isActive) {
            statusEl.innerHTML = '<span class="text-accent">Aktif</span>';
        } else {
            statusEl.innerHTML = '<span class="text-secondary">Tidak Aktif</span>';
        }

        const now = Math.floor(Date.now() / 1000);
        const durationEnd = u.durationEnd.toNumber();
        if (durationEnd > now && u.isActive) {
            const diffDays = Math.ceil((durationEnd - now) / 86400);
            document.getElementById('stk-time-remaining').innerText = diffDays + " Hari";
        } else {
            document.getElementById('stk-time-remaining').innerText = "-";
        }

        // Live calculation for Reward Berjalan
        if(u.isActive && u.participation.gt(0)) {
            const lastUpdate = u.lastUpdate.toNumber();
            const timeDiff = now - lastUpdate;
            if(timeDiff > 0) {
                const yieldBP = u.dailyYieldBP.toNumber();
                // reward = (participation * dailyYieldBP * timeDiff) / (10000 * 86400)
                const reward = (participation * yieldBP * timeDiff) / (10000 * 86400);
                document.getElementById('stk-reward-running').innerText = reward.toFixed(4);
            }
        } else {
            document.getElementById('stk-reward-running').innerText = "0.00";
        }

        // Update Rank and Leader Rewards
        const leaderRw = await stakingContract.leaderRewards(currentUserAddress);
        const leaderRewardsEl = document.getElementById('ui-leader-rewards');
        if(leaderRewardsEl) leaderRewardsEl.innerHTML = parseFloat(ethers.utils.formatUnits(leaderRw, 18)).toFixed(2) + ' <span class="text-sm text-secondary font-sans">SNR</span>';

        const rankEl = document.getElementById('ui-current-rank');
        const rankNames = ["Member", "Star", "Captain", "Commander", "General", "Emperor"];
        if(rankEl) rankEl.innerHTML = 'RANK ' + u.currentRank + ' <span class="text-lg font-sans text-secondary">(' + (rankNames[u.currentRank] || '') + ')</span>';

        const directEl = document.getElementById('ui-direct-active');
        if(directEl) directEl.innerHTML = u.directActiveCount.toString() + ' <span class="text-sm text-secondary">Member</span>';

        const groupVolEl = document.getElementById('ui-group-volume');
        if(groupVolEl) groupVolEl.innerHTML = parseFloat(ethers.utils.formatUnits(u.groupVolume, 18)).toFixed(2) + ' <span class="text-sm text-secondary">SNR</span>';

    } catch (err) {
        console.error("Error updating balances:", err);
    }
}

async function loadTransactionHistory() {
    if(!stakingContract || !snrContract || !currentUserAddress) return;
    const historyContainer = document.getElementById('history-list');
    if(!historyContainer) return;
    
    historyContainer.innerHTML = '<div class="text-center text-secondary py-4"><i data-lucide="loader-2" class="w-8 h-8 animate-spin mx-auto mb-2"></i> Memuat Data Blockchain...</div>';
    if(typeof lucide !== 'undefined') lucide.createIcons();

    try {
        const currentBlock = await provider.getBlockNumber();
        const startBlock = currentBlock > 5000 ? currentBlock - 5000 : 0; // Fetch last 5000 blocks to avoid rate limits

        // 1. Deposits (Transfer SNR to Contract)
        const filterDeposit = snrContract.filters.Transfer(currentUserAddress, STAKING_CONTRACT_ADDRESS);
        const deposits = await snrContract.queryFilter(filterDeposit, startBlock, currentBlock);

        // 2. Withdraws (Transfer SNR from Contract to User)
        const filterWithdraw = snrContract.filters.Transfer(STAKING_CONTRACT_ADDRESS, currentUserAddress);
        const withdraws = await snrContract.queryFilter(filterWithdraw, startBlock, currentBlock);

        // 3. Harvests
        const filterHarvest = stakingContract.filters.RewardHarvested(currentUserAddress);
        const harvests = await stakingContract.queryFilter(filterHarvest, startBlock, currentBlock);

        let allTx = [];

        deposits.forEach(ev => {
            allTx.push({
                type: 'Deposit Staking',
                amount: parseFloat(ethers.utils.formatUnits(ev.args.value, 18)),
                hash: ev.transactionHash,
                blockNumber: ev.blockNumber,
                color: 'text-green-400',
                icon: 'arrow-down-right'
            });
        });

        withdraws.forEach(ev => {
            allTx.push({
                type: 'Withdrawal / Claim',
                amount: parseFloat(ethers.utils.formatUnits(ev.args.value, 18)),
                hash: ev.transactionHash,
                blockNumber: ev.blockNumber,
                color: 'text-yellow-400',
                icon: 'arrow-up-right'
            });
        });

        harvests.forEach(ev => {
            allTx.push({
                type: 'Harvest Reward',
                amount: parseFloat(ethers.utils.formatUnits(ev.args.netToCompound.add(ev.args.netToReadyWD), 18)),
                hash: ev.transactionHash,
                blockNumber: ev.blockNumber,
                color: 'text-accent',
                icon: 'leaf'
            });
        });

        allTx.sort((a,b) => b.blockNumber - a.blockNumber);

        if(allTx.length === 0) {
            historyContainer.innerHTML = '<div class="text-center text-secondary py-8">Belum ada riwayat transaksi.</div>';
            return;
        }

        let html = '';
        allTx.forEach(tx => {
            html += 
            <div class="flex items-center justify-between p-4 bg-background/50 border border-cardBorder rounded-lg mb-2 hover:border-primary/50 transition-colors">
                <div class="flex items-center gap-3">
                    <div class="p-2 rounded bg-card border border-cardBorder"><i data-lucide="" class=" w-5 h-5"></i></div>
                    <div>
                        <div class="font-bold font-display text-sm"></div>
                        <a href="https://bscscan.com/tx/" target="_blank" class="text-xs text-primary hover:underline">Lihat di Explorer <i data-lucide="external-link" class="w-3 h-3 inline"></i></a>
                    </div>
                </div>
                <div class="text-right">
                    <div class="font-bold  font-display"> SNR</div>
                    <div class="text-xs text-secondary">Block: </div>
                </div>
            </div>;
        });
        historyContainer.innerHTML = html;
        if(typeof lucide !== 'undefined') lucide.createIcons();

    } catch(err) {
        console.error("Error fetching history:", err);
        historyContainer.innerHTML = '<div class="text-center text-red-400 py-4">Gagal memuat history. Pastikan koneksi RPC lancar.</div>';
    }
}

// Ensure executeProtocol uses ethers if available
async function executeProtocol() {
    // Basic validation
    const amountInput = document.getElementById('stake-amount').value;
    const durationInput = document.getElementById('stake-duration').value;
    showTxModal('loading', 'Executing Protocol', 'Please approve transaction in your wallet...');
    setTimeout(() => {
        showTxModal('success', 'Protocol Active', Staking simulation successful.);
    }, 2000);
}

window.connectWallet = connectWallet;
window.executeProtocol = executeProtocol;
