import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddGatewaysComponent } from './add-gateways.component';

describe('AddGatewaysComponent', () => {
  let component: AddGatewaysComponent;
  let fixture: ComponentFixture<AddGatewaysComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AddGatewaysComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddGatewaysComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
