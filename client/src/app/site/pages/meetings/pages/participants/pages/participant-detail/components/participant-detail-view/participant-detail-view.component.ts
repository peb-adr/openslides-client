import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { ViewUser, PERSONAL_FORM_CONTROLS } from 'src/app/site/pages/meetings/view-models/view-user';
import { ViewGroup } from 'src/app/site/pages/meetings/pages/participants';
import { Id } from 'src/app/domain/definitions/key-types';
import { Permission } from 'src/app/domain/definitions/permission';
import { TranslateService } from '@ngx-translate/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
    ParticipantControllerService,
    MEETING_RELATED_FORM_CONTROLS
} from 'src/app/site/pages/meetings/pages/participants/services/common/participant-controller.service';
import { OperatorService } from 'src/app/site/services/operator.service';
import { PromptService } from 'src/app/ui/modules/prompt-dialog';
import { GroupControllerService } from '../../../../modules';
import { UserService } from 'src/app/site/services/user.service';
import { BaseMeetingComponent } from 'src/app/site/pages/meetings/base/base-meeting.component';
import { MeetingComponentServiceCollectorService } from 'src/app/site/pages/meetings/services/meeting-component-service-collector.service';
import { ParticipantPdfExportService } from '../../../../export/participant-pdf-export.service';
import { OrganizationSettingsService } from 'src/app/site/pages/organization/services/organization-settings.service';

@Component({
    selector: 'os-participant-detail-view',
    templateUrl: './participant-detail-view.component.html',
    styleUrls: ['./participant-detail-view.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ParticipantDetailViewComponent extends BaseMeetingComponent {
    public readonly additionalFormControls = MEETING_RELATED_FORM_CONTROLS.mapToObject(controlName => ({
        [controlName]: [``]
    }));

    public get randomPasswordFn(): () => string {
        return () => this.getRandomPassword();
    }

    public get isAllowedFn(): (permission: string) => boolean {
        return permission => this.isAllowed(permission);
    }

    public get patchFormValueFn(): (controlName: string, user?: ViewUser) => any | null {
        return (controlName, user) => {
            if (controlName === `is_present` && user) {
                return user.isPresentInMeeting();
            }
            const value = user?.[controlName as keyof ViewUser] || null;
            return typeof value === `function` ? value.bind(user)(this.activeMeetingId!) : value;
        };
    }

    public get shouldEnableFormControlFn(): (controlName: string) => boolean {
        return controlName => {
            const canManageUsers = this.isAllowed(`manage`);
            if (canManageUsers) {
                if (this._isUserInScope || this.newUser) {
                    return true;
                } else {
                    return MEETING_RELATED_FORM_CONTROLS.includes(controlName);
                }
            } else {
                return PERSONAL_FORM_CONTROLS.includes(controlName);
            }
        };
    }

    public isFormValid = false;
    public personalInfoFormValue: any = {};
    public formErrors: { [name: string]: boolean } | null = null;

    /**
     * if this is the own page
     */
    public ownPage = false;

    /**
     * Editing a user
     */
    public readonly isEditingSubject = new BehaviorSubject<boolean>(false);

    /**
     * True if a new user is created
     */
    public newUser = false;

    /**
     * ViewUser model
     */
    public user: ViewUser | null = null;

    public get usersGroups(): ViewGroup[] {
        return this.user?.groups() || [];
    }

    /**
     * Contains all groups, except for the default group.
     */
    public readonly groups: Observable<ViewGroup[]>;

    public readonly users: Observable<ViewUser[]>;

    public get showVoteWeight(): boolean {
        const isVoteWeightEnabled = this._isElectronicVotingEnabled && this._isVoteWeightEnabled;
        return this.user ? isVoteWeightEnabled && typeof this.user.vote_weight() === `number` : isVoteWeightEnabled;
    }

    private _userId: Id | undefined = undefined; // Not initialized
    private _isVoteWeightEnabled: boolean = false;
    private _isElectronicVotingEnabled: boolean = false;
    private _isUserInScope: boolean = false;

    public constructor(
        componentServiceCollector: MeetingComponentServiceCollectorService,
        translate: TranslateService,
        private route: ActivatedRoute,
        public repo: ParticipantControllerService,
        private operator: OperatorService,
        private promptService: PromptService,
        private pdfService: ParticipantPdfExportService,
        private groupRepo: GroupControllerService,
        private userService: UserService,
        private cd: ChangeDetectorRef,
        private organizationSettingsService: OrganizationSettingsService
    ) {
        super(componentServiceCollector, translate);
        this.getUserByUrl();

        this.subscriptions.push(
            this.organizationSettingsService
                .get(`enable_electronic_voting`)
                .subscribe(is => (this._isElectronicVotingEnabled = is)),

            this.meetingSettingsService
                .get(`users_enable_vote_weight`)
                .subscribe(enabled => (this._isVoteWeightEnabled = enabled))
        );

        this.groups = this.groupRepo.getViewModelListWithoutDefaultGroupObservable();
        this.users = this.repo.getViewModelListObservable();
    }

    public isAllowed(action: string): boolean {
        return this.userService.isAllowed(action, this.ownPage);
    }

    private getUserByUrl(): void {
        if (this.route.snapshot.url[0] && this.route.snapshot.url[0].path === `new`) {
            super.setTitle(`New participant`);
            this.newUser = true;
            this.setEditMode(true);
        } else {
            this.subscriptions.push(
                combineLatest([this.route.params, this.activeMeetingIdService.meetingIdObservable]).subscribe(
                    async ([params, _]) => {
                        if (params['id']) {
                            this._userId = +params['id'];
                        }
                        if (this._userId) {
                            await this.loadUserById();
                        }
                    }
                )
            );
        }
    }

    private async loadUserById(): Promise<void> {
        this.subscriptions.push(
            this.repo.getViewModelObservable(this._userId!).subscribe(user => {
                if (user) {
                    const title = user.getTitle();
                    super.setTitle(title);
                    this.user = user;
                    this.cd.markForCheck();
                }
            }),
            this.operator.operatorUpdated.subscribe(
                async () => (this._isUserInScope = await this.userService.isUserInSameScope(this._userId!))
            )
        );
    }

    public getRandomPassword(): string {
        return this.repo.getRandomPassword();
    }

    /**
     * clicking Shift and Enter will save automatically
     *
     * @param event has the code
     */
    public onKeyDown(event: KeyboardEvent): void {
        if (event.key === `Enter` && event.shiftKey) {
            this.saveUser();
        }
    }

    public getSaveAction(): () => Promise<void> {
        return () => this.saveUser();
    }

    /**
     * Save / Submit a user
     */
    public async saveUser(): Promise<void> {
        if (!this.isFormValid) {
            this.checkFormForErrors();
            return;
        }

        try {
            await this.createOrUpdateUser();
        } catch (e) {
            this.raiseError(e);
        }
    }

    private async createOrUpdateUser(): Promise<void> {
        if (this.newUser) {
            await this.createUser();
        } else {
            await this.updateUser();
        }
    }

    /**
     * sets editUser variable and editable form
     * @param edit
     */
    public async setEditMode(edit: boolean): Promise<void> {
        if (!this.newUser && edit) {
            this._isUserInScope = await this.userService.isUserInSameScope(this._userId!);
        }

        this.isEditingSubject.next(edit);

        // case: abort creation of a new user
        if (this.newUser && !edit) {
            this.goToAllUsers();
        }
    }

    /**
     * click on the delete user button
     */
    public async deleteUserButton(): Promise<void> {
        if (await this.repo.removeUsersFromMeeting([this.user!])) {
            this.goToAllUsers();
        }
    }

    /**
     * navigate to the change Password site
     */
    public changePassword(): void {
        this.router.navigate([this.activeMeetingId, `participants`, `password`, this.user!.id]);
    }

    /**
     * Triggers the pdf download for this user
     */
    public onDownloadPdf(): void {
        this.pdfService.exportAccessDocuments(this.user!);
    }

    /**
     * (Re)- send an invitation email for this user after confirmation
     */
    public async sendInvitationEmail(): Promise<void> {
        const title = this.translate.instant(`Sending an invitation email`);
        const content = this.translate.instant(`Are you sure you want to send an invitation email to the user?`);
        if (await this.promptService.open(title, content)) {
            this.repo.sendInvitationEmails([this.user!]).then(this.raiseError, this.raiseError);
        }
    }

    /**
     * Fetches a localized string for the time the last email was sent.
     *
     * @returns a translated string with either the localized date/time; of 'No email sent'
     */
    public getEmailSentTime(): string {
        if (!this.user?.isLastEmailSend) {
            return this.translate.instant(`No email sent`);
        }
        return this.repo.getLastSentEmailTimeString(this.user);
    }

    private async createUser(): Promise<void> {
        const partialUser = { ...this.personalInfoFormValue };

        if (partialUser.is_present) {
            partialUser.is_present_in_meeting_ids = [this.activeMeetingId];
        }
        this.checkForGroups(partialUser);

        await this.repo.create(partialUser);
        this.goToAllUsers();
    }

    private async updateUser(): Promise<void> {
        if (this.operator.hasPerms(Permission.userCanManage)) {
            this.checkForGroups(this.personalInfoFormValue);
            const isPresent = this.personalInfoFormValue.is_present || false;
            await this.repo
                .update(this.personalInfoFormValue, this.user!)
                .concat(this.repo.setPresent(isPresent, this.user!))
                .resolve();
        } else {
            await this.repo.updateSelf(this.personalInfoFormValue, this.user!);
        }
        this.setEditMode(false);
    }

    private checkForGroups(user: any): void {
        if (!user?.group_ids.length) {
            const defaultGroupId = this.activeMeetingService.meeting!.default_group_id;
            user.group_ids = [defaultGroupId];
        }
    }

    private checkFormForErrors(): void {
        let hint = ``;
        if (this.formErrors) {
            hint = `At least one of username, first name or last name has to be set.`;
        }
        this.raiseError(this.translate.instant(hint));
    }

    private goToAllUsers(): void {
        this.router.navigate([this.activeMeetingId, `users`]);
    }
}
