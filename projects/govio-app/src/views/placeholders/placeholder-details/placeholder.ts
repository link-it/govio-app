import * as moment from 'moment';

export class Placeholder {

  id: number | null = null;
  name: string | null = null;
  description: string | null = null;
  example: string | null = null;
  type: string | null = null;
  pattern: string | null = null;
  mandatory?: boolean | null = null;

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
