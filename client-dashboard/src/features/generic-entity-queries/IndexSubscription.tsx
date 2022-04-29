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
    <Typography sx={{ mb: 4 }}>
        <br></br>
        You are claimin', baby! You have {subscriptionData?.units} units of the rewards token  
        {subscriptionData?.publisher}.
        <br></br>

        You have so far received {subscriptionData?.totalAmountReceivedUntilUpdatedAt} DAIx 
        in distributions.
        <br></br>
        <br></br>
        <em>
            Placeholders:
            <br></br>
            Current KPI performance: ✅
            
            <br></br>
            Last successful epoch payment was at {date} {time}.
        </em>
    </Typography>
            <form onSubmit={(e: SyntheticEvent) => e.preventDefault()}>
                <FormGroup>
                    <TextField
                        sx={{ m: 1 }}
                        label="Chain ID"
                        value={queryChainId}
                        onChange={(e) =>
                            setQueryChainId(Number(e.currentTarget.value))
                        }
                    />
                </FormGroup>
            </form>
            <GenericDataGrid
                {...queryResult}
                pageSize={pageSize}
                pageUseState={[page, setPage]}
                gridSortModelUseState={[sortModel, setSortModel]}
            />
        </>
    );
};
