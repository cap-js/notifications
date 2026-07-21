using { CatalogService } from './cat-service';

extend service CatalogService with {
  @description: '{i18n>BOOK_ORDERED_DESCRIPTION}'
  @notification: {
    template: {
      title        : '{i18n>BOOK_ORDERED_TITLE}',
      publicTitle  : '{i18n>BOOK_ORDERED_PUBLIC_TITLE}',
      subtitle     : '{i18n>BOOK_ORDERED_SUBTITLE}',
      groupedTitle : '{i18n>BOOK_ORDERED_GROUPED_TITLE}',
      email        : {
        subject: '{i18n>BOOK_ORDERED_EMAIL_SUBJECT}',
        html   : './book-ordered-email.html',
      }
    },
    deliveryChannels: [{ channel: 'MAIL', enabled: true, defaultPreference: true, editablePreference: true}]
  }
  @notification.priority : (quantity > 5 ? #High : #Low)
  event BookOrderedNotify {
    title     : String;
    buyer     : String;
    quantity  : Integer;
    recipients: array of String;
  }

  @notification: {
    template: {
      title        : 'Late Delivery',
      publicTitle  : 'Late Delivery',
      groupedTitle : 'Delivery Updates',
    }
  }
  @notification.priority : (days_between(orderDate, deliveryDate) > 7 ? #High : #Low)
  event LateDeliveryNotify {
    title        : String;
    orderDate    : Date;
    deliveryDate : Date;
    recipients   : array of String;
  }
}
