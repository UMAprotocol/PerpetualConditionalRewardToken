// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;


import "@openzeppelin/contracts/proxy/Clones.sol";
import { PerpetualConditionalRewardsToken } from "./PerpetualConditionalRewardsToken.sol";

contract PerpetualConditionalRewardsTokenFactory {
    address public immutable pcrTokenImplementation;
    address public newPcrTokenAddress;

    constructor() {
        pcrTokenImplementation = address(new PerpetualConditionalRewardsToken("PCRbase", "PCRx"));
    }

    function createPcrToken(bool useIda, bool useOracle) external returns (address) {
        // TODO: use deterministic clone address creation
        address clone = Clones.clone(pcrTokenImplementation);
        newPcrTokenAddress = clone;
        PerpetualConditionalRewardsToken(payable(clone)).initialize(useIda, useOracle);//"PCRclone", "PCRx1", msg.sender);
        return clone;  // Why does this not return?
    }
}
