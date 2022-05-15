import React, {Component} from "react";
import BigNumber from "bignumber.js";
import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';

class ChangeContractProperties extends Component {
    constructor(props) {
        super(props);
        this.state = {
            kpiEvaluationInterval: "",
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
        // this.props.changeKpiEvaluationInterval(this.state.funding);
        this.setState({kpiEvaluationInterval: ""})
    }

    render() {
        return (
            <div>
            <Form onSubmit={this.handleSubmit}>
                <Form.Label htmlFor="funding">Add Funds: </Form.Label>
                <InputGroup>
		            <Form.Control type="text" name="kpiEvaluationInterval" placeholder="Interval in seconds" onChange={this.handleChange} value={this.state.kpiEvaluationInterval}></Form.Control>
		            {/* <Form.Control type="text" name="funding" placeholder="Enter a USDC amount..." onChange={this.handleChange} value={this.state.funding}></Form.Control> */}
		            <Button type="submit" className="addWithdrawButton" size="sm" >Submit</Button>
                </InputGroup>
            </Form>
            </div>
        )
    }
}

export default ChangeContractProperties;