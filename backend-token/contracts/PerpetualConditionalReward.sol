// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import {
    IInstantDistributionAgreementV1
} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/agreements/IInstantDistributionAgreementV1.sol";
// import uma

contract PerpetualConditionalReward {

  // address uma;

  constructor() public {
    // instantiate (deploy) the IDA
    // for that we need the address of the host

    // instantiate (deploy) the token
    // for that we need the address of the IDA which you will get upon its deployment

    // instantiate (not deploy, it already is deployed) the uma oracle
  }

  // we are creating a smart contract which gates the distribution of
  // funds in a superfluid stream

  // it does this by requiring a specific value to be returned from an
  // oracle system. in our case we are using U M A.

  // function which asks the oracle if something has happened or not
  // this is the "give me money" step that a contributor would take
  function askOracle() public returns (bool) {
    return true;
  }

  // the function that we have to implement in order for the oracle to be
  // able to talk to our contract
  function __oracleCallback() public {
    // parse the result
  }


}
