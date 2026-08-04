const fs = require('fs');
let indexHtml = fs.readFileSync('index.html', 'utf8');

indexHtml = indexHtml.replace(/(?1<!-- Audio Toggle -->[\s\S]*?)const btnSound = new Audio[\\s\\S]*?\n}\);/m, '// Audio logic managed by audio.js');

if(!indexHtml.includes('audio.js')) {
    indexHtml = indexHtml.replace('<script src="dapp.js', '<script src="audio.js?v=3.0"></script>\n    <script src="dapp.js');
}

if(!indexHtml.includes('id="audio-toggle"')) {
    indexHtml = indexHtml.replace('<div class="container mx-auto px-4 h-full flex flex-col justify-center items-center text-center"', '<button id="audio-toggle" class="absolute top-4 right-4 text-xs font-display text-primary/70 hover:text-primary transition-colors border border-primary/20 px-3 py-1.5 rounded-lg bg-black/40 backdrop-blur-md z-[100]">🔥 Sound ON</button>\n        <div class="container mx-auto px-4 h-full flex flex-col justify-center items-center text-center"');
}


if(!indexHtml.includes('sysAudio.playSuccess()')) {
    indexHtml = indexHtml.replace('iconHtml = \'<i data-lucide="check-circle"', 'if(window.sysAudio) sysAudio.playSuccess();\n                iconHtml = \'<i data-lucide="check-circle"');
    indexHtml = indexHtml.replace('iconHtml = \'<i data-lucide="alert-triangle"', 'if(window.sysAudio) sysAudio.playError();\n                iconHtml = \'<i data-lucide="alert-triangle"');
}


if(!indexHtml.includes('aurora-bg')) {
    indexHtml = indexHtml.replace('class="bg-black text-white font-sans overflow-x-hidden relative"', 'class="bg-black text-white font-sans overflow-x-hidden relative aurora-bg"');
    indexHtml = indexHtml.replace('</style>',  '  .aurora-bg { background: radial-gradient(circle at 50% -50%, rgba(255, 204, 0, 0.1), transparent 70%); }\n    </style>');
}

fs.writeFileSync('index.html', indexHtml);

const pages = [
    { file: 'whitepaper.html', title: 'WHITEPAPER | SNR-VAULT', heading: 'THE SOVEREIGN WHITEPAPER', content: '<div class="prose prose-invert max-w-none"><p>Executive Summary: SNR-VAULT is the premier Sovereign Infrastructure for the Digital Economy.</p><h3>Vision & Mission</h3><p>To provide a decentralized, robust, and permanent yield ecosystem on the Binance Smart Chain.</p><h3>Tokenomics</h3><p>Max Supply: 10,000,000 SNR. Ecosystem: 10% tax on harvests/withdrawals directed to the Treasury.</p><h3>Risk Disclosure</h3><p>Smart contracts are immutable. Cryptocurrency is volatile. Proceed with sovereign responsibility.</p></div>' },
    { file: 'about.html', title: 'ABOUT US | SNR-VAULT', heading: 'ABOUT THE PROTOCOL', content: '<p>SNR-VAULT is an enterprise-grade staking protocol audited and verified.</p>' },
    { file: 'security.html', title: 'SECURITY | SNR-VAULT', heading: 'SECURITY & INFRASTRUCTURE', content: '<p>100% Non-custodial. Audited smart contracts. Timelock protected.</p>' },
    { file: 'privacy-policy.html', title: 'PRIVACY POLICY | SNR-VAULT', heading: 'PRIVACY POLICY', content: '<p>We do not track IP addresses or personal identities. You are an anonymous wallet address.</p>' },
    { file: 'terms-of-use.html', title: 'TERMS OF USE | SNR-VAULT', heading: 'TERMS OF USE', content: '<p>By connecting your wallet, you agree to the immutable laws of the deployed Smart Contract.</p>' },
    { file: 'risk-disclosure.html', title: 'RISK DISCLOSURE | SNR-VAULT', heading: 'RISK DISCLOSURE', content: '<p>Cryptocurrency involves high risk. Never invest more than you can afford to lose.</p>' },
    { file: 'roadmap.html', title: 'ROADMAP | SNR-VAULT', heading: 'ENTERPRISE roadmap', content: '<p>Q3 2026: Enterprise Deployment<br>Q4 2026: Cross-chain Assets<br>Q1 2027: Sovereign AI Integrations</p>' },
    { file: 'contact.html', title: 'CONTACT | SNR-VAULT', heading: 'CONTACT PROTOCOL', content: '<p>Direct P2O OTC: +62 838 2968 1017 (Official WA Escrow).</p>' },
    { file: 'transparency.html', title: 'TRANSPARENCY | SNR-VAULT', heading: 'LEDGER TRANSPARENCY', content: '<p>All liabilities, reserve balances, and leader rewards are permanently logged on BSC.</p>' }
];

let baseTemplate = fs.readFileSync('index.html', 'utf8');
let header = baseTemplate.split('<main')[0];
let footer = baseTemplate.split('</main>')[1];

pages.forEach(p => {
    let pageHtml = header.replace(/<title>.*<\/title>/, `<title>${p.title}</title>`)
        + `<main class="container mx-auto px-4 py-32 z-10 relative">\n`
        + `  <div class="glass-panel p-8 max-w-4xl mx-auto border-primary/20">\n`
        + `    <h1 class="text-4xl font-black font-display text-gradient-gold mb-8">${p.heading}</h1>\n`
        + `    <div class="text-secondary leading-relaxed space-y-6">${p.content}</div>\n`
        + `    <div class="mt-12"><a href="index.html" class="text-primary hover:text-white transition-colors">&larr; Return to Fortress</a></div>\n`
        + `  </div>\n`
        + `</main>\n`
        + footer;
    fs.writeFileSync(p.file, pageHtml);
});
