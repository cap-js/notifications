const AlertNotificationService = require('./service')

module.exports = class NotifyToConsole extends AlertNotificationService {
  async init() {

    // call AlertNotificationService's init
    await super.init()
  }
}
