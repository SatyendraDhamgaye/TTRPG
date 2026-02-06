import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MapCanvas } from './map-canvas';

describe('MapCanvas', () => {
  let component: MapCanvas;
  let fixture: ComponentFixture<MapCanvas>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MapCanvas]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MapCanvas);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
