import { Injectable } from '@angular/core';
import { MotionPollServiceModule } from '../motion-poll-service.module';
import { PollRepositoryService } from 'src/app/gateways/repositories/polls/poll-repository.service';
import { ViewPoll } from 'src/app/site/pages/meetings/pages/polls';
import { PollClassType } from 'src/app/domain/models/poll/poll-constants';
import { Fqid } from 'src/app/domain/definitions/key-types';

@Injectable({
    providedIn: MotionPollServiceModule
})
export class MotionPollControllerService {
    constructor(private repo: PollRepositoryService) {}

    public getViewModelList(): ViewPoll[] {
        return this.repo.getViewModelList().filter(poll => poll.pollClassType === PollClassType.Motion);
    }

    public getViewModelListByContentObject(fqid: Fqid): ViewPoll[] {
        return this.getViewModelList().filter(poll => poll.content_object_id === fqid);
    }
}
