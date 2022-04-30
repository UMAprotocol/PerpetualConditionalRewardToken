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
                                <em>You are on network [{chainId}] and your wallet address 
                                is [{signerAddress}].</em>
                            </Typography>
                        </Box>
                        <IndexSubscription />
                        <br></br>
                        <SdkListItem title="Successful Distributions">
                            <ListIndexEventsForSubscription />
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
