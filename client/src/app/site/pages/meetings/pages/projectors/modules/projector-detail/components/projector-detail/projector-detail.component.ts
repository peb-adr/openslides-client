import { Component, OnInit } from '@angular/core';
import { ViewProjector, ViewProjectorCountdown, ViewProjectorMessage } from '../../../../view-models';
import { BaseMeetingComponent } from 'src/app/site/pages/meetings/base/base-meeting.component';
import { Observable, map, switchMap } from 'rxjs';
import { ScrollScaleDirection } from 'src/app/gateways/repositories/projectors/projector.action';
import { Id } from 'src/app/domain/definitions/key-types';
import { MeetingComponentServiceCollectorService } from 'src/app/site/pages/meetings/services/meeting-component-service-collector.service';
import { TranslateService } from '@ngx-translate/core';
import { ActivatedRoute } from '@angular/router';
import { DurationService } from 'src/app/site/services/duration.service';
import { PromptService } from 'src/app/ui/modules/prompt-dialog';
import { OperatorService } from 'src/app/site/services/operator.service';
import { ProjectorControllerService } from 'src/app/site/pages/meetings/pages/projectors/services/projector-controller.service';
import { ProjectorCountdownControllerService } from '../../services/projector-countdown-controller.service';
import { ProjectorMessageControllerService } from '../../services/projector-message-controller.service';
import { Permission } from 'src/app/domain/definitions/permission';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { ViewProjection } from 'src/app/site/pages/meetings/pages/projectors';
import { ProjectorEditDialogService } from '../../../../components/projector-edit-dialog/services/projector-edit-dialog.service';
import { ProjectorMessageDialogService } from '../../../../components/projector-message-dialog';
import { ProjectorCountdownDialogService } from '../../../../components/projector-countdown-dialog';
import { GridTileDimension } from 'src/app/ui/modules/grid';
import { CurrentListOfSpeakersSlideService } from '../../../../../agenda/modules/list-of-speakers/services/current-list-of-speakers-slide.service';
import { ProjectionControllerService } from '../../services/projection-controller.service';
import { CurrentSpeakerChyronSlideService } from '../../services/current-speaker-chyron-slide.service';

/**
 * The projector detail view.
 */
@Component({
    selector: `os-projector-detail`,
    templateUrl: `./projector-detail.component.html`,
    styleUrls: [`./projector-detail.component.scss`]
})
export class ProjectorDetailComponent extends BaseMeetingComponent implements OnInit {
    public readonly COLLECTION = ViewProjector.COLLECTION;

    /**
     * The projector to show.
     */
    public projector!: ViewProjector;

    public projectorObservable: Observable<ViewProjector | null> | null = null;

    public scrollScaleDirection = ScrollScaleDirection;

    public countdowns: ViewProjectorCountdown[] = [];

    public messages: ViewProjectorMessage[] = [];

    public projectorCount: number = 0;

    /**
     * Defines the used sizes for different devices for the left column.
     */
    public projectorTileSizeLeft: GridTileDimension = { medium: 8, large: 10 };

    /**
     * Defines the used sizes for different devices for the right column.
     */
    public projectorTileSizeRight: GridTileDimension = { medium: 4, large: 6 };

    /**
     * true if the queue might be altered
     */
    public editQueue = false;

    private _projectorId: Id | null = null;

    public constructor(
        componentServiceCollector: MeetingComponentServiceCollectorService,
        translate: TranslateService,
        private repo: ProjectorControllerService,
        private projectionRepo: ProjectionControllerService,
        private countdownRepo: ProjectorCountdownControllerService,
        private messageRepo: ProjectorMessageControllerService,
        private currentListOfSpeakersSlideService: CurrentListOfSpeakersSlideService,
        private currentSpeakerChyronService: CurrentSpeakerChyronSlideService,
        private projectorEditDialog: ProjectorEditDialogService,
        private projectorMessageDialog: ProjectorMessageDialogService,
        private projectorCountdownDialog: ProjectorCountdownDialogService,
        private route: ActivatedRoute,
        private durationService: DurationService,
        private promptService: PromptService,
        private operator: OperatorService
    ) {
        super(componentServiceCollector, translate);

        this.subscriptions.push(
            this.countdownRepo.getViewModelListObservable().subscribe(countdowns => (this.countdowns = countdowns)),
            this.messageRepo.getViewModelListObservable().subscribe(messages => (this.messages = messages)),
            this.repo.getViewModelListObservable().subscribe(projectors => (this.projectorCount = projectors.length))
        );
    }

    /**
     * Gets the projector and subscribes to it.
     */
    public ngOnInit(): void {
        const projectorId$ = this.route.params.pipe(map(params => parseInt(params[`id`], 10) || 1));
        this.projectorObservable = projectorId$.pipe(
            switchMap(projectorId => this.repo.getViewModelObservable(projectorId))
        );
    }

    public onIdFound(id: Id | null): void {
        if (id) {
            this._projectorId = id;
            this.setupSubscription();
        }
    }

    public async editProjector(): Promise<void> {
        const dialogRef = await this.projectorEditDialog.open(this.projector);
        dialogRef.afterClosed().subscribe(update => {
            if (this.projector && update) {
                this.repo.update(update, this.projector);
            }
        });
    }

    /**
     * Handler to set the selected projector as the meeting reference projector
     */
    public setProjectorAsReference(): void {
        this.repo.setReferenceProjector(this.projector);
    }

    /**
     * Handler for the delete Projector button
     * TODO: same with projector list entry
     */
    public async onDeleteProjectorButton(): Promise<void> {
        const title = this.translate.instant(`Are you sure you want to delete this projector?`);
        if (this.projector && (await this.promptService.open(title, this.projector.name))) {
            this.repo.delete(this.projector);
        }
    }

    /**
     * @returns true if the operator can manage
     */
    public canManage(): boolean {
        return this.operator.hasPerms(Permission.projectorCanManage);
    }

    /**
     * Change the scroll
     *
     * @param direction The direction to send.
     * @param step (optional) The amount of steps to make.
     */
    public scroll(direction: ScrollScaleDirection, step: number = 1): void {
        this.repo.scroll(this.projector, direction, step);
    }

    /**
     * Change the scale
     *
     * @param direction The direction to send.
     * @param step (optional) The amount of steps to make.
     */
    public scale(direction: ScrollScaleDirection, step: number = 1): void {
        this.repo.scale(this.projector, direction, step);
    }

    public async projectNextSlide(): Promise<void> {
        await this.repo.next(this.projector);
    }

    public async projectPreviousSlide(): Promise<void> {
        await this.repo.previous(this.projector);
    }

    public onSortingChange(event: CdkDragDrop<ViewProjection>): void {
        const ids = this.projector.preview_projections.map(projection => projection.id);
        moveItemInArray(ids, event.previousIndex, event.currentIndex);
        this.repo.sortPreview(this.projector, ids);
    }

    public deleteProjection(projection: ViewProjection): void {
        this.projectionRepo.delete(projection);
    }

    public projectPreview(projection: ViewProjection): void {
        this.repo.projectPreview(projection);
    }

    public unprojectCurrent(projection: ViewProjection): void {
        this.repo.toggle(projection.getProjectionBuildDescriptor(), [this.projector!]);
    }

    public isClosProjected(overlay: boolean): boolean {
        return this.currentListOfSpeakersSlideService.isProjectedOn(this.projector, overlay);
    }

    public toggleClos(overlay: boolean): void {
        this.currentListOfSpeakersSlideService.toggleOn(this.projector, overlay);
    }

    public isChyronProjected(): boolean {
        return this.currentSpeakerChyronService.isProjectedOn(this.projector);
    }

    public toggleChyron(): void {
        this.currentSpeakerChyronService.toggleOn(this.projector);
    }

    public async createProjectorCountdown(): Promise<void> {
        const dialogRef = await this.projectorCountdownDialog.open({ count: this.countdowns.length });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                const defaultTime = this.durationService.stringToDuration(result.duration, `m`);
                const countdown = {
                    meeting_id: this.activeMeetingId,
                    title: result.title,
                    description: result.description,
                    default_time: defaultTime
                };
                this.countdownRepo.create(countdown);
            }
        });
    }

    public async createProjectorMessage(): Promise<void> {
        const dialogRef = await this.projectorMessageDialog.open();

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                const message = {
                    meeting_id: this.activeMeetingId,
                    message: result.message
                };
                this.messageRepo.create(message);
            }
        });
    }

    private setupSubscription(): void {
        this.subscriptions.push(
            this.repo.getViewModelObservable(this._projectorId!).subscribe(projector => {
                if (projector) {
                    const title = projector.name;
                    super.setTitle(title);
                    this.projector = projector;
                }
            })
        );
    }
}
