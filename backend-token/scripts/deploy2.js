const PerpetualConditionalReward = artifacts.require("PerpetualConditionalReward");

module.exports = function(deployer) {
  deployer.deploy(PerpetualConditionalReward);
};
