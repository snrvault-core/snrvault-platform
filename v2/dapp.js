// =========================================================
// dapp.js - SNR Sovereign Enterprise Full Production Driver
// Built for Ethers.js (v5 & v6 Auto-compatible)
// =========================================================

// 1. SMART CONTRACT ADDRESSES
const SNR_TOKEN_ADDRESS = "0x5ce1427f77d8c58f97f5e18b36804fd54aa72718";
const STAKING_CONTRACT_ADDRESS = "0x59a7098D86ac1548dAF3b14aAfC43858D274f543";

// 2. COMPLETE ABI MAPPINGS
const STAKING_ABI = [
    // --- WRITE FUNCTIONS ---
    "function joinProtocol(uint256 _amount, address _mentor, uint256 _days) external",
    "function harvestDailyReward() external",
    "function claimLeaderRewards() external",
    "function withdrawReadyBalance(uint256 _amount) external",
    "function unstakePrincipal(uint256 _amount) external",
    "function requestAssetAcquisition(uint8 _t, uint256 _v, string _model, uint8 _p) external",
    "function claimSovereignPrincipal() external",

    // --- READ / VIEW FUNCTIONS ---
    "function users(address) view returns (bool isActive, uint256 participation, uint256 currentRank, uint256 totalRewardClaimed, uint256 directActiveCount, uint256 groupVolume, uint256 durationEnd, uint256 lastUpdate, uint256 dailyYieldBP, address mentor)",
    "function leaderRewards(address) view returns (uint256)",
    "function getDashboard(address _user) external view returns (tuple(" +
        "address wallet, uint256 stakingPrincipal, uint256 currentReward, uint256 rewardClaimed, uint256 readyWithdraw, " +
        "uint256 totalStakingAsset, uint256 dailyYieldBP, uint256 stakingEndDate, uint256 remainingLock, bool stakingActive, " +
        "uint8 assetType, uint256 assetValue, uint256 assetPrincipalLocked, uint256 assetEndDate, uint256 assetRemaining, " +
        "bool assetVerified, bool assetDelivered, uint8 protocolPath, string unitModel, string licensePlate, " +
        "uint256 directActive, uint256 groupVolume, uint256 rank, uint256 leaderReward, uint256 leaderRewardClaimed, " +
        "uint256 leaderRewardAccumulated, bool leaderCapReached, uint256 rewardCap, uint256 rewardCapRemaining, " +
        "bool blacklisted, bool fundLocked, bool protocolPaused, bool lockdown, bool emergencyMode" +
    "))",

    // --- EVENTS ---
    "event RewardHarvested(address indexed user, uint256 netToCompound, uint256 netToReadyWD)",
    "event RankUpgraded(address indexed user, uint256 newRank)",
    "event AssetActivated(address indexed user, uint8 atype, uint256 value, uint8 path)"
];

const ERC20_ABI = [
    "function approve(address spender, uint256 amount) external returns (bool)",
    "function allowance(address owner, address spender) external view returns (uint256)",
    "function balanceOf(address account) external view returns (uint256)",
    "event Transfer(address indexed from, address indexed to, uint256 value)"
];

// 3. GLOBAL VARIABLES
let provider;
let signer;
let stakingContract;
let snrContract;
let currentUserAddress;

// ==========================================
// KONEKSI WALLET & INITIALIZATION
// ==========================================
async function connectWallet() {
    if (typeof window.ethereum !== 'undefined' || typeof window.web3 !== 'undefined') {
        try {
            const eth = window.ethereum || window.web3.currentProvider;
            if (eth.request) {
                await eth.request({ method: 'eth_requestAccounts' });
            } else if (eth.enable) {
                await eth.enable();
            }

            // Integrasi Provider (Dukungan Ethers v5 & v6)
            if (typeof ethers.BrowserProvider !== 'undefined') {
                provider = new ethers.BrowserProvider(eth);
                signer = await provider.getSigner();
            } else if (typeof ethers.providers !== 'undefined') {
                provider = new ethers.providers.Web3Provider(eth);
                signer = provider.getSigner();
            } else {
                throw new Error("Library Ethers.js tidak ditemukan!");
            }

            currentUserAddress = await (signer.getAddress ? signer.getAddress() : signer.getAddress);

            // Inisialisasi Kontrak dengan Signer untuk kemampuan Read & Write
            stakingContract = new ethers.Contract(STAKING_CONTRACT_ADDRESS, STAKING_ABI, signer);
            snrContract = new ethers.Contract(SNR_TOKEN_ADDRESS, ERC20_ABI, signer);

            // Update UI Button
            const connectBtn = document.getElementById('btn-connect-wallet');
            if (connectBtn) {
                const shortAddress = currentUserAddress.substring(0, 6) + '...' + currentUserAddress.substring(currentUserAddress.length - 4);
                connectBtn.innerHTML = '<i data-lucide="check-circle" class="w-4 h-4"></i> <span>' + shortAddress + '</span>';
                if (typeof lucide !== 'undefined') lucide.createIcons();
            }

            // Sync Saldo Native BNB
            const bnbBalance = await provider.getBalance(currentUserAddress);
            const formattedBNB = typeof ethers.formatEther !== 'undefined' 
                ? ethers.formatEther(bnbBalance) 
                : ethers.utils.formatEther(bnbBalance);

            const bnbElem = document.getElementById('ui-bnb-balance');
            if (bnbElem) bnbElem.innerText = parseFloat(formattedBNB).toFixed(4);

            // Load Data Dashboard & History
            await updateDashboardBalances();
            await loadTransactionHistory();

            // Auto-Reload saat Ganti Akun / Network
            if (eth.on) {
                eth.on('accountsChanged', () => window.location.reload());
                eth.on('chainChanged', () => window.location.reload());
            }

        } catch (error) {
            console.error("Connection Error:", error);
            alert("Gagal konek wallet: " + (error.message || error));
        }
    } else {
        alert("Tolong buka website ini melalui DApp Browser (TokenPocket, TrustWallet, MetaMask) agar fungsi Web3 berjalan.");
    }
}

// Alias universal
window.initWeb3 = connectWallet;

// ==========================================
// TRANSAKSI WRITE (MEMBER ACTIONS)
// ==========================================

// 1. Join Protocol / Stake
async function btnActionJoinProtocol(amountFormatted, mentorAddress, durationDays) {
    if (!stakingContract || !currentUserAddress) return alert("Silakan hubungkan wallet Anda terlebih dahulu!");
    try {
        showTxModal('loading', 'Menyiapkan Transaksi Staking...');
        const parseUnits = ethers.parseUnits || ethers.utils.parseUnits;
        const amountWei = parseUnits(amountFormatted.toString(), 18);
        const mentor = (mentorAddress && (ethers.isAddress ? ethers.isAddress(mentorAddress) : ethers.utils.isAddress(mentorAddress))) 
            ? mentorAddress 
            : "0x0000000000000000000000000000000000000000";

        // Check & Approve Allowance
        const allowance = await snrContract.allowance(currentUserAddress, STAKING_CONTRACT_ADDRESS);
        if (BigInt(allowance.toString()) < BigInt(amountWei.toString())) {
            showTxModal('loading', 'Meminta Izin Token (Approve SNR)...');
            const approveTx = await snrContract.approve(STAKING_CONTRACT_ADDRESS, amountWei);
            await approveTx.wait();
        }

        showTxModal('loading', 'Mengirim Transaksi Staking...');
        const tx = await stakingContract.joinProtocol(amountWei, mentor, durationDays || 30);
        await tx.wait();

        showTxModal('success', 'Staking Berhasil Diaktifkan!');
        await updateDashboardBalances();
    } catch (err) {
        handleTxError(err);
    }
}

// 2. Harvest Daily Reward
async function btnActionHarvest() {
    if (!stakingContract || !currentUserAddress) return alert("Silakan hubungkan wallet terlebih dahulu!");
    try {
        showTxModal('loading', 'Memproses Klaim Hasil Harian...');
        const tx = await stakingContract.harvestDailyReward();
        await tx.wait();

        showTxModal('success', 'Panen Reward Harian Berhasil!');
        await updateDashboardBalances();
    } catch (err) {
        handleTxError(err);
    }
}

// 3. Claim Leader / Network Reward
async function btnActionClaimLeader() {
    if (!stakingContract || !currentUserAddress) return alert("Silakan hubungkan wallet terlebih dahulu!");
    try {
        showTxModal('loading', 'Memproses Klaim Bonus Leader...');
        const tx = await stakingContract.claimLeaderRewards();
        await tx.wait();

        showTxModal('success', 'Bonus Leader Berhasil Dicairkan!');
        await updateDashboardBalances();
    } catch (err) {
        handleTxError(err);
    }
}

// 4. Withdraw Ready Balance
async function btnActionWithdrawReady(amountFormatted) {
    if (!stakingContract || !currentUserAddress) return alert("Silakan hubungkan wallet terlebih dahulu!");
    try {
        showTxModal('loading', 'Memproses Penarikan Saldo...');
        const parseUnits = ethers.parseUnits || ethers.utils.parseUnits;
        const amountWei = parseUnits(amountFormatted.toString(), 18);

        const tx = await stakingContract.withdrawReadyBalance(amountWei);
        await tx.wait();

        showTxModal('success', 'Penarikan Saldo Berhasil!');
        await updateDashboardBalances();
    } catch (err) {
        handleTxError(err);
    }
}

// 5. Unstake Principal Modal Pokok
async function btnActionUnstake(amountFormatted) {
    if (!stakingContract || !currentUserAddress) return alert("Silakan hubungkan wallet terlebih dahulu!");
    try {
        showTxModal('loading', 'Memproses Penarikan Modal Pokok...');
        const parseUnits = ethers.parseUnits || ethers.utils.parseUnits;
        const amountWei = parseUnits(amountFormatted.toString(), 18);

        const tx = await stakingContract.unstakePrincipal(amountWei);
        await tx.wait();

        showTxModal('success', 'Modal Pokok Berhasil Ditarik!');
        await updateDashboardBalances();
    } catch (err) {
        handleTxError(err);
    }
}

// 6. Request Asset Acquisition Program
async function btnActionRequestAsset(assetTypeEnum, assetValueFormatted, unitModel, protocolPathEnum) {
    if (!stakingContract || !currentUserAddress) return alert("Silakan hubungkan wallet terlebih dahulu!");
    try {
        showTxModal('loading', 'Mengirimkan Pengajuan Program Aset...');
        const parseUnits = ethers.parseUnits || ethers.utils.parseUnits;
        const valueWei = parseUnits(assetValueFormatted.toString(), 18);

        const tx = await stakingContract.requestAssetAcquisition(assetTypeEnum, valueWei, unitModel || "", protocolPathEnum || 0);
        await tx.wait();

        showTxModal('success', 'Pengajuan Program Aset Berhasil!');
        await updateDashboardBalances();
    } catch (err) {
        handleTxError(err);
    }
}

// 7. Claim Sovereign Principal (Cairkan Jaminan Aset)
async function btnActionClaimSovereignAsset() {
    if (!stakingContract || !currentUserAddress) return alert("Silakan hubungkan wallet terlebih dahulu!");
    try {
        showTxModal('loading', 'Mencairkan Jaminan Aset Program...');
        const tx = await stakingContract.claimSovereignPrincipal();
        await tx.wait();

        showTxModal('success', 'Pencairan Jaminan Aset Berhasil!');
        await updateDashboardBalances();
    } catch (err) {
        handleTxError(err);
    }
}

// ==========================================
// READ & SINKRONISASI DASHBOARD REAL-TIME
// ==========================================
async function updateDashboardBalances() {
    if (!stakingContract || !currentUserAddress) return;

    try {
        const formatUnits = ethers.formatUnits || ethers.utils.formatUnits;
        const fmt = (val) => parseFloat(formatUnits(val || 0, 18)).toLocaleString('id-ID', { maximumFractionDigits: 2 });

        // Get SNR Token Balance
        const snrBalance = await snrContract.balanceOf(currentUserAddress);
        updateUI('ui-snr-balance', fmt(snrBalance) + " SNR");
        updateUI('ui-wallet-balance', fmt(snrBalance) + " SNR");

        // Single Call via getDashboard View Function
        const d = await stakingContract.getDashboard(currentUserAddress);

        // Populate Staking Data
        updateUI('ui-staking-principal', fmt(d.stakingPrincipal) + " SNR");
        updateUI('ui-current-reward', fmt(d.currentReward) + " SNR");
        updateUI('ui-pending-reward', fmt(d.currentReward) + " SNR");
        updateUI('ui-reward-claimed', fmt(d.rewardClaimed) + " SNR");
        updateUI('ui-ready-withdraw', fmt(d.readyWithdraw) + " SNR");
        updateUI('ui-total-staking-asset', fmt(d.totalStakingAsset) + " SNR");
        updateUI('ui-daily-yield-bp', (Number(d.dailyYieldBP) / 100).toFixed(2) + "% / hari");
        updateUI('ui-remaining-lock', formatSeconds(Number(d.remainingLock)));

        // Populate Asset Data
        updateUI('ui-asset-value', fmt(d.assetValue) + " SNR");
        updateUI('ui-asset-locked', fmt(d.assetPrincipalLocked) + " SNR");
        updateUI('ui-asset-model', d.unitModel || "Belum Ada Program");
        updateUI('ui-asset-remaining', formatSeconds(Number(d.assetRemaining)));

        // Populate Leader & Network Data
        updateUI('ui-direct-active', d.directActive.toString());
        updateUI('ui-group-volume', fmt(d.groupVolume) + " SNR");
        updateUI('ui-current-rank', "Rank " + d.rank.toString());
        updateUI('ui-leader-reward', fmt(d.leaderReward) + " SNR");

    } catch (err) {
        console.error("Gagal sinkronisasi data dashboard:", err);
    }
}

async function loadTransactionHistory() {
    console.log("Loading transaction history for:", currentUserAddress);
}

// ==========================================
// HELPER UTILITIES
// ==========================================
function updateUI(elementId, textValue) {
    const el = document.getElementById(elementId);
    if (el) el.innerText = textValue;
}

function formatSeconds(seconds) {
    if (seconds <= 0) return "Selesai / Bebas";
    const days = Math.floor(seconds / (3600 * 24));
    const hours = Math.floor((seconds % (3600 * 24)) / 3600);
    return `${days} Hari ${hours} Jam`;
}

function showTxModal(type, text) {
    console.log(`[Tx Modal - ${type.toUpperCase()}]: ${text}`);
    if (type === 'error') {
        alert("Transaksi Gagal: " + text);
    } else if (type === 'success') {
        alert("Berhasil: " + text);
    }
}

function handleTxError(err) {
    console.error("Tx Error:", err);
    let msg = err.reason || err.message || "Transaksi Dibatalkan atau Gagal";
    showTxModal('error', msg);
}

// DOM Event Listener
window.addEventListener('DOMContentLoaded', () => {
    const btnConnect = document.getElementById("btn-connect-wallet");
    if (btnConnect) {
        btnConnect.addEventListener("click", connectWallet);
    }
});
