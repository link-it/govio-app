import { Component, OnInit, ViewChild, ElementRef, HostListener, AfterContentChecked, OnDestroy, Input, HostBinding } from '@angular/core';
import { Router } from '@angular/router';
import { BreakpointObserver } from '@angular/cdk/layout';

import { TranslateService } from '@ngx-translate/core';

import { Tools } from 'projects/tools/src/lib/tools.service';
import { ConfigService } from 'projects/tools/src/lib/config.service';
import { Language } from 'projects/components/src/lib/classes/language';
import { MenuAction } from 'projects/components/src/lib/classes/menu-action';
import { EventType } from 'projects/tools/src/lib/classes/events';
import { EventsManagerService } from 'projects/tools/src/lib/eventsmanager.service';
import { AuthenticationService } from '@services/authentication.service';
import { OpenAPIService } from '@services/openAPI.service';

import { INavData } from './gp-sidebar-nav';
import { GpSidebarNavHelper } from './gp-sidebar-nav.helper';
import { navItemsMainMenu } from './_nav';

// import urlExist from "url-exist"

@Component({
  selector: 'gp-layout',
  templateUrl: './gp-layout.component.html',
  styleUrls: ['./gp-layout.component.scss']
})
export class GpLayoutComponent implements OnInit, AfterContentChecked, OnDestroy {
  static readonly Name = 'GpLayoutComponent';
  @ViewChild('watermark', { read: ElementRef }) watermark!: ElementRef;

  @HostBinding('class.full-content') get fullContentClass(): boolean {
    return this.fullContent;
  }
  @HostBinding('class.page-full-scroll') get pageFullScrollClass(): boolean {
    return (this.fullScroll || !this.desktop) && !this.contentScroll;
  }
  @HostBinding('class.page-content-scroll') get pageContentScrollClass(): boolean {
    return (!this.fullScroll && this.desktop) || this.contentScroll;
  }

  fullContent: boolean = false;
  fullScroll: boolean = false;
  contentScroll: boolean = true;

  Tools = Tools;

  _session: any = null;

  _config: any = null;
  _languages: Language[] = [];
  _language: string = '';
  __once: boolean = true;

  _menuActions: MenuAction[] = [];
  _menuAppActions: MenuAction[] = [];

  _spin = true;

  _sideBarOpened: boolean = false;
  _sideBarCollapsed: boolean = false;
  _sideBarCollapsedPinned: boolean = false;
  _openSideBar: boolean = false;

  navItems: INavData[] = [];

  desktop: boolean = false;
  tablet: boolean = false;
  mobile: boolean = false;

  _showHeaderBar: boolean = false;
  _forceMenuOpen: boolean = false;

  _title: string = '';

  _isGovApp: boolean = true;

  constructor(
    private router: Router,
    private observer: BreakpointObserver,
    private translate: TranslateService,
    private configService: ConfigService,
    private tools: Tools,
    private eventsManagerService: EventsManagerService,
    private authenticationService: AuthenticationService,
    private apiService: OpenAPIService,
    public sidebarNavHelper: GpSidebarNavHelper
  ) {
    this._config = this.configService.getConfiguration();
    this._showHeaderBar = this._config.AppConfig.Layout.showHeaderBar || false;
    this._forceMenuOpen = this._config.AppConfig.Layout.forceMenuOpen || false;
    this._title = this._config.AppConfig.Layout.Header.title;

    if (!this._showHeaderBar) {
      document.documentElement.style.setProperty('--header-height', this._showHeaderBar ? '48px' : '0px');
      document.documentElement.style.setProperty('--content-wrapper-top', this._showHeaderBar ? '48px' : '0px');
    }

    if (this._config.NavMenu && this._config.NavMenu.length > 0) {
      this.navItems = this._config.NavMenu;
    } else {
      this.navItems = [...navItemsMainMenu];
    }

    this._session = this.authenticationService.getCurrentSession();

    if (Tools.CurrentApplication && Tools.CurrentApplication.menu) {
      this._isGovApp = Tools.CurrentApplication.menu.action === 'dashboard';
    }

    this._initLanguages();
    this._initMenuActions();
    this._onResize();
  }

  @HostListener('window:resize')
  _onResize() {
    this.desktop = (window.innerWidth >= 1200);
    this.tablet = (window.innerWidth < 1200 && window.innerWidth >= 768);
    this.mobile = (window.innerWidth < 768);

    if (this.desktop) {
      this._sideBarCollapsed = this._sideBarCollapsedPinned ? true : false;
      this._sideBarOpened = true;
      this._openSideBar = false;
    }
    if (this.tablet) {
      this._sideBarCollapsed = true;
      this._sideBarOpened = false;
      this._openSideBar = false;
    }
    if (this.mobile) {
      this._sideBarCollapsed = false;
      this._sideBarOpened = false;
    }
  }

  ngOnInit() {
    this.eventsManagerService.on(EventType.NAVBAR_OPEN, (event: any) => {
      this.__openSideBar();
    });

    setTimeout(() => {
      if (this._sideBarOpened && !this.desktop && !this.mobile) {
        this.__toggelCollapse();
      }
    });

    setTimeout(() => {
      this.loadProfile();
    }, 200);
  }

  ngAfterContentChecked() {
    // this._spin = this.tools.getSpinner() && this.tools.isSpinnerGlobal();

    if (this._config.AppConfig.Watermark) {
      this.__once = false;
      this._watermark();
    }
  }

  ngOnDestroy() {
  }

  loadProfile() {
    this._spin = true;
    this.apiService.getList('profile').subscribe(
      (response: any) => {
        // console.log('profile response', response);
        this.authenticationService.setNoProfile(false);
        this.authenticationService.setCurrentSession(response);
        this.authenticationService.reloadSession();
        this._initMenuActions();
        this._spin = false;
      },
      (error: any) => {
        console.log('loadProfile error', error);
        this.authenticationService.setNoProfile(true);
        this._spin = false;
      }
    );
  }

  _initMenuActions() {
    const _user = this.authenticationService.getUser();

    this._menuActions = [
      new MenuAction({
        title: _user,
        subTitle: '',
        action: 'profile'
      }),
      new MenuAction({
        title: this.translate.instant('APP.MENU.Logout'),
        action: 'logout'
      })
    ];

    // this.configService.getConfig('application').subscribe(
    //   (config: any) => {
    //     const _apps = config.Applications || [];
    //     _apps.forEach(async (item: any) => {
    //       let _isEnabled = true;
    //       if (item.action !== 'dashboard') {
    //         _isEnabled = await urlExist(item.url);
    //       }
    //       this._menuAppActions.push(
    //         new MenuAction({ ...item, enabled: _isEnabled })
    //       );
    //     });
    //   }
    // );
  }

  _initLanguages() {
    try {
      const _lingue = this._config.AppConfig.Lingue;
      const _codeLangs = (_lingue.length != 0) ? [] : ['it'];
      let _currentLanguage: Language = new Language({
        language: 'Italiano',
        alpha2Code: 'it',
        alpha3Code: 'ita'
      });
      const browserLang = this.translate.getBrowserLang();

      _lingue.forEach((lingua: any) => {
        const _l: Language = new Language(lingua);
        this._languages.push(_l);
        _codeLangs.push(lingua.alpha2Code);
        if (browserLang == _l.alpha2Code) {
          _currentLanguage = _l;
        }
      });

      this.translate.addLangs(_codeLangs);
      this._language = _currentLanguage.alpha3Code;
      // PayService.ALPHA_3_CODE = _currentLanguage.alpha3Code;
      if (this.translate.currentLang !== _currentLanguage.alpha2Code) {
        this._doTranslate();
      }
      this.translate.use(_currentLanguage.alpha2Code);

    } catch (e) {
      console.log('Verificare configurazione lingue');
    }
  }

  _onChangeLanguage(event: any) {
    if (event.language.alpha2Code !== this.translate.currentLang) {
      Tools.WaitForResponse();
      this._language = event.language.alpha3Code;
      this._doTranslate();
      this.translate.use(event.language.alpha2Code);
    }
  }

  _doTranslate() {
    // dummy
    Tools.WaitForResponse(false);
  }

  __toggelCollapse() {
    this._sideBarCollapsed = !this._sideBarCollapsed;
    this._sideBarCollapsedPinned = this._sideBarCollapsed;
    this._sideBarOpened = !this._sideBarCollapsed
    window.dispatchEvent(new Event('resize'));
  }

  __openSideBar() {
    this._openSideBar = true;
    window.dispatchEvent(new Event('resize'));
  }

  __closeSideBar() {
    this._openSideBar = false;
    window.dispatchEvent(new Event('resize'));
  }

  _onClickMenu(event: any, item: INavData) {
    if (!this._forceMenuOpen) {
      if (!this.desktop && !this.mobile) {
        this._sideBarCollapsed = true;
        this._sideBarOpened = false;
        this._openSideBar = false;
      }

      if (this.mobile && item.title && item.children && item.children.length > 0) {
        // Expand the menu
        this._sideBarCollapsed = false;
        this._sideBarOpened = true;
        this._openSideBar = true;
        this._expandMenu(item);
      } else {
        this.router.navigate([item.url]);
        if (this.mobile) {
          this._sideBarCollapsed = true;
          this._sideBarOpened = false;
          this._openSideBar = false;
          this._resetExpandMenu();
        }
      }
    } else {
      // Expand the menu
      if (!this.desktop && !this.mobile) {
        this._sideBarCollapsed = true;
        this._sideBarOpened = false;
        this._openSideBar = false;
      }
      item.expanded = false;
      this.router.navigate([item.url]);
      if (this.mobile) {
        this._sideBarCollapsed = true;
        this._sideBarOpened = false;
        this._openSideBar = false;
      }
    }
  }

  _onMenuHeaderAction(event: any) {
    this._title = this._config.AppConfig.Layout.Header.title;
    switch (event.menu.action) {
      case 'profile':
        this.router.navigate(['/profile']);
        break
      case 'logout':
        this.router.navigate(['/auth/login']);
        break
      default:
        break;
    }
  }

  _onMenuAppHeaderAction(event: any) {
    Tools.CurrentApplication = event;
    this._title = (Tools.CurrentApplication && Tools.CurrentApplication.menu) ? Tools.CurrentApplication.menu.title : this._config.AppConfig.Layout.Header.title;
    switch (event.menu.action) {
      case 'dashboard':
        this._isGovApp = true;
        this.router.navigate([event.menu.url]);
        break
      default:
        this._isGovApp = false;
        this.router.navigate(['/application']);
        break;
    }
  }

  _hasPermission(menu: any) {
    return this.authenticationService.hasPermission(menu.permission, 'view');
  }

  _expandMenu(item: INavData) {
    if (item.children) {
      item.expanded = !item.expanded;
    }
  }

  _resetExpandMenu() {
    this.navItems.forEach((item: INavData) => {
      item.expanded = false;
    });
  }

  /**
   * Internal watermark text rotation
   */
  protected _watermark() {
    if (this.watermark) {
      this.__once = true;
      const watermark = this.watermark.nativeElement;
      const span = watermark.querySelector('span');
      span.style.transform = 'rotate(-' + Math.atan((watermark.clientHeight / watermark.clientWidth)) * 180 / Math.PI + 'deg)';
    }
  }
}
