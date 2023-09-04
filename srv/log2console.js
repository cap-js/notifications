const AlertNotificationService = require('./service')

module.exports = class Alert2Console extends AlertNotificationService {
  async init() {

    // call AlertNotificationService's init
    await super.init()
  }
}
