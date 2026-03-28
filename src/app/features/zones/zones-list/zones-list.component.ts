import { Component, inject, signal, OnInit, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { Zone } from '../../../core/models/zone.models';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-zones-list',
  standalone: true,
  imports: [RouterLink, LoadingSpinnerComponent, ConfirmDialogComponent, PageHeaderComponent],
  template: `
    <app-page-header title="Zones de livraison" subtitle="Organisez vos secteurs de distribution" />
    <div class="flex justify-end mb-4">
      <a routerLink="/zones/new" class="btn-primary">+ Ajouter une zone</a>
    </div>
    @if (loading()) { <app-loading-spinner /> }
    @else {
      <div class="space-y-3">
        @for (z of zones(); track z.id) {
          <div class="card flex items-center justify-between">
            <div class="flex items-center gap-3">
              <span class="text-2xl">🗺️</span>
              <div>
                <p class="font-medium text-gray-900 dark:text-gray-100">{{ z.nom }}</p>
                @if (z.description) { <p class="text-sm text-gray-500 dark:text-gray-400">{{ z.description }}</p> }
              </div>
            </div>
            <div class="flex gap-2">
              <a [routerLink]="['/zones', z.id, 'edit']" class="btn-secondary text-sm py-1 px-3">Modifier</a>
              <button (click)="confirmDelete(z)" class="btn-danger text-sm py-1 px-3">Supprimer</button>
            </div>
          </div>
        }
        @if (zones().length === 0) {
          <div class="card text-center py-12 text-gray-400">
            <div class="text-4xl mb-3">🗺️</div>
            <p>Aucune zone créée</p>
          </div>
        }
      </div>
    }
    <app-confirm-dialog [visible]="showConfirm()" title="Supprimer la zone" [message]="'Supprimer ' + (toDelete()?.nom ?? '') + ' ?'"
      (confirm)="doDelete()" (cancel)="showConfirm.set(false)" />
  `,
})
export class ZonesListComponent implements OnInit {
  private api = inject(ApiService);
  private destroyRef = inject(DestroyRef);
  zones = signal<Zone[]>([]);
  loading = signal(true);
  showConfirm = signal(false);
  toDelete = signal<Zone | null>(null);

  ngOnInit() { this.load(); }
  load() {
    this.loading.set(true);
    this.api.getZones()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: (d) => { this.zones.set(d); this.loading.set(false); }, error: () => this.loading.set(false) });
  }
  confirmDelete(z: Zone) { this.toDelete.set(z); this.showConfirm.set(true); }
  doDelete() { this.api.deleteZone(this.toDelete()!.id).subscribe({ next: () => { this.showConfirm.set(false); this.load(); } }); }
}
