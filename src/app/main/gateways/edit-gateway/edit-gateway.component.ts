import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import * as L from 'leaflet';
import { AppService } from '../../../app.service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-edit-gateway',
  templateUrl: './edit-gateway.component.html',
  styleUrls: ['./edit-gateway.component.scss']
})
export class EditGatewayComponent implements OnInit, AfterViewInit, OnDestroy {
  selectedGatewayType: 'virtual' | 'real' = 'virtual';

  // Virtual Gateway properties
  virtualActive: boolean = true;
  virtualGatewayName: string = '';
  virtualMacAddress: string = '';
  virtualKeepAlive: number = 30;

  // Real Gateway properties
  realActive: boolean = true;
  realGatewayName: string = '';
  realMacAddress: string = '';
  realIpv4: string = '';
  realPort: string = '';

  // Map properties (reused for both forms)
  latitude: number = 0;
  longitude: number = 0;
  altitude: number | undefined;
  locationAddress: string = 'Device Location'; // New property to hold the address

  searchAddress: string = '';
  showSearchBox: boolean = false;

  private map: L.Map | undefined;
  private marker: L.Marker | undefined;

  gatewayId: string | null = null;
  isEditMode: boolean = true;

  constructor(private appService: AppService, private route: ActivatedRoute, private router: Router) { }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.gatewayId = params.get('id');
      if (this.gatewayId) {
        // Load gateway data first. The map will be initialized after the data is fetched.
        this.loadGatewayData(this.gatewayId);
      } else {
        console.error('No gateway ID provided for editing.');
        this.router.navigate(['/gateways']);
      }
    });
  }

  ngAfterViewInit(): void {
    // We intentionally don't call initMap() here for edit mode.
    // It's called after the async data load to ensure it uses the correct coordinates.
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
      this.map = undefined;
    }
  }

  loadGatewayData(id: string): void {
    this.appService.getSingleGateway(id).subscribe({
      next: (response) => {
        const gatewayData = response.response;
        if (gatewayData.typeGateway) {
          this.selectedGatewayType = 'virtual';
          this.virtualActive = gatewayData.active;
          this.virtualGatewayName = gatewayData.name;
          this.virtualMacAddress = gatewayData.macAddress;
          this.virtualKeepAlive = gatewayData.keepAlive;
        } else {
          this.selectedGatewayType = 'real';
          this.realActive = gatewayData.active;
          this.realGatewayName = gatewayData.name;
          this.realMacAddress = gatewayData.macAddress;
          this.realIpv4 = gatewayData.ip;
          this.realPort = gatewayData.port;
        }
        this.latitude = gatewayData.location?.latitude || 0;
        this.longitude = gatewayData.location?.longitude || 0;
        this.altitude = gatewayData.location?.altitude;

        // The key change: Call initMap() AFTER the data has been loaded.
        this.initMap();
        // Also, immediately reverse geocode the loaded coordinates.
        this.reverseGeocode(this.latitude, this.longitude);
      },
      error: (err) => {
        console.error('Failed to fetch gateway data:', err);
      }
    });
  }

  private initMap(): void {
    if (this.map) {
      this.map.remove();
    }
    this.map = L.map('map').setView([this.latitude, this.longitude], 6);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(this.map);

    const defaultIcon = L.icon({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      tooltipAnchor: [16, -28],
      shadowSize: [41, 41]
    });

    L.Marker.prototype.options.icon = defaultIcon;

    // Use the locationAddress property for the initial popup content.
    this.marker = L.marker([this.latitude, this.longitude]).addTo(this.map)
      .bindPopup(this.locationAddress)
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

  updateMapMarker(): void {
    if (this.map && this.marker && this.latitude !== null && this.longitude !== null) {
      const newLatLng = new L.LatLng(this.latitude, this.longitude);
      this.marker.setLatLng(newLatLng);
      this.map.setView(newLatLng, this.map.getZoom() || 13);
    } else if (this.map && this.latitude !== null && this.longitude !== null) {
      this.marker = L.marker([this.latitude, this.longitude]).addTo(this.map);
      this.map.setView([this.latitude, this.longitude], this.map.getZoom() || 13);
    }
    // After updating the marker position, perform reverse geocoding.
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

    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(this.searchAddress)}`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (data && data.length > 0) {
        const firstResult = data[0];
        this.latitude = parseFloat(firstResult.lat);
        this.longitude = parseFloat(firstResult.lon);
        // The updateMapMarker() call will now handle the reverse geocoding
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

  generateMacAddress(type: 'virtual' | 'real'): void {
    let mac = '';
    mac = Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join('').toUpperCase();
    //for (let i = 0; i < 6; i++) {
      //mac += Math.floor(Math.random() * 256).toString(16).padStart(2, '0');
      //if (i < 5) {
        //mac += ':';
      //}
    //}
    if (type === 'virtual') {
      this.virtualMacAddress = mac;
    } else {
      this.realMacAddress = mac;
    }
  }

  selectGatewayType(type: 'virtual' | 'real'): void {
    this.selectedGatewayType = type;
    // When the gateway type changes, we still need to re-initialize the map.
    setTimeout(() => {
      this.initMap();
      this.reverseGeocode(this.latitude, this.longitude);
    }, 0);
  }

  updateGateway(): void {
    let gatewayData: any;
    if (this.selectedGatewayType === 'virtual') {
      gatewayData = {
        active: this.virtualActive,
        name: this.virtualGatewayName,
        macAddress: this.virtualMacAddress,
        keepAlive: this.virtualKeepAlive,
        typeGateway: true,
        location: {
          latitude: this.latitude,
          longitude: this.longitude,
          altitude: this.altitude
        },
        ip: '',
        port: ''
      };
    } else {
      gatewayData = {
        active: this.realActive,
        name: this.realGatewayName,
        macAddress: this.realMacAddress,
        keepAlive: 0,
        typeGateway: false,
        ip: this.realIpv4,
        port: this.realPort,
        location: {
          latitude: this.latitude,
          longitude: this.longitude,
          altitude: this.altitude
        }
      };
    }

    this.appService.updateGateway(this.gatewayId!, gatewayData).subscribe({
      next: (response) => {
        console.log('Gateway updated successfully:', response);
        this.router.navigate(['/gateways']);
      },
      error: (error) => {
        console.error('Error updating gateway:', error);
      }
    });
  }
}
