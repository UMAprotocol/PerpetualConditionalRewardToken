import React, {
    FC,
    ReactElement,
    useContext,
    useState,
} from "react";
import { Event_OrderBy, OrderDirection, SentEvent } from "@superfluid-finance/sdk-core";
import { Loader } from "../Loader";
import {
    Pagination,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
} from "@mui/material";
import { SignerContext } from "../SignerContext";
import { Error } from "../Error";
import { sfSubgraph } from "../redux/store";
import { formatTimestamp } from "./../utils.js"

export const ListIndexEventsForSubscription: FC = (): ReactElement => {
    const [chainId, signerAddress] = useContext(SignerContext);
    const [page, setPage] = useState<number>(1);
    const [queryChainId, setQueryChainId] = useState<number>(chainId);
    const [pageSize, setPageSize] = useState<number>(5);

    const queryResult = sfSubgraph.useIndexSubscriptionsQuery({
        chainId: queryChainId,
        filter: {
            subscriber: signerAddress,
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
                    break;
                }
            }
        }
    }

    const {
        data: pagedEvents,
        isFetching,
        isLoading,
        error,
        refetch,
    } = sfSubgraph.useEventsQuery(
        {
            chainId: queryChainId,
            filter: {
                addresses_contains: ["0x3e0182261dBDFFb63CBDa3e54B6e4A83a8549B47".toLowerCase()],
                // Sent is triggered on ida.distribute, and is not called in the contract for any other reason.
                name: "Sent",
                // Only get events since subscription was created
                blockNumber_gte: subscriptionData?.createdAtBlockNumber.toString() || "0",
            },
            pagination: {
                skip: (page - 1) * pageSize,
                take: pageSize,
            },
            order: {
                orderBy: "timestamp" as Event_OrderBy,
                orderDirection: "desc" as OrderDirection
            },
        },
        {
            pollingInterval: 7500,
        }
    );

    let pagedSentEvents = pagedEvents?.data as SentEvent[]
    
    return (
        <>
            {isLoading ? (
                <Loader />
            ) : error ? (
                <Error error={error} retry={refetch} />
            ) : (
                <TableContainer>
                    <Table aria-label="simple table">
                        <TableHead>
                            <TableRow>
                                <TableCell>Distribution</TableCell>
                                <TableCell>Total amount to all recipients</TableCell>
                                <TableCell>Transaction hash</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {pagedSentEvents.map(
                                (event: SentEvent, index: number) => (
                                    <TableRow key={index}>
                                        <TableCell>
                                            {formatTimestamp(event.timestamp)}
                                        </TableCell>
                                        <TableCell>
                                            {event.amount}
                                        </TableCell>
                                        <TableCell>
                                            {event.transactionHash.substring(0, 15) + "..."}
                                        </TableCell>
                                    </TableRow>
                                )
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}
            {pagedEvents && !error && (
                <Pagination
                    count={pagedEvents.nextPaging ? page + 1 : page}
                    page={page}
                    onChange={(
                        event: React.ChangeEvent<unknown>,
                        value: number
                    ) => {
                        setPage(value);
                    }}
                />
            )}
        </>
    );
};
