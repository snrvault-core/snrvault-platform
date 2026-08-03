// =========================================================
// i18n.js - Multi-Language Translation Engine
// Supports HTML attribute: data-i18n
// =========================================================

const translations = {
    en: {
        dapp_back: "BACK TO MAIN",
        dapp_connect: "CONNECT WALLET",
        dashboard_title: "TITAN SOVEREIGN ENTERPRISE",
        staking_title: "STAKING DASHBOARD",
        total_staked: "Total Staked Principal",
        pending_reward: "Pending Daily Reward",
        ready_withdraw: "Ready to Withdraw",
        total_claimed: "Total Claimed",
        harvest_btn: "HARVEST REWARD",
        withdraw_btn: "WITHDRAW BALANCE",
        unstake_btn: "UNSTAKE PRINCIPAL",
        network_title: "NETWORK & LEADER SYSTEM",
        direct_active: "Direct Active Members",
        group_volume: "Group Volume",
        current_rank: "Current Rank",
        claim_leader_btn: "CLAIM LEADER REWARD",
        asset_title: "SOVEREIGN ASSET PROGRAM",
        asset_value: "Target Asset Value",
        asset_model: "Unit / Model",
        asset_lock: "Locked Guarantee",
        request_asset_btn: "REQUEST ASSET PROGRAM"
    },
    id: {
        dapp_back: "KEMBALI KE UTAMA",
        dapp_connect: "HUBUNGKAN WALLET",
        dashboard_title: "TITAN SOVEREIGN ENTERPRISE",
        staking_title: "DASHBOARD STAKING",
        total_staked: "Total Modal Staking",
        pending_reward: "Hasil Harian Belum Dipanen",
        ready_withdraw: "Saldo Siap Cair",
        total_claimed: "Total Reward Diterima",
        harvest_btn: "PANEN REWARD",
        withdraw_btn: "TARIK SALDO",
        unstake_btn: "CABUT MODAL POKOK",
        network_title: "SISTEM JARINGAN & LEADER",
        direct_active: "Mitra Aktif Langsung",
        group_volume: "Volume Ombudsman/Grup",
        current_rank: "Peringkat Saat Ini",
        claim_leader_btn: "KLAIM BONUS LEADER",
        asset_title: "PROGRAM ASET SOVEREIGN",
        asset_value: "Nilai Aset Target",
        asset_model: "Tipe / Model Unit",
        asset_lock: "Jaminan Terkunci",
        request_asset_btn: "AJUKAN PROGRAM ASET"
    }
};

let currentLang = localStorage.getItem('app_lang') || 'en';

function setLanguage(lang) {
    if (!translations[lang]) return;
    currentLang = lang;
    localStorage.setItem('app_lang', lang);

    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(element => {
        const key = element.getAttribute('data-i18n');
        if (translations[lang][key]) {
            const translatedText = translations[lang][key];
            
            // Penanganan presisi untuk Form Input (Placeholder)
            if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                element.placeholder = translatedText;
            } else if (element.tagName === 'INPUT' && (element.type === 'button' || element.type === 'submit')) {
                element.value = translatedText;
            } else {
                element.innerText = translatedText;
            }
        }
    });

    // Update label pada tombol switcher bahasa di UI jika elemen tersedia
    const langBtn = document.getElementById('btn-lang-toggle');
    if (langBtn) {
        langBtn.innerText = lang.toUpperCase();
    }
}

function toggleLanguage() {
    const newLang = currentLang === 'en' ? 'id' : 'en';
    setLanguage(newLang);
}

// Ekspor Fungsi ke Scope Global (window) agar bisa dipanggil langsung dari atribut HTML onclick="toggleLanguage()"
window.setLanguage = setLanguage;
window.toggleLanguage = toggleLanguage;
window.currentLang = currentLang;

// Jalankan Otomatis saat Halaman Selesai Di-load
window.addEventListener('DOMContentLoaded', () => {
    setLanguage(currentLang);
});

// Jalankan langsung jika DOM sudah terlanjur siap saat file di-load
if (document.readyState === 'interactive' || document.readyState === 'complete') {
    setLanguage(currentLang);
}
