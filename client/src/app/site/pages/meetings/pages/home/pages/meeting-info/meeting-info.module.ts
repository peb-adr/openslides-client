import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { InfoModule } from 'src/app/site/modules/info';
import { OpenSlidesTranslationModule } from 'src/app/site/modules/translations';
import { DirectivesModule } from 'src/app/ui/directives';
import { HeadBarModule } from 'src/app/ui/modules/head-bar';
import { ListModule } from 'src/app/ui/modules/list';
import { PipesModule } from 'src/app/ui/pipes';

import { CountUsersComponent } from './components/count-users/count-users.component';
import { MeetingInfoComponent } from './components/meeting-info/meeting-info.component';
import { UserStatisticsComponent } from './components/user-statistics/user-statistics.component';
import { MeetingInfoRoutingModule } from './meeting-info-routing.module';

@NgModule({
    declarations: [MeetingInfoComponent, CountUsersComponent, UserStatisticsComponent],
    imports: [
        CommonModule,
        MeetingInfoRoutingModule,
        MatCardModule,
        MatButtonToggleModule,
        HeadBarModule,
        FormsModule,
        ListModule,
        DirectivesModule,
        OpenSlidesTranslationModule.forChild(),
        InfoModule,
        PipesModule
    ]
})
export class MeetingInfoModule {}
