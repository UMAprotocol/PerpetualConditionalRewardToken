// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

//import {OpsReady} from "../vendor/gelato/OpsReady.sol";
// import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";

// import { SafeERC20 } from 'https://github.com/OpenZeppelin/openzeppelin-contracts/blob/release-v3.3/contracts/token/ERC20/SafeERC20.sol';

/*
contract OpsReady {
    IOps opsGel;
    address payable public immutable gelato;
    address public constant ETH = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;

    modifier onlyOps() {
        require(msg.sender == address(opsGel), "OpsReady: onlyOps");
        _;
    }

    constructor(address _ops) {
        opsGel = IOps(_ops);
        gelato = opsGel.gelato();
    }

    function _transfer(uint256 _amount, address _paymentToken) internal {
        if (_paymentToken == ETH) {
            (bool success, ) = gelato.call{value: _amount}("");
            require(success, "_transfer: ETH transfer failed");
        } else {
            SafeERC20.safeTransfer(IERC20(_paymentToken), gelato, _amount);
        }
    }
}
*/
/*
interface IOps {
    function createTaskNoPrepayment(
        address _execAddr,
        bytes4 _execSelector,
        address _resolverAddr,
        bytes calldata _resolverData,
        address _feeToken
    ) external returns(bytes32 task);

    function gelato() external view returns (address payable);
    function getFeeDetails() external view returns (uint256, address);
}
*/
/*
interface IOps {
    function createTask(
        address _execAddress,
        bytes4 _execSelector,
        address _resolverAddress,
        bytes calldata _resolverData
    ) public returns (bytes32 task);
}
*/
contract Counter  {
    uint256 public count;
    uint256 public lastExecuted;

    constructor(/*address payable _ops*/)  {}
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
    function increaseCount(/*uint256 amount */ ) external  {
        require(
            ((block.timestamp - lastExecuted) > 180),
            "Counter: increaseCount: Time not elapsed"
        );

        count += 1;
        lastExecuted = block.timestamp;
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