import { sfSubgraph } from "../../redux/store";
import { Event_OrderBy, OrderDirection, SentEvent } from "@superfluid-finance/sdk-core";
import { GridSortModel } from "@mui/x-data-grid/models/gridSortModel";
import React from "react";

let queryChainId = 4;
let tokenContractAddress = "0x62B7bbfF2193F03931861D1b1aF097c1b3A8fBf5";


// Note this doesn't deal with paging requests
export const allDistributionDataSince: Function = (blockNumber: number | undefined): SentEvent[] => {
    const {
        data: singlePageEvents,
        isFetching,
        isLoading,
        error,
        refetch,
    } = sfSubgraph.useEventsQuery(
        {
            chainId: queryChainId,
            filter: {
                addresses_contains: [tokenContractAddress.toLowerCase()],
                // Sent is triggered on ida.distribute, and is not called in the contract for any other reason.
                name: "Sent",
                // Only get events since subscription was created
                blockNumber_gte: blockNumber?.toString() || "0",
            },
        },
        {
            pollingInterval: 7500,
        },
    );
    return singlePageEvents?.data as SentEvent[];
}

export const mostRecentDistributionSince: Function = (blockNumber: number | undefined):
    SentEvent | undefined => {
    const {
        data: singlePageEvents,
        isFetching,
        isLoading,
        error,
        refetch,
    } = sfSubgraph.useEventsQuery(
        {
            chainId: queryChainId,
            filter: {},
            //     addresses_contains: [tokenContractAddress.toLowerCase()],
            //     // Sent is triggered on ida.distribute, and is not called in the contract for any other reason.
            //     name: "Sent",
            //     // Only get events since subscription was created
            //     blockNumber_gte: blockNumber?.toString() || "0",
            // },
            pagination: undefined,
            // Think this can only handle filter OR order..?
            // order: {
            //     orderBy: "timestamp" as Event_OrderBy,
            //     orderDirection: "desc" as OrderDirection
            // },
        },
        {
            pollingInterval: 7500,
        },
    );
    let maxBlockNumber = 0;
    if (!singlePageEvents) return undefined;
    let events = singlePageEvents?.data as SentEvent[];
    var mostRecentData = events.at(0);
    for (var i = 0; i < events.length; i++) {
        var event = events.at(i);
        if (!event) continue;
        if (event.blockNumber > maxBlockNumber) {
            maxBlockNumber = event.blockNumber;
            mostRecentData = event;
        }
    }
    return mostRecentData;
}
