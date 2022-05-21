// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;


import "@openzeppelin/contracts/proxy/Clones.sol";
import { DividendRightsToken } from "./DividendRightsToken.sol";

contract FactoryClone {
    address public immutable pcrTokenImplementation;
    address public cloneAddress;

    constructor() {
        pcrTokenImplementation = address(new DividendRightsToken("PCRbase", "PCRx"));
    }

    function createWallet() external returns (address) {
        // TODO: use deterministic clone address creation
        address clone = Clones.clone(pcrTokenImplementation);
        cloneAddress = clone;
        DividendRightsToken(payable(clone)).initialize();//"PCRclone", "PCRx1", msg.sender);
        return clone;
    }
}
