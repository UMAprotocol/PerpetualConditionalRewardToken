const { web3tx, toWad } = require("@decentral.ee/web3-helpers");

const deployFramework = require("@superfluid-finance/ethereum-contracts/scripts/deploy-framework");
const deployTestToken = require("@superfluid-finance/ethereum-contracts/scripts/deploy-test-token");
const deploySuperToken = require("@superfluid-finance/ethereum-contracts/scripts/deploy-super-token");
const SuperfluidSDK = require("@superfluid-finance/js-sdk");
const PerpetualConditionalReward = artifacts.require("PerpetualConditionalReward")

contract("PerpetualConditionalReward", accounts => {
    const rallyInstance = await PerpetualConditionalReward.new();
    console.log(rallyInstance)
    const errorHandler = err => {
        if (err) throw err;
    };

  it("should assert true", async function () {
    const oracleResult = await rallyInstance.askOracle.call();//accounts[0]);
    });
  it("should assert true", async function () {
    const rallyInstance = await PerpetualConditionalReward.new();
    console.log(rallyInstance)
    const oracleResult = await rallyInstance.askOracle.send();//accounts[0]);
    });
});
