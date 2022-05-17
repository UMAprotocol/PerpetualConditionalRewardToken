import React, {Component} from "react";
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
            <Form onSubmit={this.handleSubmit}>
                <Form.Label htmlFor="funding">Token contract properties: </Form.Label>
                <InputGroup>
		            <Form.Control type="text" name="newKpiEvaluationInterval" placeholder={this.props.currentKpiEvaluationInterval} onChange={this.handleChange} value={this.state.newKpiEvaluationInterval}></Form.Control>
		            <Button type="submit" className="addWithdrawButton" size="sm" >Submit</Button>
                </InputGroup>
            </Form>
            </div>
        )
    }
}

export default ChangeContractProperties;