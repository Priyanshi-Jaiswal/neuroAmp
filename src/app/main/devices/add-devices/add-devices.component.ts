import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router'; // Import Router
import * as L from 'leaflet';
import { AppService } from '../../../app.service';

@Component({
  selector: 'app-add-devices',
  templateUrl: './add-devices.component.html',
  styleUrls: ['./add-devices.component.scss']
})
export class AddDevicesComponent implements OnInit, AfterViewInit, OnDestroy {
  // currentUser: any;
  deviceId: string | null = null;
  isEditMode: boolean = false;

  // Form fields for the new device
  active: boolean = false; // Renamed from 'active' for clarity
  name: string = '';
  devEUI: string = '';
  region: string = '';
  selectedGatewayId: string | null = null; // New property for the selected gateway
  gateway: any[] = [];

  // Example options for the region dropdown
  regionOptions: string[] = ['US915', 'EU868', 'AS923', 'AU915'];

  // Activation Settings form fields
  otaaSupported: boolean = false; // Renamed from 'active' for clarity
  appKey: string = '';
  devAddr: string = '';
  nwkSKey: string = '';
  appSKey: string = '';

  // Class A Settings form fields
  rx1Delay: string = '';
  rx1Duration: string = '';
  rx1DataRateOffset: string = '';
  rx2Delay: string = '';
  rx2Duration: string = '';
  channelFrequency: string = '';
  dataRate: string = '';
  ackTimeout: string = '';

  // Class B Settings field
  classBSupported: boolean = false; // Renamed from 'active' for clarity

  // Class C Settings field
  classCSupported: boolean = false; // Renamed from 'active' for clarity

  // Frame Settings form fields
  uplinkDataRate: string = '';
  fPort: string = '';
  retransmission: string = '';
  fCnt: string = '';
  fCntDownDisable: boolean = false;
  fCntDown: number | undefined;

  // Features Settings field
  adrEnabled: boolean = false; // Renamed from 'active' for clarity
  rangeAntenna: string = '';

  // NEW: Payload Settings form fields
  uplinkInterval: string = '';
  payloadExceedsAction: 'fragments' | 'truncates' = 'fragments'; // Default to 'fragments'
  mType: 'ConfirmedDataUp' | 'UnConfirmedDataUp' = 'ConfirmedDataUp'; // Default to 'ConfirmedDataUp'
  payloadContent: string = '';
  base64Encoded: boolean = false;

  // Location Settings (NEW)
  latitude: number = 1; // Default latitude (Accra, Ghana area from image)
  longitude: number = 1; // Default longitude
  altitude: number | undefined;
  locationAddress: string = 'Device Location'; // New property to hold the address

  // Visibility toggles for sensitive keys
  showAppKey: boolean = false;
  showNwkSKey: boolean = false;
  showAppSKey: boolean = false;
  searchAddress: string = '';
  showSearchBox: boolean = false; // Controls visibility of the address search box

  private map: L.Map | undefined;
  private marker: L.Marker | undefined;

  // Current active tab in the Device's Settings sidebar
  activeSettingTab: string = 'General';

  private deviceCreatedForSession: boolean = false;

  // Changed constructor to inject Router instead of MatDialogRef
  constructor(private router: Router, private appService: AppService) { }

  ngOnInit(): void {
    // Initialize any data or perform setup here
    this.appService.getGateways().subscribe({
      next: (response) => {
        this.gateway = response.response;
        console.log('Gateways loaded:', this.gateway);
      },
      error: (err) => {
        console.error('Failed to fetch gateways:', err);
      },
    });
  }

  ngAfterViewInit(): void {
    // The map is now only initialized when the Location tab is opened.
  }

  ngOnDestroy(): void { // Lifecycle hook to clean up map resources
    if (this.map) {
      this.map.remove();
      this.map = undefined;
    }
  }

  /**
   * Handles the click event for sidebar navigation.
   * Sets the active tab.
   * @param tabName The name of the tab to activate.
   */
  setActiveTab(tabName: string): void {
    this.activeSettingTab = tabName;
    console.log(`Mapsd to: ${tabName}`);

    if (tabName === 'Location') {
      setTimeout(() => {
        if (!this.map) {
          this.initMap();
        }
        this.map?.invalidateSize();
      }, 100);
    }
  }

  /**
     * Initializes the Leaflet map and sets up the tile layer and marker.
     */
  private initMap(): void {
    if (this.map) {
      this.map.remove();
    }

    this.map = L.map('map').setView([this.latitude, this.longitude], 6);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(this.map);

    const iconRetinaUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png';
    const iconUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png';
    const shadowUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png';

    const defaultIcon = L.icon({
      iconRetinaUrl,
      iconUrl,
      shadowUrl,
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      tooltipAnchor: [16, -28],
      shadowSize: [41, 41]
    });

    L.Marker.prototype.options.icon = defaultIcon;

    this.marker = L.marker([this.latitude, this.longitude]).addTo(this.map)
      .bindPopup(this.locationAddress) // Use the new locationAddress property
      .openPopup();

    this.map.on('click', (e: L.LeafletMouseEvent) => {
      this.latitude = parseFloat(e.latlng.lat.toFixed(6));
      this.longitude = parseFloat(e.latlng.lng.toFixed(6));
      this.updateMapMarker();
    });

    this.map.invalidateSize();
  }

  // New method for reverse geocoding
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

  /**
   * Updates the map marker position and map view based on current latitude and longitude.
   */
  updateMapMarker(): void {
    if (this.map && this.marker && this.latitude !== null && this.longitude !== null) {
      const newLatLng = new L.LatLng(this.latitude, this.longitude);
      this.marker.setLatLng(newLatLng);
      this.map.setView(newLatLng, this.map.getZoom() || 13); // Maintain zoom or set default
    } else if (this.map && this.latitude !== null && this.longitude !== null) {
      // If marker doesn't exist but map does, create it
      this.marker = L.marker([this.latitude, this.longitude]).addTo(this.map);
      this.map.setView([this.latitude, this.longitude], this.map.getZoom() || 13);
    }
    // Trigger reverse geocoding after updating the marker.
    this.reverseGeocode(this.latitude, this.longitude);
  }

  /**
   * Called when latitude or longitude input changes.
   * Updates the map marker.
   */
  onLatLngChange(): void {
    this.updateMapMarker();
  }

  /**
   * Searches for a location using Nominatim API and updates map/coordinates.
   */
  async searchLocation(): Promise<void> {
    if (!this.searchAddress) {
      console.warn('Please enter an address to search.');
      return;
    }

    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(this.searchAddress)}`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (data && data.length > 0) {
        const firstResult = data[0];
        this.latitude = parseFloat(firstResult.lat);
        this.longitude = parseFloat(firstResult.lon);
        this.updateMapMarker();
        this.map?.setView([this.latitude, this.longitude], 13); // Zoom in on search result
        console.log('Location found:', firstResult);
      } else {
        console.warn('Location not found for the given address.');
      }
    } catch (error) {
      console.error('Error searching location:', error);
    }
  }

  /**
   * Generates a random DevEUI.
   */
  generateDevEUI(): void {
    this.devEUI = Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join('').toUpperCase();
    console.log('Generated DevEUI:', this.devEUI);
  }


  // NEW: Methods for Activation Settings
  /**
   * Generates a random 32-character hexadecimal string for App Key.
   */
  generateAppKey(): void {
    this.appKey = this.generateRandomHexString(32);
    console.log('Generated App Key:', this.appKey);
  }

  /**
   * Generates a random 8-character hexadecimal string for DevAddr.
   */
  generateDevAddr(): void {
    this.devAddr = this.generateRandomHexString(8);
    console.log('Generated DevAddr:', this.devAddr);
  }

  /**
   * Generates a random 32-character hexadecimal string for NwkSKey.
   */
  generateNwkSKey(): void {
    this.nwkSKey = this.generateRandomHexString(32);
    console.log('Generated NwkSKey:', this.nwkSKey);
  }

  /**
   * Generates a random 32-character hexadecimal string for AppSKey.
   */
  generateAppSKey(): void {
    this.appSKey = this.generateRandomHexString(32);
    console.log('Generated AppSKey:', this.appSKey);
  }

  /**
   * Helper function to generate a random hexadecimal string of a given length.
   */
  private generateRandomHexString(length: number): string {
    let result = '';
    const characters = '0123456789ABCDEF';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  }

  /**
   * Toggles the visibility of the App Key input field.
   */
  toggleAppKeyVisibility(): void {
    this.showAppKey = !this.showAppKey;
  }

  /**
   * Toggles the visibility of the NwkSKey input field.
   */
  toggleNwkSKeyVisibility(): void {
    this.showNwkSKey = !this.showNwkSKey;
  }

  /**
   * Toggles the visibility of the AppSKey input field.
   */
  toggleAppSKeyVisibility(): void {
    this.showAppSKey = !this.showAppSKey;
  }

  /**
   * Saves the new device data.
   */
  saveDevice(): void {
    if (!this.name || !this.devEUI || !this.selectedGatewayId || !this.region) {
      alert('Please fill in Name, DevEUI, Gateway and Region in the General tab.');
      this.activeSettingTab = 'General';
      return;
    }
    const newDeviceData = {
      isDeviceActive: this.active,
      name: this.name,
      devEUI: this.devEUI,
      region: this.region,
      gateway: this.selectedGatewayId,
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
        altitude: this.altitude
      }
    };
    console.log('Attempting to save new device:', newDeviceData);
    this.devEUI = newDeviceData.devEUI
    console.log("Device EUI before if: ", this.devEUI);
    if (!this.deviceCreatedForSession) {
      console.log("Device EUI after if: ", this.devEUI);
      this.appService.createDevice(newDeviceData).subscribe({
        next: (response) => {
          console.log('Device created successfully!', response);
          alert('Device created successfully!');
          this.deviceCreatedForSession = true;
        },
        error: (error) => {
          console.error('Error creating device:', error);
          alert('Failed to create device. Check console for details.');
        }
      });
      console.log("Device EUI before else: ", this.devEUI);
    }
    else {
      console.log("Device EUI after else: ", this.devEUI);
      this.appService.updateDevice(this.devEUI, newDeviceData).subscribe({
        next: (response) => {
          console.log('Device updated successfully!', response);
          alert('Device updated successfully!');
        },
        error: (error) => {
          console.log("devEUI: ", this.devEUI);
          console.error('Error updating device:', error);
          alert('Failed to update device. Check console for details.');
        }
      });
    }

  }
}