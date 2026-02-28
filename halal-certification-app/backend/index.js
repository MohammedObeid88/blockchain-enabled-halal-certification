const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { Gateway, Wallets } = require('fabric-network');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const crypto = require('crypto');

const upload = multer({ dest: 'uploads/' });

mongoose
    .connect('mongodb://localhost:27017/halal-certification-app', {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(() => console.log('MongoDB connected'))
    .catch((err) => console.error('MongoDB connection error:', err));

const app = express();
app.use(bodyParser.json());
app.use(
    cors({
        origin: ['http://127.0.0.1:3000', 'http://localhost:3000'],
        credentials: true,
    })
);

const User = require('./models/User');

app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await User.findOne({ username });

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        res.json({
            username: user.username,
            org: user.org,
            identity: user.identity,
        });

    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/InitLedger', async (req, res) => {
    try {
        const { org, identity } = req.body;

        if (!org || !identity) {
            return res
                .status(400)
                .json({ error: 'Missing required parameters' });
        }

        const ccpPath = path.resolve(
            __dirname,
            'connection',
            `connection-${org}.json`
        );
        const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

        const walletPath = path.join(process.cwd(), 'wallet', org);
        const wallet = await Wallets.newFileSystemWallet(walletPath);

        const gateway = new Gateway();
        await gateway.connect(ccp, {
            wallet,
            identity,
            discovery: { enabled: true, asLocalhost: true },
        });

        const network = await gateway.getNetwork('mychannel');
        const contract = network.getContract('halalCertification');

        const result = await contract.submitTransaction('InitLedger');

        res.status(200).json({
            message: 'InitLedger transaction submitted successfully',
            result: { productID: '123' },
        });
        await gateway.disconnect();
    } catch (error) {
        console.error(`Failed to submit transaction: ${error}`);
        res.status(500).send(`Error: ${error}`);
    }
});

app.post('/requestHalalCertification', async (req, res) => {
    try {
        const { org, identity, productID } = req.body;

        if (!org || !identity || !productID) {
            return res
                .status(400)
                .json({ error: 'Missing required parameters' });
        }

        const ccpPath = path.resolve(
            __dirname,
            'connection',
            `connection-${org}.json`
        );
        const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

        const walletPath = path.join(process.cwd(), 'wallet', org);
        const wallet = await Wallets.newFileSystemWallet(walletPath);

        const gateway = new Gateway();
        await gateway.connect(ccp, {
            wallet,
            identity,
            discovery: { enabled: true, asLocalhost: true },
        });

        const network = await gateway.getNetwork('mychannel');
        const contract = network.getContract('halalCertification');

        const result = await contract.submitTransaction(
            'requestHalalCertification',
            productID
        );

        res.status(200).json({
            message: 'Transaction submitted successfully',
            result: JSON.parse(result.toString()),
        });
        await gateway.disconnect();
    } catch (error) {
        console.error(`Failed to submit transaction: ${error}`);
        res.status(500).send(`Error: ${error}`);
    }
});

app.post('/cancelRequest', async (req, res) => {
    try {
        const { org, identity, productID } = req.body;

        if (!org || !identity || !productID) {
            return res
                .status(400)
                .json({ error: 'Missing required parameters' });
        }

        const ccpPath = path.resolve(
            __dirname,
            'connection',
            `connection-${org}.json`
        );
        const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

        const walletPath = path.join(process.cwd(), 'wallet', org);
        const wallet = await Wallets.newFileSystemWallet(walletPath);

        const gateway = new Gateway();
        await gateway.connect(ccp, {
            wallet,
            identity,
            discovery: { enabled: true, asLocalhost: true },
        });

        const network = await gateway.getNetwork('mychannel');
        const contract = network.getContract('halalCertification');

        const result = await contract.submitTransaction(
            'cancelRequest',
            productID
        );

        res.status(200).json({
            message: 'Transaction submitted successfully',
            result: JSON.parse(result.toString()),
        });
        await gateway.disconnect();
    } catch (error) {
        console.error(`Failed to submit transaction: ${error}`);
        res.status(500).send(`Error: ${error}`);
    }
});

app.post('/applyForAppeal', async (req, res) => {
    try {
        const { org, identity, productID, appealReason } = req.body;

        if (!org || !identity || !productID || !appealReason) {
            return res
                .status(400)
                .json({ error: 'Missing required parameters' });
        }

        const ccpPath = path.resolve(
            __dirname,
            'connection',
            `connection-${org}.json`
        );
        const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

        const walletPath = path.join(process.cwd(), 'wallet', org);
        const wallet = await Wallets.newFileSystemWallet(walletPath);

        const gateway = new Gateway();
        await gateway.connect(ccp, {
            wallet,
            identity,
            discovery: { enabled: true, asLocalhost: true },
        });

        const network = await gateway.getNetwork('mychannel');
        const contract = network.getContract('halalCertification');

        const result = await contract.submitTransaction(
            'applyForAppeal',
            productID,
            appealReason
        );

        res.status(200).json({
            message: 'Transaction submitted successfully',
            result: JSON.parse(result.toString()),
        });
        await gateway.disconnect();
    } catch (error) {
        console.error(`Failed to submit transaction: ${error}`);
        res.status(500).send(`Error: ${error}`);
    }
});

app.post('/registerIngredientsList', async (req, res) => {
    try {
        const { org, identity, productID, ingredientsCID } = req.body;

        if (!org || !identity || !productID || !ingredientsCID) {
            return res
                .status(400)
                .json({ error: 'Missing required parameters' });
        }
        
        const hashedIngredientsCID = crypto
            .createHash('sha256')
            .update(ingredientsCID)
            .digest('hex');
        
        const ccpPath = path.resolve(
            __dirname,
            'connection',
            `connection-${org}.json`
        );
        const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

        const walletPath = path.join(process.cwd(), 'wallet', org);
        const wallet = await Wallets.newFileSystemWallet(walletPath);

        const gateway = new Gateway();
        await gateway.connect(ccp, {
            wallet,
            identity,
            discovery: { enabled: true, asLocalhost: true },
        });

        const network = await gateway.getNetwork('mychannel');
        const contract = network.getContract('halalCertification');

        const result = await contract.submitTransaction(
            'registerIngredientsList',
            productID,
            hashedIngredientsCID
        );

        res.status(200).json({
            message: 'Transaction submitted successfully',
            result: JSON.parse(result.toString()),
        });
        await gateway.disconnect();
    } catch (error) {
        console.error(`Failed to submit transaction: ${error}`);
        res.status(500).send(`Error: ${error}`);
    }
});

app.post('/checkCompliance', async (req, res) => {
    try {
        const { org, identity, productID } = req.body;

        if (!org || !identity || !productID) {
            return res
                .status(400)
                .json({ error: 'Missing required parameters' });
        }

        const ccpPath = path.resolve(
            __dirname,
            'connection',
            `connection-${org}.json`
        );
        const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

        const walletPath = path.join(process.cwd(), 'wallet', org);
        const wallet = await Wallets.newFileSystemWallet(walletPath);

        const gateway = new Gateway();
        await gateway.connect(ccp, {
            wallet,
            identity,
            discovery: { enabled: true, asLocalhost: true },
        });

        const network = await gateway.getNetwork('mychannel');
        const contract = network.getContract('halalCertification');

        const result = await contract.submitTransaction(
            'checkCompliance',
            productID
        );

        res.status(200).json({
            message: 'Transaction submitted successfully',
            result: JSON.parse(result.toString()),
        });
        await gateway.disconnect();
    } catch (error) {
        console.error(`Failed to submit transaction: ${error}`);
        res.status(500).send(`Error: ${error}`);
    }
});

app.post('/readFile', upload.single('file'), async (req, res) => {
    const filePath = req.file.path;
    const targetWords = ['pork', 'gelatin', 'alcohol'];

    try {
        const dataBuffer = fs.readFileSync(filePath);
        const data = await pdfParse(dataBuffer);

        fs.unlinkSync(filePath);

        const text = data.text.toLowerCase();
        const foundWords = targetWords.filter((word) =>
            text.includes(word.toLowerCase())
        );

        res.json({
            message: foundWords.length > 0
                ? 'Non-compliant. Undeclared ingredients found.'
                : 'Compliant. No undeclared ingredients found.',
            compliance: foundWords.length > 0
                ? foundWords
                : null,
        });
    } catch (error) {
        console.error('PDF parsing error:', error);
        res.status(500).json({ error: 'Error reading or parsing PDF.' });
    }
});

app.post('/approveHalalCertification', async (req, res) => {
    try {
        const { org, identity, productID, certificateCID } = req.body;

        if (!org || !identity || !productID || !certificateCID) {
            return res
                .status(400)
                .json({ error: 'Missing required parameters' });
        }

        const hashedCertificateCID = crypto
            .createHash('sha256')
            .update(certificateCID)
            .digest('hex');

        const ccpPath = path.resolve(
            __dirname,
            'connection',
            `connection-${org}.json`
        );
        const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

        const walletPath = path.join(process.cwd(), 'wallet', org);
        const wallet = await Wallets.newFileSystemWallet(walletPath);

        const gateway = new Gateway();
        await gateway.connect(ccp, {
            wallet,
            identity,
            discovery: { enabled: true, asLocalhost: true },
        });

        const network = await gateway.getNetwork('mychannel');
        const contract = network.getContract('halalCertification');

        const result = await contract.submitTransaction(
            'approveHalalCertification',
            productID,
            hashedCertificateCID
        );

        res.status(200).json({
            message: 'Transaction submitted successfully',
            result: JSON.parse(result.toString()),
        });
        await gateway.disconnect();
    } catch (error) {
        console.error(`Failed to submit transaction: ${error}`);
        res.status(500).send(`Error: ${error}`);
    }
});

app.post('/rejectHalalCertification', async (req, res) => {
    try {
        const { org, identity, productID } = req.body;

        if (!org || !identity || !productID) {
            return res
                .status(400)
                .json({ error: 'Missing required parameters' });
        }

        const ccpPath = path.resolve(
            __dirname,
            'connection',
            `connection-${org}.json`
        );
        const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

        const walletPath = path.join(process.cwd(), 'wallet', org);
        const wallet = await Wallets.newFileSystemWallet(walletPath);

        const gateway = new Gateway();
        await gateway.connect(ccp, {
            wallet,
            identity,
            discovery: { enabled: true, asLocalhost: true },
        });

        const network = await gateway.getNetwork('mychannel');
        const contract = network.getContract('halalCertification');

        const result = await contract.submitTransaction(
            'rejectHalalCertification',
            productID
        );

        res.status(200).json({
            message: 'Transaction submitted successfully',
            result: JSON.parse(result.toString()),
        });
        await gateway.disconnect();
    } catch (error) {
        console.error(`Failed to submit transaction: ${error}`);
        res.status(500).send(`Error: ${error}`);
    }
});

app.post('/decideOnAppeal', async (req, res) => {
    try {
        const { org, identity, productID, decision } = req.body;

        if (!org || !identity || !productID || !decision) {
            return res
                .status(400)
                .json({ error: 'Missing required parameters' });
        }

        const ccpPath = path.resolve(
            __dirname,
            'connection',
            `connection-${org}.json`
        );
        const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

        const walletPath = path.join(process.cwd(), 'wallet', org);
        const wallet = await Wallets.newFileSystemWallet(walletPath);

        const gateway = new Gateway();
        await gateway.connect(ccp, {
            wallet,
            identity,
            discovery: { enabled: true, asLocalhost: true },
        });

        const network = await gateway.getNetwork('mychannel');
        const contract = network.getContract('halalCertification');

        const result = await contract.submitTransaction(
            'decideOnAppeal',
            productID,
            decision
        );

        res.status(200).json({
            message: 'Transaction submitted successfully',
            result: JSON.parse(result.toString()),
        });
        await gateway.disconnect();
    } catch (error) {
        console.error(`Failed to submit transaction: ${error}`);
        res.status(500).send(`Error: ${error}`);
    }
});

app.post('/approveAfterAppeal', async (req, res) => {
    try {
        const { org, identity, productID, certificateCID } = req.body;

        if (!org || !identity || !productID || !certificateCID) {
            return res
                .status(400)
                .json({ error: 'Missing required parameters' });
        }

        const hashedCertificateCID = crypto
            .createHash('sha256')
            .update(certificateCID)
            .digest('hex');

        const ccpPath = path.resolve(
            __dirname,
            'connection',
            `connection-${org}.json`
        );
        const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

        const walletPath = path.join(process.cwd(), 'wallet', org);
        const wallet = await Wallets.newFileSystemWallet(walletPath);

        const gateway = new Gateway();
        await gateway.connect(ccp, {
            wallet,
            identity,
            discovery: { enabled: true, asLocalhost: true },
        });

        const network = await gateway.getNetwork('mychannel');
        const contract = network.getContract('halalCertification');

        const result = await contract.submitTransaction(
            'approveAfterAppeal',
            productID,
            hashedCertificateCID
        );

        res.status(200).json({
            message: 'Transaction submitted successfully',
            result: JSON.parse(result.toString()),
        });
        await gateway.disconnect();
    } catch (error) {
        console.error(`Failed to submit transaction: ${error}`);
        res.status(500).send(`Error: ${error}`);
    }
});

app.post('/rejectAfterAppeal', async (req, res) => {
    try {
        const { org, identity, productID } = req.body;

        if (!org || !identity || !productID) {
            return res
                .status(400)
                .json({ error: 'Missing required parameters' });
        }

        const ccpPath = path.resolve(
            __dirname,
            'connection',
            `connection-${org}.json`
        );
        const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

        const walletPath = path.join(process.cwd(), 'wallet', org);
        const wallet = await Wallets.newFileSystemWallet(walletPath);

        const gateway = new Gateway();
        await gateway.connect(ccp, {
            wallet,
            identity,
            discovery: { enabled: true, asLocalhost: true },
        });

        const network = await gateway.getNetwork('mychannel');
        const contract = network.getContract('halalCertification');

        const result = await contract.submitTransaction(
            'rejectAfterAppeal',
            productID
        );

        res.status(200).json({
            message: 'Transaction submitted successfully',
            result: JSON.parse(result.toString()),
        });
        await gateway.disconnect();
    } catch (error) {
        console.error(`Failed to submit transaction: ${error}`);
        res.status(500).send(`Error: ${error}`);
    }
});

app.get('/readState', async (req, res) => {
    try {
        const { org, identity, productID } = req.query;

        if (!org || !identity || !productID) {
            return res
                .status(400)
                .json({ error: 'Missing required parameters' });
        }

        const ccpPath = path.resolve(
            __dirname,
            'connection',
            `connection-${org}.json`
        );
        const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

        const walletPath = path.join(process.cwd(), 'wallet', org);
        const wallet = await Wallets.newFileSystemWallet(walletPath);

        const gateway = new Gateway();
        await gateway.connect(ccp, {
            wallet,
            identity,
            discovery: { enabled: true, asLocalhost: true },
        });

        const network = await gateway.getNetwork('mychannel');
        const contract = network.getContract('halalCertification');

        const result = await contract.evaluateTransaction(
            'readState',
            productID
        );

        res.status(200).json({ result: JSON.parse(result.toString()) });
        await gateway.disconnect();
    } catch (error) {
        console.error(`Failed to evaluate transaction: ${error}`);
        res.status(500).send(`Error: ${error}`);
    }
});

app.post('/uploadFile', upload.single('file'), async (req, res) => {
    try {
        const fileData = fs.readFileSync(req.file.path);
        const result = await ipfs.add(fileData);
        const fileName = `${Date.now()}-${req.file.originalname}`;
        await ipfs.files.cp(`/ipfs/${result.cid.toString()}`, `/${fileName}`);

        fs.unlinkSync(req.file.path);

        res.status(200).json({ cid: result.cid.toString() });
    } catch (error) {
        console.error('IPFS upload failed:', error);
        res.status(500).json({ error: 'Failed to upload to IPFS' });
    }
});

let ipfs;

(async () => {
    const { create } = await import('kubo-rpc-client');
    ipfs = create({ url: 'http://localhost:5001' });

    const PORT = process.env.PORT || 8081;
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`Server running on http://0.0.0.0:${PORT}`);
    });
})();
