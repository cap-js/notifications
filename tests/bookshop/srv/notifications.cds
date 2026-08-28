using { CatalogService } from './cat-service';
using {sap.capire.bookshop as my} from '../db/schema';

extend service CatalogService with {
  @description: '{i18n>BOOK_ORDERED_DESCRIPTION}'
  @notification: {
    title        : '{i18n>BOOK_ORDERED_TITLE}',
    publicTitle  : '{i18n>BOOK_ORDERED_PUBLIC_TITLE}',
    subtitle     : '{i18n>BOOK_ORDERED_SUBTITLE}',
    groupedTitle : '{i18n>BOOK_ORDERED_GROUPED_TITLE}',
    email        : {
      subject: '{i18n>BOOK_ORDERED_EMAIL_SUBJECT}',
      html   : './book-ordered-email.html',
    },
    channels: ['email']
  }
  @notification.priority : (quantity > 5 ? #High : #Low)
  event BookOrderedNotify {
    title     : String;
    buyer     : String;
    quantity  : Integer;
    recipients: array of String;
  }

  @notification: {
    title        : 'Late Delivery',
    publicTitle  : 'Late Delivery',
    groupedTitle : 'Delivery Updates',
  }
  @notification.priority : (days_between(orderDate, deliveryDate) > 7 ? #High : #Low)
  event LateDeliveryNotify {
    title        : String;
    orderDate    : Date;
    deliveryDate : Date;
    recipients   : array of String;
  }
}

service CatalogTest {
    @notifications : [{
      type: 'MY_NOTIFICATION_TYPE',
      on: ['READ'],
      recipients: ($self.createdBy),
      where: ($self.title = 'Wuthering Heights'),
      priority: #Low,
    }, {
      type: 'MY_NOTIFICATION_TYPE',
      on: ['READ'],
      recipients: ($self.createdBy),
      where: ($self.title = 'Jane Eyre'),
      priority: #Low,
      parameters: { bookTitle: $self.title, bookId: $self.ID }
    }]
    entity Books as projection on my.Books;

}
