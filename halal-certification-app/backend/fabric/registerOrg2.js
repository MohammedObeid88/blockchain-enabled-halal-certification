'use strict';

const { Wallets, Gateway } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const path = require('path');
const fs = require('fs');

async function main() {
    try {
        // Load the network configuration
        const ccpPath = path.resolve(__dirname, '..', 'connection', 'connection-org2.json');
        const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

        // Create a new CA client for interacting with the CA
        const caURL = ccp.certificateAuthorities['ca.org2.example.com'].url;
        const ca = new FabricCAServices(caURL);

        // Create a new file system based wallet for managing identities
        const walletPath = path.join(__dirname, '..', 'wallet', 'org2');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Check to see if we've already enrolled the user
        const userIdentity = await wallet.get('org2User');
        if (userIdentity) {
            console.log('An identity for the user "org2User" already exists in the wallet');
            return;
        }

        // Check to see if we've already enrolled the admin user
        const adminIdentity = await wallet.get('org2Admin');
        if (!adminIdentity) {
            console.log(
                'An identity for the admin user "org2Admin" does not exist in the wallet. Run enrollOrg2.js before retrying'
            );
            return;
        }

        // Build a user object for authenticating with the CA
        const provider = wallet.getProviderRegistry().getProvider(adminIdentity.type);
        const adminUser = await provider.getUserContext(adminIdentity, 'org2Admin');

        // Register the user, enroll the user, and import the new identity into the wallet
        const secret = await ca.register(
            {
                enrollmentID: 'org2User',
                role: 'client',
            },
            adminUser
        );
        const enrollment = await ca.enroll({
            enrollmentID: 'org2User',
            enrollmentSecret: secret,
        });
        const x509Identity = {
            credentials: {
                certificate: enrollment.certificate,
                privateKey: enrollment.key.toBytes(),
            },
            mspId: 'Org2MSP',
            type: 'X.509',
        };
        await wallet.put('org2User', x509Identity);
        console.log('Successfully registered and enrolled user "org2User" and imported it into the wallet');
    } catch (error) {
        console.error(`Failed to register user "org2User": ${error}`);
        process.exit(1);
    }
}

main();