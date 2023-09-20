const fs = require('fs');
const cloudSDK = require("@sap-cloud-sdk/core");
const { executeHttpRequest} = cloudSDK;

const messages = {
  INVALID_NOTIFICATION_TYPES:
    "Failed to create Notification Types as they are not valid.",
  DESTINATION_NOT_FOUND: "Failed to get destination: ",
};

function validateNotificationTypes(notificationTypes = {}) {
  /**
   * TODO: write a logic to check all the required fields.
   */
  return true;
}

function readFileContent(filePath) {
  return JSON.parse(
    fs.readFileSync(cds.requires.notifications.types)
  );
}

async function еxecuteRequest(httpmethod, targetUrl, payload, notifServiceDest, csrfHeaders) {
  let response = {};
  try {
    response = await executeHttpRequest(notifServiceDest, {
      url: targetUrl,
      method: httpmethod,
      data: payload,
      headers: csrfHeaders,
    });
  } catch (e) {
    console.log(e);
    return e;
  }
  return response;
}

module.exports = {
  messages,
  validateNotificationTypes,
  readFileContent,
  executeRequest: еxecuteRequest
};
