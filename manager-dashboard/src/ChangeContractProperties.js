import React, {Component} from "react";
import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";
import BigNumber from "bignumber.js";
import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';

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
                <Form onSubmit={this.handleSubmit}>
                    <Form.Label htmlFor="kpiEvaluationInterval">KPI evaluation interval: <br></br>{this.props.currentKpiEvaluationInterval} seconds</Form.Label>
                    <InputGroup>
                        <Form.Control type="text" name="newKpiEvaluationInterval" placeholder={this.props.currentKpiEvaluationInterval} onChange={this.handleChange} value={this.state.newKpiEvaluationInterval}></Form.Control>
                        <Button type="submit" className="addWithdrawButton" size="sm" >Update</Button>
                    </InputGroup>
                </Form>
            </Col>
            <Col>
                <Form onSubmit={this.handleSubmit}>
                    <Form.Label htmlFor="kpiDisputeWindow">KPI dispute window: <br></br>{this.props.currentKpiDisputeWindow} seconds</Form.Label>
                    <InputGroup>
                        <Form.Control type="text" name="newKpiDisputeWindow" placeholder={this.props.currentKpiDisputeWindow} onChange={this.handleChange} value={this.state.newKpiDisputeWindow}></Form.Control>
                        <Button type="submit" className="addWithdrawButton" size="sm" >Update</Button>
                    </InputGroup>
                </Form>
            </Col>
            <Col>
                <Form onSubmit={this.handleSubmit}>
                    <Form.Label htmlFor="payoutAmount">Payout amount: <br></br>{this.props.currentPayoutAmount} USDC</Form.Label>
                    <InputGroup>
                        <Form.Control type="text" name="newPayoutAmount" placeholder={this.props.currentPayoutAmount} onChange={this.handleChange} value={this.state.newPayoutAmount}></Form.Control>
                        <Button type="submit" className="addWithdrawButton" size="sm" >Update</Button>
                    </InputGroup>
                </Form>
            </Col>
            </Row>
            </div>
        )
    }
}

export default ChangeContractProperties;