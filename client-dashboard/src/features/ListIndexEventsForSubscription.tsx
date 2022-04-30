import React, {
    FC,
    ReactElement,
    useContext,
    useState,
    useEffect,
} from "react";
import { AllEvents } from "@superfluid-finance/sdk-core";
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

export const ListIndexEventsForSubscription: FC = (): ReactElement => {
    const [chainId, signerAddress] = useContext(SignerContext);
    const [page, setPage] = useState<number>(1);
    const [queryChainId, setQueryChainId] = useState<number>(chainId);
    const [accountAddress, setAccountAddress] = useState<string>("0x3e0182261dBDFFb63CBDa3e54B6e4A83a8549B47");

    useEffect(() => {
        setPage(1);
    }, [queryChainId, accountAddress]);

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
                name: "Sent",
            },
        },
        {
            pollingInterval: 7500,
        }
    );

    console.log(pagedEvents);

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
                                <TableCell>Event</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {pagedEvents!.data.map(
                                (event: AllEvents, index: number) => (
                                    <TableRow key={index}>
                                        <TableCell>
                                            <pre>
                                                {JSON.stringify(event)}
                                            </pre>
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
