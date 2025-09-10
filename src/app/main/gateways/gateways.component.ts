import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AppService } from '../../app.service';
import { MatDialog } from '@angular/material/dialog';
import { ColDef, ICellRendererParams, RowSelectedEvent } from 'ag-grid-community';
import { ActionButtonComponent } from '../action-button/action-button.component';
import * as L from 'leaflet';

const iconDefault = L.icon({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = iconDefault;

@Component({
  selector: 'app-gateways',
  templateUrl: './gateways.component.html',
  styleUrls: ['./gateways.component.scss']
})

export class GatewaysComponent implements OnInit, AfterViewInit {
  gateways: any[] = [];
  selectedRow: any[] = [];
  rowData: any[] = [];
  colDefs: ColDef[] = [
    { field: "select", headerName: "", checkboxSelection: true, headerCheckboxSelection: true, flex: 0.3 },
    {
      field: "status",
      headerName: "Status",
      flex: 0.6,
      cellRenderer: (params: ICellRendererParams) => {
        const status = params.data?.currentStatus;
        let color = status === 'playing' ? 'green' : 'red';
        return `<div style="display: flex; align-items: center; justify-content: left; height: 100%;">
                  <div style="width: 20px; height: 20px; border-radius: 50%; background-color: ${color};"></div>
                </div>`;
      },
    },
    { field: "name", headerName: "Name", filter: 'agTextColumnFilter', flex: 2 },
    { field: "macAddress", headerName: "MAC Address", filter: 'agTextColumnFilter', flex: 2 },
    { field: "type", headerName: "Type", filter: 'agTextColumnFilter', flex: 1.5 },
    { field: "no_of_devices", headerName: "No. of Devices", filter: 'agTextColumnFilter', flex: 1.5 },
    {
      field: "action",
      headerName: "Actions",
      flex: 1.5,
      cellRenderer: ActionButtonComponent,
      suppressMenu: true,
      filter: false,
      sortable: false,
      cellRendererParams: {
        type: 'gateway',
      },
    }
  ];
  paginationPageSizeSelector = [5, 10, 20, 50, 100, 200];
  
  private map!: L.Map;

  // ViewChild for resizable panels, using the non-null assertion operator "!"
  @ViewChild('tableContainer') tableContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('mapContainer') mapContainer!: ElementRef<HTMLDivElement>;

  private isDragging = false;
  
  constructor(private appService: AppService, private router: Router, private route: ActivatedRoute, private dialog: MatDialog) { }

  ngOnInit(): void {
    this.initMap();
    this.loadGateways();
  }

  ngAfterViewInit(): void {
    // this.initMap();
    this.loadGateways(); 
  }

  // Resizing logic
  onDragStart(event: MouseEvent) {
    this.isDragging = true;
    document.body.style.cursor = 'ns-resize';
    document.addEventListener('mousemove', this.onDragging);
    document.addEventListener('mouseup', this.onDragEnd);
  }

  private onDragging = (event: MouseEvent) => {
    if (!this.isDragging) return;

    const container = this.tableContainer.nativeElement.parentElement;
    if (!container) return; // Add a null check here

    const totalHeight = container.offsetHeight;
    const tableHeight = event.clientY - container.getBoundingClientRect().top;
    const mapHeight = totalHeight - tableHeight;

    if (tableHeight > 100 && mapHeight > 100) { // Min height of 100px
      this.tableContainer.nativeElement.style.height = `${tableHeight}px`;
      this.mapContainer.nativeElement.style.height = `${mapHeight}px`;
      if (this.map) {
        this.map.invalidateSize(); // Important to redraw the map after resizing
      }
    }
  }

  private onDragEnd = () => {
    this.isDragging = false;
    document.body.style.cursor = '';
    document.removeEventListener('mousemove', this.onDragging);
    document.removeEventListener('mouseup', this.onDragEnd);
  }


  private initMap(): void {
    const mapElement = document.getElementById('map');
    if (mapElement) {
      this.map = L.map('map', {
        center: [20.5937, 78.9629],
        zoom: 5
      });
  
      const tiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
        minZoom: 3,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      });
  
      tiles.addTo(this.map);
      
      // Add this line to force the map to redraw after initialization
      this.map.invalidateSize(); 
    }
  }

  private addMarkers(gateways: any[]): void {
    if (!this.map) return;
    // ... clear existing markers
    gateways.forEach(gateway => {
      console.log(`Gateway: ${gateway.name}, Lat: ${gateway.location.latitude}, Lng: ${gateway.location.longitude}`); // <--- Add this line
      if (gateway.location.latitude && gateway.location.longitude) {
        // L.marker([gateway.latitude, gateway.longitude])
        //   .addTo(this.map)
        //   .bindPopup(`<b>${gateway.name}</b><br>${gateway.macAddress}`);
        L.marker([parseFloat(gateway.location.latitude), parseFloat(gateway.location.longitude)])
        .addTo(this.map).bindPopup(`<b>${gateway.name}</b>`);
      }
    });
  }

  loadGateways(): void {
    this.appService.getGateways().subscribe({
      next: (response) => {
        console.log('API Response:', response);
        this.rowData = response.response;
        this.rowData.forEach(gateway => {
          gateway.type = gateway.typeGateway ? 'Virtual' : 'Real';
        });
        this.addMarkers(this.rowData);
        // this.gateways = response.response.map((gateway: any) => ({
        //   ...gateway,
        //   currentStatus: gateway.currentStatus || 'paused',
        //   uplinkStatus: gateway.uplinkStatus || 'stopped'
        // }));
      },
      error: (err) => {
        console.error('Failed to fetch gateways:', err);
      }
    });
  }

  onRowSelected(event: RowSelectedEvent) {
    this.selectedRow = event.api.getSelectedNodes().map(node => node.data);
    console.log('Selected Rows:', this.selectedRow);
  }

  navigateToAddGatewayPage(): void {
    this.router.navigate(['/addGateways']); 
    console.log('Navigating to Add New Device page');
  }

  navigateToEditGatewayPage(): void {
    if (this.selectedRow && this.selectedRow.length === 1) {
      const gatewayId = this.selectedRow[0]._id.$oid;
      this.router.navigate(['/edit-gateway', gatewayId]);
      console.log('Navigating to Edit Gateway page for ID:', gatewayId);
    } else {
      console.warn('Please select exactly one gateway to edit.');
    }
  }

  deleteGateway(): void {
    if (this.selectedRow && this.selectedRow.length > 0) {
      const gatewayIds = this.selectedRow.map(row => row._id.$oid);
      const confirmation = confirm(`Are you sure you want to delete ${gatewayIds.length} selected gateway(s)?`);
      if (confirmation) {
        gatewayIds.forEach(id => {
          this.appService.deleteGateway(id).subscribe({
            next: (response) => {
              console.log('Gateway deleted successfully:', response);
              this.loadGateways();
            },
            error: (error) => {
              console.error('Error deleting gateway:', error);
            }
          });
        });
        this.selectedRow = [];
      }
    } else {
      console.warn('Please select at least one gateway to delete.');
    }
  }
}