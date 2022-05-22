import { GelatoOpsSDK, isGelatoOpsSupported, TaskReceipt } from "@gelatonetwork/ops-sdk";
import { ethers, Contract } from "ethers";
import { Signer } from "@ethersproject/abstract-signer";


async function createPcrTokenUpkeepTask(_signer) {
    const signer = (new ethers.providers.Web3Provider(window.ethereum)).getSigner();
  const chainId = 4;  // rinkeby
  if (!isGelatoOpsSupported(chainId)) {
    console.log(`Gelato Ops network not supported (${chainId})`);
    return;
  }

  // Init GelatoOpsSDK
  const gelatoOps = new GelatoOpsSDK(chainId, signer);

  // Prepare Task data to automate
  const counterAbi = [
	{
		"inputs": [],
		"name": "increaseCount",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_ops",
				"type": "address"
			}
		],
		"stateMutability": "nonpayable",
		"type": "constructor"
	},
	{
		"stateMutability": "payable",
		"type": "receive"
	},
	{
		"inputs": [],
		"name": "checker",
		"outputs": [
			{
				"internalType": "bool",
				"name": "canExec",
				"type": "bool"
			},
			{
				"internalType": "bytes",
				"name": "execPayload",
				"type": "bytes"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "count",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "ETH",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "gelato",
		"outputs": [
			{
				"internalType": "address payable",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "lastExecuted",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "ops",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
];
  const counter = new Contract('0x4869041CcAe0BB3eb00e3cF144B4C0Cf52b613Cc', counterAbi, signer);
  const selector = counter.interface.getSighash("increaseCount()");
  const resolverData = counter.interface.getSighash("checker()");

  // Create task
  console.log("Creating Task...");
  const res = await gelatoOps.createTask({
    execAddress: counter.address,
    execSelector: selector,
    execAbi: JSON.stringify(counterAbi),
    resolverAddress: counter.address,
    resolverData: resolverData,
    resolverAbi: JSON.stringify(counterAbi),
    useTreasury: false,
    name: "Automated Counter without treasury",
  });
  // FIXME: signing of the task name doesn't complete successfully because CORS header isn't added.
  console.log("Task created, taskId: " + res.taskId + " tx hash: " + res.transactionHash);
  console.log("> https://app.gelato.network/task/" + res.taskId + "?chainId=" + chainId);
}

export default createPcrTokenUpkeepTask;