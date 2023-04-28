import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges } from '@angular/core';
import { UntypedFormGroup } from '@angular/forms';

import { TranslateService } from '@ngx-translate/core';

import { ConfigService } from 'projects/tools/src/lib/config.service';
import { Tools } from 'projects/tools/src/lib/tools.service';
import { EventsManagerService } from 'projects/tools/src/lib/eventsmanager.service';
import { OpenAPIService } from 'projects/govio-app/src/services/openAPI.service';

@Component({
  selector: 'app-template-view',
  templateUrl: 'template-view.component.html',
  styleUrls: ['template-view.component.scss']
})
export class TemplateViewComponent implements OnInit, OnChanges, OnDestroy {
  static readonly Name = 'TemplateViewComponent';
  readonly model: string = 'templates';

  @Input() id: number | null = null;
  @Input() config: any = null;
  
  @Output() close: EventEmitter<any> = new EventEmitter<any>();
  
  appConfig: any;
  
  _formGroup: UntypedFormGroup = new UntypedFormGroup({});
  template: any = null;

  _spin: boolean = false;

  _error: boolean = false;
  _errorMsg: string = '';

  constructor(
    private translate: TranslateService,
    private configService: ConfigService,
    public tools: Tools,
    public eventsManagerService: EventsManagerService,
    public apiService: OpenAPIService,
  ) {
    this.appConfig = this.configService.getConfiguration();
  }

  ngOnInit() {
  }

  ngOnDestroy() {
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.id) {
      this.id = changes.id.currentValue;
      this.configService.getConfig(this.model).subscribe(
        (config: any) => {
          this.config = config;
          this._loadAll();
        }
      );
    }
  }

  _loadAll() {
    this._loadTemplate();
  }

  _loadTemplate() {
    if (this.id) {
      this._spin = true;
      this.template = null;
      this.apiService.getDetails(this.model, this.id).subscribe({
        next: (response: any) => {
          this.template = { ...response };
          this._spin = false;
        },
        error: (error: any) => {
          this._spin = false;
        }
      });
    }
  }
}
