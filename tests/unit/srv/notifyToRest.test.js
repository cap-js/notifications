const { messages, buildNotification } = require("../../../lib/utils");
const NotifyToRest = require("../../../srv/notifyToRest");

describe("Notify to rest", () => {
  let log = cds.test.log()
  let notifyToRest;

  beforeEach(() => {
    notifyToRest = new NotifyToRest();
  })

  describe("Warnings", () => {
    it("No object is passed", async () => {
      notifyToRest.notify();
      expect(log.output).toContain(messages.NO_OBJECT_FOR_NOTIFY);
    });

    it("Empty object is passed", async () => {
      notifyToRest.notify({});
      expect(log.output).toContain(messages.EMPTY_OBJECT_FOR_NOTIFY);
    });

    it("Recipients or title isn't passed in default notification", async () => {
      notifyToRest.notify({ dummy: true });
      expect(log.output).toContain(messages.MANDATORY_PARAMETER_NOT_PASSED_FOR_DEFAULT_NOTIFICATION);
    });

    it("Title isn't a string in default notification", async () => {
      notifyToRest.notify({ title: 1, recipients: ["abc@abc.com"] });
      expect(log.output).toContain(messages.TITLE_IS_NOT_STRING);
    });

    it("Priority isn't valid in default notification", async () => {
      notifyToRest.notify({ title: "abc", recipients: ["abc@abc.com"], priority: "abc" });
      expect(log.output).toContain("Invalid priority abc. Allowed priorities are LOW, NEUTRAL, MEDIUM, HIGH");
    });

    it("Description isn't valid in default notification", async () => {
      notifyToRest.notify({ title: "abc", recipients: ["abc@abc.com"], priority: "low", description: true });
      expect(log.output).toContain(messages.DESCRIPTION_IS_NOT_STRING);
    });
  });

  describe("Posting notifications", () => {
    let postedNotification;

    beforeEach(() => {
      notifyToRest.postNotification = n => postedNotification = n;
      notifyToRest.init();
    });

    it("Correct body is sent the notification should be posted", async () => {
      const body = { title: "abc", recipients: ["abc@abc.com"], priority: "low" }; 
      await notifyToRest.notify(body);
      expect(postedNotification).toMatchObject(buildNotification(body));
    });

    it("Emit is called with an outbox request object", async () => {
      const req = { event: "IncidentResolved", data: { NotificationTypeKey: "IncidentResolved", NotificationTypeVersion: "1", Priority: "NEUTRAL", Properties: [], Recipients: [] }, headers: {} };
      await notifyToRest.emit(req);
      expect(postedNotification).toMatchObject(req.data);
    });

    it("Notify is called with a single object-containing type", async () => {
      const body = { type: "IncidentResolved", recipients: ["abc@abc.com"], data: { title: "test" } };
      await notifyToRest.notify(body);
      expect(postedNotification).toMatchObject(buildNotification(body));
    });

    it("Notify is called with type as first arg and message as second", async () => {
      await notifyToRest.notify("IncidentResolved", { recipients: ["abc@abc.com"], data: { title: "test" } });
      expect(postedNotification).toMatchObject(buildNotification({ type: "IncidentResolved", recipients: ["abc@abc.com"], data: { title: "test" } }));
    });

    it("Notify is called with a single object containing NotificationTypeKey and no type", async () => {
      const body = { NotificationTypeKey: "IncidentResolved", NotificationTypeVersion: "1", Priority: "NEUTRAL", Properties: [], Recipients: [] };
      const expected = buildNotification({ ...body });
      await notifyToRest.notify(body);
      expect(postedNotification).toMatchObject(expected);
    });
  });
});
