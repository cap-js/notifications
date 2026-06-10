const NotificationService = require("./service")

const { buildHeadersForDestination } = require("@sap-cloud-sdk/connectivity")
const { executeHttpRequest } = require("@sap-cloud-sdk/http-client")
const { getNotificationDestination } = require("../lib/utils")
const cds = require("@sap/cds")
const LOG = cds.log('notifications')
const NOTIFICATIONS_API_ENDPOINT = "v2/Notification.svc"


module.exports = exports = class NotifyToRest extends NotificationService {
  async init() {
    this.on("*", req => this.postNotification(req.data))
    return super.init()
  }

  async postNotification(notificationData) {
    const notificationDestination = await getNotificationDestination()
    const csrfHeaders = await buildHeadersForDestination(notificationDestination, {
      url: NOTIFICATIONS_API_ENDPOINT,
    })

    if (Array.isArray(notificationData)) {
      const results = await Promise.allSettled(notificationData.map(n => this._postOne(n, notificationDestination, csrfHeaders)))
      const failures = results.filter(r => r.status === 'rejected')
      for (const f of failures) LOG._warn && LOG.warn('Batch notification failed:', f.reason?.message ?? f.reason)
      return results
    }
    return this._postOne(notificationData, notificationDestination, csrfHeaders)
  }

  async _postOne(notificationData, notificationDestination, csrfHeaders) {
    try {
      LOG._info && LOG.info(
        `Sending notification of key: ${notificationData.NotificationTypeKey} and version: ${notificationData.NotificationTypeVersion}`
      )
      const response = await executeHttpRequest(notificationDestination, {
        url: `${NOTIFICATIONS_API_ENDPOINT}/Notifications`,
        method: "post",
        data: notificationData,
        headers: { ...csrfHeaders, Accept: "application/json" },
      })
      if (LOG._debug) {
        LOG.debug("Notification sent", {
          body: response?.data,
          headers: response?.headers,
        })
      }
      return response
    } catch (err) {
      const message = err.response.data?.error?.message?.value ?? err.response.message
      const error = new cds.error(message)

      if (/^4\d\d$/.test(err.response?.status) && err.response?.status != 429) {
        error.unrecoverable = true
      }

      throw error
    }
  }
}
