import { Component } from '@angular/core';
import { Router, NavigationEnd, NavigationStart } from '@angular/router';
import { AppService } from './app.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'genAI';
  currentUrl: string = '';
  showHeaderFooter = true;
  isShowSideNav = true;
  
  constructor(private router: Router, private appService: AppService){
    this.router.events.subscribe(event => {
      if(event instanceof NavigationEnd) {
        this.currentUrl = event.urlAfterRedirects;
        if(this.currentUrl.indexOf('login') != -1) {
            this.showHeaderFooter = false;
        } else {
          this.showHeaderFooter = true;
        }
        if (event instanceof NavigationStart) {
        }
      }
    });
  }

  ngOnInit() {
    this.appService.sideNavData.subscribe(res => {
      if (res === "") {
        this.isShowSideNav = true;
      }
      if (res === true) {
        this.isShowSideNav = true;
      } else if (res === false) {
        this.isShowSideNav = false;
      }
    });         
  }
}
