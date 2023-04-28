import * as moment from 'moment';

export class Template {

  id: number | null = null;
  name: string | null = null;
  description: string | null = null;
  subject: string | null = null;
  message_body: string | null = null;
  has_payment: boolean = false;
  has_due_date: boolean = false;

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
