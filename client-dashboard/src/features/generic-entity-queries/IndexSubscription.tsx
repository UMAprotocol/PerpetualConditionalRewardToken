import React, {
    FC,
    ReactElement,
    useContext,
    useState,
} from "react";
import { SignerContext } from "../../SignerContext";
import { sfSubgraph } from "../../redux/store";
import { SentEvent } from "@superfluid-finance/sdk-core";
import { DateTime } from "luxon";
import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";
import Card from "react-bootstrap/Card";
import Container from "react-bootstrap/Container";
import "./IndexSubscription.css"
import { ethers } from "ethers";

export const IndexSubscription: FC = (): ReactElement => {
    const [chainId, signerAddress] = useContext(SignerContext);
    const [queryChainId, setQueryChainId] = useState<number>(chainId);

    const queryResult = sfSubgraph.useIndexSubscriptionsQuery({
        chainId: queryChainId,
        filter: {
            subscriber: "0x8C9E7eE24B97d118F4b0f28E4Da89D349db2F28B",
        },
    });
    const data = queryResult.data
    var subscriptionData;
    if (data) {
        const ddata = data.data
        if (ddata) {
            for (var i = 0; i < ddata.length; i++) {
                subscriptionData = ddata.at(i);
                if (!subscriptionData) continue;
                if (subscriptionData.publisher == "0x3e0182261dBDFFb63CBDa3e54B6e4A83a8549B47".toLowerCase()) {
                    console.log(subscriptionData);
                    break;
                }
            }
        }
    }
    let timestamp = subscriptionData?.updatedAtTimestamp
    var date = DateTime.fromSeconds(Number(timestamp)).toFormat("LLL. dd yyyy");
    var time = DateTime.fromSeconds(Number(timestamp)).toFormat("ttt");
    

    // Get payments more recent than when the total was last updated (to add)
    const paymentsSinceLastUpdatedBlockResponse = sfSubgraph.useEventsQuery(
        {
            chainId: queryChainId,
            filter: {
                addresses_contains: ["0x3e0182261dBDFFb63CBDa3e54B6e4A83a8549B47".toLowerCase()],
                // Sent is triggered on ida.distribute, and is not called in the contract for any other reason.
                name: "Sent",
                // Only get events since subscription total was last updated
                blockNumber_gte: subscriptionData?.updatedAtBlockNumber.toString() || "0",
            },
        },
        {
            pollingInterval: 7500,
        }
    );
    let paymentsSinceLastUpdatedBlockData = paymentsSinceLastUpdatedBlockResponse.data?.data || []
    // Sum over recent ones to get the updated total, assuming no approval/units
    // changed since the value from updatedAtTimestamp
    var totalDistributionsReceived = parseInt(subscriptionData?.totalAmountReceivedUntilUpdatedAt || "0");
    for (var i = 0; i < paymentsSinceLastUpdatedBlockData.length; i++) {
        let paymentEvent = paymentsSinceLastUpdatedBlockData.at(i) as SentEvent
        totalDistributionsReceived += parseInt(paymentEvent.amount) * parseInt(subscriptionData?.units || "0");
        totalDistributionsReceived /= 30  // TODO: get total number of units for the IDA
    }

    let totalDistributionsReceived_ether = ethers.utils.formatEther(totalDistributionsReceived.toString());
    totalDistributionsReceived_ether = (+totalDistributionsReceived_ether).toFixed(4)


    return (
        <>
        <div>
			<Container>
            <Row>            
            
            <Col>
                <Card className="KPIStatus">
                   <div >
                        <h5>Current KPI status</h5>
                        <h6>✅?</h6>
                   </div>
                </Card>

                <Card className="recentPayout">
                   <div >
                        <h5>Latest payment</h5>
                        <h6>{date} {time}?</h6>
                   </div>
                </Card>
                 
                <Card className="indexUnits">
                   <div >
                        <h5>PCR token units</h5>
                        <h6>{subscriptionData?.units}</h6>
                   </div>
                </Card>

            </Col>

            <Col>
                <Card className="balance" >
                    <h2><strong>Total Rewards Received</strong></h2>
                    <h3>{totalDistributionsReceived_ether} DAIx</h3>

                    <br></br>
                    <h5><strong>Successful epochs</strong></h5>
                    <h6>5?</h6>
                </Card>
            </Col>

            </Row>
            </Container>

            </div>
        </>
    );
};
