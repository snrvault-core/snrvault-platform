// i18n.js - SNR-VAULT Bilingual Engine (Supporting Paragraphs Only - All Titles & Buttons Unchanged)

const i18nDict = {
    // Hero Descriptive Paragraph
    'hero_desc': { 
        en: 'A community-centered digital economic infrastructure connecting people, commerce, distribution, assets, and transparent technology. Stake SNR on Binance Smart Chain.', 
        id: 'Infrastruktur ekonomi digital berbasis komunitas yang menghubungkan manusia, perdagangan, distribusi, aset, dan teknologi transparan. Staking SNR di Binance Smart Chain.' 
    },

    // Hall of Fame Supporting Text Paragraphs
    'hof_subtitle': { 
        en: 'Highest appreciation for SNR-VAULT Elite Leaders who have proven leadership sovereignty and set records in the national network.', 
        id: 'Apresiasi tertinggi bagi Pemimpin Elit SNR-VAULT yang berhasil membuktikan kedaulatan kepemimpinan dan mencetak rekor di jaringan nasional.' 
    },
    'hof_cta_desc': { 
        en: 'Qualify for Rank Colonel or Titan, send your official photo to Escrow Admin to be displayed on the Hall of Fame!', 
        id: 'Tembus kualifikasi Rank Colonel atau Titan, kirimkan foto resmi Anda ke Admin Escrow untuk dipajang di Panggung Kehormatan!' 
    },

    // DApp Terminal Supporting Paragraphs (After Connect Wallet)
    'dapp_ref_desc': {
        en: 'Share this link. When a new member stakes via your link, they will automatically join your Direct (Upline) network.',
        id: 'Sebarkan link ini. Saat member baru melakukan staking via link Anda, mereka akan otomatis menjadi jaringan Direct (Upline) Anda.'
    },
    'dapp_p2p_desc': {
        en: 'P2P transactions are currently served directly via Official Admin / Escrow.',
        id: 'Transaksi P2P saat ini dilayani secara langsung via Admin / Escrow Resmi.'
    },
    'dapp_ranks_desc': {
        en: 'Complete guide for rank qualifications, 10-level network rewards, and daily yield optimization strategy.',
        id: 'Panduan lengkap kualifikasi rank, bonus jaringan 10 level, dan strategi optimalisasi hasil panen harian.'
    },

    // Footer Legal Disclosure
    'footer_legal': {
        en: 'Under the Governance of PT SNR DIGITAL TRANSFORMASI. Sovereign Infrastructure for the Digital Economy. Audited, verifiable, and permanent smart contracts on BSC.',
        id: 'Di bawah Tata Kelola PT SNR DIGITAL TRANSFORMASI. Infrastruktur Berdaulat Ekonomi Digital. Smart Contract diaudit, terverifikasi, dan permanen di BSC.'
    }
};

let currentLang = localStorage.getItem('snr_lang') || 'en';

function setLanguage(lang) {
    switchLanguage(lang);
}

function switchLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('snr_lang', lang);
    
    // Translate elements with data-i18n attributes (Supporting Paragraphs Only)
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (i18nDict[key] && i18nDict[key][lang]) {
            el.innerText = i18nDict[key][lang];
        }
    });

    // Update Language Toggle Button Styles (Landing Page & dApp Header)
    const updateTogglePair = (btnEnId, btnIdId) => {
        const btnEn = document.getElementById(btnEnId);
        const btnId = document.getElementById(btnIdId);

        if (btnEn && btnId) {
            if (lang === 'en') {
                btnEn.className = "px-2.5 sm:px-3 py-1.5 text-xs font-display transition-colors rounded text-cyan-400 font-bold bg-slate-800 border border-cyan-500/40";
                btnId.className = "px-2.5 sm:px-3 py-1.5 text-xs font-display transition-colors rounded text-slate-400 font-bold hover:text-white bg-transparent";
            } else {
                btnId.className = "px-2.5 sm:px-3 py-1.5 text-xs font-display transition-colors rounded text-yellow-400 font-bold bg-slate-800 border border-yellow-500/40";
                btnEn.className = "px-2.5 sm:px-3 py-1.5 text-xs font-display transition-colors rounded text-slate-400 font-bold hover:text-white bg-transparent";
            }
        }
    };

    updateTogglePair('lang-en', 'lang-id');
    updateTogglePair('lang-en-dapp', 'lang-id-dapp');
}

document.addEventListener('DOMContentLoaded', () => {
    switchLanguage(currentLang);
});
