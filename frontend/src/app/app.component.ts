import { Component, inject, OnInit, ViewContainerRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MapComponent } from './features/map/map.component';
import { HeaderComponent, FooterComponent } from './shared/components';
import { RouterModule } from '@angular/router';
import { ToastComponent } from './shared/components/toast/toast.component';
import { LoadingComponent } from './shared/components/loading/loading.component';
import { AuthService } from './core/services/auth.service';
import { ModalService } from '@core/services/modal.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    HeaderComponent, 
    FooterComponent,
    LoadingComponent,
    ToastComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  
  constructor(
    private auth: AuthService,
    private modalService: ModalService, vcr: ViewContainerRef
  ) {
    this.auth.currentUser$.subscribe();
    modalService.setRootViewContainerRef(vcr);
  }

  ngOnInit() {}

}