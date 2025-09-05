import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import * as L from 'leaflet';
import { AppService } from '../../../app.service';
import { forkJoin, take } from 'rxjs';

@Component({
  selector: 'app-edit-device',
  templateUrl: './edit-device.component.html',
  styleUrls: ['./edit-device.component.scss'],
})
export class EditDeviceComponent implements OnInit, AfterViewInit, OnDestroy {
  deviceId: string | null = null;
  gatewayOptions: any[] = [];
  active: boolean = false;
  name: string = '';
  devEUI: string = '';
  region: string = '';
  gateway: string = '';
  selectedGatewayId: string | null = null;
  regionOptions: string[] = ['US915', 'EU868', 'AS923', 'AU915'];
  otaaSupported: boolean = false;
  appKey: string = '';
  devAddr: string = '';
  nwkSKey: string = '';
  appSKey: string = '';
  showAppKey: boolean = false;
  showNwkSKey: boolean = false;
  showAppSKey: boolean = false;
  rx1Delay: string = '';
  rx1Duration: string = '';
  rx1DataRateOffset: string = '';
  rx2Delay: string = '';
  rx2Duration: string = '';
  channelFrequency: string = '';
  dataRate: string = '';
  ackTimeout: string = '';
  classBSupported: boolean = false;
  classCSupported: boolean = false;
  uplinkDataRate: string = '';
  fPort: string = '';
  retransmission: string = '';
  fCnt: string = '';
  fCntDownDisable: boolean = false;
  fCntDown: number | undefined;
  adrEnabled: boolean = false;
  rangeAntenna: string = '';
  uplinkInterval: string = '';
  payloadExceedsAction: 'fragments' | 'truncates' = 'fragments';
  mType: 'ConfirmedDataUp' | 'UnConfirmedDataUp' = 'ConfirmedDataUp';
  payloadContent: string = '';
  base64Encoded: boolean = false;
  latitude: number = 6.195;
  longitude: number = 1.0;
  altitude: number | undefined;
  locationAddress: string = 'Device Location';
  searchAddress: string = '';
  showSearchBox: boolean = false;
  private map: L.Map | undefined;
  private marker: L.Marker | undefined;
  activeSettingTab: string = 'General';
  tabOrder: string[] = [
    'General',
    'Activation',
    'Class A',
    'Class B',
    'Class C',
    'Frame settings',
    'Features',
    'Location',
    'Payload',
  ];

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private appService: AppService
  ) {}

  ngOnInit(): void {
    this.appService.getGateways().subscribe({
      next: (response) => {
        this.gatewayOptions = response.response;
        console.log('Gateways loaded:', this.gateway);
      },
      error: (err) => {
        console.error('Failed to fetch gateways:', err);
      },
    });
    this.deviceId = this.route.snapshot.paramMap.get('devEUI');
    if (this.deviceId) {
      this.loadGatewaysAndDeviceData(this.deviceId);
    } else {
      console.error('No device ID provided for editing.');
      this.router.navigate(['/devices']);
    }
  }

  ngAfterViewInit(): void {}

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
      this.map = undefined;
    }
  }

  loadGatewaysAndDeviceData(devEUI: string): void {
    forkJoin({
      device: this.appService.getSingleDevice(devEUI),
    })
      .pipe(take(1))
      .subscribe({
        next: (results) => {
          const deviceData = results.device.response;
          this.populateFormWithData(deviceData);
        },
        error: (error) => {
          console.error('Error fetching data:', error);
          alert(
            'Failed to load device data or gateways. Check console for details.'
          );
          this.router.navigate(['/devices']);
        },
      });
  }

  private populateFormWithData(deviceData: any): void {
    this.active = deviceData.isDeviceActive || false;
    this.name = deviceData.name || '';
    this.devEUI = deviceData.devEUI || '';
    this.region = deviceData.region || '';
    this.gateway = deviceData.gateway || '';
    console.log("Anurag====", deviceData.gateway);
    this.otaaSupported = deviceData.otaaSupported || false;
    this.appKey = deviceData.appKey || '';
    this.devAddr = deviceData.devAddr || '';
    this.nwkSKey = deviceData.nwkSKey || '';
    this.appSKey = deviceData.appSKey || '';
    this.rx1Delay = deviceData.rx1Delay || '';
    this.rx1Duration = deviceData.rx1Duration || '';
    this.rx1DataRateOffset = deviceData.rx1DataRateOffset || '';
    this.rx2Delay = deviceData.rx2Delay || '';
    this.rx2Duration = deviceData.rx2Duration || '';
    this.channelFrequency = deviceData.channelFrequency || '';
    this.dataRate = deviceData.dataRate || '';
    this.ackTimeout = deviceData.ackTimeout || '';
    this.classBSupported = deviceData.classBSupported || false;
    this.classCSupported = deviceData.classCSupported || false;
    this.uplinkDataRate = deviceData.uplinkDataRate || '';
    this.fPort = deviceData.fPort || '';
    this.retransmission = deviceData.retransmission || '';
    this.fCnt = deviceData.fCnt || '';
    this.fCntDownDisable = deviceData.fCntDownDisable || false;
    this.fCntDown = deviceData.fCntDown || undefined;
    this.adrEnabled = deviceData.adrEnabled || false;
    this.rangeAntenna = deviceData.rangeAntenna || '';
    this.uplinkInterval = deviceData.uplinkInterval || '';
    this.payloadExceedsAction = deviceData.payloadExceedsAction || 'fragments';
    this.mType = deviceData.mType || 'ConfirmedDataUp';
    this.payloadContent = deviceData.payloadContent || '';
    this.base64Encoded = deviceData.base64Encoded || false;
    this.latitude = deviceData.location?.latitude || 6.195;
    this.longitude = deviceData.location?.longitude || 1.0;
    this.altitude = deviceData.location?.altitude || undefined;
    if (this.activeSettingTab === 'Location') {
      setTimeout(() => {
        if (!this.map) {
          this.initMap();
          this.reverseGeocode(this.latitude, this.longitude);
        }
      }, 100);
    }
  }

  setActiveTab(tabName: string): void {
    this.activeSettingTab = tabName;
    console.log(`Mapped to: ${tabName}`);
    if (tabName === 'Location') {
      setTimeout(() => {
        if (!this.map) {
          this.initMap();
          this.reverseGeocode(this.latitude, this.longitude);
        } else {
          this.map.invalidateSize();
        }
      }, 100);
    }
  }

  private initMap(): void {
    if (this.map) {
      this.map.remove();
    }
    this.map = L.map('map').setView([this.latitude, this.longitude], 6);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.map);
    const defaultIcon = L.icon({
      iconRetinaUrl:
        'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl:
        'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl:
        'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      tooltipAnchor: [16, -28],
      shadowSize: [41, 41],
    });
    L.Marker.prototype.options.icon = defaultIcon;
    this.marker = L.marker([this.latitude, this.longitude])
      .addTo(this.map)
      .bindPopup(this.locationAddress)
      .openPopup();
    this.map.on('click', (e: L.LeafletMouseEvent) => {
      this.latitude = parseFloat(e.latlng.lat.toFixed(6));
      this.longitude = parseFloat(e.latlng.lng.toFixed(6));
      this.updateMapMarker();
    });
    this.map.invalidateSize();
  }

  private async reverseGeocode(lat: number, lng: number): Promise<void> {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;
    try {
      const response = await fetch(url);
      const data = await response.json();
      if (data && data.display_name) {
        this.locationAddress = data.display_name;
        if (this.marker) {
          this.marker.setPopupContent(this.locationAddress);
        }
      } else {
        this.locationAddress = 'Address not found';
        if (this.marker) {
          this.marker.setPopupContent(this.locationAddress);
        }
      }
    } catch (error) {
      console.error('Error in reverse geocoding:', error);
      this.locationAddress = 'Address lookup failed';
      if (this.marker) {
        this.marker.setPopupContent(this.locationAddress);
      }
    }
  }

  updateMapMarker(): void {
    if (this.map && this.latitude !== null && this.longitude !== null) {
      const newLatLng = new L.LatLng(this.latitude, this.longitude);
      if (this.marker) {
        this.marker.setLatLng(newLatLng);
        this.marker.setPopupContent(this.locationAddress);
      } else {
        this.marker = L.marker(newLatLng).addTo(this.map);
        this.marker.bindPopup(this.locationAddress).openPopup();
      }
      this.map.setView(newLatLng, this.map.getZoom() || 13);
    } else if (this.map && this.marker) {
      this.map.removeLayer(this.marker);
      this.marker = undefined;
    }
    this.reverseGeocode(this.latitude, this.longitude);
  }

  onLatLngChange(): void {
    this.updateMapMarker();
  }

  async searchLocation(): Promise<void> {
    if (!this.searchAddress) {
      console.warn('Please enter an address to search.');
      return;
    }
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      this.searchAddress
    )}`;
    try {
      const response = await fetch(url);
      const data = await response.json();
      if (data && data.length > 0) {
        const firstResult = data[0];
        this.latitude = parseFloat(firstResult.lat);
        this.longitude = parseFloat(firstResult.lon);
        this.updateMapMarker();
        this.map?.setView([this.latitude, this.longitude], 13);
        console.log('Location found:', firstResult);
      } else {
        console.warn('Location not found for the given address.');
      }
    } catch (error) {
      console.error('Error searching location:', error);
    }
  }

  generateDevEUI(): void {
    this.devEUI = Array.from({ length: 16 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    )
      .join('')
      .toUpperCase();
  }
  generateAppKey(): void {
    this.appKey = this.generateRandomHexString(32);
  }
  generateDevAddr(): void {
    this.devAddr = this.generateRandomHexString(8);
  }
  generateNwkSKey(): void {
    this.nwkSKey = this.generateRandomHexString(32);
  }
  generateAppSKey(): void {
    this.appSKey = this.generateRandomHexString(32);
  }
  private generateRandomHexString(length: number): string {
    let result = '';
    const characters = '0123456789ABCDEF';
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  }
  toggleAppKeyVisibility(): void {
    this.showAppKey = !this.showAppKey;
  }
  toggleNwkSKeyVisibility(): void {
    this.showNwkSKey = !this.showNwkSKey;
  }
  toggleAppSKeyVisibility(): void {
    this.showAppSKey = !this.showAppSKey;
  }

  private getUpdatedDeviceData(): any {
    return {
      isDeviceActive: this.active,
      name: this.name,
      devEUI: this.devEUI,
      region: this.region,
      gateway: this.gateway,
      otaaSupported: this.otaaSupported,
      appKey: this.appKey,
      devAddr: this.devAddr,
      nwkSKey: this.nwkSKey,
      appSKey: this.appSKey,
      rx1Delay: this.rx1Delay,
      rx1Duration: this.rx1Duration,
      rx1DataRateOffset: this.rx1DataRateOffset,
      rx2Delay: this.rx2Delay,
      rx2Duration: this.rx2Duration,
      channelFrequency: this.channelFrequency,
      dataRate: this.dataRate,
      ackTimeout: this.ackTimeout,
      classBSupported: this.classBSupported,
      classCSupported: this.classCSupported,
      uplinkDataRate: this.uplinkDataRate,
      fPort: this.fPort,
      retransmission: this.retransmission,
      fCnt: this.fCnt,
      fCntDownDisable: this.fCntDownDisable,
      fCntDown: this.fCntDown,
      adrEnabled: this.adrEnabled,
      rangeAntenna: this.rangeAntenna,
      uplinkInterval: this.uplinkInterval,
      payloadExceedsAction: this.payloadExceedsAction,
      mType: this.mType,
      payloadContent: this.payloadContent,
      base64Encoded: this.base64Encoded,
      location: {
        latitude: this.latitude,
        longitude: this.longitude,
        altitude: this.altitude,
      },
    };
  }

  /**
   * Updates device data and navigates to the next tab on success.
   */
  updateAndNext(): void {
    if (!this.devEUI) {
      alert('Error: Device ID is missing for update.');
      return;
    }
    const updatedDeviceData = this.getUpdatedDeviceData();
    console.log('Attempting to update device and go to next tab:', updatedDeviceData);

    this.appService.updateDevice(this.devEUI, updatedDeviceData).subscribe({
      next: (response) => {
        console.log('Device updated successfully!', response);
        // alert('Device updated successfully!');
        const currentIndex = this.tabOrder.indexOf(this.activeSettingTab);
        if (currentIndex !== -1 && currentIndex < this.tabOrder.length - 1) {
          const nextTab = this.tabOrder[currentIndex + 1];
          this.setActiveTab(nextTab);
        } else {
          // Fallback to close if on the last tab
          this.router.navigate(['/devices']);
        }
      },
      error: (error) => {
        console.error('Error updating device:', error);
        alert('Failed to update device. Check console for details.');
      },
    });
  }

  /**
   * Updates device data and navigates to the devices list on success.
   */
  updateAndClose(): void {
    if (!this.devEUI) {
      alert('Error: Device ID is missing for update.');
      return;
    }
    const updatedDeviceData = this.getUpdatedDeviceData();
    console.log('Attempting to update device and close:', updatedDeviceData);

    this.appService.updateDevice(this.devEUI, updatedDeviceData).subscribe({
      next: (response) => {
        console.log('Device updated successfully!', response);
        alert('Device updated successfully!');
        this.router.navigate(['/devices']);
      },
      error: (error) => {
        console.error('Error updating device:', error);
        alert('Failed to update device. Check console for details.');
      },
    });
  }

  cancel(): void {
    this.router.navigate(['/devices']);
  }
}