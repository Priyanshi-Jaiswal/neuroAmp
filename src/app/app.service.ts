import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})

export class AppService {
  user: any;
  private sideNav = new BehaviorSubject<any>('');
  private userStory = new BehaviorSubject<any>('');

  userStoryData = this.userStory.asObservable();
  sideNavData = this.sideNav.asObservable();

  constructor(private http: HttpClient) { }

  private apiUrl = '/api';

  isAuthenticated() {
    if (this.getUser()) {
      return true;
    } else {
      return false;
    }
  }

  getUser() {
    this.user = sessionStorage.getItem('userName')
    return this.user;
  }

  sideNavShowEvent(navData: any) {
    this.sideNav.next(navData);
  }

  userStoryDataShowEvent(story: any) {
    this.userStory.next(story);
  }

  getDashboardSummary(): Observable<any> {
    return this.http.get(`${this.apiUrl}/dashboard/total_count`);
  }

  createBulkDevices(data: { numberOfDevices: number | undefined; appKey: string; gateway: string | null; region: string; }): Observable<any> {
    return this.http.post(`${this.apiUrl}/devices/` + this.user + `/bulk`, data);
  }

  createDevice(deviceData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/devices/` + this.user, deviceData);
  }

  getDevices(): Observable<any> {
    return this.http.get(`${this.apiUrl}/devices/` + this.user);
  }

  updateDevice(devEUI: string, userData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/devices/` + this.user + `/${devEUI}`, userData);
  }

  deleteDevice(devEUI: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/devices/` + this.user + `/${devEUI}`);
  }

  getSingleDevice(devEUI: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/devices/` + this.user + `/${devEUI}`);
  }

  createGateway(gatewayData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/gateways/` + this.user, gatewayData);
  }

  getGateways(): Observable<any> {
    return this.http.get(`${this.apiUrl}/gateways/` + this.user);
  }

  getSingleGateway(gatewayId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/gateways/` + this.user + `/${gatewayId}`);
  }

  updateGateway(gatewayId: string, gatewayData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/gateways/` + this.user + `/${gatewayId}`, gatewayData);
  }

  deleteGateway(gatewayId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/gateways/` + this.user + `/${gatewayId}`);
  }

  getGatewayBridgeConfig(): Observable<any> {
    return this.http.get(`${this.apiUrl}/gateway_bridge/config`);
  }

  // New methods for bulk device actions
  startDevice(deviceList: string[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/v1/lns/devices/join`, { deviceList });
  }

  stopDevice(deviceList: string[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/v1/lns/unjoin`, { deviceList });
  }

  startDeviceUplink(deviceList: string[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/v1/lns/startuplink`, { deviceList });
  }

  stopDeviceUplink(deviceList: string[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/v1/lns/stopuplink`, { deviceList });
  }

  public getDeviceLogs(devEui: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/devices/${devEui}/logs`)
  }

  startGateway(gatewayId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/v1/lns/gw/devices/join`, { gwlist: [gatewayId] });
  }

  stopGateway(gatewayId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/v1/lns/gw/devices/unjoin`, { gwlist: [gatewayId] });
  }

  startGatewayUplink(gatewayId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/v1/lns/gw/startuplink`, { gatewayId });
  }

  stopGatewayUplink(gatewayId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/v1/lns/gw/stopuplink`, { gatewayId });
  }

}
