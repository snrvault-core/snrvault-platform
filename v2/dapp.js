// dapp.js - SNR Sovereign Enterprise Production Driver (Ethers.js v6)

const CONTRACT_ADDRESS = "0x...ADDRESS_SMART_CONTRACT_STAKING...";
const SNR_TOKEN_ADDRESS = "0x...ADDRESS_TOKEN_ERC20_SNR...";

// Complete ABI mapping from SNRStakingV6_TITAN_SOVEREIGN_ENTERPRISE
const SNR_STAKING_ABI = [
    // --- WRITE FUNCTIONS ---
    "function joinProtocol(uint256 _amount, address _mentor, uint256 _days) external",
    "function harvestDailyReward() external",
    "function claimLeaderRewards() external",
    "function withdrawReadyBalance(uint256 _amount) external",
    "function unstakePrincipal(uint256 _amount) external",
    "function requestAssetAcquisition(uint8 _t, uint256 _v, string _model, uint8 _p) external",
    "function claimSovereignPrincipal() external",
    
    // --- READ FUNCTIONS ---
    "function getDashboard(address _user) external view returns (tuple(" +
        "address wallet, uint256 stakingPrincipal, uint256 currentReward, uint256 rewardClaimed, uint256 readyWithdraw, " +
        "uint256 totalStakingAsset, uint256 dailyYieldBP, uint256 stakingEndDate, uint256 remainingLock, bool stakingActive, " +
        "uint8 assetType, uint256 assetValue, uint256 assetPrincipalLocked, uint256 assetEndDate, uint256 assetRemaining, " +
        "bool assetVerified, bool assetDelivered, uint8 protocolPath, string unitModel, string licensePlate, " +
        "uint256 directActive, uint256 groupVolume, uint256 rank, uint256 leaderReward, uint256 leaderRewardClaimed, " +
        "uint256 leaderRewardAccumulated, bool leaderCapReached, uint256 rewardCap, uint256 rewardCapRemaining, " +
        "bool blacklisted, bool fundLocked, bool protocolPaused, bool lockdown, bool emergencyMode" +
    "))",
    "function getProtocolStatistics() external view returns (tuple(" +
        "uint256 totalPrincipal, uint256 totalReferral, uint256 totalWithdraw, uint256 totalLiability, " +
        "uint256 reserveBalance, uint256 reserveHealthBP, bool solvent" +
    "))",
    
    // --- EVENTS ---
    "event JoinedProtocol(address indexed user, uint256 amount, uint256 daysLock)",
    "event RewardHarvested(address indexed user, uint256 amount)",
    "event LeaderRewardClaimed(address indexed user, uint256 amount)",
    "event PrincipalUnstaked(address indexed user, uint256 amount)"
];

const ERC20_ABI = [
    "function approve(address spender, uint256 amount) external returns (bool)",
    "function allowance(address owner, address spender) external view returns (uint256)",
    "function balanceOf(address account) external view returns (uint256)"
];

let provider, signer, userAddress, stakingContract, tokenContract;

// ==========================================
// 1. KONEKSI WALLET & INITIALIZATION
// ==========================================
async function initWeb3() {
    if (window.ethereum) {
        try {
            provider = new ethers.BrowserProvider(window.ethereum);
            await provider.send("eth_requestAccounts", []);
            signer = await provider.getSigner();
            userAddress = await signer.getAddress();

            stakingContract = new ethers.Contract(CONTRACT_ADDRESS, SNR_STAKING_ABI, signer);
            tokenContract = new ethers.Contract(SNR_TOKEN_ADDRESS, ERC20_ABI, signer);

            // Ganti teks tombol connect wallet jika ada di UI
            const btnConnect = document.getElementById("btn-connect-wallet");
            if (btnConnect) {
                btnConnect.innerText = userAddress.substring(0, 6) + "..." + userAddress.substring(38);
            }

            // Sync data awal
            await fetchAndRenderDashboard();
            
            // Listen event pergantian akun Metamask
            window.ethereum.on('accountsChanged', () => window.location.reload());
            window.ethereum.on('chainChanged', () => window.location.reload());

        } catch (error) {
            console.error("User rejected connection", error);
            showTxModal('error', 'Gagal Menghubungkan Wallet');
        }
    } else {
        alert("Metamask atau Web3 Wallet tidak terdeteksi!");
    }
}

// ==========================================
// 2. LOGIKA PENANGANAN TRANSAKSI (WRITE)
// ==========================================

// Tombol: Join Protocol / Stake
async function btnActionJoinProtocol(amount, mentorAddress, durationDays) {
    try {
        showTxModal('loading', 'Menyiapkan Transaksi Staking...');
        const amountWei = ethers.parseUnits(amount.toString(), 18);
        const mentor = mentorAddress && ethers.isAddress(mentorAddress) ? mentorAddress : "0x0000000000000000000000000000000000000000";

        // Step 1: Check Allowance
        const allowance = await tokenContract.allowance(userAddress, CONTRACT_ADDRESS);
        if (allowance < amountWei) {
            showTxModal('loading', 'Meminta Izin Token (Approve)...');
            const approveTx = await tokenContract.approve(CONTRACT_ADDRESS, amountWei);
            await approveTx.wait();
        }

        // Step 2: Execute Join
        showTxModal('loading', 'Mengirim Modal ke Smart Contract...');
        const tx = await stakingContract.joinProtocol(amountWei, mentor, durationDays);
        await tx.wait();

        showTxModal('success', 'Staking Berhasil Diaktifkan!');
        await fetchAndRenderDashboard();
    } catch (err) {
        handleTxError(err);
    }
}

// Tombol: Harvest Daily Reward
async function btnActionHarvest() {
    try {
        showTxModal('loading', 'Memproses Klaim Hasil Harian...');
        const tx = await stakingContract.harvestDailyReward();
        await tx.wait();

        showTxModal('success', 'Panen Reward Harian Berhasil!');
        await fetchAndRenderDashboard();
    } catch (err) {
        handleTxError(err);
    }
}

// Tombol: Claim Leader / Referral Reward
async function btnActionClaimLeader() {
    try {
        showTxModal('loading', 'Memproses Klaim Leader Reward...');
        const tx = await stakingContract.claimLeaderRewards();
        await tx.wait();

        showTxModal('success', 'Bonus Leader Berhasil Dicairkan!');
        await fetchAndRenderDashboard();
    } catch (err) {
        handleTxError(err);
    }
}

// Tombol: Withdraw Ready Balance
async function btnActionWithdrawReady(amount) {
    try {
        showTxModal('loading', 'Memproses Penarikan Saldo...');
        const amountWei = ethers.parseUnits(amount.toString(), 18);
        const tx = await stakingContract.withdrawReadyBalance(amountWei);
        await tx.wait();

        showTxModal('success', 'Penarikan Saldo Berhasil!');
        await fetchAndRenderDashboard();
    } catch (err) {
        handleTxError(err);
    }
}

// Tombol: Unstake Principal
async function btnActionUnstake(amount) {
    try {
        showTxModal('loading', 'Pencabutan Modal Pokok...');
        const amountWei = ethers.parseUnits(amount.toString(), 18);
        const tx = await stakingContract.unstakePrincipal(amountWei);
        await tx.wait();

        showTxModal('success', 'Modal Pokok Berhasil Ditarik!');
        await fetchAndRenderDashboard();
    } catch (err) {
        handleTxError(err);
    }
}

// Tombol: Request Asset Program
async function btnActionRequestAsset(assetTypeEnum, assetValue, unitModel, protocolPathEnum) {
    try {
        showTxModal('loading', 'Mengirimkan Pengajuan Aset Program...');
        const valueWei = ethers.parseUnits(assetValue.toString(), 18);
        const tx = await stakingContract.requestAssetAcquisition(assetTypeEnum, valueWei, unitModel, protocolPathEnum);
        await tx.wait();

        showTxModal('success', 'Pengajuan Program Aset Berhasil!');
        await fetchAndRenderDashboard();
    } catch (err) {
        handleTxError(err);
    }
}

// Tombol: Claim Sovereign Principal (Pengembalian Modal Aset)
async function btnActionClaimSovereignAsset() {
    try {
        showTxModal('loading', 'Mencairkan Jaminan Aset Program...');
        const tx = await stakingContract.claimSovereignPrincipal();
        await tx.wait();

        showTxModal('success', 'Pencairan Jaminan Aset Berhasil!');
        await fetchAndRenderDashboard();
    } catch (err) {
        handleTxError(err);
    }
}

// ==========================================
// 3. SINKRONISASI DATA KE DASHBOARD (READ)
// ==========================================
async function fetchAndRenderDashboard() {
    if (!stakingContract || !userAddress) return;

    try {
        // Single call batch reading
        const d = await stakingContract.getDashboard(userAddress);
        const userBalance = await tokenContract.balanceOf(userAddress);
        const bnbBalance = await provider.getBalance(userAddress);

        // Helper formatter
        const fmt = (val) => parseFloat(ethers.formatUnits(val || 0, 18)).toLocaleString('id-ID', { maximumFractionDigits: 2 });
        const fmt4 = (val) => parseFloat(ethers.formatUnits(val || 0, 18)).toLocaleString('id-ID', { maximumFractionDigits: 4 });

        // Update Global UI
        updateUI('ui-bnb-balance', fmt4(bnbBalance));

        // Update Staking UI
        updateUI('ui-wallet-balance', fmt(userBalance) + " SNR");
        updateUI('ui-staking-principal', fmt(d.stakingPrincipal) + " SNR");
        updateUI('ui-current-reward', fmt(d.currentReward) + " SNR");
        updateUI('ui-reward-claimed', fmt(d.rewardClaimed) + " SNR");
        updateUI('ui-ready-withdraw', fmt(d.readyWithdraw) + " SNR");
        updateUI('ui-total-staking-asset', fmt(d.totalStakingAsset) + " SNR");
        updateUI('ui-daily-yield-bp', (Number(d.dailyYieldBP) / 100).toFixed(2) + "% / hari");
        updateUI('ui-remaining-lock', formatSeconds(Number(d.remainingLock)));

        // Update Asset UI
        updateUI('ui-asset-value', fmt(d.assetValue) + " SNR");
        updateUI('ui-asset-locked', fmt(d.assetPrincipalLocked) + " SNR");
        updateUI('ui-asset-model', d.unitModel || "Belum Ada Program");
        updateUI('ui-asset-remaining', formatSeconds(Number(d.assetRemaining)));

        // Update Network & Referral UI
        updateUI('ui-direct-active', d.directActive.toString());
        updateUI('ui-group-volume', fmt(d.groupVolume) + " SNR");
        updateUI('ui-current-rank', "Rank " + d.rank.toString());
        updateUI('ui-leader-reward', fmt(d.leaderReward) + " SNR");

        // System Security States Check
        if (d.blacklisted || d.lockdown || d.protocolPaused || d.emergencyMode) {
            console.warn("Sistem dalam batasan proteksi / pembekuan.");
        }

        // Sinkronisasi Transaksi History (Ledger)
        fetchTransactionHistory();

    } catch (err) {
        console.error("Gagal sinkronisasi data dashboard:", err);
    }
}

// Helper DOM Updater
function updateUI(elementId, textValue) {
    const el = document.getElementById(elementId);
    if (el) el.innerText = textValue;
}

// Helper Format Detik ke Hari/Jam
function formatSeconds(seconds) {
    if (seconds <= 0) return "Selesai / Bebas";
    const days = Math.floor(seconds / (3600 * 24));
    const hours = Math.floor((seconds % (3600 * 24)) / 3600);
    return `${days} Hari ${hours} Jam`;
}

// Helper Error Handler
function handleTxError(err) {
    console.error("Tx Error:", err);
    let msg = err.reason || err.message || "Transaksi Dibatalkan/Gagal";
    showTxModal('error', msg);
}

// ==========================================
// 4. TRANSACTION HISTORY TAB (LEDGER)
// ==========================================
async function fetchTransactionHistory() {
    if (!stakingContract || !userAddress) return;
    
    const historyList = document.getElementById('history-list');
    if (!historyList) return;
    
    try {
        historyList.innerHTML = '<div class="text-center text-secondary py-12"><i data-lucide="loader-2" class="w-8 h-8 text-secondary/50 animate-spin mx-auto mb-3"></i><span>Menyinkronkan Ledger...</span></div>';
        if(typeof lucide !== 'undefined') lucide.createIcons();

        // 1. Dapatkan filter dari kontrak
        const filterJoined = stakingContract.filters.JoinedProtocol(userAddress);
        const filterHarvest = stakingContract.filters.RewardHarvested(userAddress);
        const filterLeader = stakingContract.filters.LeaderRewardClaimed(userAddress);
        const filterUnstake = stakingContract.filters.PrincipalUnstaked(userAddress);

        // 2. Query logs (menggunakan range block terbaru untuk mencegah RPC timeout)
        const currentBlock = await provider.getBlockNumber();
        const startBlock = currentBlock > 5000 ? currentBlock - 5000 : 0; // Ambil 5000 blok terakhir (~1.5 hari di BSC)

        const [logsJoined, logsHarvest, logsLeader, logsUnstake] = await Promise.all([
            stakingContract.queryFilter(filterJoined, startBlock, currentBlock),
            stakingContract.queryFilter(filterHarvest, startBlock, currentBlock),
            stakingContract.queryFilter(filterLeader, startBlock, currentBlock),
            stakingContract.queryFilter(filterUnstake, startBlock, currentBlock)
        ]);

        // 3. Gabungkan dan urutkan
        let allEvents = [];
        
        logsJoined.forEach(log => allEvents.push({ type: 'Joined', data: log, desc: `Staked ${parseFloat(ethers.formatUnits(log.args[1] || 0, 18)).toLocaleString('id-ID')} SNR`, icon: 'arrow-down-right', color: 'text-primary', border: 'border-primary' }));
        logsHarvest.forEach(log => allEvents.push({ type: 'Harvest', data: log, desc: `Claimed ${parseFloat(ethers.formatUnits(log.args[1] || 0, 18)).toLocaleString('id-ID')} SNR`, icon: 'leaf', color: 'text-accent', border: 'border-accent' }));
        logsLeader.forEach(log => allEvents.push({ type: 'Leader', data: log, desc: `Bonus ${parseFloat(ethers.formatUnits(log.args[1] || 0, 18)).toLocaleString('id-ID')} SNR`, icon: 'users', color: 'text-green-500', border: 'border-green-500' }));
        logsUnstake.forEach(log => allEvents.push({ type: 'Unstake', data: log, desc: `Withdrawn ${parseFloat(ethers.formatUnits(log.args[1] || 0, 18)).toLocaleString('id-ID')} SNR`, icon: 'arrow-up-right', color: 'text-red-500', border: 'border-red-500' }));

        // Sort desc (terbaru di atas)
        allEvents.sort((a, b) => b.data.blockNumber - a.data.blockNumber);

        // 4. Render
        if (allEvents.length === 0) {
            historyList.innerHTML = '<div class="text-center text-secondary py-12"><i data-lucide="inbox" class="w-8 h-8 text-secondary/50 mx-auto mb-3"></i><span>Tidak ada transaksi di 5000 blok terakhir.</span></div>';
        } else {
            let html = '';
            for (const evt of allEvents) {
                const txHash = evt.data.transactionHash;
                const shortHash = txHash.substring(0, 8) + '...' + txHash.substring(txHash.length - 6);
                
                html += `
                <div class="flex gap-3 text-sm border-l-2 ${evt.border} pl-3 bg-card/30 p-3 rounded-r mb-2 hover:bg-card/60 transition-colors">
                    <i data-lucide="${evt.icon}" class="w-5 h-5 ${evt.color} shrink-0 mt-0.5"></i>
                    <div class="w-full">
                        <div class="text-white font-bold font-display flex justify-between">
                            <span>${evt.type} Protocol</span>
                            <a href="https://bscscan.com/tx/${txHash}" target="_blank" class="text-xs text-secondary hover:text-accent flex items-center gap-1">
                                ${shortHash} <i data-lucide="external-link" class="w-3 h-3"></i>
                            </a>
                        </div>
                        <div class="text-sm text-secondary font-mono mt-1">${evt.desc}</div>
                        <div class="text-[10px] text-primary/60 mt-2">Block: ${evt.data.blockNumber}</div>
                    </div>
                </div>`;
            }
            historyList.innerHTML = html;
        }
        
        if(typeof lucide !== 'undefined') lucide.createIcons();
    } catch (err) {
        console.error("Gagal sinkronisasi history:", err);
        historyList.innerHTML = '<div class="text-center text-red-500 py-12"><span>Gagal memuat ledger dari blockchain. Coba lagi nanti.</span></div>';
    }
}
