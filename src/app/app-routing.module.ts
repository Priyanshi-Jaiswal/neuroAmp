import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { DashboardComponent } from './main/dashboard/dashboard.component';
import { LoginComponent } from '././shared/login/login.component';
import { GatewaysComponent } from './main/gateways/gateways.component';
import { AddGatewaysComponent } from './main/gateways/add-gateways/add-gateways.component';
import { EditGatewayComponent } from './main/gateways/edit-gateway/edit-gateway.component';
import { DevicesComponent } from './main/devices/devices.component';
import { AddDevicesComponent } from './main/devices/add-devices/add-devices.component';
import { AddBulkDevicesComponent } from './main/devices/add-bulk-devices/add-bulk-devices.component';
import { EditDeviceComponent } from './main/devices/edit-device/edit-device.component';
import { AuthGuard } from './auth.guard';
import { GatewayBridgeComponent } from './main/gateway-bridge/gateway-bridge.component';


export const routes: Routes = [
  { path: 'login', component: LoginComponent },  
  { path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard] },
  { path: 'gateways', component: GatewaysComponent, canActivate: [AuthGuard] },
  { path: 'addGateways', component: AddGatewaysComponent, canActivate: [AuthGuard] },
  { path: 'edit-gateway/:id', component: EditGatewayComponent, canActivate: [AuthGuard] },
  { path: 'devices', component: DevicesComponent, canActivate: [AuthGuard] }, 
  { path: 'addDevices', component: AddDevicesComponent, canActivate: [AuthGuard] },
  { path: 'addBulkDevices', component: AddBulkDevicesComponent, canActivate: [AuthGuard] },
  { path: 'edit-device/:devEUI', component: EditDeviceComponent, canActivate: [AuthGuard] },
  { path: 'gatewayBridge', component: GatewayBridgeComponent, canActivate: [AuthGuard] },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {

}
