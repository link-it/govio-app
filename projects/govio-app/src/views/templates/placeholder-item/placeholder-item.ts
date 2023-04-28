export class PlaceholderItem {

  templateId: number | null = null;
  placeholderId: number | null = null;
  position: number | null = null;
  mandatory: boolean = true;

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
