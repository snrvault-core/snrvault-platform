// v2/assets/js/env.js
// Read-only config layer (aman). Tidak mengubah logic on-chain.
// Pastikan dashboard.js / transparency.js bisa ambil config dari sini.

window.SNR_ENV = {
  MODE: "STAGING", // nanti kita ubah ke "PRODUCTION" saat lock
  CHAIN: "BSC Mainnet",
  RPC: "https://bsc-dataseed.binance.org/",
  TOKEN_SYMBOL: "SNR",

  // Kontrak (sesuaikan kalau sudah fix)
  SNR_TOKEN: "0x5ce1427f77d8c58f97f5e18b36804fd54aa72718",
  SNR_STAKING: "0x59a7098D86ac1548dAF3b14aAfC43858D274f543",

  // Wallet penting (isi nanti kalau sudah final)
  TREASURY_WALLET: "",
  VAULT_REWARD_WALLET: "",
  BURN_WALLET: "0x000000000000000000000000000000000000dEaD",
};

console.log("SNR_ENV loaded:", window.SNR_ENV.MODE, window.SNR_ENV.CHAIN);
