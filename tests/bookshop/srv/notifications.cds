@description: '{i18n>BOOK_ORDERED_DESCRIPTION}'
@notification: {
  template: {
    title        : '{i18n>BOOK_ORDERED_TITLE}',
    publicTitle  : '{i18n>BOOK_ORDERED_PUBLIC_TITLE}',
    subtitle     : '{i18n>BOOK_ORDERED_SUBTITLE}',
    groupedTitle : '{i18n>BOOK_ORDERED_GROUPED_TITLE}',
  }
}
event BookOrdered {
  title     : String;
  buyer     : String;
  recipients: array of String;
}
