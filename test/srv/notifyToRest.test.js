const { messages, buildNotification } = require("../../lib/utils");
const NotifyToRest = require("../../srv/notifyToRest");

describe("notify to rest", () => {
  it("when no object is passed", async () => {
    const notifyToRest = new NotifyToRest();
    const warnSpy = jest.spyOn(global.console, "warn");
    notifyToRest.notify();
    expect(warnSpy).toHaveBeenCalledWith("[notifications] -", messages.NO_OBJECT_FOR_NOTIFY);
    warnSpy.mockClear();
  });

  it("when empty object is passed", async () => {
    const notifyToRest = new NotifyToRest();
    const warnSpy = jest.spyOn(global.console, "warn");
    notifyToRest.notify({});
    expect(warnSpy).toHaveBeenCalledWith("[notifications] -", messages.EMPTY_OBJECT_FOR_NOTIFY);
    warnSpy.mockClear();
  });

  it(`when recipients or title isn't passed in default notification`, async () => {
    const notifyToRest = new NotifyToRest();
    const warnSpy = jest.spyOn(global.console, "warn");
    notifyToRest.notify({ dummy: true });
    expect(warnSpy).toHaveBeenCalledWith("[notifications] -", messages.MANDATORY_PARAMETER_NOT_PASSED_FOR_DEFAULT_NOTIFICATION);
    warnSpy.mockClear();
  });

  it(`when title isn't a string in default notification`, async () => {
    const notifyToRest = new NotifyToRest();
    const warnSpy = jest.spyOn(global.console, "warn");
    notifyToRest.notify({ title: 1, recipients: ["abc@abc.com"] });
    expect(warnSpy).toHaveBeenCalledWith("[notifications] -", messages.TITLE_IS_NOT_STRING);
    warnSpy.mockClear();
  });

  it(`when priority isn't valid in default notification`, async () => {
    const notifyToRest = new NotifyToRest();
    const warnSpy = jest.spyOn(global.console, "warn");
    notifyToRest.notify({ title: "abc", recipients: ["abc@abc.com"], priority: "abc" });
    expect(warnSpy).toHaveBeenCalledWith("[notifications] -", "Invalid priority abc. Allowed priorities are LOW, NEUTRAL, MEDIUM, HIGH");
    warnSpy.mockClear();
  });

  it(`when description isn't valid in default notification`, async () => {
    const notifyToRest = new NotifyToRest();
    const warnSpy = jest.spyOn(global.console, "warn");
    notifyToRest.notify({ title: "abc", recipients: ["abc@abc.com"], priority: "low", description: true });
    expect(warnSpy).toHaveBeenCalledWith("[notifications] -", messages.DESCRIPTION_IS_NOT_STRING);
    warnSpy.mockClear();
  });

  it(`When correct body is send | Then notification is posted`, async () => {
    const body = { title: "abc", recipients: ["abc@abc.com"], priority: "low" };
    const notifyToRest = new NotifyToRest();
    let notification; notifyToRest.postNotification = n => notification = n
    await notifyToRest.init();
    await notifyToRest.notify(body);
    expect(notification).toMatchObject(buildNotification(body));
  });
});
