import React, {Component} from "react";
import Button from 'react-bootstrap/Button';
import "./CreateToken.css";

class CreatePCRToken extends Component {
    constructor(props) {
        super(props);
        this.createPCRToken = this.createPCRToken.bind(this)
    }


    async createPCRToken() {
        var btn = document.getElementById("createPCRToken");
        btn.innerHTML = "Creating token...";
        // Request a new token from the factory
        await this.props.callPCRTokenFactoryFunction()
        // Monitor its eventual creation
        setInterval(() => {
            this.props.getCurrentPCRTokenFunction();
        }, 1000)
    }

    render() {
            return (
                <Button id="createPCRToken" onClick={this.createPCRToken} className="createToken">Create a new PCR Token</Button>
                )
        }
    }

export default CreatePCRToken;