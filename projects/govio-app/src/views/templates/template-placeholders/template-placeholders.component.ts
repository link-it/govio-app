import { Component, HostListener, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { AbstractControl, UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';

import { TranslateService } from '@ngx-translate/core';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';

import { YesnoDialogBsComponent } from 'projects/components/src/lib/dialogs/yesno-dialog-bs/yesno-dialog-bs.component';

import { ConfigService } from 'projects/tools/src/lib/config.service';
import { EventsManagerService } from 'projects/tools/src/lib/eventsmanager.service';
import { OpenAPIService } from 'projects/govio-app/src/services/openAPI.service';

@Component({
  selector: 'app-template-placeholders',
  templateUrl: 'template-placeholders.component.html',
  styleUrls: ['template-placeholders.component.scss']
})
export class TemplatePlaceholdersComponent implements OnInit, OnDestroy {

  @Input() id: number | null = null;

  config: any;

  templatePlaceholders: any[] = [];
  _origTemplatePlaceholders: any[] = [];
  page: any = {};
  _links: any = {};

  _isEdit: boolean = false;
  _isNew: boolean = false;
  _editPlaceholders: boolean = false;
  _modifiedPlaceholders: boolean = false;
  _createPlaceholder: boolean = false;

  _formGroup: UntypedFormGroup = new UntypedFormGroup({});

  _spin: boolean = false;

  _message: string = 'APP.MESSAGE.NoResults';
  _messageHelp: string = 'APP.MESSAGE.NoResultsHelp';

  _error: boolean = false;

  placeholdersConfig: any = null;

  _modalConfirmRef!: BsModalRef;

  _flexList: boolean = true;

  constructor(
    private translate: TranslateService,
    private modalService: BsModalService,
    private configService: ConfigService,
    private eventsManagerService: EventsManagerService,
    public apiService: OpenAPIService
  ) {
  }

  ngOnInit() {
    this._loadTemplatePlaceholders();

    this.configService.getConfig('placeholders').subscribe(
      (config: any) => {
        this.placeholdersConfig = config;
      }
    );
  }

  ngOnDestroy() {
  }

  refresh() {
    this._loadTemplatePlaceholders();
  }

  _setErrorMessages(error: boolean) {
    this._error = error;
    if (this._error) {
      this._message = 'APP.MESSAGE.ERROR.Default';
      this._messageHelp = 'APP.MESSAGE.ERROR.DefaultHelp';
    } else {
      this._message = 'APP.MESSAGE.NoResults';
      this._messageHelp = 'APP.MESSAGE.NoResultsHelp';
    }
  }

  _loadTemplatePlaceholders(query: any = null, url: string = '') {
    this._setErrorMessages(false);
    if (this.id) {
      this._spin = true;
      // if (!url) { this.templatePlaceholders = []; }
      this.apiService.getList(`templates/${this.id}/placeholders?embed=placeholder`).subscribe({
        next: (response: any) => {
          this.templatePlaceholders = response.items ? JSON.parse(JSON.stringify(response.items)) : null;
          this._origTemplatePlaceholders = response.items ? JSON.parse(JSON.stringify(response.items)) : null;
          if (this.templatePlaceholders && !this.templatePlaceholders.length) {
            this._isEdit = false;
            this._isNew = false;
            this._createPlaceholder = false;
            this._editPlaceholders = false;
            this._modifiedPlaceholders = false;
            this._createPlaceholder = false;
          }
          this._spin = false;
        },
        error: (error: any) => {
          this._setErrorMessages(true);
          this._spin = false;
        }
      });
    }
  }

  _onNew() {
    this._isNew = true;
    this._isEdit = true;
    this._createPlaceholder = false;
    setTimeout(() => {
      this.scrollTo('edit-container');
    }, 400); 
  }

  _onSave(event: any) {
    this._isEdit = false;
    this._isNew = false;
    this._createPlaceholder = false;
    this.refresh();
  }

  _onDelete(event: any) {
    const _pId = event.item?._embedded?.placeholder.id || event._embedded?.placeholder.id;

    const initialState = {
      title: this.translate.instant('APP.TITLE.Attention'),
      messages: [
        this.translate.instant('APP.MESSAGE.AreYouSure')
      ],
      cancelText: this.translate.instant('APP.BUTTON.Cancel'),
      confirmText: this.translate.instant('APP.BUTTON.Confirm'),
      confirmColor: 'danger'
    };

    this._modalConfirmRef = this.modalService.show(YesnoDialogBsComponent, {
      ignoreBackdropClick: true,
      initialState: initialState
    });
    this._modalConfirmRef.content.onClose.subscribe(
      (response: any) => {
        if (response) {
          this._spin = true;
          this.apiService.deleteElementRelated('templates', this.id, `placeholders/${_pId}`).subscribe({
            next: (response: any) => {
              this.refresh();
              this._spin = false;
            },
            error: (e: any) => {
              this._setErrorMessages(true);
              this._spin = false;
            }
          });
        }
      }
    );
  }

  _onClose(event: any) {
    this._isEdit = false;
    this._isNew = false;
    this._createPlaceholder = false;
  }

  _onEditPlaceholders(event: any) {
    this._editPlaceholders = !this._editPlaceholders;
    if (!this._editPlaceholders && this._modifiedPlaceholders) {
      this.templatePlaceholders = JSON.parse(JSON.stringify(this._origTemplatePlaceholders));
    }
    if (!this._editPlaceholders) {
      this._modifiedPlaceholders = false;
      this._isEdit = false;
      this._isNew = false;    
      this._createPlaceholder = false;
    }
  }

  _onSavePlaceholders(event: any) {
    const newSorting: any = { items: [] };
    this.templatePlaceholders.forEach((item: any, index: number) => {
      newSorting.items.push({
        placeholder_id: item.placeholder_id,
        position: index + 1,
        mandatory: item.mandatory
      });
    });
    this.apiService.putElementRelated('templates', this.id, 'placeholders', newSorting).subscribe(
      (response: any) => {
        this.refresh();
        this._editPlaceholders = false;
      },
      (error: any) => {
        console.log('sorting error', error);
      }
    );
  }

  drop(event: any) {
    moveItemInArray(this.templatePlaceholders, event.previousIndex, event.currentIndex);
    if (event.previousIndex !== event.currentIndex) {
      this._modifiedPlaceholders = true;
      this.templatePlaceholders.map((item: any, index: number) => {
        item.position = index + 1;
        return item;
      });
      }
  }

  _onCreatePlcaholder() {
    this._createPlaceholder = true;
    this._isEdit = false;
    this._isNew = false;
  }

  onChangeMandatory(event: any, placeholder: any) {
    this._modifiedPlaceholders = true;
  }

  // ScrollTo

  scrollTo(id: string) {
    const box = document.querySelector('.container-scroller');
    const targetElm = document.getElementById(id); // <-- Scroll to here within ".box"

    this.scrollToElm(box, targetElm, 600);   
  }

  scrollToElm(container: any, elm: any, duration: number){
    var pos = this.getRelativePos(elm);

    this._scrollTo(container, pos.top, duration);  // duration in seconds
  }

  getRelativePos(elm: any){
    const pPos: any = elm.parentNode.getBoundingClientRect(), // parent pos
          cPos: any = elm.getBoundingClientRect(), // target pos
          pos: any = {};

    pos.top    = cPos.top    - pPos.top + elm.parentNode.scrollTop + (pPos.bottom - pPos.top),
    pos.right  = cPos.right  - pPos.right,
    pos.bottom = cPos.bottom - pPos.bottom,
    pos.left   = cPos.left   - pPos.left;

    return pos;
  }
  
  _scrollTo(element: any, to: any, duration: number) {
    var start = element.scrollTop,
        change = to - start;

    element.scrollTop = start + change;
  }
}
