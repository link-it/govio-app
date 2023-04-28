import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

import { AuthenticationService } from '../services/authentication.service';

@Injectable()
export class PermissionGuard implements CanActivate {

  constructor(
    private router: Router,
    private authenticationService: AuthenticationService
  ) { }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    const permission = route.data.permission;
    const grant = route.data.grant;

    if (this.authenticationService.isLogged()) {
      if (this.authenticationService.hasPermission(permission, grant)) {
        return true;
      } else {
        this.router.navigate(['/dashboard']);
        return false;
      }
    } else {
      this.router.navigate(['/auth/login'], { queryParams: { returnUrl: state.url }});
      return false;
    }
  }
}
