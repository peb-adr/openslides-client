import { BaseModel } from '../base/base-model';
import { Id } from '../../definitions/key-types';
import { HasMeetingId } from '../../interfaces/has-meeting-id';
import { HasSequentialNumber } from '../../interfaces';

/**
 * Representation of a motion workflow. Has the nested property 'states'
 * @ignore
 */
export class MotionWorkflow extends BaseModel<MotionWorkflow> {
    public static COLLECTION = `motion_workflow`;

    public name!: string;

    public state_ids!: Id[]; // (motion_state/workflow_id)[];
    public first_state_id!: Id; // motion_state/first_state_of_workflow_id;
    public motion_ids!: Id[]; // (motion/workflow_id)[];
    public default_workflow_meeting_id!: Id; // meeting/motions_default_workflow_id;
    public default_amendment_workflow_meeting_id!: Id; // meeting/motions_default_amendment_workflow_id;
    public default_statute_amendment_workflow_meeting_id!: Id; // meeting/motions_default_statute_amendments_workflow_id;

    public constructor(input?: any) {
        super(MotionWorkflow.COLLECTION, input);
    }
}
export interface MotionWorkflow extends HasMeetingId, HasSequentialNumber {}
