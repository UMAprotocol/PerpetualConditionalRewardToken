import React, {Component} from "react";
import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";

class ChangeContractProperty extends Component {
    constructor(props) {
        super(props);
        this.state = {
            newPropertyValue: "",
            currentPropertyValue: this.props.currentPropertyValue,
        }

        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);

        // Check contract property for when it's updated asynchronously
        // Delay the first check to allow web3 to load
        setTimeout(
            setInterval(() => {
                this.props.getPropertyFunction();
                this.setState({currentPropertyValue: this.props.currentPropertyValue});
            }, 1000),
        5000);
    }

    //methods to handle input

    handleChange(evt) {
        this.setState({
            [evt.target.name]: evt.target.value
        })
        console.log(evt.target)
    }

    handleSubmit(evt) {
        evt.preventDefault();  // Prevent browser refresh
        console.log("Requested property value: " + this.state.newPropertyValue)
        this.props.updatePropertyFunction(this.state.newPropertyValue)
        this.setState({newPropertyValue: ""});  // Restore placeholder
    }

    render() {
        return (
            <div>
            <Form onSubmit={this.handleSubmit}>
                <Row>
                    <Col>
                <Form.Label htmlFor={this.props.propertyId}>{this.props.propertyDisplayName}: <br></br>{this.state.currentPropertyValue} {this.props.propertyUnits}</Form.Label>
                    </Col>
                    <Col>
                <InputGroup>
                    <Form.Control type="text" name="newPropertyValue" placeholder="Enter value"
                    onChange={this.handleChange}
                    value={this.state.newPropertyValue}
                    />
                    <Button type="submit" className="addWithdrawButton" size="sm" >Update</Button>
                </InputGroup>
                </Col>
                </Row>
            </Form>
            </div>
        )
    }
}

export default ChangeContractProperty;