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

import "@openzeppelin/contracts/utils/Strings.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

// For cloning, we require an Initializable version of ERC20: get this with ERC20Upgradeable.
// (Otherwise we can't pass the immutable ERC20 name and symbol arguments to our clone while cloning).
// Initialization is used in place of a constructor, which is required for the contract to be cloneable.
// Being Initializable protects the initialization method from being called multiple times (as of v4.6.0)
import { ERC20Upgradeable } from "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";

// Standard ERC20 tokens are also used in this contract for reward currency etc.
import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";


import "./vendor/BokkyPooBahsDateTimeLibrary/BokkyPooBahsDateTimeLibrary.sol";


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

enum Network {
    Kovan,
    Rinkeby, 
    Polygon
    }

contract PerpetualConditionalRewardsToken is
    // Ownable,
    ERC20Upgradeable,
    OpsReady,  // Allow monitoring and triggering of upkeep by Gelato Tasks
    KeeperCompatibleInterface,  // Allow monitoring and triggering of upkeep by Chain-Link Keepers
    OptimisticRequester  // Receive callbacks on Oracle price settlement
{
    bool private actuallyUseOracle = true;
    bool private actuallyUseIda = true;

    uint32 public constant INDEX_ID = 0;
    uint8 private _decimals;
    Network private _network;


    bytes private _ancillaryData;
    bytes32 private _identifier = bytes32(abi.encodePacked("YES_OR_NO_QUERY"));
    OptimisticOracleInterface _oracle;
    IERC20 public _oracleRequestCurrency;
    uint256 private _oracleRequestTimestamp;

    uint256 public _payoutAmountOnOracleConfirmation;  // Reward paid to IDA recipients if Oracle returns successful KPI
    uint256 public _oracleRequestLiveness_sec;  // Duration for which price proposals can be disputed
    uint256 public _oracleRequestInterval_sec;  // How frequently to request a new result from the oracle
    uint256 public _oracleRequestReward;  // Voluntary fee for oracle requests to incentivize price proposals


    // This needs to be manually changed in addition to the network variable e.g. _network = Network.Polygon
    // address public immutable _gelatoOpsAddress = address(0x6c3224f9b3feE000A444681d5D45e4532D5BA531);  // Kovan
    address public immutable _gelatoOpsAddress = address(0x8c089073A9594a4FB03Fa99feee3effF0e2Bc58a);  // Rinkeby
    // address public immutable _gelatoOpsAddress = address(0x527a819db1eb0e34426297b03bae11F2f8B3A19E);  // Polygon

    ISuperToken private _cashToken;
    ISuperfluid private _host;
    IInstantDistributionAgreementV1 private _ida;

    // use callbacks to track approved subscriptions
    mapping (address => bool) public isSubscribing;

    event PriceProposedEvent();
    event PriceSettledEvent(int256);
    event OracleVerificationResult(bool);
    event AncillaryDataUpdatedEvent(string);
    event UpkeepPerformedEvent();

    // Keepers will monitor these variables and initiate oracle requests/settlements when needed
    uint256 public immutable _upkeepInterval_sec = 15;  // How frequently keepers are to monitor checkUpkeep
    bool public _oracleSettlementOverdue = false;
    bool public _oracleRequestOverdue = false;
    uint256 public _oracleRequestDueAt_timestamp = type(uint256).max;
    uint256 public _oracleSettlementDueAt_timestamp = type(uint256).max;

    constructor()
        OpsReady(_gelatoOpsAddress)
    {
        // Prevent the implementation contract from being used (its sole purpose is to be cloned).
        // Clones won't have the constructor called so will be unaffected.
        // _disableInitializers();

        // FIXME: remove this and disable initializers so the base token can't be used (only enabled for dev work)
        initialize("PCR non-clone", "PCRx");
    }

    function initialize(
        string memory name,
        string memory symbol
        // address _owner
        /*
        ISuperToken cashToken,
        ISuperfluid host,
        IInstantDistributionAgreementV1 ida)*/
        ) public initializer 
    {
        __ERC20_init(name, symbol);

        _network = Network.Rinkeby;
    
        //transferOwnership(_owner);  // FIXME: reinstate ownable

        // Manually initialize class members that don't get initialized in cloning
        ops = _gelatoOpsAddress;
        gelato = IOps(ops).gelato();
    
        actuallyUseOracle = true;
        actuallyUseIda = true;

        _identifier = bytes32(abi.encodePacked("YES_OR_NO_QUERY"));

        _oracleRequestTimestamp;
        _payoutAmountOnOracleConfirmation = 1 ether;
        _oracleRequestLiveness_sec = 2 /*hours*/ * 60 /*min*/ * 60 /*seconds*/;
        _oracleRequestInterval_sec = 1 /*hours*/ * 60 /*min*/ * 60 /*seconds*/;  // How frequently to request a new result from the oracle
        
        if (Network.Polygon == _network) {
            _oracleRequestReward = 5000000;  // USDC 6 decimals
        } else {
            _oracleRequestReward = 0;  // Avoid needing to have the reward currency on testnets
        }

        _oracleSettlementOverdue = false;
        _oracleRequestOverdue = false;
        _oracleSettlementDueAt_timestamp = type(uint256).max;

        if (actuallyUseOracle) {
            if (Network.Kovan == _network) {
                // Kovan UMA Optimistic Oracle addresses
                // From https://docs.umaproject.org/resources/network-addresses
                _oracle = OptimisticOracleInterface(address(0xB1d3A89333BBC3F5e98A991d6d4C1910802986BC));
                _oracleRequestCurrency = IERC20(address(0xbF7A7169562078c96f0eC1A8aFD6aE50f12e5A99));  // DAI
                // _oracleRequestCurrency = IERC20(address(0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174));  // USDC
            } else if (Network.Rinkeby == _network){
                // Rinkeby UMA Optimistic Oracle addresses
                _oracle = OptimisticOracleInterface(address(0x3746badD4d6002666dacd5d7bEE19f60019A8433));
                // _oracleRequestCurrency = IERC20(address(0x5592EC0cfb4dbc12D3aB100b257153436a1f0FEa));  // DAI
                _oracleRequestCurrency = IERC20(address(0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174));  // USDC
            } else if (Network.Polygon == _network){
                // Polygon UMA Optimistic Oracle addresses
                _oracle = OptimisticOracleInterface(address(0xBb1A8db2D4350976a11cdfA60A1d43f97710Da49));
                // _oracleRequestCurrency = IERC20(address(0x3066818837c5e6eD6601bd5a91B0762877A6B731));  // UMA (couldn't find DAI in whitelist)
                _oracleRequestCurrency = IERC20(address(0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174));  // USDC
            } else {
                require(false, "Unsupported network");
            }
        }

        // Schedule the first request (processing in this contract will be triggered by a Keeper when the time comes).
        _oracleRequestDueAt_timestamp = block.timestamp;// + _oracleRequestInterval_sec;

        if (actuallyUseIda) {
            if (Network.Kovan == _network) {
                // (from https://docs.superfluid.finance/superfluid/protocol-developers/networks)
                _host = ISuperfluid(0xF0d7d1D47109bA426B9D8A3Cde1941327af1eea3);
                // _cashToken = ISuperToken(0xe3CB950Cb164a31C66e32c320A800D477019DCFF);  // fDAIx
                _cashToken = ISuperToken(0x25B5cD2E6ebAedAa5E21d0ECF25A567EE9704aA7);  // fUSDCx
                _ida = IInstantDistributionAgreementV1(0x556ba0b3296027Dd7BCEb603aE53dEc3Ac283d2b);
            } else if (Network.Rinkeby == _network){
                _host = ISuperfluid(0xeD5B5b32110c3Ded02a07c8b8e97513FAfb883B6);
                // _cashToken = ISuperToken(0x745861AeD1EEe363b4AaA5F1994Be40b1e05Ff90);  // fDAIx
                _cashToken = ISuperToken(0x0F1D7C55A2B133E000eA10EeC03c774e0d6796e8);  // fUSDCx
                _ida = IInstantDistributionAgreementV1(0x32E0ecb72C1dDD92B007405F8102c1556624264D);
            } else if (Network.Polygon == _network){
                _host = ISuperfluid(0x3E14dC1b13c488a8d5D310918780c983bD5982E7);
                // _cashToken = ISuperToken(0x1305F6B6Df9Dc47159D12Eb7aC2804d4A33173c2);  // DAIx
                _cashToken = ISuperToken(0xCAa7349CEA390F89641fe306D93591f87595dc1F);  // USDCx
                _ida = IInstantDistributionAgreementV1(0xB0aABBA4B2783A72C52956CDEF62d438ecA2d7a1);
            } else {
                require(false, "Unsupported network");
            }

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


        setOracleRequestString(_oracleRequestDueAt_timestamp);

        _decimals = 0;
    }

    // Allow contract to receive ETH/MATIC balance to pay for its Gelato Task upkeep
    receive() external payable {}

    function setOracleRequestString(uint256 timeToGetYesterdayOf) public
    {
        uint requestIntervalStartTimestamp = BokkyPooBahsDateTimeLibrary.subDays(timeToGetYesterdayOf, 1);
        string memory startDate_string = string.concat(
            Strings.toString(BokkyPooBahsDateTimeLibrary.getYear(requestIntervalStartTimestamp)), "-",
            Strings.toString(BokkyPooBahsDateTimeLibrary.getMonth(requestIntervalStartTimestamp)), "-",
            Strings.toString(BokkyPooBahsDateTimeLibrary.getDay(requestIntervalStartTimestamp)));

        string memory requestString = string.concat(
        "q: title: Will there be at least 25 transactions on Gelato Polygon network on ",
        startDate_string,
        "? description: This is a yes or no question based on historical data. If the contract address 0x7598e84B2E114AB62CAB288CE5f7d5f6bad35BbA on Polygon Mainnet network (chain ID 137) executed 25 or more transactions of any type during ",
        startDate_string,
        " UTC then this market will resolve to \"Yes\". Otherwise this market will resolve to \"No\". Transactions with timestamps between 00:00 ",
        startDate_string,
        " UTC and 23:59 ",
        startDate_string,
        " UTC are to be included. All transactions in that date range including failed transactions are to be included. This chain explorer link will be used for resolution: https://polygonscan.com/address/0x7598e84B2E114AB62CAB288CE5f7d5f6bad35BbA?agerange=",
        startDate_string,
        "~",
        startDate_string,  // could be different date depending on duration of KPI
        ". res_data: p1: 0, p2: 1, p3: 0.5, p4: -57896044618658097711785492504343953926634992332820282019728.792003956564819968. Where p1 corresponds to No, p2 to a Yes, p3 to unknown, and p4 to an early request");

        emit AncillaryDataUpdatedEvent(requestString);
        _ancillaryData = abi.encodePacked(requestString);     
    }

    function setPayoutAmount(uint256 amount_eth) external
    {
        _payoutAmountOnOracleConfirmation = amount_eth;
    }

    function setOracleRequestInterval(uint256 interval_sec) external
    {
        _oracleRequestInterval_sec = interval_sec;
    }
    
    function setOracleRequestReward(uint256 amount_usdc) external
    {
        _oracleRequestReward = amount_usdc;
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
        _mint(beneficiary, amount);

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
        _oracleRequestTimestamp = block.timestamp;  // Used as a request ID of sorts
        if (!actuallyUseOracle) {
            return true;
        }
        // This must be manually called temporarily for some faster dev iterations
        // setOracleRequestString(_oracleRequestDueAt_timestamp);
        
        // Approve that the request reward can be sent to the Oracle
        _oracleRequestCurrency.approve(address(_oracle), _oracleRequestReward);
        // Request price from oracle to start the process
        _oracle.requestPrice(_identifier, _oracleRequestTimestamp, _ancillaryData, _oracleRequestCurrency, _oracleRequestReward);
    
        // Configure the price request: do this within the same transaction because it's not possible after a proposal is made
        // Shorten the liveness so that the question is settled faster (default 7200 seconds = 2h)
        _oracle.setCustomLiveness(_identifier, _oracleRequestTimestamp, _ancillaryData, _oracleRequestLiveness_sec);
        // Set additional bond to 0 so that just the "final fee" is used as bond for the price proposers
        _oracle.setBond(_identifier, _oracleRequestTimestamp, _ancillaryData, 0);


        // Propose that the task has been completed (this requires a bond to be transferred on mainnet)
        // int256 proposedPrice = 1 ether;
        // address requester = address(this);
        // _oracle.proposePrice(requester, _identifier, _oracleRequestTimestamp, _ancillaryData, proposedPrice); 

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
            // Leave the distribution to the priceSettled callback (how it will be done on mainnet)
            // distribute(_payoutAmountOnOracleConfirmation);
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
        uint128 senderUnits = uint128(balanceOf(sender));
        uint128 recipientUnits = uint128(balanceOf(recipient));
        // first try to do ERC20 transfer
        _transfer(sender, recipient, amount);

        // Solidity compiler versions > 0.8.4 and less than 1.0.0 will mistakenly report
        // the following lines as unreachable when using ERC20Upgradeable transfer.
        // See https://github.com/ethereum/solidity/issues/11522

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
        if (1 ether == resolvedPrice) {
            emit OracleVerificationResult(true);
            distribute(uint256(_payoutAmountOnOracleConfirmation));
        } else if (0 == resolvedPrice) {
            emit OracleVerificationResult(false);
        }
    }

     function priceProposed(
        bytes32 /*_identifier*/,
        uint256 /*_timestamp*/,
        bytes memory /*_ancillaryData*/
    ) external override {
        emit PriceProposedEvent();
        
        if (Network.Polygon != _network) {
            // Schedule for the price resolution to be retrieved after the liveness elapses
            // Not needed on mainnet because UMA bots monitor this already
            _oracleSettlementDueAt_timestamp = block.timestamp + _oracleRequestLiveness_sec;
        }
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
            // Schedule for another request to happen (independent of when the previos one gets settled)
            _oracleRequestDueAt_timestamp = _oracleRequestDueAt_timestamp + _oracleRequestInterval_sec;
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
        );
    }

    // Gelato-compatible API (returning the function to call)
    function checkUpkeep_payGelatoFees() public view 
        returns (bool upkeepNeeded, bytes memory execPayload_gelato) {
        (bool oracleSettlementOverdue, bool oracleRequestOverdue) = checkForOverdueActions();
        upkeepNeeded = oracleSettlementOverdue || oracleRequestOverdue;

        execPayload_gelato = abi.encodeWithSelector(
            this.performUpkeepAndPayGelatoFees.selector
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
