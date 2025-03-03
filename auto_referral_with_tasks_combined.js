const { ethers } = require('ethers');
const axios = require('axios');
const fs = require('fs').promises;
const readline = require('readline');

const banner = `
=======================================
    AIDA AUTO BOT | ADINK725
=======================================
`;

const config = {
    baseUrl: 'https://back.aidapp.com',
    campaignId: '6b963d81-a8e9-4046-b14f-8454bc3e6eb2',
    excludedMissionId: 'f8edb0b4-ac7d-4a32-8522-65c5fb053725', // Task Invite 1 friend
    headers: {
        'authority': 'back.aidapp.com',
        'accept': '*/*',
        'accept-encoding': 'gzip, deflate, br, zstd',
        'accept-language': 'en-US,en;q=0.6',
        'origin': 'https://my.aidapp.com',
        'referer': 'https://my.aidapp.com/',
        'sec-ch-ua': '"Not(A:Brand";v="99", "Brave";v="133", "Chromium";v="133"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-site',
        'sec-gpc': '1',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36'
    }
};

// Fungsi untuk membaca referral code dari file
const readReferralCode = async () => {
    try {
        const content = await fs.readFile('reff.txt', 'utf8');
        return content.trim();
    } catch (error) {
        console.error('❌ Gagal membaca referral code dari reff.txt:', error.message);
        process.exit(1);
    }
};

// Fungsi untuk membuat wallet baru
const generateWallet = () => {
    const wallet = ethers.Wallet.createRandom();
    const walletData = {
        address: wallet.address,
        privateKey: wallet.privateKey,
        mnemonic: wallet.mnemonic.phrase
    };

    // Simpan wallet ke file JSON
    fs.writeFile('wallet.json', JSON.stringify(walletData, null, 2));

    console.log('✅ Wallet berhasil dibuat dan disimpan!');
    return wallet;
};

// Fungsi untuk otentikasi menggunakan wallet address
const authenticateWallet = async (wallet, referralCode) => {
    const message = `MESSAGE_ETHEREUM_${Date.now()}:${Date.now()}`;
    const signature = await wallet.signMessage(message);

    try {
        const response = await axios.get(`${config.baseUrl}/user-auth/login`, {
            params: {
                strategy: 'WALLET',
                chainType: 'EVM',
                address: wallet.address,
                token: message,
                signature: signature,
                inviter: referralCode
            },
            headers: config.headers
        });

        console.log('✅ Otentikasi berhasil!', response.data);
        return response.data;
    } catch (error) {
        console.error('❌ Gagal otentikasi:', error.response ? error.response.data : error.message);
        return null;
    }
};

// Fungsi untuk mendaftarkan wallet menggunakan API referral
const registerReferral = async (wallet, accessToken, referralCode) => {
    if (!accessToken) {
        console.error('❌ Token tidak ditemukan! Pastikan token tersedia.');
        return;
    }

    try {
        const response = await axios.post('https://my.aidapp.com/api/referral/register', {
            referralCode: referralCode,
            walletAddress: wallet.address
        }, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
                ...config.headers
            }
        });

        // Memeriksa apakah respons adalah HTML
        if (response.headers['content-type'].includes('text/html')) {
            console.log('✅ Wallet berhasil didaftarkan namun menerima respons HTML');
        } else {
            console.log('✅ Wallet berhasil didaftarkan menggunakan API referral!', response.data);
        }
    } catch (error) {
        if (error.response && error.response.status === 404) {
            console.error('❌ Gagal mendaftarkan wallet: Endpoint tidak ditemukan.');
        } else {
            console.error('❌ Gagal mendaftarkan wallet:', error.response ? error.response.data : error.message);
        }
        if (error.response) {
            console.error('Respons API:', error.response);
        }
    }
};

// Fungsi untuk menyimpan token ke file
const saveTokenToFile = async (filename, token) => {
    try {
        await fs.appendFile(filename, `${token}\n`);
        console.log('✅ Token berhasil disimpan ke file!');
    } catch (error) {
        console.error(`❌ Gagal menyimpan token ke file: ${error.message}`);
    }
};

// Fungsi untuk membaca token dari file
async function readTokens(filename) {
    try {
        const content = await fs.readFile(filename, 'utf8');
        return content.trim().split('\n').filter(token => token.length > 0);
    } catch (error) {
        console.error(`Error reading ${filename}:`, error.message);
        return [];
    }
}

// Fungsi untuk mendapatkan misi yang tersedia
async function getAvailableMissions(accessToken) {
    try {
        const currentDate = new Date().toISOString();
        const response = await axios.get(
            `${config.baseUrl}/questing/missions?filter%5Bdate%5D=${currentDate}&filter%5Bgrouped%5D=true&filter%5Bprogress%5D=true&filter%5Brewards%5D=true&filter%5Bstatus%5D=AVAILABLE&filter%5BcampaignId%5D=${config.campaignId}`,
            {
                headers: {
                    ...config.headers,
                    'authorization': `Bearer ${accessToken}`
                }
            }
        );
        
        return response.data.data.filter(mission => 
            mission.progress === "0" && mission.id !== config.excludedMissionId
        );
    } catch (error) {
        console.error('Error fetching available missions:', error.response?.data || error.message);
        return [];
    }
}

// Fungsi untuk menyelesaikan misi
async function completeMission(missionId, accessToken) {
    try {
        const response = await axios.post(
            `${config.baseUrl}/questing/mission-activity/${missionId}`,
            {},
            {
                headers: {
                    ...config.headers,
                    'authorization': `Bearer ${accessToken}`,
                    'content-length': '0'
                }
            }
        );

        console.log(`Mission ${missionId} completed successfully!`);
        return true;
    } catch (error) {
        console.error(`Error completing mission ${missionId}:`, error.response?.data || error.message);
        return false;
    }
}

// Fungsi untuk klaim reward misi
async function claimMissionReward(missionId, accessToken) {
    try {
        const response = await axios.post(
            `${config.baseUrl}/questing/mission-reward/${missionId}`,
            {},
            {
                headers: {
                    ...config.headers,
                    'authorization': `Bearer ${accessToken}`,
                    'content-length': '0'
                }
            }
        );

        console.log(`Reward for mission ${missionId} claimed successfully!`);
        return true;
    } catch (error) {
        console.error(`Error claiming reward for mission ${missionId}:`, error.response?.data || error.message);
        return false;
    }
}

// Fungsi untuk menjalankan bot
async function runBot() {
    console.log(banner); 

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    rl.question('Berapa akun yang ingin dibuat? ', async (answer) => {
        const numOfAccounts = parseInt(answer);

        if (isNaN(numOfAccounts) || numOfAccounts <= 0) {
            console.error('Jumlah akun tidak valid.');
            rl.close();
            return;
        }

        // Baca referral code dari reff.txt
        const referralCode = await readReferralCode();

        // Hapus semua token yang ada di new_tokens.txt
        await fs.writeFile('new_tokens.txt', '');

        for (let i = 0; i < numOfAccounts; i++) {
            console.log(`\nMembuat akun ${i + 1} dari ${numOfAccounts}...`);
            const wallet = generateWallet();
            const authData = await authenticateWallet(wallet, referralCode);
            
            if (authData && authData.tokens && authData.tokens.access_token) {
                await registerReferral(wallet, authData.tokens.access_token, referralCode);
                await saveTokenToFile('new_tokens.txt', authData.tokens.access_token); // Simpan token baru ke file
            } else {
                console.error('❌ Gagal membuat akun baru dan mendapatkan token.');
                continue;
            }
        }

        const tokens = await readTokens('new_tokens.txt');
        if (tokens.length === 0) {
            console.error('No tokens found in new_tokens.txt');
            rl.close();
            return;
        }

        console.log(`Found ${tokens.length} tokens to process...`);

        for (let i = 0; i < tokens.length; i++) {
            const accessToken = tokens[i];
            console.log(`\nProcessing token ${i + 1}/${tokens.length}: ${accessToken.slice(0, 20)}...`);

            const availableMissions = await getAvailableMissions(accessToken);
            if (availableMissions.length === 0) {
                console.log('No available missions to complete for this token.');
                continue;
            }

            console.log(`Found ${availableMissions.length} missions to complete.`);

            for (const mission of availableMissions) {
                console.log(`Processing mission: ${mission.label} (ID: ${mission.id})`);
                
                const completed = await completeMission(mission.id, accessToken);
                if (completed) {
                    await new Promise(resolve => setTimeout(resolve, 1000)); 
                    await claimMissionReward(mission.id, accessToken);
                }

                await new Promise(resolve => setTimeout(resolve, 2000)); 
            }

            console.log(`Finished processing token ${i + 1}`);
        }

        console.log('\nBot finished processing all tokens.');
        rl.close();
    });
}

runBot().catch(error => {
    console.error('Bot encountered an error:', error);
});
