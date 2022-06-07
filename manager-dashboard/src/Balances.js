import React, {Component} from "react";
import Container from "react-bootstrap/Container";
import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";
import Card from "react-bootstrap/Card";
import DisplayBalance from "./DisplayBalance";
import Fund from "./Fund";
import FundGasBalance from "./FundGasBalance";
import Withdraw from "./Withdraw";
import "./Balances.css";
import MonthlyOutflows from "./MonthlyOutflows";

class Balances extends Component {
    constructor(props) {
        super(props);

        this.addFunding = this.addFunding.bind(this);
        this.addGasBalanceFunding = this.addGasBalanceFunding.bind(this);
        this.withdrawFunding = this.withdrawFunding.bind(this);
    }

    addFunding(amount) {
        this.props.funding(amount)
    }

    addGasBalanceFunding(amount) {
        this.props.fundingGasBalance(amount)
    }

    withdrawFunding(amount) {
        this.props.withdraw(amount)
    }

    render() {
        return(
            <div>
			<Container>
            <Row>            
            
            <Col>
            {/* {this.props.fUSDCxBal == 0?
                <Card className="balances">
                   <div >
                        <h5>SuperToken USDCx Balance </h5>
                        <h2>$0.00</h2>
                   </div>
                   </Card>
               : */}
               <Card className="balances">
                    <DisplayBalance 
                    fUSDCxBal={this.props.fUSDCxBal}
                    ethBalance={this.props.ethBalance}
                    outflows={this.props.outflows}
                    updateBalanceFunction={this.props.updateBalanceFunction}

                    />
                </Card>
                {/* } */}
                </Col>
                <Col>
                 
                 <Card className="addFunds">
                    <Fund 
	                funding={this.addFunding}
                    />
                </Card>
                 
                 <Card className="addGasBalanceFunds">
                    <FundGasBalance
	                funding={this.addGasBalanceFunding}
                    />
                </Card>
{/* 
                <Card className="withdrawFunds">
                    <Withdraw 
	                withdraw={this.withdrawFunding}
                    />
                </Card> */}
            </Col>
               

            {/* <Col>
                <Card className="funding" >
                    <MonthlyOutflows
                    outflows={this.props.outflows}
                    endDate={this.props.endDate}
                    />
                </Card>
            </Col> */}

            </Row>
            </Container>

            </div>
        )
    }
}

export default Balances;