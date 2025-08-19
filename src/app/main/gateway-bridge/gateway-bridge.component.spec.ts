import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GatewayBridgeComponent } from './gateway-bridge.component';

describe('GatewayBridgeComponent', () => {
  let component: GatewayBridgeComponent;
  let fixture: ComponentFixture<GatewayBridgeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [GatewayBridgeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GatewayBridgeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
