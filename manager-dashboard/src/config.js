import BigNumber from "bignumber.js";


export const fUSDC_address = "0xc94dd466416A7dFE166aB2cF916D3875C049EBB7";
// export const fUSDCx_address = "0x8aE68021f6170E5a766bE613cEA0d75236ECCa9a";
// Rinkeby addresses
export const fUSDCx_address = "0x0F1D7C55A2B133E000eA10EeC03c774e0d6796e8";
export const pcrTokenFactory_address = "0xD2B8BC7154f82BB5dBB0E4eEa954e4223Bb63708";

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