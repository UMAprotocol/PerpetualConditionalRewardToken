// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import {OpsReady} from "./vendor/gelato/OpsReady.sol";

interface IOps {
    /*
    function createTaskNoPrepayment(
        address _execAddr,
        bytes4 _execSelector,
        address _resolverAddr,
        bytes calldata _resolverData,
        address _feeToken
    ) external returns(bytes32 task);

    function gelato() external view returns (address payable);
    */
    function getFeeDetails() external view returns (uint256, address);
}

contract CounterPaysOwnFees is OpsReady {
    uint256 public count;
    uint256 public lastExecuted;

    constructor(address _ops) OpsReady(_ops) {}
  /*  
    function startTask() external {
        IOps.createTask(
            address(this), 
            this.increaseCount.selector,
            address(this),
            abi.encodeWithSelector(this.checker.selector)
        );
    }
    */
    // Allow contract to receive ETH balance
    receive() external payable {}

    function increaseCount(/*uint256 amount */ ) external  {
        require(
            ((block.timestamp - lastExecuted) > 180),
            "Counter: increaseCount: Time not elapsed"
        );

        count += 1;
        lastExecuted = block.timestamp;

        // Pay for Gelato fees
        uint256 fee;
        address feeToken;
        (fee, feeToken) = IOps(ops).getFeeDetails();
        _transfer(fee, feeToken);
    }
    
    function checker()
        external
        view
        returns (bool canExec, bytes memory execPayload)
    {
        canExec = (block.timestamp - lastExecuted) > 180;

        execPayload = abi.encodeWithSelector(
            this.increaseCount.selector
            //uint256(100)
        );
    }
}