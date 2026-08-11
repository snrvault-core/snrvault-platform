// i18n.js - SNR-VAULT Bilingual Engine (Preserving Signature Terms & Iconic Buttons)

const i18nDict = {
    // Navigation & Hero (Descriptive Texts)
    'nav_how_it_works': { en: 'HOW IT WORKS', id: 'CARA KERJA' },
    'nav_canons': { en: 'V7 CANONS', id: 'KANUN V7' },
    'nav_hall_of_fame': { en: 'HALL OF FAME', id: 'HALL OF FAME' },
    'nav_tokenomics': { en: 'TOKENOMICS', id: 'TOKENOMICS' },
    'nav_transparency': { en: 'TRANSPARENCY', id: 'TRANSPARANSI' },
    'nav_roadmap': { en: 'ROADMAP', id: 'ROADMAP' },

    'hero_badge': { en: 'PROTOCOL V4 ACTIVE', id: 'PROTOKOL V4 AKTIF' },
    'hero_desc': { 
        en: 'A community-centered digital economic infrastructure connecting people, commerce, distribution, assets, and transparent technology. Stake SNR on Binance Smart Chain.', 
        id: 'Infrastruktur ekonomi digital berbasis komunitas yang menghubungkan manusia, perdagangan, distribusi, aset, dan teknologi transparan. Staking SNR di Binance Smart Chain.' 
    },

    // Hall of Fame Section
    'hof_badge': { en: 'PANGGUNG KEHORMATAN LEADER', id: 'PANGGUNG KEHORMATAN LEADER' },
    'hof_subtitle': { 
        en: 'Highest appreciation for SNR-VAULT Elite Leaders who have proven leadership sovereignty and set records in the national network.', 
        id: 'Apresiasi tertinggi bagi Pemimpin Elit SNR-VAULT yang berhasil membuktikan kedaulatan kepemimpinan dan mencetak rekor di jaringan nasional.' 
    },
    'hof_cta_title': { en: 'WANT YOUR PHOTO & NAME IMMORTALIZED HERE?', id: 'INGIN FOTO & NAMA ANDA DIABADIKAN DI SINI?' },
    'hof_cta_desc': { 
        en: 'Qualify for Rank Colonel or Titan, send your official photo to Escrow Admin to be displayed on the Hall of Fame!', 
        id: 'Tembus kualifikasi Rank Colonel atau Titan, kirimkan foto resmi Anda ke Admin Escrow untuk dipajang di Panggung Kehormatan!' 
    },

    // Footer
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
    
    // Translate elements with data-i18n attributes
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
