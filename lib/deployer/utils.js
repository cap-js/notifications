const { getDestination } = require("@sap-cloud-sdk/connectivity");
const {existsSync} = require('fs')
const messages = {
  DESTINATION_NOT_FOUND: "Failed to get destination: ",
};

let prefix // be filled in below...
function getPrefixCdsEnv() {
  if (!prefix) {
    prefix = cds.env.requires.notifications?.prefix
    if (prefix === "$app-name") try {
      prefix = require(cds.root + '/package.json').name
    } catch { prefix = null }
    if (!prefix) prefix = basename(cds.root)
  }
  return prefix
}

function getConfig() {
  if (existsSync('./config.json')) {
    return JSON.parse(require('./config.json'));
  } else {
    return {
      destination: cds.env.requires.notifications?.destination ?? "SAP_Notifications",
      prefix: getPrefixCdsEnv()
    }
  }
}

async function getNotificationDestination() {
  const config = getConfig();
  const destinationName = config.destination ?? "SAP_Notifications";
  const notificationDestination = await getDestination({ destinationName, useCache: true });
  if (!notificationDestination) {
    // TODO: What to do if destination isn't found??
    throw new Error(messages.DESTINATION_NOT_FOUND + destinationName);
  }
  return notificationDestination;
}

function getPrefix() {
  const config = getConfig();
  return config.prefix;
}

function getNotificationTypesKeyWithPrefix(notificationTypeKey) {
  const prefix = getPrefix();
  return `${prefix}/${notificationTypeKey}`;
}

module.exports = {
  getNotificationDestination,
  getPrefix,
  getNotificationTypesKeyWithPrefix,
};
