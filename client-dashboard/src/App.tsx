import React, { FC, ReactElement, useState } from "react";
import { Box, Container, Paper, Typography } from "@mui/material";
import { InitializeSuperfluidSdk } from "./InitializeSuperfluidSdk";
import { Framework } from "@superfluid-finance/sdk-core";
import { Loader } from "./Loader";
import { SignerContext } from "./SignerContext";
import { Web3Provider } from "@ethersproject/providers";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Collapse from "@mui/material/Collapse";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import { IndexSubscription } from "./features/generic-entity-queries/IndexSubscription";
import { ListIndexEventsForSubscription } from "./features/ListIndexEventsForSubscription";
import { ListIndexSubscriptions } from "./features/ListIndexSubscription";
import { ListEvents } from "./features/ListEvents";

function App() {
    const [superfluidSdk, setSuperfluidSdk] = useState<Framework | undefined>();
    const [signerAddress, setSignerAddress] = useState<string | undefined>();
    const [chainId, setChainId] = useState<number | undefined>();

    const onSuperfluidSdkInitialized = async (
        superfluidSdk: Framework,
        provider: Web3Provider
    ) => {
        setSuperfluidSdk(superfluidSdk);

        provider
            .getSigner()
            .getAddress()
            .then((address) => setSignerAddress(address));

        provider.getNetwork().then((network) => setChainId(network.chainId));
    };

    return (
        <Container maxWidth="md">
            <Box sx={{ my: 4 }}>
                <Typography variant="h2" component="h2" gutterBottom>
                    PCR token rewards
                </Typography>
  <Typography variant="caption">
  Features (client dashboard designed for a specific PCR token):
  <ul>
    <li>Metamask login as form of token holder identification</li>
    <li>Use of Superfluid graph instance to 'authenticate' user as recipient of the IDA and customise dashboard.</li>
    <li>Summary stats of client's distributions received through processing of the graph data (including adjustment for it being out of date if distributions occured after "updatedAtBlockNumber")</li>
    <li>Dynamic updating of events and stats shown when new payments occur.</li>
    <li><b>Automated, recurrent querying</b> of the UMA Optimistic Oracle (dummy yes/no query) at predefined interval</li>
    <li><b>Automated settlement</b> of price request after liveness elapses, influencing/gating the IDA distribution</li>
  </ul>

  Not included yet:
  <ul>
    <li>Linking to UMA Optimistic Oracle request status</li>
    <li>Dispute handling in the smart contract</li>
    <li>KPI monitoring in the dashboard (optional, human-completed oracle responses don't need it)</li>
    <li>Funding the contract to successful pay out DAI on behalf of owner</li>
  </ul>
  <br></br>
  Ready?
  <br></br>
  </Typography>
                {!superfluidSdk ? (
                    <InitializeSuperfluidSdk
                        onSuperfluidSdkInitialized={(x, provider) =>
                            onSuperfluidSdkInitialized(x, provider)
                        }
                    />
                ) : !chainId || !signerAddress ? (
                    <Loader />
                ) : (
                    <SignerContext.Provider value={[chainId, signerAddress]}>
                        <Box maxWidth="{false}">
                            <Typography variant="caption" sx={{ mb: 4 }}>
  <br></br><hr></hr><br></br>
                                {/* <em>You are on network [{chainId}] and your wallet address 
                                is [{signerAddress}].</em> */}
                            </Typography>
                            <Typography variant="caption" sx={{ mb: 4 }}>
                                <em>Token contract: 
                                    <a href="https://kovan.etherscan.io/address/0x901FFECCA2aF81604ca27B22403d5905684518C0#tokentxns">
                                        0x901FFECCA2aF81604ca27B22403d5905684518C0</a> <br></br>
                                        KPI check interval: every 3 minutes, request liveness: 30 seconds.
                                        <br></br>
                                        Recipient address: 0x8C9E7e... (known recipient of this IDA, but Metamask can be used as login).</em>
                            </Typography>
                        </Box>
                        <IndexSubscription />
                        <br></br>
                        <SdkListItem title="Successful Distributions (filtered to those [0x8C9E7e] received)">
                            <ListIndexEventsForSubscription />
                            <ListIndexSubscriptions/>
                            <ListEvents/>
                        </SdkListItem>
                    </SignerContext.Provider>
                )}
            </Box>
        </Container>
    );
}

export const SdkListItem: FC<{ title: string }> = ({
    children,
    title,
}): ReactElement => {
    const [isOpen, setIsListEventsOpen] = useState(false);

    return (
        <Box mb={1}>
            <Paper variant="outlined">
                <ListItemButton onClick={() => setIsListEventsOpen(!isOpen)}>
                    <ListItemIcon>
                        {isOpen ? <ExpandLess /> : <ExpandMore />}
                    </ListItemIcon>
                    <ListItemText primary={title} />
                </ListItemButton>
                <Collapse in={isOpen} timeout="auto" unmountOnExit>
                    <Box p={2}>{children}</Box>
                </Collapse>
            </Paper>
        </Box>
    );
};

export default App;
