import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { LoginComponent } from './shared/login/login.component';
import { NavMenuComponent } from './shared/nav-menu/nav-menu.component';
import { HeaderComponent } from './shared/header/header.component';
import { FooterComponent } from './shared/footer/footer.component';
import { AuthGuard } from './auth.guard';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatMenuModule } from '@angular/material/menu';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSortModule } from '@angular/material/sort';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';
import { MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatListModule } from '@angular/material/list';
import { MatSidenavModule } from '@angular/material/sidenav';
import { DevicesComponent } from './main/devices/devices.component';
import { DashboardComponent } from './main/dashboard/dashboard.component';
import { GatewaysComponent } from './main/gateways/gateways.component';
import { LoaderComponent } from './shared/loader/loader.component';
import { AddDevicesComponent } from './main/devices/add-devices/add-devices.component';
import { AddGatewaysComponent } from './main/gateways/add-gateways/add-gateways.component';
import { AgGridModule } from 'ag-grid-angular';
import { GatewayBridgeComponent } from './main/gateway-bridge/gateway-bridge.component';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';
import { DateTimePickerModule } from '@syncfusion/ej2-angular-calendars';
import { NgApexchartsModule } from 'ng-apexcharts';
import { CanvasJSAngularChartsModule } from '@canvasjs/angular-charts';
import { EditDeviceComponent } from './main/devices/edit-device/edit-device.component';
import { EditGatewayComponent } from './main/gateways/edit-gateway/edit-gateway.component';
import { AddBulkDevicesComponent } from './main/devices/add-bulk-devices/add-bulk-devices.component';
import { ActionButtonComponent } from './main/action-button/action-button.component';
import { LogPanelComponent } from './main/action-button/log-panel/log-panel.component';
import { AlertModalComponent } from './shared/alert-modal/alert-modal.component';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    NavMenuComponent,
    HeaderComponent,
    FooterComponent,
    DevicesComponent,
    DashboardComponent,
    GatewaysComponent,
    LoaderComponent,
    AddDevicesComponent,
    AddGatewaysComponent,
    GatewayBridgeComponent,
    EditDeviceComponent,
    EditGatewayComponent,
    AddBulkDevicesComponent,
    ActionButtonComponent,
    LogPanelComponent,
    AlertModalComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    BrowserAnimationsModule,
    MatInputModule,
    DateTimePickerModule,
    MatIconModule,
    MatAutocompleteModule,
    HttpClientModule,
    MatCardModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    ReactiveFormsModule,
    MatMenuModule,
    MatTableModule,
    MatTabsModule,
    MatPaginatorModule,
    MatProgressBarModule,
    MatSortModule,
    MatSelectModule,
    MatCheckboxModule,
    MatRadioModule,
    MatDialogModule,
    MatTooltipModule,
    MatExpansionModule,
    MatListModule,
    MatSidenavModule,
    AgGridModule,
    MatDatepickerModule,
    NgApexchartsModule,
    CanvasJSAngularChartsModule,
  ],
  providers: [
    AuthGuard,
    provideAnimationsAsync(),
    provideNativeDateAdapter()
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
