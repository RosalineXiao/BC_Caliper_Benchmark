'use strict';

const { WorkloadModuleBase } = require('@hyperledger/caliper-core');

class AssetWorkload extends WorkloadModuleBase {
    constructor() {
        super();
        this.createdAssets = [];
    }

    async initializeWorkloadModule(workerIndex, totalWorkers, roundIndex, roundArguments, sutAdapter, sutContext) {
        await super.initializeWorkloadModule(workerIndex, totalWorkers, roundIndex, roundArguments, sutAdapter, sutContext);
        this.txnType = this.roundArguments.txnType;
        this.contractId = this.roundArguments.contractId;

        // Create assets for read/update/delete rounds
        if (['read', 'update', 'delete'].includes(this.txnType)) {
            for (let i = 0; i < this.roundArguments.assets; i++) {
                const assetID = `${this.workerIndex}_${i}`;
                this.createdAssets.push(assetID);
                const request = {
                    contractId: this.contractId,
                    contractFunction: 'CreateAsset',
                    invokerIdentity: 'User1',
                    contractArguments: [assetID, 'blue', '20', 'penguin', '500'],
                    readOnly: false
                };
                await this.sutAdapter.sendRequests(request);
            }
        }
    }

    async submitTransaction() {
        const idx = Math.floor(Math.random() * this.roundArguments.assets);
        const assetID = `${this.workerIndex}_${idx}`;

        let request = {};

        switch (this.txnType) {
            case 'create':
                const newAssetID = `${this.workerIndex}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
                this.createdAssets.push(newAssetID);
                request = {
                    contractId: this.contractId,
                    contractFunction: 'CreateAsset',
                    invokerIdentity: 'User1',
                    contractArguments: [newAssetID, 'red', '10', 'lion', '1000'],
                    readOnly: false
                };
                break;

            case 'read':
                request = {
                    contractId: this.contractId,
                    contractFunction: 'ReadAsset',
                    invokerIdentity: 'User1',
                    contractArguments: [assetID],
                    readOnly: true
                };
                break;

            case 'update':
                request = {
                    contractId: this.contractId,
                    contractFunction: 'UpdateAsset',
                    invokerIdentity: 'User1',
                    contractArguments: [assetID, 'green', '25', 'tiger', '750'],
                    readOnly: false
                };
                break;

            case 'delete':
                request = {
                    contractId: this.contractId,
                    contractFunction: 'DeleteAsset',
                    invokerIdentity: 'User1',
                    contractArguments: [assetID],
                    readOnly: false
                };
                break;

            default:
                throw new Error(`Unknown txnType: ${this.txnType}`);
        }

        await this.sutAdapter.sendRequests(request);
    }

    async cleanupWorkloadModule() {
        // Only needed if we created assets that need to be cleaned up
        if (this.txnType === 'create' || this.txnType === 'update') {
            for (const assetID of this.createdAssets) {
                const request = {
                    contractId: this.contractId,
                    contractFunction: 'DeleteAsset',
                    invokerIdentity: 'User1',
                    contractArguments: [assetID],
                    readOnly: false
                };
                await this.sutAdapter.sendRequests(request);
            }
        }
    }
}

function createWorkloadModule() {
    return new AssetWorkload();
}

module.exports.createWorkloadModule = createWorkloadModule;
