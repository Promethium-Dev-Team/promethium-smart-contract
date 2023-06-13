// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

library DataTypes {
    struct PositionData {
        address adaptor;
        bytes adaptorData;
        bytes configurationData;
    }

    struct AdaptorCall {
        address adaptor;
        bytes callData;
    }
}
