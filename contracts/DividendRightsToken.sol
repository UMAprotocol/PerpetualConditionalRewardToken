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
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";


import { OptimisticRequester } from "@uma/core/contracts/oracle/implementation/OptimisticOracle.sol";
import { OptimisticOracleInterface } from "@uma/core/contracts/oracle/interfaces/OptimisticOracleInterface.sol";
import {FinderInterface} from "@uma/core/contracts/oracle/interfaces/FinderInterface.sol";
import {OracleInterfaces} from "@uma/core/contracts/oracle/implementation/Constants.sol";

/**
 * The dividends rights token show cases two use cases
 * 1. Use Instant distribution agreement to distribute tokens to token holders.
 * 2. Use SuperApp framework to update `isSubscribing` when new subscription is approved by token holder.
 */
contract DividendRightsToken is
    Ownable,
    ERC20,
    OptimisticRequester  // Receive callbacks on Oracle price settlement
{

    uint32 public constant INDEX_ID = 0;
    uint8 private _decimals;
    bytes private _ancillaryData = abi.encodePacked("q: title: Will Deanna recover from jetlag by 1 May?, description: This is a yes or no question. res_data: p1: 0, p2: 1, p3: 0.5. Where p2 corresponds to Yes, p1 to a No, p3 to unknown"); 
    bytes32 private _identifier = bytes32(abi.encodePacked("YES_OR_NO_QUERY"));
    uint256 private _timestamp;
    uint256 private _payoutAmountOnOracleConfirmation = 10;

    OptimisticOracleInterface _oracle;

    ISuperToken private _cashToken;
    ISuperfluid private _host;
    IInstantDistributionAgreementV1 private _ida;

    // use callbacks to track approved subscriptions
    mapping (address => bool) public isSubscribing;

    constructor(
        string memory name,
        string memory symbol)
        /*
        ISuperToken cashToken,
        ISuperfluid host,
        IInstantDistributionAgreementV1 ida)*/
        ERC20(name, symbol) 
    {
        _oracle = _getOptimisticOracle();

        // Kovan superfluid addresses
        // (from https://docs.superfluid.finance/superfluid/protocol-developers/networks)
        ISuperfluid host = ISuperfluid(0xF0d7d1D47109bA426B9D8A3Cde1941327af1eea3);
        ISuperToken cashToken = ISuperToken(0xe3CB950Cb164a31C66e32c320A800D477019DCFF);
        IInstantDistributionAgreementV1 ida = IInstantDistributionAgreementV1(0x556ba0b3296027Dd7BCEb603aE53dEc3Ac283d2b);

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

        // Hard-code some initial recipients of IDA
        issue(address(0x8C9E7eE24B97d118F4b0f28E4Da89D349db2F28B), 10);
        issue(address(0xCDA9908fCA6029f04d177CD07BFeaAe54E0739A5), 10);
  
        transferOwnership(msg.sender);
        _decimals = 0;
    }

    function decimals() public view override returns (uint8) {
        return _decimals;
    }

    /// @dev Issue new `amount` of gifts to `beneficiary`
    function issue(address beneficiary, uint256 amount) public onlyOwner {
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

    function _getOptimisticOracle() internal pure returns (OptimisticOracleInterface) {
        // Kovan UMA Optimistic Oracle address
        // From https://docs.umaproject.org/dev-ref/addresses
        return OptimisticOracleInterface(address(0xB1d3A89333BBC3F5e98A991d6d4C1910802986BC));
    }

    /// @dev Request verification from the oracle that distribution should be paid out
    function requestVerification() external returns (bool) {
        address requester = address(this);

        _timestamp = block.timestamp;
        int256 proposedPrice = 1 ether;
        uint256 customLiveness_sec = 30;

        // Request price from oracle to start the process
        _oracle.requestPrice(_identifier, _timestamp, _ancillaryData, IERC20(address(0xbF7A7169562078c96f0eC1A8aFD6aE50f12e5A99)), 0);
        // Shorten the liveness so that the question is settled faster for demo (not possible on mainnet within same call)
        _oracle.setCustomLiveness(_identifier, _timestamp, _ancillaryData, customLiveness_sec);
        // Propose that the task has been completed
        _oracle.proposePrice(requester, _identifier, _timestamp, _ancillaryData, proposedPrice); 

        return true;
    }

    /// @dev Retrieve the verification result, if the verification process has finished
    function getVerificationResult() external returns (int256) {
        int256 resolvedPrice = _oracle.settleAndGetPrice(_identifier, _timestamp, _ancillaryData);
        emit PriceSettledEvent(resolvedPrice);
        return resolvedPrice;
    }

    /// @dev Distribute `amount` of cash among all token holders
    function distribute(uint256 cashAmount) public onlyOwner {
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

    /**
     *  Callback for settlement.
     *  identifier price identifier being requested.
     *  timestamp timestamp of the price being requested.
     *  ancillaryData ancillary data of the price being requested.
     *  price price that was resolved by the escalation process.
     */
    function priceSettled (
        bytes32 /*identifier*/,
        uint256 /*timestamp*/,
        bytes memory /*ancillaryData*/,
        int256 /*price*/
    ) external override onlyOwner {
       distribute(uint256(_payoutAmountOnOracleConfirmation));
    }

     function priceProposed(
        bytes32 /*_identifier*/,
        uint256 /*_timestamp*/,
        bytes memory /*_ancillaryData*/
    ) external override {}

    function priceDisputed(
        bytes32 /*_identifier*/,
        uint256 /*_timestamp*/,
        bytes memory /*_ancillaryData*/,
        uint256 /*_refund*/
    ) external override {}

}
