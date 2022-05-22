import React, {Component} from "react";
import Container from "react-bootstrap/Container";
import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";
import Card from "react-bootstrap/Card";
import DisplayBalance from "./DisplayBalance";
import Fund from "./Fund";
import Withdraw from "./Withdraw";
import ChangeContractProperties from "./ChangeContractProperties";
import "./Balances.css";
import MonthlyOutflows from "./MonthlyOutflows";

class Balances extends Component {
    constructor(props) {
        super(props);

        this.addFunding = this.addFunding.bind(this);
        this.withdrawFunding = this.withdrawFunding.bind(this);
    }

    addFunding(amount) {
        this.props.funding(amount)
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
                 
                 <Card className="addFunds">
                    <Fund 
	                funding={this.addFunding}
                    />
                </Card>
{/* 
                <Card className="withdrawFunds">
                    <Withdraw 
	                withdraw={this.withdrawFunding}
                    />
                </Card> */}

                <Card className="changeContractProperties">
                    <ChangeContractProperties 
                    changeKpiEvaluationInterval={this.props.changeKpiEvaluationInterval}
                    getKpiEvaluationInterval={this.props.getKpiEvaluationInterval}
                    currentKpiEvaluationInterval={this.props.currentKpiEvaluationInterval}
                    changeKpiDisputeWindow={this.props.changeKpiDisputeWindow}
                    getKpiDisputeWindow={this.props.getKpiDisputeWindow}
                    currentKpiDisputeWindow={this.props.currentKpiDisputeWindow}
                    changePayoutAmount={this.props.changePayoutAmount}
                    getPayoutAmount={this.props.getPayoutAmount}
                    currentPayoutAmount={this.props.currentPayoutAmount}
                    />
                </Card>
            </Col>
               

            <Col>
                <Card className="funding" >
                    <MonthlyOutflows
                    outflows={this.props.outflows}
                    endDate={this.props.endDate}
                    />
                </Card>
            </Col>

            </Row>
            </Container>

            </div>
        )
    }
}

export default Balances;