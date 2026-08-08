// dapp.js - SNR Sovereign Enterprise Production Driver (Ethers.js v5.7.2)

const CONTRACT_ADDRESS = "0x3a941865fee1fA9d318417524D23400E58D7F051";
const SNR_TOKEN_ADDRESS = "0x5ce1427f77d8c58f97f5e18b36804fd54aa72718";

// Complete ABI mapping from SNRStakingV7_TITAN_SOVEREIGN_ENTERPRISE
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
    "function users(address) external view returns (uint256 participation, uint256 originalGrant, uint256 totalRewardClaimed, uint256 lastUpdate, uint256 dailyYieldBP, bool isActive, bool isBlacklisted, uint8 activeProgram, uint256 supportValue, uint256 supportSettled, address mentor, uint256 directActiveCount, uint256 groupVolume, uint256 currentRank, uint256 principalDeposit, bool isFundLockedByAdmin, uint256 readyToWithdraw, uint256 stakingEndDate, uint256 assetEndDate)",
    "function getProtocolStatistics() external view returns (tuple(" +
        "uint256 totalPrincipal, uint256 totalReferral, uint256 totalWithdraw, uint256 totalLiability, " +
        "uint256 reserveBalance, uint256 reserveHealthBP, bool solvent" +
    "))",
    
    // --- EVENTS V7 ---
    "event RewardHarvested(address indexed user, uint256 netToCompound, uint256 netToReadyWD)",
    "event PrincipalUnstaked(address indexed user, uint256 amount, uint256 penalty)",
    "event AssetActivated(address indexed user, uint8 atype, uint256 value, uint8 path)",
    "event RankUpgraded(address indexed user, uint256 newRank)",
    "event LeaderCapReached(address indexed leader)",
    "event LeaderCapReset(address indexed leader)"
];

const ERC20_ABI = [
    "function approve(address spender, uint256 amount) external returns (bool)",
    "function allowance(address owner, address spender) external view returns (uint256)",
    "function balanceOf(address account) external view returns (uint256)",
    "event Transfer(address indexed from, address indexed to, uint256 value)"
];

let provider, signer, userAddress, stakingContract, tokenContract;

// Helper Simpan Ledger Lokal (Mencegah Kehilangan Riwayat Akibat Limit BSC RPC)
function saveLocalTx(type, txHash, desc) {
    if (!userAddress) return;
    try {
        const key = "snr_v7_ledger_" + userAddress.toLowerCase();
        let list = JSON.parse(localStorage.getItem(key) || "[]");
        list.unshift({
            type: type,
            txHash: txHash,
            desc: desc,
            timestamp: Date.now(),
            blockNumber: "V7 Ledger"
        });
        localStorage.setItem(key, JSON.stringify(list.slice(0, 50)));
    } catch(e) {}
}

function getLocalTxs() {
    if (!userAddress) return [];
    try {
        const key = "snr_v7_ledger_" + userAddress.toLowerCase();
        return JSON.parse(localStorage.getItem(key) || "[]");
    } catch(e) { return []; }
}

// ==========================================
// 1. KONEKSI WALLET & INITIALIZATION
// ==========================================
async function initWeb3() {
    if (window.ethereum) {
        try {
            provider = new ethers.providers.Web3Provider(window.ethereum);
            await provider.send("eth_requestAccounts", []);
            signer = await provider.getSigner();
            userAddress = await signer.getAddress();

            stakingContract = new ethers.Contract(CONTRACT_ADDRESS, SNR_STAKING_ABI, signer);
            tokenContract = new ethers.Contract(SNR_TOKEN_ADDRESS, ERC20_ABI, signer);

            const btnConnect = document.getElementById("btn-connect-wallet");
            if (btnConnect) {
                btnConnect.innerHTML = `<i data-lucide="log-out" class="w-4 h-4 text-red-400"></i> ${userAddress.substring(0, 6)}...${userAddress.substring(38)}`;
                btnConnect.onclick = function() {
                    if(confirm("Disconnect Wallet?")) { window.location.reload(); }
                };
                if(typeof lucide !== 'undefined') lucide.createIcons();
            }

            await fetchAndRenderDashboard();
            
            window.ethereum.on('accountsChanged', () => window.location.reload());
            window.ethereum.on('chainChanged', () => window.location.reload());

        } catch (error) {
            console.error("User rejected connection", error);
            showTxModal('error', 'Koneksi Ditolak', 'Gagal Menghubungkan Wallet');
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
        const savedMentor = localStorage.getItem('snr_v7_mentor');
        let mentor = mentorAddress && ethers.utils.isAddress(mentorAddress) ? mentorAddress : savedMentor;
        mentor = mentor && ethers.utils.isAddress(mentor) ? mentor : "0x0000000000000000000000000000000000000000";

        // Proteksi Jaringan: Cek apakah Upline sudah aktif di V7
        if (mentor !== "0x0000000000000000000000000000000000000000") {
            try {
                const mentorData = await stakingContract.users(mentor);
                if (!mentorData.isActive && mentor.toLowerCase() !== CONTRACT_ADDRESS.toLowerCase()) {
                    const confirmWait = confirm(`PERINGATAN UPLINE BELUM AKTIF:\n\nSponsor/Upline Anda (${mentor.substring(0,6)}...${mentor.substring(38)}) belum melakukan Staking di V7.\n\nAgar jaringan Anda terikat sah ke Upline Anda dan tidak dialihkan ke Admin, harap minta Upline Anda untuk melakukan Staking V7 terlebih dahulu.\n\nApakah Anda tetap ingin melanjutkan Staking sekarang?`);
                    if (!confirmWait) return;
                }
            } catch(e) {}
        }

        showTxModal('loading', 'Transaksi', 'Menyiapkan Transaksi Staking V7...');
        const amountWei = ethers.utils.parseUnits(amount.toString(), 18);

        // Step 1: Check Allowance
        const allowance = await tokenContract.allowance(userAddress, CONTRACT_ADDRESS);
        if (allowance.lt(amountWei)) {
            showTxModal('loading', 'Transaksi', 'Meminta Izin Token (Approve)...');
            const approveTx = await tokenContract.approve(CONTRACT_ADDRESS, amountWei);
            await approveTx.wait();
        }

        // Step 2: Execute Join
        showTxModal('loading', 'Transaksi', 'Mengirim Modal ke Smart Contract V7...');
        const tx = await stakingContract.joinProtocol(amountWei, mentor, durationDays);
        await tx.wait();

        saveLocalTx('Staked V7', tx.hash, `Deposit Staking V7: ${parseFloat(amount).toLocaleString('id-ID')} SNR`);
        showTxModal('success', 'Berhasil', 'Staking V7 Berhasil Diaktifkan!');
        await fetchAndRenderDashboard();
    } catch (err) {
        handleTxError(err);
    }
}

// Tombol: Harvest Daily Reward
async function btnActionHarvest() {
    try {
        if (!stakingContract || !userAddress) return;
        
        const userData = await stakingContract.users(userAddress);
        const lastUpdate = Number(userData.lastUpdate) || 0;
        const now = Math.floor(Date.now() / 1000);
        
        if (lastUpdate > 0 && now < lastUpdate + 86400) {
            const diff = (lastUpdate + 86400) - now;
            const remainingText = formatSeconds(diff);
            showTxModal('info', 'Siklus Panen 24 Jam', `Panen harian berjalan dalam siklus 24 jam di blockchain.\n\nPanen berikutnya dapat dilakukan dalam:\n${remainingText}.\n\nReward harian Anda tetap tersimpan aman di blockchain.`);
            return;
        }

        showTxModal('loading', 'Transaksi', 'Memproses Klaim Hasil Harian V7...');
        const tx = await stakingContract.harvestDailyReward();
        await tx.wait();

        saveLocalTx('Harvest V7', tx.hash, `Panen Profit V7 (Auto-Compound 45%)`);
        showTxModal('success', 'Berhasil', 'Panen Reward Harian V7 Berhasil!');
        await fetchAndRenderDashboard();
    } catch (err) {
        handleTxError(err);
    }
}

// Tombol: Claim Leader / Referral Reward
async function btnActionClaimLeader() {
    try {
        showTxModal('loading', 'Transaksi', 'Memproses Klaim Leader Reward...');
        const tx = await stakingContract.claimLeaderRewards();
        await tx.wait();

        saveLocalTx('Leader Reward V7', tx.hash, `Pencairan Bonus Leader V7`);
        showTxModal('success', 'Berhasil', 'Bonus Leader Berhasil Dicairkan!');
        await fetchAndRenderDashboard();
    } catch (err) {
        handleTxError(err);
    }
}

// Tombol: Withdraw Ready Balance
async function btnActionWithdrawReady(amount) {
    try {
        showTxModal('loading', 'Transaksi', 'Memproses Penarikan Saldo...');
        const amountWei = ethers.utils.parseUnits(amount.toString(), 18);
        const tx = await stakingContract.withdrawReadyBalance(amountWei);
        await tx.wait();

        saveLocalTx('Withdraw V7', tx.hash, `Penarikan Saldo Ready: ${parseFloat(amount).toLocaleString('id-ID')} SNR`);
        showTxModal('success', 'Berhasil', 'Penarikan Saldo Berhasil!');
        await fetchAndRenderDashboard();
    } catch (err) {
        handleTxError(err);
    }
}

// Tombol: Unstake Principal (Aktif dengan Proteksi Penalti V7)
async function btnActionUnstake(amount) {
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) return;
    
    try {
        const userData = await stakingContract.users(userAddress);
        const now = Math.floor(Date.now() / 1000);
        const endDate = Number(userData.stakingEndDate) || 0;
        
        if (endDate > now) {
            const confirmEarly = confirm("PERINGATAN DENDA V7:\nMasa staking Anda belum selesai. Pencabutan modal sebelum waktunya akan dikenakan DENDA 50% oleh Smart Contract.\n(25% masuk Treasury, 25% masuk Cadangan Kontrak).\n\nApakah Anda yakin ingin melanjutkan Unstake?");
            if (!confirmEarly) return;
        }

        showTxModal('loading', 'Transaksi', 'Memproses Pencabutan Modal Pokok...');
        const amountWei = ethers.utils.parseUnits(amount.toString(), 18);
        const tx = await stakingContract.unstakePrincipal(amountWei);
        await tx.wait();

        saveLocalTx('Unstake V7', tx.hash, `Pencabutan Modal: ${parseFloat(amount).toLocaleString('id-ID')} SNR`);
        showTxModal('success', 'Berhasil', 'Modal Pokok Berhasil Ditarik!');
        await fetchAndRenderDashboard();
    } catch (err) {
        handleTxError(err);
    }
}

// Tombol: Request Asset Program
async function btnActionRequestAsset(assetTypeEnum, assetValue, unitModel, protocolPathEnum) {
    try {
        showTxModal('loading', 'Transaksi', 'Mengirimkan Pengajuan Aset Program...');
        const valueWei = ethers.utils.parseUnits(assetValue.toString(), 18);
        const tx = await stakingContract.requestAssetAcquisition(assetTypeEnum, valueWei, unitModel, protocolPathEnum);
        await tx.wait();

        showTxModal('success', 'Berhasil', 'Pengajuan Program Aset Berhasil!');
        await fetchAndRenderDashboard();
    } catch (err) {
        handleTxError(err);
    }
}

// Tombol: Claim Sovereign Principal (Pengembalian Modal Aset)
async function btnActionClaimSovereignAsset() {
    try {
        showTxModal('loading', 'Transaksi', 'Mencairkan Jaminan Aset Program...');
        const tx = await stakingContract.claimSovereignPrincipal();
        await tx.wait();

        showTxModal('success', 'Berhasil', 'Pencairan Jaminan Aset Berhasil!');
        await fetchAndRenderDashboard();
    } catch (err) {
        handleTxError(err);
    }
}

// ==========================================
// 3. SINKRONISASI DATA KE DASHBOARD (READ)
// ==========================================
async function fetchAndRenderDashboard() {
    if (!userAddress) return;

    const fmt = (val) => parseFloat(ethers.utils.formatUnits(val || 0, 18)).toLocaleString('id-ID', { maximumFractionDigits: 2 });
    const fmtBNB = (val) => parseFloat(ethers.utils.formatUnits(val || 0, 18)).toLocaleString('id-ID', { maximumFractionDigits: 6 });

    try {
        if (tokenContract && provider) {
            const userBalance = await tokenContract.balanceOf(userAddress);
            const bnbBalance = await provider.getBalance(userAddress);
            
            updateUI('ui-bnb-balance', fmtBNB(bnbBalance));
            updateUI('ui-wallet-balance', fmt(userBalance) + " SNR");
        }
    } catch (err) {
        console.error("Gagal membaca saldo token/BNB:", err);
    }

    if (!stakingContract) return;

    try {
        if (CONTRACT_ADDRESS.includes("...")) {
            console.warn("Alamat Smart Contract Staking belum disetel (Masih Placeholder)!");
            return;
        }

        const d = await stakingContract.getDashboard(userAddress);
        const userData = await stakingContract.users(userAddress);

        const lastUpdate = Number(userData.lastUpdate) || 0;
        const participation = parseFloat(ethers.utils.formatUnits(userData.participation || 0, 18));
        const dailyYieldBP = Number(userData.dailyYieldBP) || 0;

        // Export state ke window object untuk ticker presisi di index.html
        window.snrStakingState = {
            principal: participation,
            dailyYieldBP: dailyYieldBP,
            lastUpdate: lastUpdate
        };

        // Hitung Live Reward Real-time dari lastUpdate (Persis seperti rumus Solidity)
        const now = Math.floor(Date.now() / 1000);
        let liveReward = 0;
        if (lastUpdate > 0 && participation > 0 && dailyYieldBP > 0 && now > lastUpdate) {
            const elapsed = now - lastUpdate;
            liveReward = (participation * (dailyYieldBP / 10000) * elapsed) / 86400;
        } else {
            liveReward = Number(ethers.utils.formatUnits(d.currentReward || 0, 18));
        }

        // Update Staking UI
        updateUI('ui-staking-principal', fmt(d.stakingPrincipal) + " SNR");
        updateUI('ui-current-reward', liveReward.toFixed(8));

        // Cooldown Timer Logic
        if(lastUpdate > 0 && d.stakingActive) {
            const diff = (lastUpdate + 86400) - now;
            if(diff > 0) {
                updateUI('harvest-cooldown', "Cooldown: " + formatSeconds(diff));
                document.querySelector('button[onclick="btnActionHarvest()"]')?.classList.add("opacity-50", "cursor-not-allowed");
            } else {
                updateUI('harvest-cooldown', "Siap Panen");
                document.querySelector('button[onclick="btnActionHarvest()"]')?.classList.remove("opacity-50", "cursor-not-allowed");
            }
        } else {
            updateUI('harvest-cooldown', "Belum Aktif");
        }

        updateUI('ui-reward-claimed', fmt(d.rewardClaimed) + " SNR");
        updateUI('ui-ready-withdraw', fmt(d.readyWithdraw) + " SNR");
        updateUI('ui-total-staking-asset', fmt(d.totalStakingAsset) + " SNR");
        updateUI('ui-daily-yield-bp', (dailyYieldBP / 100).toFixed(2) + "% / hari");
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

        if (d.blacklisted || d.lockdown || d.protocolPaused || d.emergencyMode) {
            console.warn("Sistem dalam batasan proteksi / pembekuan.");
        }

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

// Helper Format Detik ke Jam/Menit/Detik Presisi
function formatSeconds(seconds) {
    if (seconds <= 0) return "Siap / Bebas";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hours >= 24) {
        const days = Math.floor(hours / 24);
        const remHours = hours % 24;
        return `${days} Hari ${remHours}j ${minutes}m ${secs}s`;
    }
    return `${hours} Jam ${minutes} Mnt ${secs} Detik`;
}

// Helper Error Handler
function handleTxError(err) {
    console.error("Tx Error:", err);
    let msg = err.reason || err.message || "Transaksi Dibatalkan/Gagal";
    showTxModal('error', 'Error Transaksi', msg);
}

// Helper Query Log Paralel Terbagi Chunk (Bypass Limit BSC RPC)
async function queryLogsInChunks(contract, filter, currentBlock, totalBlocks = 10000, chunkSize = 2000) {
    let logs = [];
    let start = currentBlock > totalBlocks ? currentBlock - totalBlocks : 0;
    let promises = [];
    for (let from = start; from < currentBlock; from += chunkSize) {
        let to = (from + chunkSize > currentBlock) ? currentBlock : from + chunkSize;
        promises.push(contract.queryFilter(filter, from, to).catch(() => []));
    }
    const results = await Promise.all(promises);
    results.forEach(res => { if (Array.isArray(res)) logs.push(...res); });
    return logs;
}

// ==========================================
// 4. TRANSACTION HISTORY TAB (LEDGER)
// ==========================================
async function fetchTransactionHistory() {
    if (!stakingContract || !tokenContract || !userAddress) return;
    
    const historyList = document.getElementById('history-list');
    if (!historyList) return;
    
    try {
        historyList.innerHTML = '<div class="text-center text-secondary py-12"><i data-lucide="loader-2" class="w-8 h-8 text-secondary/50 animate-spin mx-auto mb-3"></i><span>Menyinkronkan Ledger Blockchain V7...</span></div>';
        if(typeof lucide !== 'undefined') lucide.createIcons();

        let allEvents = [];
        let txHashes = new Set();

        // 1. Ambil transaksi lokal (Permanen tanpa tergantung limit RPC)
        const localTxs = getLocalTxs();
        localTxs.forEach(item => {
            if (!txHashes.has(item.txHash)) {
                txHashes.add(item.txHash);
                allEvents.push({
                    type: item.type,
                    data: { transactionHash: item.txHash, blockNumber: item.blockNumber },
                    desc: item.desc,
                    icon: item.type.includes('Harvest') ? 'leaf' : (item.type.includes('Staked') ? 'arrow-down-right' : 'wallet'),
                    color: item.type.includes('Harvest') ? 'text-accent' : 'text-primary',
                    border: item.type.includes('Harvest') ? 'border-accent' : 'border-primary'
                });
            }
        });

        // 2. Query logs on-chain dalam 5 chunk aman x 2,000 blok (Total 10,000 blok ~8.3 jam tanpa ditolak RPC BSC)
        try {
            const filterStaked = tokenContract.filters.Transfer(userAddress, CONTRACT_ADDRESS);
            const filterPayout = tokenContract.filters.Transfer(CONTRACT_ADDRESS, userAddress);
            const filterHarvest = stakingContract.filters.RewardHarvested(userAddress);
            const filterUnstake = stakingContract.filters.PrincipalUnstaked(userAddress);

            const currentBlock = await provider.getBlockNumber();

            const [logsStaked, logsPayout, logsHarvest, logsUnstake] = await Promise.all([
                queryLogsInChunks(tokenContract, filterStaked, currentBlock),
                queryLogsInChunks(tokenContract, filterPayout, currentBlock),
                queryLogsInChunks(stakingContract, filterHarvest, currentBlock),
                queryLogsInChunks(stakingContract, filterUnstake, currentBlock)
            ]);

            logsStaked.forEach(log => {
                if (!txHashes.has(log.transactionHash)) {
                    txHashes.add(log.transactionHash);
                    const val = log.args ? (log.args.value || log.args[2] || 0) : 0;
                    const amount = parseFloat(ethers.utils.formatUnits(val, 18)).toLocaleString('id-ID', { maximumFractionDigits: 2 });
                    allEvents.push({ 
                        type: 'Staked V7', 
                        data: log, 
                        desc: `Deposit Staking V7: ${amount} SNR`, 
                        icon: 'arrow-down-right', 
                        color: 'text-primary', 
                        border: 'border-primary' 
                    });
                }
            });

            logsHarvest.forEach(log => {
                if (!txHashes.has(log.transactionHash)) {
                    txHashes.add(log.transactionHash);
                    const compoundVal = log.args ? (log.args.netToCompound || log.args[1] || 0) : 0;
                    const readyWdVal = log.args ? (log.args.netToReadyWD || log.args[2] || 0) : 0;
                    const compound = parseFloat(ethers.utils.formatUnits(compoundVal, 18)).toLocaleString('id-ID', { maximumFractionDigits: 2 });
                    const readyWd = parseFloat(ethers.utils.formatUnits(readyWdVal, 18)).toLocaleString('id-ID', { maximumFractionDigits: 2 });
                    allEvents.push({ 
                        type: 'Harvest V7', 
                        data: log, 
                        desc: `Panen V7 (Auto-Comp: ${compound} SNR | Ready: ${readyWd} SNR)`, 
                        icon: 'leaf', 
                        color: 'text-accent', 
                        border: 'border-accent' 
                    });
                }
            });

            logsUnstake.forEach(log => {
                if (!txHashes.has(log.transactionHash)) {
                    txHashes.add(log.transactionHash);
                    const amtVal = log.args ? (log.args.amount || log.args[1] || 0) : 0;
                    const amt = parseFloat(ethers.utils.formatUnits(amtVal, 18)).toLocaleString('id-ID', { maximumFractionDigits: 2 });
                    allEvents.push({ 
                        type: 'Unstake V7', 
                        data: log, 
                        desc: `Pencabutan Modal: ${amt} SNR`, 
                        icon: 'arrow-up-right', 
                        color: 'text-red-500', 
                        border: 'border-red-500' 
                    });
                }
            });

            logsPayout.forEach(log => {
                if (!txHashes.has(log.transactionHash)) {
                    txHashes.add(log.transactionHash);
                    const val = log.args ? (log.args.value || log.args[2] || 0) : 0;
                    const amount = parseFloat(ethers.utils.formatUnits(val, 18)).toLocaleString('id-ID', { maximumFractionDigits: 2 });
                    allEvents.push({ 
                        type: 'Withdraw/Claim V7', 
                        data: log, 
                        desc: `Pencairan Saldo: ${amount} SNR`, 
                        icon: 'wallet', 
                        color: 'text-green-400', 
                        border: 'border-green-400' 
                    });
                }
            });
        } catch (onChainErr) {
            console.warn("Query logs on-chain dilewati karena RPC limit:", onChainErr);
        }

        allEvents.sort((a, b) => (b.data.blockNumber || 0) - (a.data.blockNumber || 0));

        if (allEvents.length === 0) {
            historyList.innerHTML = '<div class="text-center text-secondary py-12"><i data-lucide="inbox" class="w-8 h-8 text-secondary/50 mx-auto mb-3"></i><span>Tidak ada catatan transaksi di ledger.</span></div>';
        } else {
            let html = '';
            for (const evt of allEvents) {
                const txHash = evt.data.transactionHash;
                const shortHash = txHash.length > 14 ? (txHash.substring(0, 8) + '...' + txHash.substring(txHash.length - 6)) : txHash;
                
                html += `
                <div class="flex gap-3 text-sm border-l-2 ${evt.border} pl-3 bg-card/30 p-3 rounded-r mb-2 hover:bg-card/60 transition-colors">
                    <i data-lucide="${evt.icon}" class="w-5 h-5 ${evt.color} shrink-0 mt-0.5"></i>
                    <div class="w-full">
                        <div class="text-white font-bold font-display flex justify-between">
                            <span>${evt.type}</span>
                            <a href="https://bscscan.com/tx/${txHash}" target="_blank" class="text-xs text-secondary hover:text-accent flex items-center gap-1">
                                ${shortHash} <i data-lucide="external-link" class="w-3 h-3"></i>
                            </a>
                        </div>
                        <div class="text-sm text-secondary font-mono mt-1">${evt.desc}</div>
                        <div class="text-[10px] text-primary/60 mt-2">Status: ${evt.data.blockNumber}</div>
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
