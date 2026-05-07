const utils = require("../../../lib/utils")
const httpClient = require("@sap-cloud-sdk/http-client")
const connectivity = require("@sap-cloud-sdk/connectivity")
const notificationTypes = require("../../../lib/notificationTypes")

jest.mock("../../../lib/utils")
jest.mock("@sap-cloud-sdk/http-client")
jest.mock("@sap-cloud-sdk/connectivity")

const defaultNotificationType = {
  NotificationTypeKey: "Default",
  NotificationTypeVersion: "1",
  Templates: [
    {
      Language: "en",
      Description: "Other Notifications",
      TemplatePublic: "{{title}}",
      TemplateSensitive: "{{title}}",
      TemplateGrouped: "Other Notifications",
      TemplateLanguage: "mustache",
      Subtitle: "{{description}}"
    }
  ]
}

const notificationTypeWithAllProperties = {
  NotificationTypeKey: "notificationTypeWithAllProperties",
  NotificationTypeVersion: "1",
  IsGroupable: true,
  Templates: [
    {
      Language: "EN",
      TemplatePublic: "TemplatePublic",
      TemplateSensitive: "TemplateSensitive",
      TemplateGrouped: "TemplateGrouped",
      Description: "Description",
      TemplateLanguage: "MUSTACHE",
      Subtitle: "Subtitle",
      EmailSubject: "EmailSubject",
      EmailText: "EmailText",
      EmailHtml: "EmailHtml"
    }
  ],
  Actions: [
    {
      ActionId: "Accept",
      Language: "EN",
      ActionText: "Accept",
      GroupActionText: "Accept All",
      Nature: "POSITIVE"
    }
  ],
  DeliveryChannels: [
    {
      Type: "WEB",
      Enabled: true,
      DefaultPreference: false,
      EditablePreference: true
    }
  ]
}

const notificationTypeWithoutVersion = {
  NotificationTypeKey: "notificationTypeWithoutVersion",
  IsGroupable: true,
  Templates: [
    {
      Language: "EN",
      TemplatePublic: "TemplatePublic",
      TemplateSensitive: "TemplateSensitive",
      TemplateGrouped: "TemplateGrouped",
      Description: "Description",
      TemplateLanguage: "MUSTACHE",
      Subtitle: "Subtitle",
      EmailSubject: "EmailSubject",
      EmailText: "EmailText",
      EmailHtml: "EmailHtml"
    }
  ],
  Actions: [
    {
      ActionId: "Accept",
      Language: "EN",
      ActionText: "Accept",
      GroupActionText: "Accept All",
      Nature: "POSITIVE"
    }
  ],
  DeliveryChannels: [
    {
      Type: "WEB",
      Enabled: true,
      DefaultPreference: false,
      EditablePreference: true
    }
  ]
}

const notificationTypeWithNullTemplatesActionsAndDeliveryChannels = {
  ...notificationTypeWithAllProperties,
  Templates: null,
  Actions: null,
  DeliveryChannels: null
}

const testPrefix = "test-prefix"

const emptyResponseBody = { data: { d: { results: [] } } }

const allExistingResponseBody = {
  data: {
    d: {
      results: [
        {
          NotificationTypeId: "a6771115-42f4-4ac3-9c85-49a819927b9c",
          NotificationTypeKey: "Default",
          NotificationTypeVersion: "1",
          IsGroupable: true,
          Templates: {
            results: [
              {
                Language: "EN",
                TemplatePublic: "{{title}}",
                TemplateSensitive: "{{title}}",
                TemplateGrouped: "Other Notifications",
                Description: "Other Notifications",
                TemplateLanguage: "MUSTACHE",
                Subtitle: "{{description}}",
                EmailSubject: null,
                EmailText: null,
                EmailHtml: null
              }
            ]
          },
          Actions: {
            results: []
          },
          DeliveryChannels: {
            results: []
          }
        },
        {
          NotificationTypeId: "26f1fad0-de4c-4869-9b4e-62f445c8a7a8",
          NotificationTypeKey: "test-prefix/notificationTypeWithAllProperties",
          NotificationTypeVersion: "1",
          IsGroupable: true,
          Templates: {
            results: [
              {
                Language: "EN",
                TemplatePublic: "TemplatePublic",
                TemplateSensitive: "TemplateSensitive",
                TemplateGrouped: "TemplateGrouped",
                Description: "Description",
                TemplateLanguage: "MUSTACHE",
                Subtitle: "Subtitle",
                EmailSubject: "EmailSubject",
                EmailText: "EmailText",
                EmailHtml: "EmailHtml"
              }
            ]
          },
          Actions: {
            results: [
              {
                ActionId: "Accept",
                ActionText: "Accept",
                GroupActionText: "Accept All",
                Language: "EN",
                Nature: "POSITIVE"
              }
            ]
          },
          DeliveryChannels: {
            results: [
              {
                Type: "WEB",
                Enabled: true,
                DefaultPreference: false,
                EditablePreference: true
              }
            ]
          }
        },
        {
          NotificationTypeId: "5b641f19-7c05-404b-b9a3-f6326f8b23ad",
          NotificationTypeKey: "test-prefix-2/notificationTypeWithAllProperties",
          NotificationTypeVersion: "1",
          IsGroupable: true,
          Templates: {
            results: [
              {
                Language: "EN",
                TemplatePublic: "TemplatePublic",
                TemplateSensitive: "TemplateSensitive",
                TemplateGrouped: "TemplateGrouped",
                Description: "Description",
                TemplateLanguage: "MUSTACHE",
                Subtitle: "Subtitle",
                EmailSubject: "EmailSubject",
                EmailText: "EmailText",
                EmailHtml: "EmailHtml"
              }
            ]
          },
          Actions: {
            results: [
              {
                ActionId: "Accept",
                ActionText: "Accept",
                GroupActionText: "Accept All",
                Language: "EN",
                Nature: "POSITIVE"
              }
            ]
          },
          DeliveryChannels: {
            results: [
              {
                Type: "WEB",
                Enabled: true,
                DefaultPreference: false,
                EditablePreference: true
              }
            ]
          }
        },
        {
          NotificationTypeId: "719d8f6a-1e07-4981-b2be-07197cec7492",
          NotificationTypeKey: "test-prefix/notificationTypeWithoutVersion",
          NotificationTypeVersion: "1",
          IsGroupable: true,
          Templates: {
            results: [
              {
                Language: "EN",
                TemplatePublic: "TemplatePublic",
                TemplateSensitive: "TemplateSensitive",
                TemplateGrouped: "TemplateGrouped",
                Description: "Description",
                TemplateLanguage: "MUSTACHE",
                Subtitle: "Subtitle",
                EmailSubject: "EmailSubject",
                EmailText: "EmailText",
                EmailHtml: "EmailHtml"
              }
            ]
          },
          Actions: {
            results: [
              {
                ActionId: "Accept",
                ActionText: "Accept",
                GroupActionText: "Accept All",
                Language: "EN",
                Nature: "POSITIVE"
              }
            ]
          },
          DeliveryChannels: {
            results: [
              {
                Type: "WEB",
                Enabled: true,
                DefaultPreference: false,
                EditablePreference: true
              }
            ]
          }
        }
      ]
    }
  }
}

const allExistingWithUndefinedTemplatesActionsAndDeliveryChannelsResponseBody = {
  data: {
    d: {
      results: [
        {
          NotificationTypeId: "a6771115-42f4-4ac3-9c85-49a819927b9c",
          NotificationTypeKey: "Default",
          NotificationTypeVersion: "1",
          IsGroupable: true,
          Templates: {
            results: [
              {
                NotificationTypeId: "a6771115-42f4-4ac3-9c85-49a819927b9c",
                Language: "EN",
                TemplatePublic: "{{title}}",
                TemplateSensitive: "{{title}}",
                TemplateGrouped: "Other Notifications",
                Description: "Other Notifications",
                TemplateLanguage: "MUSTACHE",
                Subtitle: "{{description}}",
                EmailSubject: null,
                EmailText: null,
                EmailHtml: null
              }
            ]
          },
          Actions: {
            results: null
          },
          DeliveryChannels: {}
        },
        {
          NotificationTypeId: "26f1fad0-de4c-4869-9b4e-62f445c8a7a8",
          NotificationTypeKey: "test-prefix/notificationTypeWithAllProperties",
          NotificationTypeVersion: "1",
          IsGroupable: true
        }
      ]
    }
  }
}

describe("Managing of Notification Types", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    utils.getNotificationTypesKeyWithPrefix.mockImplementation(str => `${testPrefix}/${str}`)
  })

  describe("Create Notification Types Map", () => {
    test("Seed the Default type when isLocal is true", () => {
      const result = notificationTypes.createNotificationTypesMap([], true)
      expect(result).toHaveProperty("Default")
      expect(result["Default"]["1"]).toMatchObject(defaultNotificationType)
    })

    test("Store multiple versions of the same type under the same key", () => {
      const typeV1 = { NotificationTypeKey: "MyType", NotificationTypeVersion: "1", Templates: [] }
      const typeV2 = { NotificationTypeKey: "MyType", NotificationTypeVersion: "2", Templates: [] }
      const result = notificationTypes.createNotificationTypesMap([typeV1, typeV2])

      expect(Object.keys(result[`${testPrefix}/MyType`])).toEqual(["1", "2"])
    })
  })

  describe("Process Notification Types", () => {
    beforeEach(() => {
      utils.getNotificationDestination.mockReturnValue(undefined)
      utils.getPrefix.mockReturnValue(testPrefix)
      connectivity.buildHeadersForDestination.mockReturnValue({})
    })

    describe("Creating Types", () => {
      test("Create Default and all new types when none exist in Work Zone", () => {
        httpClient.executeHttpRequest.mockReturnValue(emptyResponseBody)

        return notificationTypes.processNotificationTypes([structuredClone(notificationTypeWithAllProperties), structuredClone(notificationTypeWithoutVersion)]).then(() => {
          const [, createDefault, createFirst, createSecond, extra] = httpClient.executeHttpRequest.mock.calls.map(c => c[1])

          expect(createDefault.method).toBe("post")
          expect(createDefault.data).toEqual(defaultNotificationType)

          expect(createFirst.method).toBe("post")
          expect(createFirst.data).toEqual(toNTypeWithPrefixedKey(notificationTypeWithAllProperties))

          expect(createSecond.method).toBe("post")
          expect(createSecond.data).toEqual(toNTypeWithPrefixedKey({ ...notificationTypeWithoutVersion, NotificationTypeVersion: "1" }))

          expect(extra).toBeUndefined()
        })
      })

      test("Do not create Default type when it already exists in Work Zone", () => {
        httpClient.executeHttpRequest.mockReturnValue(allExistingResponseBody)

        return notificationTypes.processNotificationTypes([structuredClone(notificationTypeWithAllProperties), structuredClone(notificationTypeWithoutVersion)]).then(() => {
          const postCalls = httpClient.executeHttpRequest.mock.calls.filter(c => c[1].method === "post")
          expect(postCalls).toHaveLength(0)
        })
      })

      test("Create a missing version when another version of the same type exists", () => {
        httpClient.executeHttpRequest.mockReturnValue(allExistingResponseBody)
        const versionTwo = structuredClone(notificationTypeWithAllProperties)
        versionTwo.NotificationTypeVersion = "2"

        return notificationTypes.processNotificationTypes([structuredClone(notificationTypeWithAllProperties), versionTwo, structuredClone(notificationTypeWithoutVersion)]).then(() => {
          const createCall = httpClient.executeHttpRequest.mock.calls[1][1]
          expect(createCall.method).toBe("post")
          expect(createCall.data.NotificationTypeVersion).toBe("2")
          expect(httpClient.executeHttpRequest.mock.calls[2]).toBeUndefined()
        })
      })

      test("Fall back gracefully when create response has no data.d", () => {
        httpClient.executeHttpRequest
          .mockReturnValueOnce(emptyResponseBody)
          .mockReturnValue({ status: 201 })

        return notificationTypes.processNotificationTypes([structuredClone(notificationTypeWithAllProperties)]).then(() => {
          expect(httpClient.executeHttpRequest.mock.calls[1][1].method).toBe("post")
        })
      })

      test("Create new types correctly when existing types use OData results format", () => {
        httpClient.executeHttpRequest.mockReturnValue({
          data: {
            d: {
              results: [
                {
                  NotificationTypeKey: "Default",
                  NotificationTypeVersion: "1",
                  IsGroupable: true,
                  Templates: { results: [] },
                  Actions: { results: [] },
                  DeliveryChannels: { results: [] }
                }
              ]
            }
          }
        })

        return notificationTypes.processNotificationTypes([structuredClone(notificationTypeWithAllProperties)]).then(() => {
          expect(httpClient.executeHttpRequest.mock.calls[1][1].method).toBe("post")
          expect(httpClient.executeHttpRequest.mock.calls[2]).toBeUndefined()
        })
      })
    })

    describe("Updating Types", () => {
      test("Update all changed types", () => {
        httpClient.executeHttpRequest.mockReturnValue(allExistingResponseBody)

        const updatedWithAll = structuredClone(notificationTypeWithAllProperties)
        updatedWithAll.Templates[0].Description = "New Description"
        const updatedWithoutVersion = structuredClone(notificationTypeWithoutVersion)
        updatedWithoutVersion.Templates[0].Description = "New Description"

        return notificationTypes.processNotificationTypes([structuredClone(updatedWithAll), structuredClone(updatedWithoutVersion)]).then(() => {
          const [, updateFirst, updateSecond, extra] = httpClient.executeHttpRequest.mock.calls.map(c => c[1])

          expect(updateFirst.url).toBe("v2/NotificationType.svc/NotificationTypes(guid'26f1fad0-de4c-4869-9b4e-62f445c8a7a8')")
          expect(updateFirst.method).toBe("patch")
          expect(updateFirst.data).toEqual(toNTypeWithPrefixedKey(updatedWithAll))

          expect(updateSecond.url).toBe("v2/NotificationType.svc/NotificationTypes(guid'719d8f6a-1e07-4981-b2be-07197cec7492')")
          expect(updateSecond.method).toBe("patch")
          expect(updateSecond.data).toEqual(toNTypeWithPrefixedKey({ ...updatedWithoutVersion, NotificationTypeVersion: "1" }))

          expect(extra).toBeUndefined()
        })
      })

      test("Update type when an additional Template is added", () => {
        httpClient.executeHttpRequest.mockReturnValue(allExistingResponseBody)

        const updated = structuredClone(notificationTypeWithAllProperties)
        updated.Templates[1] = updated.Templates[0]
        updated.Templates[1].Language = "DE"

        return notificationTypes.processNotificationTypes([structuredClone(updated), structuredClone(notificationTypeWithoutVersion)]).then(() => {
          const [, updateCall, extra] = httpClient.executeHttpRequest.mock.calls.map(c => c[1])
          expect(updateCall.url).toBe("v2/NotificationType.svc/NotificationTypes(guid'26f1fad0-de4c-4869-9b4e-62f445c8a7a8')")
          expect(updateCall.method).toBe("patch")
          expect(updateCall.data).toEqual(toNTypeWithPrefixedKey(updated))
          expect(extra).toBeUndefined()
        })
      })

      test("Update type when an additional Action is added", () => {
        httpClient.executeHttpRequest.mockReturnValue(allExistingResponseBody)

        const updated = structuredClone(notificationTypeWithAllProperties)
        updated.Actions[1] = updated.Actions[0]
        updated.Actions[1].Language = "DE"

        return notificationTypes.processNotificationTypes([structuredClone(updated), structuredClone(notificationTypeWithoutVersion)]).then(() => {
          const [, updateCall, extra] = httpClient.executeHttpRequest.mock.calls.map(c => c[1])
          expect(updateCall.url).toBe("v2/NotificationType.svc/NotificationTypes(guid'26f1fad0-de4c-4869-9b4e-62f445c8a7a8')")
          expect(updateCall.method).toBe("patch")
          expect(updateCall.data).toEqual(toNTypeWithPrefixedKey(updated))
          expect(extra).toBeUndefined()
        })
      })

      test("Update type when an additional DeliveryChannel is added", () => {
        httpClient.executeHttpRequest.mockReturnValue(allExistingResponseBody)

        const updated = structuredClone(notificationTypeWithAllProperties)
        updated.DeliveryChannels[1] = updated.DeliveryChannels[0]
        updated.DeliveryChannels[1].Type = "MOBILE"

        return notificationTypes.processNotificationTypes([structuredClone(updated), structuredClone(notificationTypeWithoutVersion)]).then(() => {
          const [, updateCall, extra] = httpClient.executeHttpRequest.mock.calls.map(c => c[1])
          expect(updateCall.url).toBe("v2/NotificationType.svc/NotificationTypes(guid'26f1fad0-de4c-4869-9b4e-62f445c8a7a8')")
          expect(updateCall.method).toBe("patch")
          expect(updateCall.data).toEqual(toNTypeWithPrefixedKey(updated))
          expect(extra).toBeUndefined()
        })
      })

      test("Update type when any individual field has changed", async () => {
        httpClient.executeHttpRequest.mockReturnValue(allExistingResponseBody)

        const mutate = (target, key, value) => {
        if (typeof value === "string") target[key] = value + " UPDATED"
          else if (typeof value === "boolean") target[key] = !value
          else if (typeof value === "number") target[key] = value + 1
          else return false
          return true
        }

        const assertUpdateCall = (changed) => {
          const [, updateCall, extra] = httpClient.executeHttpRequest.mock.calls.map(c => c[1])
          expect(updateCall.url).toBe("v2/NotificationType.svc/NotificationTypes(guid'26f1fad0-de4c-4869-9b4e-62f445c8a7a8')")
          expect(updateCall.method).toBe("patch")
          expect(updateCall.data).toEqual(toNTypeWithPrefixedKey(changed))
          expect(extra).toBeUndefined()
        }

        for (const [key, value] of Object.entries(notificationTypeWithAllProperties)) {
          if (key === "NotificationTypeKey" || key === "NotificationTypeVersion") continue
          const changed = structuredClone(notificationTypeWithAllProperties)
          if (!mutate(changed, key, value)) continue
          await notificationTypes.processNotificationTypes([structuredClone(changed), structuredClone(notificationTypeWithoutVersion)]).then(() => assertUpdateCall(changed))
          jest.clearAllMocks()
        }

        for (const [key, value] of Object.entries(notificationTypeWithAllProperties.Templates[0])) {
          const changed = structuredClone(notificationTypeWithAllProperties)
          if (!mutate(changed.Templates[0], key, value)) continue
          await notificationTypes.processNotificationTypes([structuredClone(changed), structuredClone(notificationTypeWithoutVersion)]).then(() => assertUpdateCall(changed))
          jest.clearAllMocks()
        }

        for (const [key, value] of Object.entries(notificationTypeWithAllProperties.Actions[0])) {
          const changed = structuredClone(notificationTypeWithAllProperties)
          if (!mutate(changed.Actions[0], key, value)) continue
          await notificationTypes.processNotificationTypes([structuredClone(changed), structuredClone(notificationTypeWithoutVersion)]).then(() => assertUpdateCall(changed))
          jest.clearAllMocks()
        }

        for (const [key, value] of Object.entries(notificationTypeWithAllProperties.DeliveryChannels[0])) {
          const changed = structuredClone(notificationTypeWithAllProperties)
          if (!mutate(changed.DeliveryChannels[0], key, value)) continue
          await notificationTypes.processNotificationTypes([structuredClone(changed), structuredClone(notificationTypeWithoutVersion)]).then(() => assertUpdateCall(changed))
          jest.clearAllMocks()
        }
      })

      test("Update type when existing type has null inner results", () => {
        httpClient.executeHttpRequest.mockReturnValue({
          data: {
            d: {
              results: [{
                NotificationTypeId: "test-guid-123",
                NotificationTypeKey: "test-prefix/notificationTypeWithAllProperties",
                NotificationTypeVersion: "1",
                IsGroupable: true,
                Templates: { results: null },
                Actions: { results: null },
                DeliveryChannels: { results: null }
              }]
            }
          }
        })

        return notificationTypes.processNotificationTypes([structuredClone(notificationTypeWithAllProperties)]).then(() => {
          const [, updateCall] = httpClient.executeHttpRequest.mock.calls.map(c => c[1])
          expect(updateCall.method).toBe("patch")
        })
      })
    })

    describe("No Changed Needed", () => {
      test("Do nothing when all types match exactly", () => {
        httpClient.executeHttpRequest.mockReturnValue(allExistingResponseBody)

        return notificationTypes.processNotificationTypes([structuredClone(notificationTypeWithAllProperties), structuredClone(notificationTypeWithoutVersion)]).then(() => {
          expect(httpClient.executeHttpRequest.mock.calls[1]).toBeUndefined()
        })
      })

      test("Do nothing when input Templates/Actions/DeliveryChannels use OData results wrapper", () => {
        httpClient.executeHttpRequest.mockReturnValue(allExistingResponseBody)

        const local = structuredClone(notificationTypeWithAllProperties)
        local.Templates = { results: notificationTypeWithAllProperties.Templates }
        local.Actions = { results: notificationTypeWithAllProperties.Actions }
        local.DeliveryChannels = { results: notificationTypeWithAllProperties.DeliveryChannels }

        return notificationTypes.processNotificationTypes([local, structuredClone(notificationTypeWithoutVersion)]).then(() => {
          expect(httpClient.executeHttpRequest.mock.calls[1]).toBeUndefined()
        })
      })

      test("Do nothing when IsGroupable is undefined (treated as true)", () => {
        httpClient.executeHttpRequest.mockReturnValue(allExistingResponseBody)

        const local = structuredClone(notificationTypeWithAllProperties)
        local.IsGroupable = undefined

        return notificationTypes.processNotificationTypes([local, structuredClone(notificationTypeWithoutVersion)]).then(() => {
          expect(httpClient.executeHttpRequest.mock.calls[1]).toBeUndefined()
        })
      })

      test("Do nothing when Language fields are lowercase", () => {
        httpClient.executeHttpRequest.mockReturnValue(allExistingResponseBody)

        const local = structuredClone(notificationTypeWithAllProperties)
        local.Templates[0].Language = notificationTypeWithAllProperties.Templates[0].Language.toLowerCase()
        local.Actions[0].Language = notificationTypeWithAllProperties.Actions[0].Language.toLowerCase()

        return notificationTypes.processNotificationTypes([local, structuredClone(notificationTypeWithoutVersion)]).then(() => {
          expect(httpClient.executeHttpRequest.mock.calls[1]).toBeUndefined()
        })
      })

      test("Do nothing when TemplateLanguage is lowercase", () => {
        httpClient.executeHttpRequest.mockReturnValue(allExistingResponseBody)

        const local = structuredClone(notificationTypeWithAllProperties)
        local.Templates[0].TemplateLanguage = notificationTypeWithAllProperties.Templates[0].TemplateLanguage.toLowerCase()

        return notificationTypes.processNotificationTypes([local, structuredClone(notificationTypeWithoutVersion)]).then(() => {
          expect(httpClient.executeHttpRequest.mock.calls[1]).toBeUndefined()
        })
      })

      test("Do nothing when Templates, Actions and DeliveryChannels are null in both local and remote", () => {
        httpClient.executeHttpRequest.mockReturnValue(allExistingWithUndefinedTemplatesActionsAndDeliveryChannelsResponseBody)

        return notificationTypes.processNotificationTypes([structuredClone(notificationTypeWithNullTemplatesActionsAndDeliveryChannels)]).then(() => {
          expect(httpClient.executeHttpRequest.mock.calls[1]).toBeUndefined()
        })
      })

      test("Do nothing when existing type matches local type exactly", () => {
        httpClient.executeHttpRequest.mockReturnValue({
          data: {
            d: {
              results: [
                {
                  NotificationTypeId: "26f1fad0-de4c-4869-9b4e-62f445c8a7a8",
                  NotificationTypeKey: "test-prefix/notificationTypeWithAllProperties",
                  NotificationTypeVersion: "1",
                  IsGroupable: true,
                  Templates: structuredClone(notificationTypeWithAllProperties).Templates,
                  Actions: structuredClone(notificationTypeWithAllProperties).Actions,
                  DeliveryChannels: structuredClone(notificationTypeWithAllProperties).DeliveryChannels
                },
                {
                  NotificationTypeKey: "Default",
                  NotificationTypeVersion: "1",
                  IsGroupable: true,
                  Templates: [],
                  Actions: [],
                  DeliveryChannels: []
                }
              ]
            }
          }
        })

        return notificationTypes.processNotificationTypes([structuredClone(notificationTypeWithAllProperties)]).then(() => {
          expect(httpClient.executeHttpRequest.mock.calls[1]).toBeUndefined()
        })
      })
    })

    test("Deletes a type that is no longer in the local file", () => {
      httpClient.executeHttpRequest.mockReturnValue(allExistingResponseBody)

      return notificationTypes.processNotificationTypes([structuredClone(notificationTypeWithAllProperties)]).then(() => {
        const [, deleteCall, extra] = httpClient.executeHttpRequest.mock.calls.map(c => c[1])
        expect(deleteCall.url).toBe("v2/NotificationType.svc/NotificationTypes(guid'719d8f6a-1e07-4981-b2be-07197cec7492')")
        expect(deleteCall.method).toBe("delete")
        expect(extra).toBeUndefined()
      })
    })
  })
})

function toNTypeWithPrefixedKey(ntype) {
  var prefixedNtype = structuredClone(ntype)
  prefixedNtype.NotificationTypeKey = testPrefix + "/" + prefixedNtype.NotificationTypeKey
  return prefixedNtype
}
