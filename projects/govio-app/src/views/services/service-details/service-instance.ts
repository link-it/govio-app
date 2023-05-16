import * as moment from 'moment';

export class ServiceInstance {

  id: number | null = null;
  service_id: number | null = null;
  organization_id: number | null = null;
  template_id: number | null = null;
  apiKey: string | null = null;
  enabled: boolean = false;
  io_service_id: string | null = null;

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
