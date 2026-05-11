// src/app/core/services/modal.service.ts
import { Injectable, Type, ViewContainerRef, ComponentRef, inject } from '@angular/core';

export interface ModalOptions {
  title?: string;
  data?: any;
  closeOnBackdrop?: boolean;
}

@Injectable({ providedIn: 'root' })
export class ModalService {
  private viewContainerRef!: ViewContainerRef;
  private modalComponentRef?: ComponentRef<any>;

  // Метод для реєстрації контейнера (зазвичай у AppComponent)
  setRootViewContainerRef(vcr: ViewContainerRef) {
    this.viewContainerRef = vcr;
  }

  open<T>(component: Type<T>, options: ModalOptions = {}) {
    if (this.modalComponentRef) this.close();

    // Створюємо компонент динамічно
    this.modalComponentRef = this.viewContainerRef.createComponent(component);
    
    // Передаємо дані в компонент, якщо потрібно
    if (options.data) {
      Object.assign(this.modalComponentRef.instance, options.data);
    }

    return this.modalComponentRef.instance;
  }

  close() {
    if (this.modalComponentRef) {
      this.modalComponentRef.destroy();
      this.modalComponentRef = undefined;
    }
  }
}