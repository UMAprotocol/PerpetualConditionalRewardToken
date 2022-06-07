import React, {Component} from "react";
import Container from 'react-bootstrap/Container';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import InputGroup from 'react-bootstrap/InputGroup';
import Modal from "react-bootstrap/Modal";
import Spinner from 'react-bootstrap/Spinner';

class CreateTokens extends Component {
    constructor(props) {
        super(props);
        this.state = {
            addresses: "",
            // amount: "",
            created: true
        }
        console.log("Create tokens component constructed")

        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.launchBulkTransferSite = this.launchBulkTransferSite.bind(this)
    }

    handleChange(evt) {
        this.setState({
            [evt.target.name]: evt.target.value
        })
    }

    handleSubmit(evt) {
        evt.preventDefault();
        this.setState({created: false})
        setTimeout(() => {
            // let address = Web3.utils.toChecksumAddress(stream.address);
            this.props.createTokens((10*parseInt(this.state.addresses)).toString())
            .then(console.log())
            .then(this.setState({addresses: "", created: true}))
        }, 2000);
    }
    launchBulkTransferSite() {
        window.open('https://cryptomultisender.com/','_blank')
    }

    render() {
        return (
        <Container>
            <Modal show={true} onHide={this.props.closeCreateModal}>
            <Modal.Header closeButton onClick={this.props.closeCreateModal}>
                <Modal.Title>Create tokens for recipients</Modal.Title>
            </Modal.Header>

            <Modal.Body>
                <Container>
                <Form>
                    <Form.Group className="mb-3">
                        <Form.Label htmlFor="addresses">How many initial recipients?</Form.Label>
                        <Form.Control type="text" name="addresses" value={this.state.addresses} onChange={this.handleChange}></Form.Control>
                    </Form.Group>
                </Form>
                </Container>
            </Modal.Body>

            <Modal.Footer>
                {this.state.created? <Button variant="primary" onClick={this.handleSubmit}>(1) Mint tokens into your wallet</Button>
                :<Spinner animation="border" variant="primary"></Spinner>}
              <Button variant="primary" onClick={this.launchBulkTransferSite}>
                (2) Send to recipients
              </Button>
              <Button variant="secondary" onClick={this.props.closeCreateModal}>
                Close
              </Button>
              
            </Modal.Footer>
            </Modal>
            </Container>
        )
    }
}

export default CreateTokens;