const cds = require("@sap/cds");
const { join } = cds.utils.path;
const { messages } = require("../../lib/utils");

cds.test(join(__dirname, "../bookshop"));

describe("Notifications Integration", () => {
  let alert;
  let infoSpy;
  let warnSpy;

  beforeAll(async () => {
    alert = await cds.connect.to("notifications");
  });

  beforeEach(() => {
    infoSpy = jest.spyOn(global.console, "info");
    warnSpy = jest.spyOn(global.console, "warn");
  });

  afterEach(() => {
    infoSpy.mockRestore();
    warnSpy.mockRestore();
  });

  test("Notifications service resolves to console implementation in development", async () => {
    expect(alert.constructor.name).toBe("NotifyToConsole");
  });

  test("Notification types are loaded into cds.notifications on startup", () => {
    expect(cds.notifications?.local?.types).toBeDefined();
    expect(cds.notifications.local.types).toHaveProperty("bookshop/BookOrdered");
  });

  test("Sending a notification with unknown type key gives a warning", async () => {
    await alert.notify("UnknownType", {
      recipients: ["reader@bookshop.com"],
      data: { title: "test" }
    });

    expect(warnSpy).toHaveBeenCalledWith(
      "[notifications] -",
      expect.stringContaining("UnknownType is not in the notification types file")
    );
  });

  test("Sending a default notification logs to console", async () => {
    await alert.notify({
      recipients: ["reader@bookshop.com"],
      title: "New book arrived",
      description: "A new book has been added to the catalogue"
    });

    expect(infoSpy).toHaveBeenCalledWith(
      "[notifications] -",
      expect.any(String),
      expect.any(String),
      expect.objectContaining({
        NotificationTypeKey: "Default",
        Priority: "NEUTRAL",
        Recipients: [{ RecipientId: "reader@bookshop.com" }],
        Properties: expect.arrayContaining([
          expect.objectContaining({ Key: "title", Value: "New book arrived" })
        ])
      }),
      expect.any(String)
    );
  });

  test("Sending a notification with no arguments warns and does nothing", async () => {
    await alert.notify();

    expect(warnSpy).toHaveBeenCalledWith(
      "[notifications] -",
      messages.NO_OBJECT_FOR_NOTIFY
    );
    expect(infoSpy).not.toHaveBeenCalled();
  });

  test("Custom typed notification uses prefixed type key from types file", async () => {
    await alert.notify("BookOrdered", {
      recipients: ["reader@bookshop.com"],
      data: { title: "Moby Dick", buyer: "reader@bookshop.com" }
    });

    expect(infoSpy).toHaveBeenCalledWith(
      "[notifications] -",
      expect.any(String),
      expect.any(String),
      expect.objectContaining({
        NotificationTypeKey: "bookshop/BookOrdered"
      }),
      expect.any(String)
    );
    expect(warnSpy).not.toHaveBeenCalled();
  });
});