const cds = require("@sap/cds");
const { setGlobalLogLevel } = require("@sap-cloud-sdk/util");

cds.once("served", async () => setGlobalLogLevel("error"));
