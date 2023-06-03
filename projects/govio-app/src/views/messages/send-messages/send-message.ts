import * as moment from 'moment';

export class SendMessage {

  id: number | null = null;
  organization_id: number | null = null;
  service_id: number | null = null;
  service_instance: number | null = null;
  // template_id: number | null = null;

  taxcode: string | null = null;
  scheduled_expedition_date: string | null = null;
  due_date: string | null = null;
  notice_number: string | null = null;
  amount: string | null = null;

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
