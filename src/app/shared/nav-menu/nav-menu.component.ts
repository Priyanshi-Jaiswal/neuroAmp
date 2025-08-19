import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { AppService } from '../../app.service';
import { filter } from 'rxjs/operators';
import { Event as RouterEvent } from '@angular/router';

@Component({
  selector: 'app-nav-menu',
  templateUrl: './nav-menu.component.html',
  styleUrls: ['./nav-menu.component.scss']
})
export class NavMenuComponent implements OnInit {
  isShowPromptHistorySubMenu = true;
  isShowSettingSubMenu = true;
  isShowWorkSpaceSubMenu = true;
  isShowSideNav = true;
  selectedMenu: string = '';

  constructor(private router: Router, private appService: AppService) { }

  ngOnInit() {
    const currentUrl = this.router.url;
    this.selectedMenu = currentUrl.split('?')[0];
    
    this.appService.sideNavData.subscribe((res: any) => {
      if (res === "") {
        this.isShowSideNav = true;
      }
      if (res === true) {
        this.isShowSideNav = true;
      } else if (res === false) {
        this.isShowSideNav = false;
      }
    });
    
    this.router.events.pipe(
      filter((event: RouterEvent): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.selectedMenu = event.url;
      if (event.urlAfterRedirects.includes('?')) {
        this.selectedMenu = this.selectedMenu.split('?')[0]      
      }
    });    
  }

  dashboard() {
    this.router.navigate(['/dashboard'])
  }

  gatewayBridge() {
    this.router.navigate(['/gatewayBridge'])
  }

  devices() {
    this.router.navigate(['/devices'])
  }

  gateways() {
    this.router.navigate(['/gateways'])
  }
}
