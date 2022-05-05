import { Observable, of } from 'rxjs';
import { HasOrganizationTags } from '../../organization-tags/view-models/has-organization-tags';
import { Committee } from 'src/app/domain/models/comittees/committee';
import { BaseViewModel } from 'src/app/site/base/base-view-model';
import { ViewUser } from 'src/app/site/pages/meetings/view-models/view-user';
import { Id } from 'src/app/domain/definitions/key-types';
import { CML } from 'src/app/domain/definitions/organization-permission';
import { ViewMeeting } from 'src/app/site/pages/meetings/view-models/view-meeting';
import { ViewOrganization } from 'src/app/site/pages/organization/view-models/view-organization';

export class ViewCommittee extends BaseViewModel<Committee> {
    public static COLLECTION = Committee.COLLECTION;
    protected _collection = Committee.COLLECTION;

    public get committee(): Committee {
        return this._model;
    }

    public get meetingAmount(): number {
        return this.meeting_ids?.length || 0;
    }

    public get memberAmount(): number {
        return this.user_ids?.length || 0;
    }

    public get hasForwardings(): boolean {
        return (this.forward_to_committee_ids || []).length > 0;
    }

    public get hasReceivings(): boolean {
        return (this.receive_forwardings_from_committee_ids || []).length > 0;
    }

    public get managerObservable(): Observable<ViewUser[]> {
        return of(this.getManagers());
    }

    public get managerAmount(): number {
        return this.getManagers().length || 0;
    }

    public getManagers(): ViewUser[] {
        const userIds = this.user_management_level_ids(CML.can_manage);
        return userIds ? (userIds.map(userId => this.getViewUser(userId)) as ViewUser[]) : [];
    }

    // Functions injected by the committee-repo
    public getViewUser!: (id: Id) => ViewUser | null;
}
interface ICommitteeRelations {
    meetings: ViewMeeting[];
    default_meeting: ViewMeeting;
    users: ViewUser[];
    users_as_observable: Observable<ViewUser[]>;
    forward_to_committees: ViewCommittee[];
    receive_forwardings_from_committees: ViewCommittee[];
    organization: ViewOrganization;
    // user_management_levels: (cml: CML) => ViewUser[]; // Not working yet!
}
export interface ViewCommittee extends Committee, ICommitteeRelations, HasOrganizationTags {}
