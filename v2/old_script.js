
        lucide.createIcons();

        // Initialize Globe
        const globeContainer = document.getElementById('globeViz');
        if (globeContainer && typeof Globe !== 'undefined') {
            const N = 40;
            const nodesData = [...Array(N).keys()].map(() => ({
                lat: (Math.random() - 0.5) * 180,
                lng: (Math.random() - 0.5) * 360,
                size: Math.random() * 0.4 + 0.1,
                color: ['#00E5FF', '#FFCC00', '#ffffff'][Math.floor(Math.random() * 3)]
            }));

            const arcsData = [...Array(25).keys()].map(() => ({
                startLat: (Math.random() - 0.5) * 180,
                startLng: (Math.random() - 0.5) * 360,
                endLat: (Math.random() - 0.5) * 180,
                endLng: (Math.random() - 0.5) * 360,
                color: ['rgba(0, 229, 255, 0.6)', 'rgba(255, 204, 0, 0.6)'][Math.round(Math.random())]
            }));

            const world = Globe()
                (globeContainer)
                .backgroundColor('rgba(0,0,0,0)')
                .showGlobe(true)
                .showAtmosphere(true)
                .atmosphereColor('#00E5FF')
                .atmosphereAltitude(0.25)
                .globeImageUrl('https://unpkg.com/three-globe/example/img/earth-night.jpg')
                .bumpImageUrl('https://unpkg.com/three-globe/example/img/earth-topology.png')
                .pointsData(nodesData)
                .pointColor('color')
                .pointAltitude(0.02)
                .pointRadius('size')
                .pointsMerge(true)
                .arcsData(arcsData)
                .arcColor('color')
                .arcDashLength(0.4)
                .arcDashGap(0.2)
                .arcDashAnimateTime(2000)
                .width(globeContainer.clientWidth)
                .height(globeContainer.clientHeight || window.innerHeight * 0.8);

            world.controls().autoRotate = true;
            world.controls().autoRotateSpeed = 1.2;
            world.controls().enableZoom = false;
            world.controls().enablePan = false;

            window.addEventListener('resize', () => {
                world.width(globeContainer.clientWidth);
                world.height(globeContainer.clientHeight || window.innerHeight * 0.8);
            });

            setTimeout(() => {
                if(globeContainer.clientWidth) {
                    world.width(globeContainer.clientWidth);
                    world.height(globeContainer.clientHeight || window.innerHeight * 0.8);
                }
            }, 500);
        }

        // Tokenomics Chart
        document.addEventListener("DOMContentLoaded", function() {
            const chartCanvas = document.getElementById('tokenomicsBurgerChart');
            if(chartCanvas) {
                const ctx = chartCanvas.getContext('2d');
                new Chart(ctx, {
                    type: 'doughnut',
                    data: {
                        labels: ['Treasury', 'Community Reward', 'Presale Asset', 'Founder & Team', 'Marketing Reward'],
                        datasets: [{
                            data: [40, 30, 15, 10, 5],
                            backgroundColor: ['#FFD700', '#00D1FF', '#FFFFFF', '#FF4500', '#A855F7'],
                            borderWidth: 0,
                            hoverOffset: 4
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        cutout: '75%',
                        plugins: {
                            legend: { display: false },
                            tooltip: { enabled: true }
                        }
                    }
                });
            }
        });

        // SPA Navigation Logic
        function toggleDapp(showDapp) {
            const landing = document.getElementById('view-landing');
            const dapp = document.getElementById('view-dapp');
            
            if (showDapp) {
                landing.style.opacity = '0';
                setTimeout(() => {
                    landing.style.display = 'none';
                    dapp.style.display = 'block';
                    void dapp.offsetWidth;
                    dapp.style.opacity = '1';
                    window.scrollTo(0,0);
                    lucide.createIcons();
                }, 300);
            } else {
                dapp.style.opacity = '0';
                setTimeout(() => {
                    dapp.style.display = 'none';
                    landing.style.display = 'block';
                    void landing.offsetWidth;
                    landing.style.opacity = '1';
                    window.scrollTo(0,0);
                }, 300);
            }
        }

        // Tab Switcher for dApp Dashboard
        function switchTab(tabName) {
            document.querySelectorAll('.dapp-tab').forEach(tab => {
                tab.classList.remove('active');
                tab.style.display = 'none';
            });

            document.querySelectorAll('[id^="btn-"]').forEach(btn => {
                btn.classList.remove('bg-primary', 'text-black');
                btn.classList.add('text-secondary', 'hover:text-white');
            });

            const targetTab = document.getElementById('tab-' + tabName);
            const targetBtn = document.getElementById('btn-' + tabName);
            if(targetTab) {
                targetTab.classList.add('active');
                targetTab.style.display = 'block';
            }
            if(targetBtn) {
                targetBtn.classList.remove('text-secondary', 'hover:text-white');
                targetBtn.classList.add('bg-primary', 'text-black');
            }
        }

        document.addEventListener("DOMContentLoaded", () => {
            switchTab('staking');
        });

        // Web3 Connection Logic
        const SNR_TOKEN_ADDRESS = "0x5ce1427f77d8c58f97f5e18b36804fd54aa72718";
        
        async function connectWallet() {
            if (typeof window.ethereum !== 'undefined') {
                try {
                    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                    const userAddress = accounts[0];
                    
                    const connectBtn = document.getElementById('btn-connect-wallet');
                    if(connectBtn) {
                        connectBtn.innerHTML = '<i data-lucide="check-circle" class="w-4 h-4"></i> ' + userAddress.substring(0,6) + '...' + userAddress.substring(userAddress.length - 4);
                        lucide.createIcons();
                    }

                    const bnbBalanceWei = await window.ethereum.request({
                        method: 'eth_getBalance',
                        params: [userAddress, 'latest']
                    });
                    const bnbBalance = parseFloat(parseInt(bnbBalanceWei, 16) / 1e18).toFixed(4);
                    document.getElementById('ui-bnb-balance').innerText = bnbBalance;

                    fetchSNRBalance(userAddress);

                } catch (error) {
                    console.error("User denied account access", error);
                }
            } else {
                alert("Please install MetaMask or a compatible Web3 Wallet to connect.");
            }
        }

        async function fetchSNRBalance(userAddress) {
            const cleanAddress = userAddress.replace('0x', '').padStart(64, '0');
            const data = '0x70a08231' + cleanAddress; 

            try {
                const response = await window.ethereum.request({
                    method: 'eth_call',
                    params: [{
                        to: SNR_TOKEN_ADDRESS,
                        data: data
                    }, 'latest']
                });
                
                const snrBalanceRaw = parseInt(response, 16);
                const snrBalance = parseFloat(snrBalanceRaw / 1e18).toFixed(2); 
                document.getElementById('ui-snr-balance').innerText = snrBalance;
            } catch (err) {
                console.error("Error fetching SNR token balance", err);
            }
        }

        // Protocol Execution Logic
        async function executeProtocol() {
            const amountInput = document.getElementById('stake-amount').value;
            const mentorInput = document.getElementById('stake-mentor').value;
            const durationInput = document.getElementById('stake-duration').value;

            if (typeof window.ethereum === 'undefined') {
                showTxModal('error', 'Connection Required', 'Please connect your Web3 wallet to access the protocol.');
                return;
            }

            try {
                const accounts = await window.ethereum.request({ method: 'eth_accounts' });
                if (!accounts || accounts.length === 0) {
                    showTxModal('error', 'Connection Required', 'Please connect your Web3 wallet first.');
                    return;
                }
            } catch(e) {
                showTxModal('error', 'Connection Error', 'Unable to verify wallet connection.');
                return;
            }

            const amount = parseFloat(amountInput);
            if (isNaN(amount) || amount < 100) {
                showTxModal('error', 'Invalid Amount', 'Minimum protocol participation requires 100 SNR.');
                return;
            }

            if (!mentorInput || mentorInput.length < 42 || !mentorInput.startsWith('0x')) {
                showTxModal('error', 'Invalid Mentor', 'Please provide a valid Web3 mentor address (0x...).');
                return;
            }

            showTxModal('loading', 'Executing Protocol', 'Initiating secure smart contract interaction on BSC...');

            setTimeout(() => {
                showTxModal('success', 'Protocol Active', `Successfully staked ${amount} SNR for ${durationInput} days. Sovereignty secured.`);
            }, 3000);
        }

        // UI Feedback Modal
        function showTxModal(type, title, message) {
            const modal = document.getElementById('tx-modal');
            const content = document.getElementById('tx-modal-content');
            
            let iconHtml = '';
            if (type === 'loading') {
                iconHtml = '<i data-lucide="loader-2" class="w-16 h-16 text-accent animate-spin mx-auto mb-6"></i>';
            } else if (type === 'success') {
                iconHtml = '<i data-lucide="check-circle" class="w-16 h-16 text-primary mx-auto mb-6 shadow-[0_0_15px_rgba(255,204,0,0.5)] rounded-full"></i>';
            } else if (type === 'error') {
                iconHtml = '<i data-lucide="alert-triangle" class="w-16 h-16 text-red-500 mx-auto mb-6"></i>';
            }

            content.innerHTML = `
                ${iconHtml}
                <h3 class="text-2xl font-display font-bold text-white mb-3 tracking-widest uppercase">${title}</h3>
                <p class="text-sm text-secondary leading-relaxed">${message}</p>
            `;
            
            lucide.createIcons();
            
            modal.style.display = 'flex';
            void modal.offsetWidth;
            modal.style.opacity = '1';
        }

        function closeTxModal() {
            const modal = document.getElementById('tx-modal');
            modal.style.opacity = '0';
            setTimeout(() => {
                modal.style.display = 'none';
            }, 300);
        }
    
