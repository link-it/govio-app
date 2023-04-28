import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import * as _ from 'lodash';

@Component({
  selector: 'app-photo-base64',
  templateUrl: './photo-base64.component.html',
  styleUrls: ['./photo-base64.component.scss']
})
export class PhotoBase64Component implements OnInit, OnChanges {

  @Input() placeHolder: string = '';
  @Input() boxWidth: string = '175';
  @Input() boxHeight: string = 'auto';
  @Input() imageSaved: string = '';
  @Input() isImageSaved: boolean = false;
  @Input() maxSize: number = 200000;
  @Input() removeLabel: string = 'Remove';
  @Input() fileTypes: string[] = ['image/png', 'image/jpeg'];
  @Input() asDataUrl: boolean = true;
  @Input() isEdit: boolean = true;

  @Output() imageLoaded: EventEmitter<any> = new EventEmitter();

  imageError!: string | null;
  cardImageBase64!: string | null;

  constructor() { }

  ngOnInit() {
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.imageSaved && changes.imageSaved.currentValue) {
      this.cardImageBase64 = changes.imageSaved.currentValue;
    }
  }

  fileChangeEvent(fileInput: any) {
    this.imageError = null;
    if (fileInput.target.files && fileInput.target.files[0]) {
      // Size Filter Bytes
      const max_size = this.maxSize; // /* The size of the file in bytes. */
      20971520
      const allowed_types = this.fileTypes;
      const max_height = 15200;
      const max_width = 25600;

      if (fileInput.target.files[0].size > max_size) {
        this.imageError = 'Maximum size allowed is ' + max_size / 1000 + 'Mb';
        return false;
      }

      if (!_.includes(allowed_types, fileInput.target.files[0].type)) {
        this.imageError = 'Only Images are allowed ( JPG | PNG )';
        return false;
      }
      const reader = new FileReader();
      reader.onload = (e: any) => {
        if (this.asDataUrl) {
          const image = new Image();
          image.src = e.target.result;
          image.onload = (rs: any) => {
            const img_height = rs.currentTarget['height'];
            const img_width = rs.currentTarget['width'];

            if (img_height > max_height && img_width > max_width) {
              this.imageError =
                'Maximum dimentions allowed ' +
                max_height +
                '*' +
                max_width +
                'px';
              return false;
            } else {
              const imgBase64Path = e.target.result;
              this.cardImageBase64 = imgBase64Path;
              this.isImageSaved = true;
              this.imageLoaded.emit(imgBase64Path);
              return true;
            }
          };
        } else {
          const imageData = e.target.result;
          this.imageLoaded.emit(imageData);
          // var buffer = e.target.result;
          // var int32View = new Int32Array(buffer);
          // var tipoImmagine = 'sconosciuto';
          // switch(int32View[0]) {
          //   case 1196314761:
          //     tipoImmagine = "png";
          //     break;
          //   case 944130375:
          //     tipoImmagine = "gif";
          //     break;
          //   case 544099650:
          //     tipoImmagine = "bmp";
          //     break;
          //   case -520103681:
          //     tipoImmagine = "jpg";
          //     break;
          //   default:
          //     tipoImmagine= "sconosciuto";
          //     break;
          // }
        }
      };

      if (this.asDataUrl) {
        reader.readAsDataURL(fileInput.target.files[0]);
      } else {
        reader.readAsArrayBuffer(fileInput.target.files[0]);
      }
      return true;
    }
    return false;
  }

  removeImage() {
    this.cardImageBase64 = null;
    this.isImageSaved = false;
    this.imageError = null;
    this.imageLoaded.emit(null);
  }
}

/** Other File Type
  'application/msword'
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  'image/jpg'
  'image/jpeg'
  'application/pdf'
  'image/png'
  'application/vnd.ms-excel'
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
*/
