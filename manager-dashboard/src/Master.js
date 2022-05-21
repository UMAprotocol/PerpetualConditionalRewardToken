import React, {Component} from "react";
import Web3 from "web3";
import detectEthereumProvider from '@metamask/detect-provider';
import BigNumber from "bignumber.js";
import SuperfluidSDK from "@superfluid-finance/js-sdk";
import { pcrTokenFactory_address } from "./config";
import { PCRTokenFactoryabi } from "./abis/PcrTokenFactoryabi";
import { fUSDC_address } from "./config";
import { fUSDCx_address } from "./config";
import { fUSDCxabi } from "./abis/fUSDCxabi";
import { ERC20abi } from "./abis/ERC20abi";
import { perpetualConditionalRewardsTokenabi } from "./abis/PerpetualConditionalRewardsTokenabi";
import ConnectWallet from "./ConnectWallet";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Card from "react-bootstrap/Card";
import "./ConnectWallet.css";
import Balances from "./Balances";
import { calculateFlowRate } from "./config";
import { calculateStream } from "./config";
import { calculateEndDate } from "./config";
import StreamList from "./StreamList";
import CreateStream from "./CreateStream";
import EditStream from "./EditStream";
import CreatePCRToken from "./CreatePCRToken";
import "./Master.css"


class Master extends Component {
    constructor(props) {
        super(props);
        this.state = {
            web3: {},
            provider: {},
            sf: {},
            connected: true,
            account: '',
            fUSDC: {},
            fUSDCx: {},
            fUSDCxBal: 0,
            creatingStream: false,
            editingStream: false,
            editingAddress: "",
            outFlows: [],
            totalOutflows: 0, 
            endDate: '',
            kpiEvaluationInterval: '?',
            kpiDisputeWindow: '?',
            payoutAmount_ether: '?',
            pcrContract: {},
            pcrContract_address: '',  // 0x3056203DF5002FcD633403279f29E8eb72D492D1
            pcrTokenFactory: {},
        }

        this.initWeb3 = this.initWeb3.bind(this);
        this.getAccount = this.getAccount.bind(this);
        this.isConnected = this.isConnected.bind(this);
        this.callPCRTokenFactory = this.callPCRTokenFactory.bind(this);
        this.getCurrentPCRToken = this.getCurrentPCRToken.bind(this);
        this.getBalance = this.getBalance.bind(this);
        this.addFunding = this.addFunding.bind(this);
        this.withdrawFunding = this.withdrawFunding.bind(this);
        this.changeKpiEvaluationInterval = this.changeKpiEvaluationInterval.bind(this);
        this.getKpiEvaluationInterval = this.getKpiEvaluationInterval.bind(this);
        this.changeKpiDisputeWindow = this.changeKpiDisputeWindow.bind(this);
        this.getKpiDisputeWindow = this.getKpiDisputeWindow.bind(this);
        this.changePayoutAmount_ether = this.changePayoutAmount_ether.bind(this);
        this.getPayoutAmount_ether = this.getPayoutAmount_ether.bind(this);
        this.createStream = this.createStream.bind(this);
        this.toggleCreateModal = this.toggleCreateModal.bind(this);
        this.closeCreateModal = this.closeCreateModal.bind(this);
        this.showCreateModal = this.showCreateModal.bind(this);
        this.listOutFlows = this.listOutFlows.bind(this);
        this.showEditModal = this.showEditModal.bind(this);
        this.toggleEditModal = this.toggleEditModal.bind(this);
        this.editStream = this.editStream.bind(this);
        this.deleteStream = this.deleteStream.bind(this);
        this.getEndDate = this.getEndDate.bind(this);
        this.getTotalOutflows = this.getTotalOutflows.bind(this);

    }

    async initWeb3() {
        
        const provider = await detectEthereumProvider();
        const web3 = new Web3(provider);

        if (provider) {
            const sf = new SuperfluidSDK.Framework({
                web3: new Web3(provider)
            });

            await sf.initialize();

        
        const fUSDC = new web3.eth.Contract(ERC20abi, fUSDC_address);
        const fUSDCx = new web3.eth.Contract(fUSDCxabi, fUSDCx_address);
        const pcrTokenFactory = new web3.eth.Contract(PCRTokenFactoryabi, pcrTokenFactory_address);
        
        this.setState({
            web3: web3,
            provider: provider,
            sf: sf,
            fUSDC: fUSDC,
            fUSDCx: fUSDCx,
            pcrTokenFactory: pcrTokenFactory,
        })
        this.getKpiEvaluationInterval();
        this.getKpiDisputeWindow();
        this.getPayoutAmount_ether();

    await this.getAccount();

    if (this.state.account.length > 0) {
    await this.getBalance();
    await this.listOutFlows();
    await this.getTotalOutflows();
    await this.getEndDate(); 
    }

    }
    else {
        console.log("You should consider metamask!")
    }

   
}

async getAccount() {
    const acct = await window.ethereum.request({ method: 'eth_accounts' })
          
          if (acct.length > 0) {
              this.setState({
                  connected: true, 
                  account: acct[0]
                })
          }
          else if (acct.length === 0) {
              this.setState({
                  connected: false,
                  account: ""
              })
          }
          
          let currentAccount = acct;
            window.ethereum
            .request({ method: 'eth_accounts' })
            .then(handleAccountsChanged)
            .catch((err) => {
                // Some unexpected error.
                // For backwards compatibility reasons, if no accounts are available,
                // eth_accounts will return an empty array.
                console.error(err);
            });

            //handles a change in connected accounts
            function handleAccountsChanged(accounts) {
                if (accounts.length === 0) {
                    // MetaMask is locked or the user has not connected any accounts
                    console.log('Please connect to MetaMask.');
               
                } else if (accounts[0] !== currentAccount) {
                    currentAccount = accounts[0];
                }
            }
            
            window.ethereum.on('accountsChanged', this.isConnected, handleAccountsChanged);
    }


isConnected() {
    let accts = window.ethereum._state.accounts;
    
    if (accts.length === 0) {
        console.log('not connected')
        this.setState({connected: false})
    } else {
        console.log('connected')
        this.setState({account: accts[0]})
        this.setState({connected: true})
    }
}

async callPCRTokenFactory() {
    await this.state.pcrTokenFactory.methods.createPcrToken().send({from: this.state.account}).then(console.log)
}

async getCurrentPCRToken() {
    const pcrContract_address = await this.state.pcrTokenFactory.methods.newPcrTokenAddress().call()  // is await even appropriate here?
    console.log(pcrContract_address)
    const pcrContract = new this.state.web3.eth.Contract(perpetualConditionalRewardsTokenabi, this.state.pcrContract_address);
    console.log(pcrContract)
    this.setState({
        pcrContract_address: pcrContract_address,
        pcrContract: pcrContract,
    })
}


async getBalance() {
    const fUSDCxBal = await this.state.fUSDCx.methods.balanceOf(this.state.pcrContract_address).call({from: this.state.account});
    const adjustedfUSDCx = Number(new BigNumber(fUSDCxBal).shiftedBy(-18)).toFixed(5);
    const ethBal = await this.state.web3.eth.getBalance(this.state.pcrContract_address)
    const adjustedEth = Number(new BigNumber(ethBal).shiftedBy(-18)).toFixed(5);

    this.setState({
        fUSDCxBal: adjustedfUSDCx,  // Passed into DisplayBalance as a property
        balance: adjustedfUSDCx,  // Added, perhaps piggybacking on balance inappropriately?
        ethBalance: adjustedEth,
    })
}

async addFunding(amount) {
    await this.state.fUSDCx.methods.transfer(this.state.pcrContract_address, amount).send({from: this.state.account}).then(console.log)
    .then(
        await this.getBalance()  // TODO: why does this happen before the transfer is complete?
    ).then(console.log("Called get balance"))
}

async withdrawFunding(amount) {
    await this.state.fUSDCx.methods.downgrade(amount).send({from: this.state.account}).then(console.log)
    .then(
        await this.getBalance()
    )
}

async getKpiEvaluationInterval() {
    const kpiEvaluationInterval = await this.state.pcrContract.methods._oracleRequestInterval_sec().call()
    this.setState({kpiEvaluationInterval: kpiEvaluationInterval})
    return kpiEvaluationInterval
}

async changeKpiEvaluationInterval(interval_sec) {
    await this.state.pcrContract.methods.setOracleRequestInterval(interval_sec).send({from: this.state.account}).then(console.log)
    .then(
        // await this.getBalance()
    )
}

async getKpiDisputeWindow() {
    const kpiDisputeWindow = await this.state.pcrContract.methods._oracleRequestLiveness_sec().call()
    this.setState({kpiDisputeWindow: kpiDisputeWindow})
    return kpiDisputeWindow
}

async changeKpiDisputeWindow(interval_sec) {
    await this.state.pcrContract.methods.setOracleRequestLiveness(interval_sec).send({from: this.state.account}).then(console.log)
}

async getPayoutAmount_ether() {
    const payoutAmount_wei = await this.state.pcrContract.methods._payoutAmountOnOracleConfirmation().call()
    let payoutAmount_ether = new BigNumber(payoutAmount_wei).shiftedBy(-18).toString()
    this.setState({payoutAmount_ether: payoutAmount_ether})
    return payoutAmount_ether
}

async changePayoutAmount_ether(amount_ether) {
    let amount_wei = new BigNumber(amount_ether).shiftedBy(18).toString()
    await this.state.pcrContract.methods.setPayoutAmount(amount_wei).send({from: this.state.account}).then(console.log)
}

async createStream(stream) {
    let amount = (new BigNumber(stream.amount).shiftedBy(18));;
    let address = Web3.utils.toChecksumAddress(stream.address);
    let _flowRate = calculateFlowRate(amount);

    const sf = this.state.sf;
    const tx = (sf.cfa._cfa.contract.methods
        .createFlow(
            fUSDCx_address.toString(),
            address.toString(),
            _flowRate.toString(),
            "0x"
        )
        .encodeABI())

    await sf.host.contract.methods.callAgreement(
        sf.cfa._cfa.address, tx, "0x").send({from: this.state.account, type: "0x2"})
    .then(console.log)
}

async editStream(stream) {
    let address = stream.address;
    let newFlowRate = calculateFlowRate(stream.amount);

    const sf = this.state.sf;
    const tx = (sf.cfa._cfa.contract.methods
        .updateFlow(
            fUSDCx_address.toString(),
            address.toString(),
            newFlowRate.toString(),
            "0x"
        )
        .encodeABI())
        await sf.host.contract.methods.callAgreement(
            sf.cfa._cfa.address, tx, "0x").send({from: this.state.account, type: "0x2"})
        .then(console.log)
        .then(await this.listOutFlows())   
}   

async deleteStream(address) {
        
    const sf = this.state.sf;
    const tx = (sf.cfa._cfa.contract.methods
        .deleteFlow(
            fUSDCx_address.toString(),
            this.state.account.toString(),
            address.toString(),
            "0x"
        )
        .encodeABI())
        await sf.host.contract.methods.callAgreement(
            sf.cfa._cfa.address.toString(), tx.toString(), "0x").send({from: this.state.account, type: "0x2"})
        .then(console.log)   
        .then(await this.listOutFlows())
} 


toggleCreateModal() {
    this.setState({creatingStream: true})
}

closeCreateModal() {
    this.setState({creatingStream: false})
}

showCreateModal() {
    return (
        <CreateStream
        createStream={this.createStream}
        closeCreateModal={this.closeCreateModal}
        />
    )
}

showEditModal(streamAddress) {
    let amount;
    
    let outFlows = this.state.outFlows;
    for (let i = 0; i <= outFlows.length; i++) {
        if (outFlows[i].receiver === streamAddress) {
            amount = calculateStream(this.state.outFlows[i].flowRate);
            break;
        }
    }
    return (
        <EditStream
        address={streamAddress}
        amount={amount}
        toggleEditModal={this.toggleEditModal}
        editStream={this.editStream}
        deleteStream={this.deleteStream}
        />
    )
}

toggleEditModal(streamAddress) {

    this.setState({
        editingStream: !this.state.editingStream,
        editingAddress: streamAddress
    })

    if (!this.state.editingStream) {
        this.showEditModal(streamAddress)
    }
}

async listOutFlows() {
    const flows = await this.state.sf.cfa.listFlows({
        superToken: fUSDCx_address,
        account: this.state.account
    })
    
    const outFlowArray = [];

    for (let i = 0; i < flows.outFlows.length; i++) {
        outFlowArray.push(flows.outFlows[i]);
    }
    
    this.setState({
        outFlows: outFlowArray
    })
}

async getTotalOutflows() {
    let totalOutflows = 0;
    let outFlows = this.state.outFlows;
    for (let i = 0; i <= outFlows.length; i++) {
        if (outFlows[i] !== undefined) { 
            let stream = calculateStream(outFlows[i].flowRate)
            totalOutflows = totalOutflows - Number(stream);
        }
    }
    
    this.setState({
        totalOutflows: totalOutflows
    })
}

getEndDate() {
    let end = calculateEndDate(this.state.fUSDCxBal, this.state.totalOutflows);
    console.log(end);
    this.setState({
        endDate: end
    })
}

async componentDidMount() {
    await this.initWeb3();
}

    render() {
        return (
            <div>
            <Row className="top">
            <Container>
            <Row>
                <Col>
                <h3 className="title">PCR Token Manager Dashboard</h3>
                </Col>

                <Col>
                {!this.state.pcrContract_address || this.state.pcrContract_address === "" || this.state.pcrContract_address === undefined
                || this.state.pcrContract_address === "0x0000000000000000000000000000000000000000" ?
                // Create a new contract
                // TODO: allow a preexisting contract to be chosen
                <CreatePCRToken
                callPCRTokenFactoryFunction={this.callPCRTokenFactory}
                getCurrentPCRTokenFunction={this.getCurrentPCRToken}
                />
                :  // We already know which contract we're using
                // TODO: link to inspection on block explorer
                <Card className="connectWallet">{`${this.state.pcrContract_address.toString().substring(0, 4)}...${this.state.pcrContract_address.toString().substring(38)}`}</Card>
                }
                </Col>

                <Col>
                {!this.state.connected || this.state.account === "" || this.state.account === undefined?
                <ConnectWallet
                getAccount={this.getAccount}
                />
                :
                <Card className="connectWallet">{`${this.state.account.toString().substring(0, 4)}...${this.state.account.toString().substring(38)}`}</Card>
                }
                </Col>
                </Row>
            </Container>

            </Row>


            <Row>
            <Container>
                <Balances
                fUSDCxBal={this.state.fUSDCxBal}
                ethBalance={this.state.ethBalance}
                funding={this.addFunding}
                withdraw={this.withdrawFunding}
                currentKpiEvaluationInterval={this.state.kpiEvaluationInterval}
                changeKpiEvaluationInterval={this.changeKpiEvaluationInterval}
                getKpiEvaluationInterval={this.getKpiEvaluationInterval}
                currentKpiDisputeWindow={this.state.kpiDisputeWindow}
                changeKpiDisputeWindow={this.changeKpiDisputeWindow}
                getKpiDisputeWindow={this.getKpiDisputeWindow}
                currentPayoutAmount={this.state.payoutAmount_ether}
                changePayoutAmount={this.changePayoutAmount_ether}
                getPayoutAmount={this.getPayoutAmount_ether}
                outflows={this.state.totalOutflows}
                endDate={this.state.endDate}
                updateBalanceFunction={this.getBalance}
                />
            </Container>
            </Row>

           <Container>
               
               <StreamList 
                toggleCreateModal={this.toggleCreateModal}
                toggleEditModal={this.toggleEditModal}
                streams={this.state.outFlows}
                fUSDCx={this.state.fUSDCx}

                />
               
           </Container>

            </div>
        )
    }
}

export default Master;