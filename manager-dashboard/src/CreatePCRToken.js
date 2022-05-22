import React, {Component} from "react";
import Button from 'react-bootstrap/Button';
import "./CreateToken.css";

class CreatePCRToken extends Component {
    constructor(props) {
        super(props);
        this.createPCRToken = this.createPCRToken.bind(this)
    }


    async createPCRToken() {
        // Request a new token from the factory
        await this.props.callPCRTokenFactoryFunction()
        // Monitor its eventual creation
        setInterval(() => {
            this.props.getCurrentPCRTokenFunction();
            // This state isn't being displayed here...
        //     this.setState({
        //         balance: (Number(this.props.fUSDCxBal)).toFixed(2),
        //         ethBalance: Number(this.props.ethBalance).toFixed(5),
        // })
        }, 1000)
    }

    render() {
            return (
                <Button onClick={this.createPCRToken} className="createToken">Create a new PCR Token</Button>

                )
        }
    }

export default CreatePCRToken;