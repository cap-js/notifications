service notificationService {
  @description: '{i18n>BOOK_ORDERED_DESCRIPTION}'
  @notification: {
    template: {
      title        : '{i18n>BOOK_ORDERED_TITLE}',
      publicTitle  : '{i18n>BOOK_ORDERED_PUBLIC_TITLE}',
      subtitle     : '{i18n>BOOK_ORDERED_SUBTITLE}',
      groupedTitle : '{i18n>BOOK_ORDERED_GROUPED_TITLE}',
      email        : {
        subject: 'Book Ordered: {{title}}',
        html   : '<p>Hi {{buyer}},</p><p>Your order for <b>{{title}}</b> has been placed.</p>',
      }
    },
    deliveryChannels: [{ channel: 'MAIL', enabled: true, defaultPreference: true, editablePreference: true}]
  }
  event BookOrderedNotify {
    title     : String;
    buyer     : String;
    recipients: array of String;
  }
}
