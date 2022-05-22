import { GelatoOpsSDK, isGelatoOpsSupported, TaskReceipt } from "@gelatonetwork/ops-sdk";
import { ethers, Contract } from "ethers";


async function createPcrTokenUpkeepTask(contractAddress, contractAbi,
        upkeepFunctionSignature, checkUpkeepFunctionSignature, signer) {
    // const signer = (new ethers.providers.Web3Provider(window.ethereum)).getSigner();
    const chainId = 4;  // rinkeby
    if (!isGelatoOpsSupported(chainId)) {
        console.log(`Gelato Ops network not supported (${chainId})`);
        return;
    }

    // Init GelatoOpsSDK
    const gelatoOps = new GelatoOpsSDK(chainId, signer);

    // Prepare Task data to automate
    const tokenContract = new Contract(contractAddress, contractAbi, signer);
    const upkeepSelector = tokenContract.interface.getSighash(upkeepFunctionSignature);
    const resolverData = tokenContract.interface.getSighash(checkUpkeepFunctionSignature);

    // Create task
    console.log("Creating Gelato Task to automate contract upkeep...");
    const res = await gelatoOps.createTask({
        execAddress: tokenContract.address,
        execSelector: upkeepSelector,
        execAbi: JSON.stringify(contractAbi),
        resolverAddress: tokenContract.address,
        resolverData: resolverData,
        resolverAbi: JSON.stringify(contractAbi),
        useTreasury: true,
        name: "PCR Token (fees paid by token manager)",
    });
    // FIXME: signing of the task name doesn't complete successfully because CORS header isn't added.
    console.log("Task created, taskId: " + res.taskId + " tx hash: " + res.transactionHash);
    const upkeepTaskUrl = "https://app.gelato.network/task/" + res.taskId + "?chainId=" + chainId
    console.log("> " + upkeepTaskUrl);
    return upkeepTaskUrl;  // FIXME: logging only happens after task creation is finished, but a promise is returned immediately.
}

export default createPcrTokenUpkeepTask;