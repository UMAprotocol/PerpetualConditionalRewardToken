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

let tokenContractAddress = "0x62B7bbfF2193F03931861D1b1aF097c1b3A8fBf5";

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
  TLDR; I've implemented the recurring KPI evaluation which differs from the design spec in these ways:
  <ul>
    <li>doesn't need API metrics to be specified programmatically,</li>
    <li>talks to the Oracle to <em>check</em> KPI results not just verify them, and</li>
    <li>leverages decentralised Keepers as the strategy for deploying paying for KPI-check gas.</li>
  </ul>
<b>Demo below.</b>
<br></br>
  Features/status - client dashboard designed for a specific PCR token:
  <ul>
    <li>Metamask login as the mechanism for token holder identification (fitting as tokens can be traded).</li>
    <li>Use of Superfluid graph instance to 'authenticate' user as recipient of the IDA and customise the dashboard for them.</li>
    <li>Summary stats of client's distributions calculated through processing of the graph data (including adjustment for IDA's data being out of date if distributions occured after "updatedAtBlockNumber").</li>
    <li>Auto-updating display of stats if new payments occur while the client is on the page.</li>
  </ul>

  Features/status - smart contract implementing a single PCR token:
  <ul>
    <li><b>Automated, recurrent querying</b> of the UMA Optimistic Oracle at predefined interval! (Using a dummy yes/no query still)</li>
    <li>Automated settlement of price request after liveness elapses, with Oracle output influencing/gating the IDA distribution.</li>
    <li>Configurable interval between Oracle requests (E.g. every five minutes or every day), and distribution amount.</li>
    <li>Read-only method that external parties can use for monitoring if either a price request or price settlement needs to be triggered, based off elapsed time (monitored off-chain for free).</li>
    <li>Ability to propose (not just request) a KPI result to the Oracle if such data is passed in when price data request is triggered.</li>
  </ul>

  Features/status - token manager workflow:
  <ul>
    <li>Possibility to set a human-verifiable KPI leveraging the Optimistic Oracle's natural language price requests (KPI doesn't <em>have to</em> be assessable by an API)*.</li>
    <li><b>NO SERVER NEEDED!!!</b> UMA and Superfluid's Graph instances and Chainlink's *decentralised* infrastructure are leveraged - no custom infrastructure for maximum up-time! (i.e. no single point of failure for maximum reliability in ensuring the KPIs get processed).</li>
    <li>Automated trigering of Oracle interactions by leveraging Chainlink Keepers for web3 reliability and security. <b>Creators of tokens don't need to deploy a custom cron job for automated triggering, or a Graph instance for data collection, or upload their keys to a server to pay for gas!!</b></li>
    <li>Chainlink's dashboard provides a ready-made (and maintained) mechanism for funding the automated triggering of KPI evaluation safely and easily.</li>
  </ul>

  Not included yet:
  <ul>
    <li>Linking to UMA Optimistic Oracle request status in client dashboard (but I know typescript now).</li>
    <li>Dispute handling in the smart contract (e.g. re-request).</li>
    <li>KPI state monitoring in the client dashboard (not applicable for human-submitted Oracle responses).</li>
    <li><b>Funding the contract to successfully pay out DAI on behalf of the token manager.</b> (I'm sure it's easy for web3 natives though.)</li>
    <li>Funding the bounties of the Oracle request (but funding the automated scheduling is sorted which is what I was more concerned about!)</li>
    <li>Dashboard for deployment of the PCR token <em>smart contracts</em> by managers (however, deployment of automated triggering of contracts is already achieved utilising Chainlink's Keeper dashboard).</li>
    <li>Getting the <em>total</em> IDA units from Superfluid database for adding the recent transactions (since "updatedAtBlockNumber") to the client's total distributions.</li>
    <li>Oracle price submitter bot for KPI value (optional, for metrics with automated reporting through APIs. Not relevant for human-assesed KPIs).</li>
  </ul>

  <em>*because KPIs are being <b>evaluated (not verified)</b> by the Oracle with this implementation strategy that leverages the Chainlink Keepers for maximum reliability.</em>
  <br></br>
  Take a look!
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
  <br></br><hr></hr><br></br>
                            <Typography variant="caption" sx={{ mb: 4 }}>
                                {/* <em>You are on network [{chainId}] and your wallet address 
                                is [{signerAddress}].</em> */}
                            </Typography>
                <Typography variant="h4" component="h4" gutterBottom>
                Client dashboard: PCRx token
                </Typography>
                            <Typography variant="caption" sx={{ mb: 4 }}>
                                <em>
                                        Recipient address hard-coded to 0x8C9E7e... for demo purposes (known recipient of this IDA, but Metamask can be used as login).
                                        </em>
  <br></br>
                            </Typography>
                        </Box>
                        <IndexSubscription />
                        <br></br>
                        <SdkListItem title="Successful Distributions (filtered to those [0x8C9E7e] received - non-zero one is manual)">
                            <ListIndexEventsForSubscription />
                        </SdkListItem>
  <br></br><hr></hr><br></br>
                <Typography variant="h4" component="h4" gutterBottom>
                Backend demo
                </Typography>
                            <Typography  sx={{ mb: 4 }}>
                                        KPI check interval: every 3 minutes, oracle request liveness: 60 seconds.
                                        <br></br>
  <ul>
    <li>
                                    <a href="https://keepers.chain.link/kovan/3039">
                                        Chainlink Keeper for this contract
                                    </a>. Alternating calls for requesting price from Oracle and settling it after liveness period has elapsed! With gas paid for <em>without</em> managing a server and <em>without</em> sharing my keys!
                                    </li>
    <li>
                                        <a href="https://optimistic-oracle-dapp-git-feature-sc-5344make-kovan-4179fe-uma.vercel.app/">
                                            UMA Optimstic Oracle queries
                                        </a> (dummy query data still). Requests being made, price being proposed, AND the result being <em>settled</em>
                                        </li>
    <li>
                                    Token contract: <a href="https://kovan.etherscan.io/address/0x62B7bbfF2193F03931861D1b1aF097c1b3A8fBf5#tokentxns">
                                        {tokenContractAddress}</a> IDA distribution events triggered by the Oracle result are listed above in the client dashboard)!
                                        </li>
                                        
                                        </ul>
                            </Typography>
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
    const [isOpen, setIsListEventsOpen] = useState(true);

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
