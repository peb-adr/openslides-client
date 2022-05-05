import { Component, Inject, OnInit, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ChoiceAnswer, ChoiceDialogConfig } from '../../definitions';

@Component({
    selector: 'os-choice-dialog',
    templateUrl: './choice-dialog.component.html',
    styleUrls: ['./choice-dialog.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class ChoiceDialogComponent {
    /**
     * One number selected, if this is a single select choice
     * User over template
     */
    public selectedChoice: number | null | undefined = undefined;

    /**
     * Form to hold the selection
     */
    public selectForm: FormGroup;

    /**
     * Checks if there is something selected
     *
     * @returns true if there is a selection chosen
     */
    public get hasSelection(): boolean {
        if (this.data && this.data.choices) {
            const formControl = this.selectForm.get(`select`);
            if (formControl) {
                return !!formControl.value || !!formControl.value?.length;
            } else {
                return false;
            }
        } else {
            return true;
        }
    }

    /**
     * All selected ids, if this is a multiselect choice
     */
    public selectedMultiChoices: number[] = [];

    public constructor(
        public dialogRef: MatDialogRef<ChoiceDialogComponent, ChoiceAnswer>,
        private formBuilder: FormBuilder,
        @Inject(MAT_DIALOG_DATA) public readonly data: ChoiceDialogConfig
    ) {
        this.selectForm = this.formBuilder.group({
            select: []
        });
    }

    /**
     * Closes the dialog with the selected choices
     */
    public closeDialog(ok: boolean, action?: string): void {
        if (!this.data.multiSelect && this.selectedChoice === null) {
            action = this.data.clearChoiceOption;
        }
        if (ok) {
            const resultValue = this.selectForm.get(`select`)?.value;
            this.dialogRef.close({
                action: action ? action : null,
                items: resultValue
            });
        } else {
            this.dialogRef.close();
        }
    }
}
