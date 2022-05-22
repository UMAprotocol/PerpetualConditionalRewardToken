import React, {Component} from "react";
import "./DisplayBalance.css";
import { calculateStreamPerSecond } from "./config";

class DisplayBalance extends Component {
    constructor(props) {
        super(props);
        this.state = {
            balance: "?",
            ethBalance: "?",
        }

        this.loadBalance = this.loadBalance.bind(this);
        
    }

    loadBalance() {
        // if (Number(this.props.fUSDCxBal) > 0) {
            this.setState({balance: this.props.fUSDCxBal})
            this.setState({ethBalance: this.props.ethBalance})
            setInterval(() => {
                this.props.updateBalanceFunction();
                this.setState({
                    balance: (Number(this.props.fUSDCxBal)).toFixed(2),
                    ethBalance: Number(this.props.ethBalance).toFixed(5),
            })}, 
            1000)
        // }
    }

    componentDidMount() {
        this.loadBalance();        
    }

    componentWillUnmount() {
        clearInterval(this.loadBalance());
        console.log('timer unmounted')
      }

render() {

    return (
        <div >
        <h5>Rewards pool balance (DAIx)</h5>
        {/* <h2>{this.props.outflows === 0? '$0.00' */}
        <h2>${this.state.balance}</h2>
        <h5>ETH balance for gas</h5>
        <h2>{this.state.ethBalance} ETH</h2>
        <h5>Rewards pool balance could hit zero on:</h5>
        ?<br></br>

        </div>
    )       
    }
}

export default DisplayBalance;