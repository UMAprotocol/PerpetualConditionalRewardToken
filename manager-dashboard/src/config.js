import BigNumber from "bignumber.js";

export const gelatoFeesPaidByContract = true;

// export const fUSDC_address = "0xc94dd466416A7dFE166aB2cF916D3875C049EBB7";
// export const rewardCurrency_address = "0x8aE68021f6170E5a766bE613cEA0d75236ECCa9a";
// Rinkeby addresses
export const fUSDC_address = "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174";
export const fUSDCx_address = "0x0F1D7C55A2B133E000eA10EeC03c774e0d6796e8";
export const fDAIx_address = "0x745861aed1eee363b4aaa5f1994be40b1e05ff90";
export const rewardCurrency_address = fDAIx_address;
export const pcrTokenFactory_address = "0xba937738BFaA46b9486e39a11690eC8603C97E42";
// Kovan addresses
// export const fUSDC_address = "0x2eb320e2100a043401e3b3b132d4134f235a6a04";
// export const fUSDCx_address = "0x25B5cD2E6ebAedAa5E21d0ECF25A567EE9704aA7";
// export const fDAIx_address = "0xe3CB950Cb164a31C66e32c320A800D477019DCFF";
// export const rewardCurrency_address = fDAIx_address;
// export const pcrTokenFactory_address = "0x400B9D1c8056E550749a0A29224B6F42A5b8Ac19";
// Polygon addresses
// export const fUSDC_address = "0x2791bca1f2de4661ed88a30c99a7a9449aa84174";
// export const fUSDCx_address = "0x0F1D7C55A2B133E000eA10EeC03c774e0d6796e8";
// export const fDAIx_address = "0x1305F6B6Df9Dc47159D12Eb7aC2804d4A33173c2";
// export const rewardCurrency_address = fDAIx_address;
// export const pcrTokenFactory_address = "0x6D025291D8B16D2c10cCd4C2862Ea4a2964583a9";

export function calculateFlowRate(amount) {
    let fr = amount / (86400 * 30)
    return Math.floor(fr);
}

export function calculateStream(flowRate) {
    const stream = new BigNumber(flowRate * (86400 * 30)).shiftedBy(-18);
    return stream.toFixed(2);
}

export function calculateEndDate(bal, outflow) {
    let t = Number(bal) / (Number(outflow) * -1);
    let secondsLeft = t * 86400 * 30;
    let end = new Date(Date.now() + (secondsLeft * 1000));
    let endDay = end.toLocaleString();
    return endDay;
}

export function calculateStreamPerSecond(amount) {
    let streamSecond = amount / (86400 * 30);
    return streamSecond;
}