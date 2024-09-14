using {
    cuid,
    managed,
    User,
    sap.common.CodeList as CodeList,
} from '@sap/cds/common';

namespace sap.cds.common;

@PersonalData : {
    DataSubjectRole : 'User',
    EntitySemantics : 'Other'
}
entity Notifications : cuid, managed {
    notificationID: UUID; //This is  the ID the Notification also has in the notifications service
    notificationTypeKey : String;
    recipient        : User;
    properties : Composition of many Properties on properties.notification = $self;
    targetParameters : Composition of many TargetParameters on targetParameters.notification = $self;
}

entity TargetParameters : cuid {
    notificationID : UUID;
    notification    : Association to one Notifications on notification.notificationID = notificationID;
    value           : String(250);
    name            : String(250);
}

entity Properties : cuid {
    notificationID : UUID;
    notification    : Association to one Notifications on notification.notificationID = notificationID;
    value           : String(250);
    name            : String(250);
    type            : String(250);
    isSensitive     : String(250);
}

annotate Notifications with @PersonalData : {
    DataSubjectRole : 'User',
    EntitySemantics : 'Other'
} {
    recipient @PersonalData.FieldSemantics : 'UserID';
    //Semantically wrong, just to ensure deletion works
    createdAt @PersonalData.FieldSemantics : 'EndOfBusinessDate';
}