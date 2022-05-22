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
// Initializable protects initialization method from being called multiple times.
// Initialization is used in place of constructor - required for the contract to be cloneable.
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";


import { OptimisticRequester } from "@uma/core/contracts/oracle/implementation/OptimisticOracle.sol";
import { OptimisticOracleInterface } from "@uma/core/contracts/oracle/interfaces/OptimisticOracleInterface.sol";
import {FinderInterface} from "@uma/core/contracts/oracle/interfaces/FinderInterface.sol";
import {OracleInterfaces} from "@uma/core/contracts/oracle/implementation/Constants.sol";


// For automated triggering of "upkeep" by the Chain-Link Keepers
import "@chainlink/contracts/src/v0.8/KeeperCompatible.sol";

// For automated triggering of "upkeep" by Gelato Tasks
import {OpsReady} from "./vendor/gelato/OpsReady.sol";
interface IOps {
    function gelato() external view returns (address payable);
    function getFeeDetails() external view returns (uint256, address);
}


contract PerpetualConditionalRewardsToken is
    // Ownable,
    ERC20,
    Initializable,  // For cloning
    OpsReady,  // Allow monitoring and triggering of upkeep by Gelato Tasks
    KeeperCompatibleInterface,  // Allow monitoring and triggering of upkeep by Chain-Link Keepers
    OptimisticRequester  // Receive callbacks on Oracle price settlement
{
    // These ERC20 parameters are redeclared in child class because they cannot be called in the constructor with clones.
    string private _name;
    string private _symbol;

    bool private actuallyUseOracle = true;
    bool private actuallyUseIda = true;

    uint32 public constant INDEX_ID = 0;
    uint8 private _decimals;

    bytes private _ancillaryData = abi.encodePacked("q: title: Will Deanna recover from jetlag by 1 May?, description: This is a yes or no question. res_data: p1: 0, p2: 1, p3: 0.5. Where p2 corresponds to Yes, p1 to a No, p3 to unknown"); 
    bytes32 private _identifier = bytes32(abi.encodePacked("YES_OR_NO_QUERY"));
    OptimisticOracleInterface _oracle;
    IERC20 private _oracleRequestCurrency;

    uint256 private _oracleRequestTimestamp;
    uint256 public _payoutAmountOnOracleConfirmation = 1 ether;
    uint256 public _oracleRequestLiveness_sec = 10;
    uint256 public _oracleRequestInterval_sec = 60;  // How frequently to request a new result from the oracle

    address public immutable _gelatoOpsAddress = address(0x8c089073A9594a4FB03Fa99feee3effF0e2Bc58a);  // Rinkeby

    ISuperToken private _cashToken;
    ISuperfluid private _host;
    IInstantDistributionAgreementV1 private _ida;

    // use callbacks to track approved subscriptions
    mapping (address => bool) public isSubscribing;

    event PriceProposedEvent();
    event PriceSettledEvent(int256);
    event OracleVerificationResult(bool);
    event UpkeepPerformedEvent();

    // Keepers will monitor these variables and initiate oracle requests/settlements when needed
    uint256 public immutable _upkeepInterval_sec = 15;  // How frequently keepers are to monitor checkUpkeep
    bool public _oracleSettlementOverdue = false;
    bool public _oracleRequestOverdue = false;
    uint256 public _oracleRequestDueAt_timestamp = type(uint256).max;
    uint256 public _oracleSettlementDueAt_timestamp = type(uint256).max;

    constructor(
        string memory name,
        string memory symbol
        )
        ERC20(name, symbol)  // This is required to inherit from ERC20 - does it make sense for the base implementation?
        OpsReady(_gelatoOpsAddress)
    {
        // Clones won't have the constructor called so will be unaffected.
        // Prevent the implementation contract from being used (its sole purpose is to be cloned).
        //_disableInitializers();
    }

    function initialize(
        // string memory name,
        // string memory symbol,
        // address _owner
        /*
        ISuperToken cashToken,
        ISuperfluid host,
        IInstantDistributionAgreementV1 ida)*/
        ) public //initializer
    {
        // Manually initialize ERC20 properties that don't get called from the constructor on clones
        _name = "name";
        _symbol = "symbol";
    
        //transferOwnership(_owner);

        // Manually initialize class members that don't get initialized in cloning
        ops = _gelatoOpsAddress;
        gelato = IOps(ops).gelato();
    
        actuallyUseOracle = true;
        actuallyUseIda = true;

        _ancillaryData = abi.encodePacked("q: title: Will Deanna recover from jetlag by 1 May?, description: This is a yes or no question. res_data: p1: 0, p2: 1, p3: 0.5. Where p2 corresponds to Yes, p1 to a No, p3 to unknown"); 
        _identifier = bytes32(abi.encodePacked("YES_OR_NO_QUERY"));

        _oracleRequestTimestamp;
        _payoutAmountOnOracleConfirmation = 1 ether;
        _oracleRequestLiveness_sec = 10;
        _oracleRequestInterval_sec = 60;  // How frequently to request a new result from the oracle

        _oracleSettlementOverdue = false;
        _oracleRequestOverdue = false;
        _oracleRequestDueAt_timestamp = type(uint256).max;
        _oracleSettlementDueAt_timestamp = type(uint256).max;



        if (actuallyUseOracle) {
        // Kovan UMA Optimistic Oracle addresses
        // From https://docs.umaproject.org/dev-ref/addresses
        // _oracle = OptimisticOracleInterface(address(0xB1d3A89333BBC3F5e98A991d6d4C1910802986BC));
        // _oracleRequestCurrency = IERC20(address(0xbF7A7169562078c96f0eC1A8aFD6aE50f12e5A99));  // DAI

        // Rinkeby UMA Optimistic Oracle addresses
        _oracle = OptimisticOracleInterface(address(0x3746badD4d6002666dacd5d7bEE19f60019A8433));
        _oracleRequestCurrency = IERC20(address(0x5592EC0cfb4dbc12D3aB100b257153436a1f0FEa));  // DAI
        }

        // Schedule the first request (processing in this contract will be triggered by a Keeper when the time comes).
        _oracleRequestDueAt_timestamp = block.timestamp;// + _oracleRequestInterval_sec;

        if (actuallyUseIda) {
        // Kovan superfluid addresses
        // (from https://docs.superfluid.finance/superfluid/protocol-developers/networks)
        // ISuperfluid host = ISuperfluid(0xF0d7d1D47109bA426B9D8A3Cde1941327af1eea3);
        // ISuperToken cashToken = ISuperToken(0xe3CB950Cb164a31C66e32c320A800D477019DCFF);  // fDAIx
        // IInstantDistributionAgreementV1 ida = IInstantDistributionAgreementV1(0x556ba0b3296027Dd7BCEb603aE53dEc3Ac283d2b);

        // Rinkeby superfluid addresses
        ISuperfluid host = ISuperfluid(0xeD5B5b32110c3Ded02a07c8b8e97513FAfb883B6);
        ISuperToken cashToken = ISuperToken(0x745861AeD1EEe363b4AaA5F1994Be40b1e05Ff90);  // fDAIx
        IInstantDistributionAgreementV1 ida = IInstantDistributionAgreementV1(0x32E0ecb72C1dDD92B007405F8102c1556624264D);

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
        }

        _decimals = 0;
    }

    // Allow contract to receive ETH balance to pay for its Gelato Task upkeep
    // FIXME: Still cannot send ether to the contract via metamask
    receive() external payable {}

    function setPayoutAmount(uint256 amount_eth) external
    {
        _payoutAmountOnOracleConfirmation = amount_eth;
    }

    function setOracleRequestInterval(uint256 interval_sec) external
    {
        _oracleRequestInterval_sec = interval_sec;
    }

    function setOracleRequestLiveness(uint256 liveness_sec) external
    {
        _oracleRequestLiveness_sec = liveness_sec;
    }

    function decimals() public view override returns (uint8) {
        return _decimals;
    }

    /// @dev Issue new `amount` of gifts to `beneficiary`
    function issue(address beneficiary, uint256 amount) public /*onlyOwner*/ {
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

    /// @dev Request verification from the oracle that distribution should be paid out
    function requestOracleVerification() public returns (bool) {
        address requester = address(this);

        _oracleRequestTimestamp = block.timestamp;  // Used as a request ID of sorts
        int256 proposedPrice = 1 ether;
        if (!actuallyUseOracle) {
            return true;
        }

        // Request price from oracle to start the process
        _oracle.requestPrice(_identifier, _oracleRequestTimestamp, _ancillaryData, _oracleRequestCurrency, 0);
        // Shorten the liveness so that the question is settled faster for demo (not possible on mainnet within same call)
        _oracle.setCustomLiveness(_identifier, _oracleRequestTimestamp, _ancillaryData, _oracleRequestLiveness_sec);
        // Propose that the task has been completed
        _oracle.proposePrice(requester, _identifier, _oracleRequestTimestamp, _ancillaryData, proposedPrice); 

        return true;
    }

    /// @dev Retrieve the verification result, if the verification process has finished
    function getOracleVerificationResult() public returns (bool) {
        bool verified = false;
        if (!actuallyUseOracle) {
            return true;
        }
        int256 resolvedPrice = _oracle.settleAndGetPrice(_identifier, _oracleRequestTimestamp, _ancillaryData);
        emit OracleVerificationResult(verified);
        if (1 ether == resolvedPrice) {
            verified = true;
        } else if (0 == resolvedPrice) {
            verified = false;
        }
        return verified;  // TODO: handle 'uncertain'/'too early' responses
    }

    /// @dev Distribute predefined amount among all token holders IFF verification succeeded
    function distributeIfOracleVerificationSucceeded() public /*onlyOwner*/ {
        if (getOracleVerificationResult()) {
            if (!actuallyUseIda) {
                return;
            }
            distribute(_payoutAmountOnOracleConfirmation);
        }
    }

    /// @dev Distribute `amount` of cash among all token holders
    // TODO: restrict who can call this lol
    function distribute(uint256 cashAmount) public /*onlyOwner*/ {
        (uint256 actualCashAmount,) = _ida.calculateDistribution(
            _cashToken,
            address(this), INDEX_ID,
            cashAmount);

        //_cashToken.transferFrom(owner(), address(this), actualCashAmount);

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
     // TODO: allow distribute() to be called from the oracle without running out of gas
    function priceSettled (
        bytes32 /*identifier*/,
        uint256 /*timestamp*/,
        bytes memory /*ancillaryData*/,
        int256 resolvedPrice
    ) external override {
        emit PriceSettledEvent(resolvedPrice);
        //distribute(uint256(_payoutAmountOnOracleConfirmation));
    }

     function priceProposed(
        bytes32 /*_identifier*/,
        uint256 /*_timestamp*/,
        bytes memory /*_ancillaryData*/
    ) external override {
        emit PriceProposedEvent();
        // Schedule for the price resolution to be retrieved after the liveness elapses
        _oracleSettlementDueAt_timestamp = block.timestamp + _oracleRequestLiveness_sec;
    }

    function priceDisputed(
        bytes32 /*_identifier*/,
        uint256 /*_timestamp*/,
        bytes memory /*_ancillaryData*/,
        uint256 /*_refund*/
    ) external override {
        // TODO: handle disputes - schedule another price request in its place?
    }

    function checkForOverdueActions() public view returns (bool oracleRequestOverdue, bool oracleSettlementOverdue) {
        oracleRequestOverdue = (block.timestamp > _oracleRequestDueAt_timestamp);
        oracleSettlementOverdue = (block.timestamp > _oracleSettlementDueAt_timestamp);
    }

    function performUpkeep_noCallData() public {
        emit UpkeepPerformedEvent();
        // Re-validate that upkeep is required, as the method can be manually triggered by anyone.
        (_oracleRequestOverdue, _oracleSettlementOverdue) = checkForOverdueActions();
        require(_oracleSettlementOverdue || _oracleRequestOverdue, "Upkeep not needed.");

        if (_oracleSettlementOverdue) {
            distributeIfOracleVerificationSucceeded();
            // Clear the settlement scheduling
            // TODO: handle disputes, e.g. check again later if settlement not resolved
            _oracleSettlementDueAt_timestamp = type(uint256).max;
            _oracleSettlementOverdue = false;  // Not strictly necessary
        }

        if (_oracleRequestOverdue) {
            require(requestOracleVerification(), "Oracle request failed.");
            // Schedule for another request to happen
            _oracleRequestDueAt_timestamp = block.timestamp + _oracleRequestInterval_sec;
            _oracleRequestOverdue = false;  // Not strictly necessary
        }
    }

    function performUpkeepAndPayGelatoFees() public {
        performUpkeep_noCallData();

        // Pay for Gelato fees
        uint256 fee;
        address feeToken;
        (fee, feeToken) = IOps(ops).getFeeDetails();
        _transfer(fee, feeToken);
    }

    // Gelato-compatible API (returning the function to call)
    function checkUpkeep_noCallData() public view 
        returns (bool upkeepNeeded, bytes memory execPayload_gelato) {
        (bool oracleSettlementOverdue, bool oracleRequestOverdue) = checkForOverdueActions();
        upkeepNeeded = oracleSettlementOverdue || oracleRequestOverdue;

        execPayload_gelato = abi.encodeWithSelector(
            this.performUpkeep_noCallData.selector
            // this.performUpkeepAndPayGelatoFees.selector
        );
    }

    // Keeper-compatible API with (unused) calldata
    function checkUpkeep(bytes calldata /* checkData */) external view override
        returns (bool, bytes memory) {
            return checkUpkeep_noCallData();
        }

    function performUpkeep(bytes calldata /*performData */) external override {
        performUpkeep_noCallData();
    }
}
