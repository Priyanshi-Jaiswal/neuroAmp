import { Injectable } from '@angular/core';
import { Router, CanActivate } from '@angular/router';
import { AppService } from './app.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(public router: Router, private appService: AppService) {}

  canActivate(): boolean {
    if (!this.appService.isAuthenticated()) {
      this.router.navigate(['login']);
      return false;
    }
    return true;
  }
}