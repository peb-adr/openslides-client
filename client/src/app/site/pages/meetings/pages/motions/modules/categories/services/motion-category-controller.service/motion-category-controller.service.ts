import { Injectable } from '@angular/core';
import { BaseMeetingControllerService } from 'src/app/site/pages/meetings/base/base-meeting-controller.service';
import { ViewMotionCategory } from '../../view-models';
import { MotionCategory } from 'src/app/domain/models/motions/motion-category';
import { MeetingControllerServiceCollectorService } from 'src/app/site/pages/meetings/services/meeting-controller-service-collector.service';
import { MotionCategoryRepositoryService } from 'src/app/gateways/repositories/motions';
import { MotionCategoryCommonServiceModule } from '../../motion-categorie-common-service.module';
import { Identifiable } from 'src/app/domain/interfaces';
import { Ids } from 'src/app/domain/definitions/key-types';
import { TreeIdNode } from 'src/app/infrastructure/definitions/tree';
import { TreeService } from 'src/app/ui/modules/sorting/modules/sorting-tree/services';
import { Observable, map } from 'rxjs';

@Injectable({
    providedIn: MotionCategoryCommonServiceModule
})
export class MotionCategoryControllerService extends BaseMeetingControllerService<ViewMotionCategory, MotionCategory> {
    constructor(
        controllerServiceCollector: MeetingControllerServiceCollectorService,
        protected override repo: MotionCategoryRepositoryService,
        private treeService: TreeService
    ) {
        super(controllerServiceCollector, MotionCategory, repo);
    }

    public override getViewModelList(): ViewMotionCategory[] {
        return this.createCategoriesTree(super.getViewModelList());
    }

    public override getViewModelListObservable(): Observable<ViewMotionCategory[]> {
        return super.getViewModelListObservable().pipe(map(categories => this.createCategoriesTree(categories)));
    }

    public create(...categories: Partial<MotionCategory>[]): Promise<Identifiable[]> {
        return this.repo.create(...categories);
    }

    public update(update: Partial<MotionCategory>, category: Identifiable): Promise<void> {
        return this.repo.update(update, category);
    }

    public delete(category: Identifiable): Promise<void> {
        return this.repo.delete(category);
    }

    public numberMotionsInCategory(category: Identifiable): Promise<void> {
        return this.repo.numberMotionsInCategory(category);
    }

    public sortCategories(tree: TreeIdNode[]): Promise<void> {
        return this.repo.sortCategories(tree);
    }

    public sortMotionsInCategory(category: Identifiable, motionIds: Ids): Promise<void> {
        return this.repo.sortMotionsInCategory(category, motionIds);
    }

    private createCategoriesTree(categories: ViewMotionCategory[]): ViewMotionCategory[] {
        return this.treeService.makeFlatTree(categories, `weight`, `parent_id`);
    }
}
