// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;


import "@openzeppelin/contracts/proxy/Clones.sol";
import { PerpetualConditionalRewardsToken } from "./PerpetualConditionalRewardsToken.sol";

contract PerpetualConditionalRewardsTokenFactory {
    address public immutable pcrTokenImplementation;
    address public newPcrTokenAddress;

    constructor() {
        pcrTokenImplementation = address(new PerpetualConditionalRewardsToken());
    }

    function createPcrToken(
        string memory name,
        string memory symbol
        ) external returns (address) {
        // TODO: use deterministic clone address creation with salt
        address clone = Clones.clone(pcrTokenImplementation);
        newPcrTokenAddress = clone;
        PerpetualConditionalRewardsToken(payable(clone)).initialize(name, symbol, msg.sender);
        return clone;
    }
}
