import { Injectable } from '@angular/core';
import { MotionDetailServiceModule } from '../motion-detail-service.module';
import { MotionChangeRecommendationControllerService } from '../../../../modules/change-recommendations/services/motion-change-recommendation-controller.service/motion-change-recommendation-controller.service';
import { MotionStatuteParagraphControllerService } from '../../../../modules/statute-paragraphs/services/motion-statute-paragraph-controller.service/motion-statute-paragraph-controller.service';
import { MotionControllerService } from '../../../../services/common/motion-controller.service/motion-controller.service';
import { MotionWorkflowControllerService } from '../../../../modules/workflows/services/motion-workflow-controller.service/motion-workflow-controller.service';
import { MotionCategoryControllerService } from '../../../../modules/categories/services/motion-category-controller.service/motion-category-controller.service';
import { MotionBlockControllerService } from '../../../../modules/motion-blocks/services/motion-block-controller.service/motion-block-controller.service';
import { TagControllerService } from '../../../../modules/tags/services/tag-controller.service/tag-controller.service';
import { MotionLineNumberingService } from '../../../../services/common/motion-line-numbering.service/motion-line-numbering.service';
import { MotionDetailViewService } from '../motion-detail-view.service';
import { MotionFormatService } from '../../../../services/common/motion-format.service/motion-format.service';
import { ParticipantControllerService } from 'src/app/site/pages/meetings/pages/participants/services/common/participant-controller.service/participant-controller.service';
import { AmendmentControllerService } from '../../../../services/common/amendment-controller.service';

@Injectable({
    providedIn: MotionDetailServiceModule
})
export class MotionDetailServiceCollectorService {
    public constructor(
        public changeRecoRepo: MotionChangeRecommendationControllerService,
        public participantRepo: ParticipantControllerService,
        public statuteRepo: MotionStatuteParagraphControllerService,
        public motionRepo: MotionControllerService,
        public amendmentRepo: AmendmentControllerService,
        public workflowRepo: MotionWorkflowControllerService,
        public categoryRepo: MotionCategoryControllerService,
        public blockRepo: MotionBlockControllerService,
        public tagRepo: TagControllerService,
        public motionLineNumbering: MotionLineNumberingService,
        public motionViewService: MotionDetailViewService,
        public motionFormatService: MotionFormatService
    ) {}
}
