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
    notificationTypeKey : String;
    recipient        : User;
    targetParameters : Composition of many TargetParameters on targetParameters.notification = $self;
}

entity TargetParameters : cuid {
    notification    : Association to one Notifications;
    value           : String(250);
    name            : String(250);
}

annotate Notifications with @PersonalData : {
    DataSubjectRole : 'User',
    EntitySemantics : 'Other'
} {
    recipient @PersonalData.FieldSemantics : 'UserID';
    //Semantically wrong, just to ensure deletion works
    createdAt @PersonalData.FieldSemantics : 'EndOfBusinessDate';
}