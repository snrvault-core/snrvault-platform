// =========================================================
// dapp.js - SNR Sovereign Enterprise Production Driver
// Compatible with Ethers.js v6 & HTML Enterprise UI
// =========================================================

const CONTRACT_ADDRESS = "0x0000000000000000000000000000000000000000"; // Ganti dengan Address Smart Contract Staking
const SNR_TOKEN_ADDRESS = "0x0000000000000000000000000000000000000000"; // Ganti dengan Address Token ERC20 SNR

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
    "))"
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
    if (typeof window.ethers === 'undefined') {
        alert("Ethers.js library belum terisi. Pastikan CDN Ethers v6 dimuat di HTML!");
        return;
    }

    if (window.ethereum) {
        try {
            provider = new ethers.BrowserProvider(window.ethereum);
            await provider.send("eth_requestAccounts", []);
            signer = await provider.getSigner();
            userAddress = await signer.getAddress();

            stakingContract = new ethers.Contract(CONTRACT_ADDRESS, SNR_STAKING_ABI, signer);
            tokenContract = new ethers.Contract(SNR_TOKEN_ADDRESS, ERC20_ABI, signer);

            // Update Teks Tombol Connect Wallet
            const btnConnect = document.getElementById("btn-connect-wallet");
            if (btnConnect) {
                const shortAddress = userAddress.substring(0, 6) + "..." + userAddress.substring(38);
                const spanText = btnConnect.querySelector('span');
                if (spanText) {
                    spanText.innerText = shortAddress;
                } else {
                    btnConnect.innerText = shortAddress;
                }
            }

            // Sync Data Dashboard Pertama Kali
            await fetchAndRenderDashboard();
            
            // Listen Event Wallet Metamask
            window.ethereum.on('accountsChanged', () => window.location.reload());
            window.ethereum.on('chainChanged', () => window.location.reload());

        } catch (error) {
            console.error("User rejected connection", error);
            showTxModal('error', 'Gagal Menghubungkan Wallet: ' + (error.reason || error.message));
        }
    } else {
        alert("Metamask atau Web3 Wallet tidak terdeteksi! Silakan periksa ekstensi browser Anda.");
    }
}

// Alias agar kompatibel jika HTML memanggil connectWallet()
window.connectWallet = initWeb3;

// ==========================================
// 2. LOGIKA TRANSAKSI SMART CONTRACT (WRITE)
// ==========================================

// Join Protocol / Staking
async function btnActionJoinProtocol(amount, mentorAddress, durationDays) {
    try {
        showTxModal('loading', 'Menyiapkan Transaksi Staking...');
        const amountWei = ethers.parseUnits(amount.toString(), 18);
        const mentor = mentorAddress && ethers.isAddress(mentorAddress) ? mentorAddress : "0x0000000000000000000000000000000000000000";

        const allowance = await tokenContract.allowance(userAddress, CONTRACT_ADDRESS);
        if (allowance < amountWei) {
            showTxModal('loading', 'Meminta Izin Token (Approve)...');
            const approveTx = await tokenContract.approve(CONTRACT_ADDRESS, amountWei);
            await approveTx.wait();
        }

        showTxModal('loading', 'Mengirim Modal ke Smart Contract...');
        const tx = await stakingContract.joinProtocol(amountWei, mentor, durationDays);
        await tx.wait();

        showTxModal('success', 'Staking Berhasil Diaktifkan!');
        await fetchAndRenderDashboard();
    } catch (err) {
        handleTxError(err);
    }
}

// Harvest Daily Reward
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

// Claim Leader Rewards
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

// Withdraw Ready Balance
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

// Unstake Principal
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

// Request Asset Program
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

// Claim Sovereign Principal
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
// 3. SINKRONISASI DATA DASHBOARD (READ)
// ==========================================
async function fetchAndRenderDashboard() {
    if (!stakingContract || !userAddress) return;

    try {
        const d = await stakingContract.getDashboard(userAddress);
        const userBalance = await tokenContract.balanceOf(userAddress);

        const fmt = (val) => parseFloat(ethers.formatUnits(val || 0, 18)).toLocaleString('id-ID', { maximumFractionDigits: 2 });

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

    } catch (err) {
        console.error("Gagal sinkronisasi data dashboard:", err);
    }
}

// Helper Update Element DOM
function updateUI(elementId, textValue) {
    const el = document.getElementById(elementId);
    if (el) el.innerText = textValue;
}

// Helper Formatter Detik
function formatSeconds(seconds) {
    if (seconds <= 0) return "Selesai / Bebas";
    const days = Math.floor(seconds / (3600 * 24));
    const hours = Math.floor((seconds % (3600 * 24)) / 3600);
    return `${days} Hari ${hours} Jam`;
}

// Helper Modal Transaksi (Fallback / Custom UI)
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
    let msg = err.reason || err.message || "Transaksi Dibatalkan/Gagal";
    showTxModal('error', msg);
}

// Inisialisasi Event Listener saat DOM Siap
window.addEventListener('DOMContentLoaded', () => {
    const btnConnect = document.getElementById("btn-connect-wallet");
    if (btnConnect) {
        btnConnect.addEventListener("click", initWeb3);
    }
});
