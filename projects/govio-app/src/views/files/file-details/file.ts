import * as moment from 'moment';

export class File {

  id: number | null = null;
  filename: string | null = null;
  organization_id: number | null = null;
  service_id: number | null = null;
  service_instance: number | null = null;
  file: any = null;
  status: any = null;
  creation_date: string | null = null;
  error_messages: number = 0;
  acquired_messages: number = 0;

  constructor(_data?: any) {
    if (_data) {
      for (const key in _data) {
        if (this.hasOwnProperty(key)) {
          if (_data[key] !== null && _data[key] !== undefined) {
            switch (key) {
              default:
                (this as any)[key] = _data[key];
            }
          }
        }
      }
    }
  }
}
