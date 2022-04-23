// SPDX-License-Identifier: MIT
pragma solidity 0.8.13;

import {
    ISuperfluid,
    ISuperToken,
    SuperAppBase,
    SuperAppDefinitions
} from "@superfluid-finance/ethereum-contracts/contracts/apps/SuperAppBase.sol";
import {
    IInstantDistributionAgreementV1
} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/agreements/IInstantDistributionAgreementV1.sol";

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
// import { OptimisticOracle} from "@uma/core/contracts/oracle/implementation/OptimisticOracle.sol";
import "@uma/core/contracts/common/implementation/Testable.sol";


// import { OptimisticOracle } from "@/OptimisticOracleService"

/**
 * The dividends rights token show cases two use cases
 * 1. Use Instant distribution agreement to distribute tokens to token holders.
 * 2. Use SuperApp framework to update `isSubscribing` when new subscription is approved by token holder.
 */
contract DividendRightsToken is
    Ownable,
    ERC20
{

    uint32 public constant INDEX_ID = 0;
    uint8 private _decimals;

    ISuperToken private _cashToken;
    ISuperfluid private _host;
    IInstantDistributionAgreementV1 private _ida;

    // use callbacks to track approved subscriptions
    mapping (address => bool) public isSubscribing;

    constructor(
        string memory name,
        string memory symbol,
        ISuperToken cashToken,
        ISuperfluid host,
        IInstantDistributionAgreementV1 ida)
        ERC20(name, symbol)
    {
        _cashToken = cashToken;
        _host = host;
        _ida = ida;

        _host.callAgreement(
            _ida,
            abi.encodeWithSelector(
                _ida.createIndex.selector,
                _cashToken,
                INDEX_ID,
                new bytes(0) // placeholder ctx
            ),
            new bytes(0) // user data
        );

        transferOwnership(msg.sender);
        _decimals = 0;
    }

    function decimals() public view override returns (uint8) {
        return _decimals;
    }

    /// @dev Issue new `amount` of giths to `beneficiary`
    function issue(address beneficiary, uint256 amount) external onlyOwner {
        uint256 currentAmount = balanceOf(beneficiary);

        // first try to do ERC20 mint of the token that will entitle holder to rewards
        ERC20._mint(beneficiary, amount);

        // then adjust beneficiary subscription units
        _host.callAgreement(
            _ida,
            abi.encodeWithSelector(
                _ida.updateSubscription.selector,
                _cashToken,
                INDEX_ID,
                beneficiary,
                uint128(currentAmount) + uint128(amount),
                new bytes(0) // placeholder ctx
            ),
            new bytes(0) // user data
        );
    }

    /// @dev Determine if distribution should be paid out
    function checkDistribution() external public {
       OptimisticOracleInterface oracle = _getOptimisticOracle();
       address requester = address(this);
       bytes ancillaryData = "encoded question";
       bytes32 identifier = "price identifier to identify the existing request";
       uint256 timestamp = getCurrentTime();
       int256 proposedPrice = 1;
       oracle.proposePrice(requester, identifier, timestamp, ancillaryData, proposedPrice); //→ uint256 totalBond (external) 

    }

    /// @dev Distribute `amount` of cash among all token holders
    function distribute(uint256 cashAmount) external onlyOwner {
        (uint256 actualCashAmount,) = _ida.calculateDistribution(
            _cashToken,
            address(this), INDEX_ID,
            cashAmount);

        _cashToken.transferFrom(owner(), address(this), actualCashAmount);

        _host.callAgreement(
            _ida,
            abi.encodeWithSelector(
                _ida.distribute.selector,
                _cashToken,
                INDEX_ID,
                actualCashAmount,
                new bytes(0) // placeholder ctx
            ),
            new bytes(0) // user data
        );
    }

    /// @dev ERC20._transfer override, to update the recipient of IDA when token owner changes
    // TODO: Prompt the new token holder to accept the SuperFluid IDA
    // TODO: Prevent distributions from being locked in UniSwap etc that cannot approve the IDA
    function _transfer(address sender, address recipient, uint256 amount) internal override {
        uint128 senderUnits = uint128(ERC20.balanceOf(sender));
        uint128 recipientUnits = uint128(ERC20.balanceOf(recipient));
        // first try to do ERC20 transfer
        ERC20._transfer(sender, recipient, amount);

        // Remove the old owner from IDA entitlement
        _host.callAgreement(
            _ida,
            abi.encodeWithSelector(
                _ida.updateSubscription.selector,
                _cashToken,
                INDEX_ID,
                sender,
                senderUnits - uint128(amount),
                new bytes(0) // placeholder ctx
            ),
            new bytes(0) // user data
        );

        // Add the new owner to the IDA
        _host.callAgreement(
            _ida,
            abi.encodeWithSelector(
                _ida.updateSubscription.selector,
                _cashToken,
                INDEX_ID,
                recipient,
                recipientUnits + uint128(amount),
                new bytes(0) // placeholder ctx
            ),
            new bytes(0) // user data
        );
    }

}
