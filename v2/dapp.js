// =========================================================
// dapp.js - SNR Sovereign Enterprise Full Production Driver
// Built for Ethers.js (v5 & v6 Auto-compatible)
// =========================================================

// =========================================================
// MULTI-LANGUAGE / BILINGUAL SYSTEM
// =========================================================
const translations = {
    id: {
        connectWallet: "Hubungkan Wallet",
        stakingTitle: "Staking SNR",
        minStake: "Jumlah staking minimal adalah 100 SNR!",
        stakeAmount: "Jumlah Staking",
        mentorAddress: "Alamat Mentor / Sponsor",
        executeBtn: "Eksekusi Protokol",
        harvestBtn: "Panen Reward",
        claimLeaderBtn: "Klaim Bonus Leader",
        withdrawBtn: "Tarik Saldo",
        totalStaked: "Total Staking",
        dailyYield: "Hasil Harian",
        readyWithdraw: "Saldo Siap Tarik",
        rank: "Peringkat",
        duration30: "30 Hari",
        duration60: "60 Hari",
        duration90: "90 Hari",
        txLoadingPrep: "Menyiapkan Transaksi Staking...",
        txLoadingApprove: "Meminta Izin Token (Approve SNR)...",
        txLoadingSend: "Mengirim Transaksi Staking...",
        txLoadingHarvest: "Memproses Klaim Hasil Harian...",
        txLoadingClaimLeader: "Memproses Klaim Bonus Leader...",
        txLoadingWithdraw: "Memproses Penarikan Saldo...",
        txSuccessStake: "Staking Berhasil Diaktifkan!",
        txSuccessHarvest: "Panen Reward Harian Berhasil!",
        txSuccessClaimLeader: "Bonus Leader Berhasil Dicairkan!",
        txSuccessWithdraw: "Penarikan Saldo Berhasil!",
        errConnectWallet: "Silakan hubungkan wallet Anda terlebih dahulu!",
        errEthersNotFound: "Library Ethers.js tidak ditemukan di window!",
        errConnectFailed: "Gagal konek wallet: ",
        errTxRejected: "Transaksi dibatalkan oleh pengguna.",
        errTxFailed: "Transaksi Dibatalkan atau Gagal",
        days: "Hari",
        hours: "Jam",
        completedFree: "Selesai / Bebas"
    },
    en: {
        connectWallet: "Connect Wallet",
        stakingTitle: "SNR Staking",
        minStake: "Minimum staking amount is 100 SNR!",
        stakeAmount: "Staking Amount",
        mentorAddress: "Mentor / Sponsor Address",
        executeBtn: "Execute Protocol",
        harvestBtn: "Harvest Reward",
        claimLeaderBtn: "Claim Leader Bonus",
        withdrawBtn: "Withdraw Balance",
        totalStaked: "Total Staked",
        dailyYield: "Daily Yield",
        readyWithdraw: "Ready to Withdraw",
        rank: "Rank",
        duration30: "30 Days",
        duration60: "60 Days",
        duration90: "90 Days",
        txLoadingPrep: "Preparing Staking Transaction...",
        txLoadingApprove: "Requesting Token Allowance (Approve SNR)...",
        txLoadingSend: "Sending Staking Transaction...",
        txLoadingHarvest: "Processing Daily Yield Claim...",
        txLoadingClaimLeader: "Processing Leader Bonus Claim...",
        txLoadingWithdraw: "Processing Balance Withdrawal...",
        txSuccessStake: "Staking Activated Successfully!",
        txSuccessHarvest: "Daily Reward Harvested Successfully!",
        txSuccessClaimLeader: "Leader Bonus Claimed Successfully!",
        txSuccessWithdraw: "Balance Withdrawal Successful!",
        errConnectWallet: "Please connect your wallet first!",
        errEthersNotFound: "Ethers.js library not found in window!",
        errConnectFailed: "Failed to connect wallet: ",
        errTxRejected: "Transaction rejected by user.",
        errTxFailed: "Transaction Cancelled or Failed",
        days: "Days",
        hours: "Hours",
        completedFree: "Completed / Free"
    }
};

let currentLang = localStorage.getItem('dapp_lang') || 'id';

function setLanguage(lang) {
    if (!translations[lang]) return;
    currentLang = lang;
    localStorage.setItem('dapp_lang', lang);

    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[lang][key]) {
            if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                el.placeholder = translations[lang][key];
            } else {
                el.innerText = translations[lang][key];
            }
        }
    });

    const langBtn = document.getElementById('btn-lang-toggle');
    if (langBtn) {
        langBtn.innerText = lang.toUpperCase();
    }
}

function toggleLanguage() {
    const nextLang = currentLang === 'id' ? 'en' : 'id';
    setLanguage(nextLang);
}

window.setLanguage = setLanguage;
window.toggleLanguage = toggleLanguage;

// 1. SMART CONTRACT CONFIGURATION
const SNR_TOKEN_ADDRESS = "0x5ce1427f77d8c58f97f5e18b36804fd54aa72718";
const STAKING_CONTRACT_ADDRESS = "0x59a7098D86ac1548dAF3b14aAfC43858D274f543";
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

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
let provider = null;
let signer = null;
let stakingContract = null;
let snrContract = null;
let currentUserAddress = null;

// ==========================================
// KONEKSI WALLET & INITIALIZATION
// ==========================================
async function connectWallet() {
    if (typeof window.ethereum === 'undefined' && typeof window.web3 === 'undefined') {
        alert("Tolong buka website ini melalui DApp Browser (TokenPocket, TrustWallet, MetaMask) agar fungsi Web3 berjalan.");
        return;
    }

    try {
        const eth = window.ethereum || window.web3.currentProvider;
        
        if (eth.request) {
            await eth.request({ method: 'eth_requestAccounts' });
        } else if (eth.enable) {
            await eth.enable();
        }

        // Deteksi Versi Ethers.js (v5 vs v6)
        if (typeof ethers.BrowserProvider !== 'undefined') {
            provider = new ethers.BrowserProvider(eth);
            signer = await provider.getSigner();
            currentUserAddress = await signer.getAddress();
        } else if (typeof ethers.providers !== 'undefined') {
            provider = new ethers.providers.Web3Provider(eth);
            signer = provider.getSigner();
            currentUserAddress = await signer.getAddress();
        } else {
            throw new Error(translations[currentLang].errEthersNotFound);
        }

        // Inisialisasi Instance Smart Contract
        stakingContract = new ethers.Contract(STAKING_CONTRACT_ADDRESS, STAKING_ABI, signer);
        snrContract = new ethers.Contract(SNR_TOKEN_ADDRESS, ERC20_ABI, signer);

        // Update UI Identitas Wallet
        const connectBtn = document.getElementById('btn-connect-wallet');
        if (connectBtn) {
            const shortAddress = `${currentUserAddress.substring(0, 6)}...${currentUserAddress.substring(currentUserAddress.length - 4)}`;
            connectBtn.innerHTML = `<i data-lucide="check-circle" class="w-4 h-4"></i> <span>${shortAddress}</span>`;
            if (typeof lucide !== 'undefined') lucide.createIcons();
        }

        // Sync Saldo Native Coin (BNB)
        const bnbBalance = await provider.getBalance(currentUserAddress);
        const formatEther = ethers.formatEther || ethers.utils.formatEther;
        const formattedBNB = formatEther(bnbBalance);

        const bnbElem = document.getElementById('ui-bnb-balance');
        if (bnbElem) bnbElem.innerText = parseFloat(formattedBNB).toFixed(4);

        // Fetch Data Dashboard
        await updateDashboardBalances();

        // Register Event Listeners untuk Wallet
        if (eth.on) {
            eth.removeAllListeners?.('accountsChanged');
            eth.removeAllListeners?.('chainChanged');
            eth.on('accountsChanged', () => window.location.reload());
            eth.on('chainChanged', () => window.location.reload());
        }

    } catch (error) {
        console.error("Connection Error:", error);
        alert(translations[currentLang].errConnectFailed + (error.reason || error.message || error));
    }
}

window.initWeb3 = connectWallet;

// ==========================================
// TRANSAKSI WRITE (MEMBER ACTIONS)
// ==========================================

// 1. Core Join Protocol Execution
async function btnActionJoinProtocol(amountFormatted, mentorAddress, durationDays) {
    if (!stakingContract || !currentUserAddress) return alert(translations[currentLang].errConnectWallet);
    
    try {
        showTxModal('loading', translations[currentLang].txLoadingPrep);
        const parseUnits = ethers.parseUnits || ethers.utils.parseUnits;
        const isAddress = ethers.isAddress || ethers.utils.isAddress;

        const amountWei = parseUnits(amountFormatted.toString(), 18);
        const mentor = (mentorAddress && isAddress(mentorAddress)) 
            ? mentorAddress 
            : ZERO_ADDRESS;

        // Check & Approve Allowance
        const allowance = await snrContract.allowance(currentUserAddress, STAKING_CONTRACT_ADDRESS);
        if (BigInt(allowance.toString()) < BigInt(amountWei.toString())) {
            showTxModal('loading', translations[currentLang].txLoadingApprove);
            const approveTx = await snrContract.approve(STAKING_CONTRACT_ADDRESS, amountWei);
            await approveTx.wait();
        }

        showTxModal('loading', translations[currentLang].txLoadingSend);
        const tx = await stakingContract.joinProtocol(amountWei, mentor, durationDays || 30);
        await tx.wait();

        showTxModal('success', translations[currentLang].txSuccessStake);
        await updateDashboardBalances();
    } catch (err) {
        handleTxError(err);
    }
}

// 2. Harvest Daily Reward
async function btnActionHarvest() {
    if (!stakingContract || !currentUserAddress) return alert(translations[currentLang].errConnectWallet);
    try {
        showTxModal('loading', translations[currentLang].txLoadingHarvest);
        const tx = await stakingContract.harvestDailyReward();
        await tx.wait();

        showTxModal('success', translations[currentLang].txSuccessHarvest);
        await updateDashboardBalances();
    } catch (err) {
        handleTxError(err);
    }
}

// 3. Claim Leader Reward
async function btnActionClaimLeader() {
    if (!stakingContract || !currentUserAddress) return alert(translations[currentLang].errConnectWallet);
    try {
        showTxModal('loading', translations[currentLang].txLoadingClaimLeader);
        const tx = await stakingContract.claimLeaderRewards();
        await tx.wait();

        showTxModal('success', translations[currentLang].txSuccessClaimLeader);
        await updateDashboardBalances();
    } catch (err) {
        handleTxError(err);
    }
}

// 4. Withdraw Ready Balance
async function btnActionWithdrawReady(amountFormatted) {
    if (!stakingContract || !currentUserAddress) return alert(translations[currentLang].errConnectWallet);
    try {
        showTxModal('loading', translations[currentLang].txLoadingWithdraw);
        const parseUnits = ethers.parseUnits || ethers.utils.parseUnits;
        const amountWei = parseUnits(amountFormatted.toString(), 18);

        const tx = await stakingContract.withdrawReadyBalance(amountWei);
        await tx.wait();

        showTxModal('success', translations[currentLang].txSuccessWithdraw);
        await updateDashboardBalances();
    } catch (err) {
        handleTxError(err);
    }
}

// ==========================================
// UI HANDLERS & FORM BRIDGES
// ==========================================

function selectDuration(days, btnElement) {
    const durationInput = document.getElementById('stake-duration');
    if (durationInput) {
        durationInput.value = days;
    }

    const buttons = document.querySelectorAll('.duration-btn');
    buttons.forEach(btn => {
        btn.className = "duration-btn bg-card text-secondary py-3 rounded-lg border border-cardBorder transition-colors text-sm";
    });

    if (btnElement) {
        btnElement.className = "duration-btn bg-primary text-black font-bold py-3 rounded-lg border border-primary transition-colors text-sm";
    }
}
window.selectDuration = selectDuration;

async function executeClaimLeaderFromUI() {
    if (!currentUserAddress) {
        alert(translations[currentLang].errConnectWallet);
        return connectWallet();
    }
    await btnActionClaimLeader();
}
window.executeClaimLeaderFromUI = executeClaimLeaderFromUI;

async function executeProtocol() {
    if (!currentUserAddress) {
        alert(translations[currentLang].errConnectWallet);
        return connectWallet();
    }

    const amountInput = document.getElementById('stake-amount') || document.getElementById('input-stake-amount');
    const amount = amountInput ? amountInput.value : "0";

    if (!amount || parseFloat(amount) < 100) {
        alert(translations[currentLang].minStake);
        return;
    }

    const mentorInput = document.getElementById('stake-mentor') || document.getElementById('input-mentor-address');
    const mentor = mentorInput ? mentorInput.value.trim() : "";

    const durationInput = document.getElementById('stake-duration');
    const days = durationInput ? parseInt(durationInput.value, 10) : 30;

    await btnActionJoinProtocol(amount, mentor, days);
}
window.executeProtocol = executeProtocol;
window.executeJoinFromUI = executeProtocol;

function switchTab(tabName) {
    const tabs = document.querySelectorAll('.dapp-tab');
    tabs.forEach(tab => {
        tab.classList.remove('active', 'block');
        tab.classList.add('hidden');
    });

    const navButtons = document.querySelectorAll('[id^="btn-"]');
    navButtons.forEach(btn => {
        btn.classList.remove('bg-primary', 'text-black');
        btn.classList.add('text-secondary');
    });

    const activeTab = document.getElementById(`tab-${tabName}`);
    if (activeTab) {
        activeTab.classList.remove('hidden');
        activeTab.classList.add('active', 'block');
    }

    const activeBtn = document.getElementById(`btn-${tabName}`);
    if (activeBtn) {
        activeBtn.classList.remove('text-secondary');
        activeBtn.classList.add('bg-primary', 'text-black');
    }
}
window.switchTab = switchTab;

// ==========================================
// READ & SINKRONISASI DASHBOARD REAL-TIME
// ==========================================
async function updateDashboardBalances() {
    if (!stakingContract || !currentUserAddress) return;

    try {
        const formatUnits = ethers.formatUnits || ethers.utils.formatUnits;
        const fmt = (val) => parseFloat(formatUnits(val || 0, 18)).toLocaleString('id-ID', { maximumFractionDigits: 2 });

        const snrBalance = await snrContract.balanceOf(currentUserAddress);
        updateUI('ui-snr-balance', `${fmt(snrBalance)} SNR`);
        updateUI('ui-wallet-balance', `${fmt(snrBalance)} SNR`);

        const d = await stakingContract.getDashboard(currentUserAddress);

        updateUI('ui-staking-principal', `${fmt(d.stakingPrincipal)} SNR`);
        updateUI('ui-current-reward', `${fmt(d.currentReward)} SNR`);
        updateUI('ui-pending-reward', `${fmt(d.currentReward)} SNR`);
        updateUI('ui-reward-claimed', `${fmt(d.rewardClaimed)} SNR`);
        updateUI('ui-ready-withdraw', `${fmt(d.readyWithdraw)} SNR`);
        updateUI('ui-total-staking-asset', `${fmt(d.totalStakingAsset)} SNR`);
        updateUI('ui-daily-yield-bp', `${(Number(d.dailyYieldBP) / 100).toFixed(2)}% / hari`);
        updateUI('ui-remaining-lock', formatSeconds(Number(d.remainingLock)));

        updateUI('ui-direct-active', d.directActive.toString());
        updateUI('ui-group-volume', `${fmt(d.groupVolume)} SNR`);
        updateUI('ui-current-rank', `Rank ${d.rank.toString()}`);
        updateUI('ui-leader-reward', `${fmt(d.leaderReward)} SNR`);

    } catch (err) {
        console.error("Gagal sinkronisasi data dashboard:", err);
    }
}

function updateUI(elementId, textValue) {
    const el = document.getElementById(elementId);
    if (el) el.innerText = textValue;
}

function formatSeconds(seconds) {
    if (seconds <= 0) return translations[currentLang].completedFree;
    const days = Math.floor(seconds / (3600 * 24));
    const hours = Math.floor((seconds % (3600 * 24)) / 3600);
    return `${days} ${translations[currentLang].days} ${hours} ${translations[currentLang].hours}`;
}

function showTxModal(type, text) {
    console.log(`[Tx Modal - ${type.toUpperCase()}]: ${text}`);
    if (type === 'error') alert(text);
    else if (type === 'success') alert(text);
}

function handleTxError(err) {
    console.error("Tx Error:", err);
    let msg = err.reason || err.message || translations[currentLang].errTxFailed;
    if (err.code === "ACTION_REJECTED" || err.code === 4001) {
        msg = translations[currentLang].errTxRejected;
    }
    showTxModal('error', msg);
}

// Event Listener Inisialisasi DOM
window.addEventListener('DOMContentLoaded', () => {
    setLanguage(currentLang);
    const btnConnect = document.getElementById("btn-connect-wallet");
    if (btnConnect) {
        btnConnect.addEventListener("click", connectWallet);
    }
});
