import React, {
    FC,
    ReactElement,
    SyntheticEvent,
    useContext,
    useEffect,
    useState,
} from "react";
import { FormGroup, TextField, Typography } from "@mui/material";
import { SignerContext } from "../../SignerContext";
import { sfSubgraph } from "../../redux/store";
import { GridSortModel } from "@mui/x-data-grid";
import { GenericDataGrid } from "./GenericDataGrid";
import { IndexSubscription_OrderBy } from "@superfluid-finance/sdk-core";
import { DateTime } from "luxon";
import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";
import Card from "react-bootstrap/Card";
import Container from "react-bootstrap/Container";
import "./IndexSubscription.css"


export const IndexSubscription: FC = (): ReactElement => {
    const [chainId, signerAddress] = useContext(SignerContext);
    const [page, setPage] = useState<number>(1);
    const [pageSize, setPageSize] = useState<number>(10);
    const [queryChainId, setQueryChainId] = useState<number>(chainId);

    useEffect(() => {
        setPage(1);
    }, [queryChainId]);

    const [sortModel, setSortModel] = React.useState<GridSortModel>([]);

    const order = !!sortModel[0]
        ? {
              orderBy: sortModel[0].field as IndexSubscription_OrderBy,
              orderDirection: sortModel[0].sort!,
          }
        : undefined;

    const queryResult = sfSubgraph.useIndexSubscriptionsQuery({
        chainId: queryChainId,
        filter: {
            subscriber: "0x8C9E7eE24B97d118F4b0f28E4Da89D349db2F28B",
        },
        // pagination: {}
            // skip: (page - 1) * pageSize,
            // take: pageSize,
        // },
        order,
    });
    const data = queryResult.data
    console.log(data)
    var subscriptionData;
    if (data) {
        const ddata = data.data
        if (ddata) {
            console.log(ddata.length)
            for (var i = 0; i < ddata.length; i++)
            { 
                subscriptionData = ddata.at(i);
                if (!subscriptionData) continue;
            if (subscriptionData.publisher == "0x3e0182261dBDFFb63CBDa3e54B6e4A83a8549B47".toLowerCase()) {
                console.log("Found it.")
                break;

            }
            else{
                console.log("Nope: " + subscriptionData.publisher)
            }
            }
        }
    }
    let timestamp = subscriptionData?.updatedAtTimestamp
    var date = DateTime.fromSeconds(Number(timestamp)).toFormat("LLL. dd yyyy");
    var time = DateTime.fromSeconds(Number(timestamp)).toFormat("ttt");
    

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
                    <h3>{subscriptionData?.totalAmountReceivedUntilUpdatedAt} DAIx</h3>
        
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
