@description: '{i18n>BOOK_ORDERED_DESCRIPTION}'
@notification: {
  template: {
    title        : '{i18n>BOOK_ORDERED_TITLE}',
    publicTitle  : '{i18n>BOOK_ORDERED_PUBLIC_TITLE}',
    subtitle     : '{i18n>BOOK_ORDERED_SUBTITLE}',
    groupedTitle : '{i18n>BOOK_ORDERED_GROUPED_TITLE}',
    email        : {
      subject: 'Book Ordered: {{title}}',
      html   : './book-ordered-email.html',
    }
  },
  deliveryChannels: [{ channel: 'Mail', enabled: true, defaultPreference: true, editablePreference: true}]
}
event BookOrdered {
  title     : String;
  buyer     : String;
  recipients: array of String;
}
