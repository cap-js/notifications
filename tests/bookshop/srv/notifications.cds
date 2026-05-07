@description: 'Book Ordered'
@notification: {
  template: {
    title        : 'Book Ordered',
    publicTitle  : 'Book Ordered',
    subtitle     : '{{buyer}} ordered {{title}}',
    groupedTitle : 'Bookshop Updates',
  }
}
event BookOrdered {
  title     : String;
  buyer     : String;
  recipients: array of String;
}
