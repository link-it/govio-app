import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { AbstractControl, FormControl, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';

import { TranslateService } from '@ngx-translate/core';

import { Tools } from 'projects/tools/src/lib/tools.service';
import { EventsManagerService } from 'projects/tools/src/lib/eventsmanager.service';
import { OpenAPIService } from 'projects/govio-app/src/services/openAPI.service';
import { CustomValidators } from 'projects/tools/src/lib/custom-forms-validators/custom-forms.module';

import { PlaceholderItem } from './placeholder-item';
import { Placeholder } from '../../placeholders/placeholder-details/placeholder';

import { concat, Observable, of, Subject, throwError } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, filter, map, startWith, switchMap, tap } from 'rxjs/operators';

import * as jsonpatch from 'fast-json-patch';
import _ from 'lodash';

@Component({
  selector: 'app-placeholder-item',
  templateUrl: 'placeholder-item.component.html',
  styleUrls: ['placeholder-item.component.scss']
})
export class PlaceholderItemComponent implements OnInit, OnDestroy {

  @Input() templateId: number | null = null;
  @Input() data: any = null;
  @Input() toExcluded: any[] = [];
  @Input() showPosition: boolean = false;
  @Input() config: any = null;
  @Input() editable: boolean = true;
  @Input() createPlaceholder: boolean = false;
  
  @Output() close: EventEmitter<any> = new EventEmitter();
  @Output() save: EventEmitter<any> = new EventEmitter();
  @Output() delete: EventEmitter<any> = new EventEmitter();
  
  position: number | null = null;
  _toExcluded: any[] = [];

  _isEdit: boolean = false;
  _isNew: boolean = false;
  _isNewPlaceholder: boolean = false;

  _dataSrc: any = null;

  _formData: PlaceholderItem = new PlaceholderItem({});
  _formGroup: UntypedFormGroup = new UntypedFormGroup({});
  _formGroupPlaceholder: UntypedFormGroup = new UntypedFormGroup({});

  _spin: boolean = false;

  _message: string = 'APP.MESSAGE.NoResults';
  _messageHelp: string = 'APP.MESSAGE.NoResultsHelp';

  _error: boolean = false;
  _errorMsg: string = '';
  
  _savingPlaceHolder: boolean = false;

  placeholders$!: Observable<any[]>;
  placeholdersInput$ = new Subject<string>();
  placeholdersLoading: boolean = false;
  selectedPlaceholder: any;
  minLengthTerm = 1;

  placeholderTypes: any[] = [
    { label: 'STRING', value: 'STRING' },
    { label: 'DATE', value: 'DATE' },
    { label: 'DATETIME', value: 'DATETIME' }
  ];

  constructor(
    private translate: TranslateService,
    public tools: Tools,
    private eventsManagerService: EventsManagerService,
    public apiService: OpenAPIService
  ) {
  }

  ngOnInit() {
    this._dataSrc = { source: { ...this.data?._embedded?.placeholder } };
    this.position = this.toExcluded.length + 1;
    this._toExcluded = this.toExcluded.map(item => item._embedded.placeholder );

    this._isNew = !this.data;
    this._isEdit = this._isNew;
    this._formData = {
      templateId: this.templateId,
      placeholderId: this.data?._embedded ? this.data._embedded.placeholder.id : null,
      position: this.data ? this.data.position : this.position,
      mandatory: this.data ? this.data.mandatory : true
    };
    this._initForm(this._formData);

    this.placeholders$ = concat(
      of([]), // default items
      this.placeholdersInput$.pipe(
        // filter(res => {
        //   return res !== null && res.length >= this.minLengthTerm
        // }),
        startWith(''),
        debounceTime(300),
        distinctUntilChanged(),
        tap(() => this.placeholdersLoading = true),
        switchMap((term: any) => {
          return this.getPlaceholders(term).pipe(
            catchError(() => of([])), // empty list on error
            tap(() => this.placeholdersLoading = false)
          )
        })
      )
    );
  }

  trackByFn(item: any) {
    return item.id;
  }

  getPlaceholders(term: string | null = null): Observable<any> {
    const _options: any = { params: { q: term } };
    return this.apiService.getList('placeholders', _options)
      .pipe(map(resp => {
        if (resp.Error) {
          throwError(resp.Error);
        } else {
          const _items = resp.items.map((item: any) => {
            item.disabled = _.findIndex(this._toExcluded, (excluded) => excluded.name === item.name) !== -1;
            return item;
          });
          return _items;
        }
      })
      );
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.createPlaceholder) {
      if (changes.createPlaceholder.currentValue) {
        this._newPlaceholder();
      } else {
        this._isNewPlaceholder = false;
        this._isNew = false;
        this._isEdit = false;
      }
      }
  }

  ngOnDestroy() {
  }

  _initForm(data: any = null) {
    if (data) {
      let _group: any = {};
      Object.keys(data).forEach((key) => {
        let value = '';
        switch (key) {
          case 'templateId':
          case 'placeholderId':
            value = data[key] ? data[key] : null;
            _group[key] = new UntypedFormControl(value, [
              Validators.required,
              CustomValidators.gt(0)
            ]);
            break;
          case 'position':
            value = data[key] ? data[key] : this.position;
            _group[key] = new UntypedFormControl(value, [
              Validators.required,
              CustomValidators.gt(0)
            ]);
            break;
          default:
            value = data[key] ? data[key] : null;
            _group[key] = new UntypedFormControl(value, []);
            break;
        }
      });
      this._formGroup = new UntypedFormGroup(_group);
    }
  }

  _onEdit(event: any) {
    this._isNew = true;
    this._isEdit = true;
    this._isNewPlaceholder = false;
  }

  __onSave(form: any) {
    const _body: any = {
      mandatory: form.mandatory || false,
      position: Number(form.position)
    };
    this.apiService.saveElement(`templates/${this.templateId}/placeholders?placeholder_id=${form.placeholderId}`, _body).subscribe(
      (response: any) => {
        this._isEdit = false;
        this.data = response;
        this.save.emit({ item: this.data });
      },
      (error: any) => {
        this._error = true;
        this._errorMsg = Tools.GetErrorMsg(error);
      }
    );
  }

  __removeEmpty(obj: any) {
    const $this = this;
    return Object.keys(obj)
      .filter(function (k) {
        return ( obj[k] != null && typeof obj[k] !== "object");
      })
      .reduce(function (acc: any, k: string) {
        acc[k] = typeof obj[k] === "object" ? $this.__removeEmpty(obj[k]) : obj[k];
        return acc;
      }, {});
  }

  __onUpdate(form: any) {
    this._error = false;
    const _data = this.__removeEmpty(this.data);
    const _body = this.__removeEmpty(form);
    const _bodyPatch: any[] = jsonpatch.compare(_data, _body);
    if (_bodyPatch) {
      this.apiService.updateElementRelated('templates', this.templateId, `placeholders?placeholder_id=${form.placeholderId}`,_bodyPatch).subscribe(
        (response: any) => {
          this._isEdit = false;
          this.data = response;
          this.save.emit({ item: this.data, update: true });
        },
        (error: any) => {
          this._error = true;
          this._errorMsg = Tools.GetErrorMsg(error);
        }
      );
    } else {
      console.log('No difference');
    }
  }

  _onSubmit(form: any) {
    if (this._isEdit && this._formGroup.valid) {
      if (this._isNew) {
        this.__onSave(form);
      } else {
        this.__onUpdate(form);
      }
    }
  }

  _onDelete(event: any) {
    this.delete.emit({ item: this.data });
  }

  _onCloseEdit(event: any) {
    this._isEdit = false;
    this._isNew = false;
    this._isNewPlaceholder = false;
    this.close.emit({ item: this.data });
  }
  
  // New Placeholder
  
  _hasControlError(name: string) {
    return (this.f[name].errors && this.f[name].touched);
  }

  get f(): { [key: string]: AbstractControl } {
    return this._formGroupPlaceholder.controls;
  }

  _onCloseNewPlaceholder(event: any) {
    this._isNewPlaceholder = false;
    this._isNew = false;
    this._isEdit = false;
    this.close.emit({ item: this.data });
  }
  
  _newPlaceholder() {
    const _placeholder: Placeholder = new Placeholder({ mandatory: false });
    this._initFormPlaceholder({ ..._placeholder });
    this._isNewPlaceholder = true;
    this._isNew = false;
    this._isEdit = false;
  }

  _initFormPlaceholder(data: any = null) {
    if (data) {
      let _group: any = {};
      Object.keys(data).forEach((key) => {
        let value = '';
        switch (key) {
          case 'name':
          case 'type':
          case 'example':
            value = data[key] ? data[key] : null;
            _group[key] = new UntypedFormControl(value, [Validators.required]);
            break;
          case 'mandatory':
            value = data[key] ? data[key] : true;
            _group[key] = new UntypedFormControl(value, []);
            break;
          default:
            value = data[key] ? data[key] : null;
            _group[key] = new UntypedFormControl(value, []);
            break;
        }
      });
      this._formGroupPlaceholder = new UntypedFormGroup(_group);
    }
  }

  __onSavePlaceholder(body: any) {
    this._error = false;
    const _mandatory: boolean = body.mandatory ? body.mandatory : false;
    const _body = Tools.RemoveEmpty(body);
    delete _body.mandatory;
    this._savingPlaceHolder = true;
    this.apiService.saveElement(`placeholders`, _body).subscribe(
      (response: any) => {
        this._isNewPlaceholder = false;
        this._savingPlaceHolder = false;
        const _body: any = {
          mandatory: _mandatory,
          position: Number(this.position),
          templateId: this.templateId,
          placeholderId: response.id
        };
        this.__onSave(_body);
      },
      (error: any) => {
        this._error = true;
        this._errorMsg = Tools.GetErrorMsg(error);
        this._savingPlaceHolder = false;
      }
    );
  }

  _onSubmitPlaceholder(form: any) {
    if (this._isNewPlaceholder && this._formGroupPlaceholder.valid) {
      this.__onSavePlaceholder(form);
    }
  }
}
