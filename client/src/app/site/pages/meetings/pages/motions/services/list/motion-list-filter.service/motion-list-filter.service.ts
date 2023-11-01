import { Injectable } from '@angular/core';
import { marker as _ } from '@colsen1991/ngx-translate-extract-marker';
import { TranslateService } from '@ngx-translate/core';
import { Id } from 'src/app/domain/definitions/key-types';
import { Permission } from 'src/app/domain/definitions/permission';
import { Restriction } from 'src/app/domain/models/motions/motion-state';
import { AmendmentType } from 'src/app/domain/models/motions/motions.constants';
import { OsFilter, OsFilterOption, OsFilterOptions } from 'src/app/site/base/base-filter.service';
import { BaseMeetingFilterListService } from 'src/app/site/pages/meetings/base/base-meeting-filter-list.service';
import { MeetingActiveFiltersService } from 'src/app/site/pages/meetings/services/meeting-active-filters.service';
import { MeetingSettingsService } from 'src/app/site/pages/meetings/services/meeting-settings.service';
import { OperatorService } from 'src/app/site/services/operator.service';

import { MotionCategoryControllerService } from '../../../modules/categories/services';
import { MotionCommentSectionControllerService } from '../../../modules/comments/services';
import { MotionBlockControllerService } from '../../../modules/motion-blocks/services';
import { TagControllerService } from '../../../modules/tags/services';
import { MotionWorkflowControllerService } from '../../../modules/workflows/services';
import { ForwardingStatus, ViewMotion } from '../../../view-models';
import { MotionsListServiceModule } from '../motions-list-service.module';

/**
 * Filter description to easier parse dynamically occurring workflows
 */
interface WorkflowFilterDesc {
    name: string;
    filter: OsFilterOption[];
}

interface WorkflowConfiguration {
    statuteEnabled: boolean;
    statute: Id | null;
    motion: Id | null;
    amendment: Id | null;
}

/**
 * Filter the motion list
 */
@Injectable({
    providedIn: MotionsListServiceModule
})
export class MotionListFilterService extends BaseMeetingFilterListService<ViewMotion> {
    /**
     * set the storage key name
     */
    protected storageKey = `MotionList`;

    /**
     * Listen to the configuration for change in defined/used workflows
     */
    protected enabledWorkflows: WorkflowConfiguration = {
        statuteEnabled: false,
        statute: null,
        motion: null,
        amendment: null
    };

    /**
     * Determine to show amendments in the motion list
     */
    private showAmendmentsInMainTable = false;

    /**
     * Filter definitions for the workflow filter. Options will be generated by
     * getFilterOptions (as the workflows available may change)
     */
    private stateFilterOptions: OsFilter<ViewMotion> = {
        property: `state_id`,
        label: _(`State`),
        options: []
    };

    private categoryFilterOptions: OsFilter<ViewMotion> = {
        property: `category_id`,
        label: _(`Category`),
        options: []
    };

    private motionBlockFilterOptions: OsFilter<ViewMotion> = {
        property: `block_id`,
        label: _(`Motion block`),
        options: []
    };

    private motionCommentFilterOptions: OsFilter<ViewMotion> = {
        property: `usedCommentSectionIds`,
        label: _(`Comment`),
        options: []
    };

    private recommendationFilterOptions: OsFilter<ViewMotion> = {
        property: `recommendation_id`,
        label: _(`Recommendation`),
        options: []
    };

    private tagFilterOptions: OsFilter<ViewMotion> = {
        property: `tag_ids`,
        label: _(`Tags`),
        options: []
    };

    private hasSpeakerOptions: OsFilter<ViewMotion> = {
        property: `hasSpeakers`,
        label: _(`Speakers`),
        options: [
            { condition: true, label: _(`Has speakers`) },
            { condition: [false, null], label: _(`Has no speakers`) }
        ]
    };

    private AmendmentFilterOption: OsFilter<ViewMotion> = {
        property: `amendmentType`,
        label: _(`Amendment`),
        options: [
            { condition: AmendmentType.Amendment, label: _(`Is amendment`) },
            { condition: AmendmentType.Parent, label: _(`Has amendments`) },
            { condition: AmendmentType.Lead, label: _(`Is no amendment and has no amendments`) }
        ]
    };

    private personalNoteFilterOptions: any[] = [
        {
            property: `isFavorite`,
            label: _(`Favorites`),
            options: [
                {
                    condition: true,
                    label: _(`Is favorite`)
                },
                {
                    condition: [false, null],
                    label: _(`Is not favorite`)
                }
            ]
        },
        {
            property: `hasNotes`,
            label: _(`Personal notes`),
            options: [
                {
                    condition: true,
                    label: _(`Has notes`)
                },
                {
                    condition: [false, null],
                    label: _(`Does not have notes`)
                }
            ]
        }
    ];

    private forwardingFilterOptions: OsFilter<ViewMotion> = {
        property: `forwardingStatus`,
        label: _(`Forwarding`),
        options: [
            {
                condition: [ForwardingStatus.wasForwarded, ForwardingStatus.both],
                label: _(`Has forwardings`)
            },
            {
                condition: [ForwardingStatus.isDerived, ForwardingStatus.both],
                label: _(`Was forwarded to this meeting`)
            },
            {
                condition: ForwardingStatus.none,
                label: _(`No forwardings`)
            }
        ]
    };

    public constructor(
        store: MeetingActiveFiltersService,
        categoryRepo: MotionCategoryControllerService,
        motionBlockRepo: MotionBlockControllerService,
        commentRepo: MotionCommentSectionControllerService,
        tagRepo: TagControllerService,
        private workflowRepo: MotionWorkflowControllerService,
        protected translate: TranslateService,
        private operator: OperatorService,
        private meetingSettingsService: MeetingSettingsService
    ) {
        super(store);
        this.getWorkflowConfig();
        this.getShowAmendmentConfig();

        this.updateFilterForRepo({
            repo: categoryRepo,
            filter: this.categoryFilterOptions,
            noneOptionLabel: _(`No category set`)
        });

        this.updateFilterForRepo({
            repo: motionBlockRepo,
            filter: this.motionBlockFilterOptions,
            noneOptionLabel: _(`No motion block set`)
        });

        this.updateFilterForRepo({
            repo: commentRepo,
            filter: this.motionCommentFilterOptions,
            noneOptionLabel: _(`No comment`)
        });

        this.updateFilterForRepo({
            repo: tagRepo,
            filter: this.tagFilterOptions,
            noneOptionLabel: _(`No tags`)
        });

        this.subscribeWorkflows();
        this.operator.operatorUpdated.subscribe(() => {
            this.updateFilterDefinitions();
        });
    }

    /**
     * @override
     * @param motions The motions without amendments, if the according config was set
     */
    protected override preFilter(motions: ViewMotion[]): ViewMotion[] {
        if (!this.showAmendmentsInMainTable) {
            return motions.filter(motion => !motion.lead_motion_id);
        }
        return motions;
    }

    /**
     * Listen to changes for the 'motions_amendments_main_table' config value
     */
    private getShowAmendmentConfig(): void {
        this.meetingSettingsService.get(`motions_amendments_in_main_list`).subscribe(show => {
            this.showAmendmentsInMainTable = show;
        });
    }

    private getWorkflowConfig(): void {
        this.meetingSettingsService.get(`motions_default_statute_amendment_workflow_id`).subscribe(id => {
            this.enabledWorkflows.statute = +id;
        });

        this.meetingSettingsService.get(`motions_default_workflow_id`).subscribe(id => {
            this.enabledWorkflows.motion = +id;
        });

        this.meetingSettingsService.get(`motions_default_amendment_workflow_id`).subscribe(id => {
            this.enabledWorkflows.amendment = +id;
        });

        this.meetingSettingsService.get(`motions_statutes_enabled`).subscribe(bool => {
            this.enabledWorkflows.statuteEnabled = bool;
        });
    }

    /**
     * @returns the filter definition
     */
    protected getFilterDefinitions(): OsFilter<ViewMotion>[] {
        let filterDefinitions = [
            this.stateFilterOptions,
            this.categoryFilterOptions,
            this.motionBlockFilterOptions,
            this.recommendationFilterOptions,
            this.motionCommentFilterOptions,
            this.tagFilterOptions,
            this.forwardingFilterOptions
        ];

        // only add the filter if the user has the correct permission
        if (this.operator.hasPerms(Permission.listOfSpeakersCanSee)) {
            filterDefinitions.push(this.hasSpeakerOptions);
        }

        if (this.showAmendmentsInMainTable) {
            filterDefinitions.push(this.AmendmentFilterOption);
        }

        if (!this.operator.isAnonymous) {
            filterDefinitions = filterDefinitions.concat(this.personalNoteFilterOptions);
        }

        return filterDefinitions;
    }

    /**
     * Subscribes to changing Workflows, and updates the state and recommendation filters accordingly.
     */
    private subscribeWorkflows(): void {
        this.workflowRepo.getViewModelListObservable().subscribe(workflows => {
            if (!workflows || !workflows.length) {
                return;
            }
            const workflowFilters: WorkflowFilterDesc[] = [];
            const recoFilters: WorkflowFilterDesc[] = [];

            const finalStates: number[] = [];
            const nonFinalStates: number[] = [];

            // get all relevant information
            for (const workflow of workflows) {
                if (this.isWorkflowEnabled(workflow.id)) {
                    workflowFilters.push({
                        name: workflow.name,
                        filter: []
                    });

                    recoFilters.push({
                        name: workflow.name,
                        filter: []
                    });

                    for (const state of workflow.states.sort((a, b) =>
                        a.weight && b.weight ? a.weight - b.weight : 0
                    )) {
                        // get the restriction array, but remove the is_submitter condition, if present
                        const restrictions = state.restrictions?.filter(
                            r => r !== Restriction.motionsIsSubmitter
                        ) as unknown as Permission[];

                        if (!restrictions || !restrictions.length || this.operator.hasPerms(...restrictions)) {
                            // sort final and non final states
                            if (state.isFinalState) {
                                finalStates.push(state.id);
                            } else {
                                nonFinalStates.push(state.id);
                            }

                            workflowFilters[workflowFilters.length - 1].filter.push({
                                condition: state.id,
                                label: state.name
                            });

                            if (state.recommendation_label) {
                                recoFilters[workflowFilters.length - 1].filter.push({
                                    condition: state.id,
                                    label: state.recommendation_label
                                });
                            }
                        }
                    }
                }
            }

            this.setStateFilters(workflowFilters, finalStates, nonFinalStates);
            this.setRecommendationFilters(recoFilters);
            this.updateFilterDefinitions();
        });
    }

    private setStateFilters(workflowFilters: WorkflowFilterDesc[], finalStates: Id[], nonFinalStates: Id[]): void {
        // convert to filter options
        if (!workflowFilters || !workflowFilters.length) {
            return;
        }
        let workflowOptions: OsFilterOptions = [];
        // add "done" and "undone"
        workflowOptions.push({
            label: _(`Done`),
            condition: finalStates
        });
        workflowOptions.push({
            label: _(`Undone`),
            condition: nonFinalStates
        });
        workflowOptions.push(`-`);

        for (const filterDef of workflowFilters) {
            workflowOptions.push(filterDef.name);
            workflowOptions = workflowOptions.concat(filterDef.filter);
        }

        this.stateFilterOptions.options = workflowOptions;
    }

    private setRecommendationFilters(recoFilters: WorkflowFilterDesc[]): void {
        if (!recoFilters || !recoFilters.length) {
            return;
        }
        let recoOptions: OsFilterOptions = [];

        for (const filterDef of recoFilters) {
            recoOptions.push(filterDef.name);
            recoOptions = recoOptions.concat(filterDef.filter);
        }

        recoOptions.push(`-`);
        recoOptions.push({
            label: _(`No recommendation`),
            condition: null
        });
        this.recommendationFilterOptions.options = recoOptions;
    }

    protected isWorkflowEnabled(workflowId: number): boolean {
        return (
            workflowId === this.enabledWorkflows.motion ||
            (this.enabledWorkflows.statuteEnabled && workflowId === this.enabledWorkflows.statute)
        );
    }
}
