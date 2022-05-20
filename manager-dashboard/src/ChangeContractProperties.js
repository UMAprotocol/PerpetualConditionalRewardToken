import React, {Component} from "react";
import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";
import BigNumber from "bignumber.js";
import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import ChangeContractProperty from "./ChangeContractProperty";

class ChangeContractProperties extends Component {
    constructor(props) {
        super(props);
        this.state = {
            newKpiEvaluationInterval: "",
            payoutAmount: "",
            kpiDisputeWindow: "",
        }

        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    //methods to handle input

    handleChange(evt) {
        this.setState({
            [evt.target.name]: evt.target.value
        })
    }

    handleSubmit(evt) {
        evt.preventDefault();
        this.props.changeKpiEvaluationInterval(this.state.newKpiEvaluationInterval);
        this.props.getKpiEvaluationInterval();
        // this.setState({kpiEvaluationInterval: currentKpiEvaluationInterval})
    }

    render() {
        return (
            <div>
            <Row>            
            
            <Col>
                <ChangeContractProperty
                    propertyDisplayName="KPI evaluation interval"
                    propertyId="kpiEvaluationInterval"
                    propertyUnits="seconds"
                    updatePropertyFunction={this.props.changeKpiEvaluationInterval}
                    getPropertyFunction={this.props.getKpiEvaluationInterval}
                    currentPropertyValue={this.props.currentKpiEvaluationInterval}
                />
            </Col>
            <Col>
                <ChangeContractProperty
                    propertyDisplayName="KPI dispute window"
                    propertyId="kpiDisputeWindow"
                    propertyUnits="seconds"
                    updatePropertyFunction={this.props.changeKpiDisputeWindow}
                    getPropertyFunction={this.props.getKpiDisputeWindow}
                    currentPropertyValue={this.props.currentKpiDisputeWindow}
                />
            </Col>
            <Col>
                <ChangeContractProperty
                    propertyDisplayName="Payout amount"
                    propertyId="payoutAmount"
                    propertyUnits="USDC"
                    updatePropertyFunction={this.props.changePayoutAmount}
                    getPropertyFunction={this.props.getPayoutAmount}
                    currentPropertyValue={this.props.currentPayoutAmount}
                />
            </Col>
            </Row>
            </div>
        )
    }
}

export default ChangeContractProperties;