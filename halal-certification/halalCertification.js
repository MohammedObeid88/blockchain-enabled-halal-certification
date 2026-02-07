'use strict';

const stringify  = require('json-stringify-deterministic');
const sortKeysRecursive  = require('sort-keys-recursive');
const { Contract } = require('fabric-contract-api');

class HalalCertification extends Contract
{
    async InitLedger(ctx)
    {
        const userID = ctx.clientIdentity.getMSPID();
        if (userID != "Org1MSP") {
            throw new Error("Access denied.\nOnly the Manufacturer may access this function.");
        }

        const products =
        [
            {
                ID: "123",
                Client: userID,
                IngredientsCID: null,
                Status: null,
                RequestDate: null,
                CertificateCID: null,
                CertificationDate: null,
                AppealReason: null
            }
        ];

        for (const product of products)
        {
            await ctx.stub.putState(product.ID, Buffer.from(stringify(sortKeysRecursive(product))));
        }
    }

    async createAsset(ctx, productID)
    {
        const userID = ctx.clientIdentity.getMSPID();
        if (userID != "Org1MSP") {
            throw new Error("Access denied.\nOnly the Manufacturer may access this function.");
        }

        const exists = await ctx.stub.getState(productID);
        if (exists && exists.length > 0) {
            throw new Error(`The product ${productID} already exists.`);
        }

        const product = {
            ID: productID,
            Client: userID,
            IngredientsCID: null,
            Status: null,
            RequestDate: null,
            CertificateCID: null,
            CertificationDate: null,
            AppealReason: null
        };

        await ctx.stub.putState(productID, Buffer.from(stringify(sortKeysRecursive(product))));

        return JSON.stringify(product);
    }

    async requestHalalCertification(ctx, productID)
    {
        const userID = ctx.clientIdentity.getMSPID();
        if (userID != "Org1MSP") {
            throw new Error("Access denied.\nOnly the Manufacturer may access this function.");
        }

        const exists = await ctx.stub.getState(productID);
        if (!exists || exists.length === 0) {
            throw new Error("Product ID does not exist.");
        }

        const product = JSON.parse(exists.toString('utf8'));

        if (product.Status != null) {
            throw new Error("Application request already exists.");
        }

        const timestamp = ctx.stub.getTxTimestamp();

        product.Status = "requested";
        product.RequestDate = new Date(timestamp.seconds.low * 1000).toLocaleString('sv-SE', { timeZone: 'Asia/Dubai' }).replace(' ', 'T');

        await ctx.stub.putState(productID, Buffer.from(stringify(sortKeysRecursive(product))));

        return JSON.stringify({
            message: "Halal certification request submitted successfully.",
            time: product.RequestDate
        });
    }

    async cancelRequest(ctx, productID)
    {
        const userID = ctx.clientIdentity.getMSPID();
        if (userID != "Org1MSP") {
            throw new Error("Access denied.\nOnly the Manufacturer may access this function.");
        }

        const exists = await ctx.stub.getState(productID);
        if (!exists || exists.length === 0) {
            throw new Error("Product ID does not exist.");
        }

        const product = JSON.parse(exists.toString('utf8'));

        if (product.Status != "requested" && product.Status != "pending") {
            throw new Error("Application request does not exist and/or it is completed.");
        }

        product.Status = "cancelled";

        await ctx.stub.putState(productID, Buffer.from(stringify(sortKeysRecursive(product))));

        const timestamp = ctx.stub.getTxTimestamp();

        return JSON.stringify({
            message: "Halal certification request cancelled successfully.",
            time: new Date(timestamp.seconds.low * 1000).toLocaleString('sv-SE', { timeZone: 'Asia/Dubai' }).replace(' ', 'T')
        });
    }

    async applyForAppeal(ctx, productID, appealReason)
    {
        const userID = ctx.clientIdentity.getMSPID();
        if (userID != "Org1MSP") {
            throw new Error("Access denied.\nOnly the Manufacturer may access this function.");
        }

        const exists = await ctx.stub.getState(productID);
        if (!exists || exists.length === 0) {
            throw new Error("Product ID does not exist.");
        }

        const product = JSON.parse(exists.toString('utf8'));

        if (product.Status != "rejected") {
            throw new Error("Application request is not rejected.");
        }

        product.Status = "appealed";
        product.AppealReason = appealReason;

        await ctx.stub.putState(productID, Buffer.from(stringify(sortKeysRecursive(product))));

        const timestamp = ctx.stub.getTxTimestamp();

        return JSON.stringify({
            message: "Appeal request sent successfully.",
            time: new Date(timestamp.seconds.low * 1000).toLocaleString('sv-SE', { timeZone: 'Asia/Dubai' }).replace(' ', 'T')
        });
    }

    //Ingredients_List.pdf CID: QmZ1VyCqtV7uzvUiQrUXvV3bUJwCyAtTQG6RKyrNuiuuTJ

    async registerIngredientsList(ctx, productID, ingredientsCID)
    {
        const userID = ctx.clientIdentity.getMSPID();
        if (userID != "Org2MSP") {
            throw new Error("Access denied.\nOnly the Ministry may access this function.");
        }

        const exists = await ctx.stub.getState(productID);
        if (!exists || exists.length === 0) {
            throw new Error("Product ID does not exist.");
        }

        const product = JSON.parse(exists.toString('utf8'));

        if (product.Status == null || product.Status == "cancelled") {
            throw new Error("Application request does not exist or it was cancelled.");
        }

        if (product.IngredientsCID) {
            throw new Error("Ingredients list already registered.");
        }

        product.IngredientsCID = ingredientsCID;

        await ctx.stub.putState(productID, Buffer.from(stringify(sortKeysRecursive(product))));

        const timestamp = ctx.stub.getTxTimestamp();

        return JSON.stringify({
            message: "Ingredients list registered successfully.",
            cid: product.IngredientsCID,
            time: new Date(timestamp.seconds.low * 1000).toLocaleString('sv-SE', { timeZone: 'Asia/Dubai' }).replace(' ', 'T')
        });
    }

    async checkCompliance(ctx, productID)
    {
        const userID = ctx.clientIdentity.getMSPID();
        if (userID != "Org2MSP") {
            throw new Error("Access denied.\nOnly the Ministry may access this function.");
        }

        const exists = await ctx.stub.getState(productID);
        if (!exists || exists.length === 0) {
            throw new Error("Product ID does not exist.");
        }

        const product = JSON.parse(exists.toString('utf8'));

        if (product.Status != "requested") {
            throw new Error("Application request does not exist.");
        }

        product.Status = "pending";

        await ctx.stub.putState(productID, Buffer.from(stringify(sortKeysRecursive(product))));

        const timestamp = ctx.stub.getTxTimestamp();

        return JSON.stringify({
            message: "Product is under review.",
            cid: product.IngredientsCID,
            time: new Date(timestamp.seconds.low * 1000).toLocaleString('sv-SE', { timeZone: 'Asia/Dubai' }).replace(' ', 'T')
        });
    }

    //Halal_Certificate.pdf CID: QmRC2CpUrzZ7TdyzGpR4hfCfJZ3wNZUqXMEBCeubrvvNxk

    async approveHalalCertification(ctx, productID, certificateCID)
    {
        const userID = ctx.clientIdentity.getMSPID();
        if (userID != "Org2MSP") {
            throw new Error("Access denied.\nOnly the Ministry may access this function.");
        }

        const exists = await ctx.stub.getState(productID);
        if (!exists || exists.length === 0) {
            throw new Error("Product ID does not exist.");
        }

        const product = JSON.parse(exists.toString('utf8'));

        if (product.Status != "pending") {
            throw new Error("Application request is not under review.");
        }

        if (product.CertificateCID) {
            throw new Error("Application already approved and certificate granted.");
        }

        const timestamp = ctx.stub.getTxTimestamp();

        product.Status = "approved";
        product.CertificateCID = certificateCID;
        product.CertificationDate = new Date(timestamp.seconds.low * 1000).toLocaleString('sv-SE', { timeZone: 'Asia/Dubai' }).replace(' ', 'T');

        await ctx.stub.putState(productID, Buffer.from(stringify(sortKeysRecursive(product))));

        return JSON.stringify({
            message: "Halal certification granted successfully.",
            time: product.CertificationDate
        });
    }

    async rejectHalalCertification(ctx, productID)
    {
        const userID = ctx.clientIdentity.getMSPID();
        if (userID != "Org2MSP") {
            throw new Error("Access denied.\nOnly the Ministry may access this function.");
        }

        const exists = await ctx.stub.getState(productID);
        if (!exists || exists.length === 0) {
            throw new Error("Product ID does not exist.");
        }

        const product = JSON.parse(exists.toString('utf8'));

        if (product.Status != "pending") {
            throw new Error("Application request is not under review.");
        }

        product.Status = "rejected";

        await ctx.stub.putState(productID, Buffer.from(stringify(sortKeysRecursive(product))));

        const timestamp = ctx.stub.getTxTimestamp();

        return JSON.stringify({
            message: "Halal certification rejected successfully.",
            time: new Date(timestamp.seconds.low * 1000).toLocaleString('sv-SE', { timeZone: 'Asia/Dubai' }).replace(' ', 'T')
        });
    }

    async decideOnAppeal(ctx, productID, decision)
    {
        const userID = ctx.clientIdentity.getMSPID();
        if (userID != "Org2MSP") {
            throw new Error("Access denied.\nOnly the Ministry may access this function.");
        }

        const exists = await ctx.stub.getState(productID);
        if (!exists || exists.length === 0) {
            throw new Error("Product ID does not exist.");
        }

        const product = JSON.parse(exists.toString('utf8'));

        if (product.Status != "appealed") {
            throw new Error("No appeal request made for this application.");
        }

        if (decision != "appeal-accepted" && decision != "appeal-rejected") {
            throw new Error("Invalid appeal decision.");
        }

        product.Status = decision;  //appeal-accepted OR appeal-rejected

        await ctx.stub.putState(productID, Buffer.from(stringify(sortKeysRecursive(product))));

        const timestamp = ctx.stub.getTxTimestamp();

        return JSON.stringify({
            message: `Decision made on appeal request as ${product.Status}`,
            time: new Date(timestamp.seconds.low * 1000).toLocaleString('sv-SE', { timeZone: 'Asia/Dubai' }).replace(' ', 'T')
        });
    }

    async approveAfterAppeal(ctx, productID, certificateCID)
    {
        const userID = ctx.clientIdentity.getMSPID();
        if (userID != "Org2MSP") {
            throw new Error("Access denied.\nOnly the Ministry may access this function.");
        }

        const exists = await ctx.stub.getState(productID);
        if (!exists || exists.length === 0) {
            throw new Error("Product ID does not exist.");
        }

        const product = JSON.parse(exists.toString('utf8'));

        if (product.Status != "appeal-accepted") {
            throw new Error("Appeal request for application not accepted.");
        }

        if (product.CertificateCID) {
            throw new Error("Application already approved and certificate granted.");
        }

        const timestamp = ctx.stub.getTxTimestamp();

        product.Status = "approved-after-appeal";
        product.CertificateCID = certificateCID;
        product.CertificationDate = new Date(timestamp.seconds.low * 1000).toLocaleString('sv-SE', { timeZone: 'Asia/Dubai' }).replace(' ', 'T');

        await ctx.stub.putState(productID, Buffer.from(stringify(sortKeysRecursive(product))));

        return JSON.stringify({
            message: "Halal certification granted successfully after appeal.",
            time: product.CertificationDate
        });
    }

    async rejectAfterAppeal(ctx, productID)
    {
        const userID = ctx.clientIdentity.getMSPID();
        if (userID != "Org2MSP") {
            throw new Error("Access denied.\nOnly the Ministry may access this function.");
        }

        const exists = await ctx.stub.getState(productID);
        if (!exists || exists.length === 0) {
            throw new Error("Product ID does not exist.");
        }

        const product = JSON.parse(exists.toString('utf8'));

        if (product.Status != "appeal-accepted") {
            throw new Error("Appeal request for application not accepted.");
        }

        product.Status = "rejected-after-appeal";

        await ctx.stub.putState(productID, Buffer.from(stringify(sortKeysRecursive(product))));

        const timestamp = ctx.stub.getTxTimestamp();

        return JSON.stringify({
            message: "Halal certification rejected successfully after appeal.",
            time: new Date(timestamp.seconds.low * 1000).toLocaleString('sv-SE', { timeZone: 'Asia/Dubai' }).replace(' ', 'T')
        });
    }

    async readState(ctx, productID)
    {
        const exists = await ctx.stub.getState(productID);
        if (!exists || exists.length === 0) {
            throw new Error("Product ID does not exist.");
        }
        const product = JSON.parse(exists.toString('utf8'));
        return JSON.stringify(product, null, 2);
    }

    async getAssets(ctx)
    {
        const iterator = await ctx.stub.getStateByRange('', '');
        let result = await iterator.next();

        const assets = [];

        while (!result.done) {
            const asset = JSON.parse(result.value.value.toString('utf8'));
            assets.push(asset);
            result = await iterator.next();
        }

        await iterator.close();
        return JSON.stringify(assets, null, 2);
    }

    async getProductHistory(ctx, productID)
    {
        const productHistory = [];

        const iterator = await ctx.stub.getHistoryForKey(productID);
        let result = await iterator.next();

        while (!result.done) {
            const historyRecord = result.value;

            let productRecord =
            {
                txId: historyRecord.txId,
                timestamp: new Date(historyRecord.timestamp.seconds.low * 1000).toLocaleString('sv-SE', { timeZone: 'Asia/Dubai' }).replace(' ', 'T'),
                isDeleted: historyRecord.isDelete,
                value: historyRecord.isDelete ? null : JSON.parse(historyRecord.value.toString())
            };

            productHistory.push(productRecord);

            result = await iterator.next();
        }

        await iterator.close();

        return JSON.stringify(productHistory, null, 4);
    }
}

module.exports = HalalCertification;