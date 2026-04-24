import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { Acolyte, AVAILABLE_PERMISSIONS } from '../../../core/models/acolyte.models';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-acolytes-list',
  standalone: true,
  imports: [RouterLink, LoadingSpinnerComponent, ConfirmDialogComponent, PageHeaderComponent],
  template: `
    <app-page-header title="Acolytes" subtitle="Gérez vos sous-comptes (max. 2)" />
    @if (deleteError()) {
      <div class="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">{{ deleteError() }}</div>
    }
    <div class="flex justify-end mb-4">
      @if (acolytes().length < 2) {
        <a routerLink="/acolytes/new" class="btn-primary">+ Ajouter un acolyte</a>
      }
    </div>
    @if (loading()) { <app-loading-spinner /> }
    @else {
      <div class="space-y-4">
        @for (a of acolytes(); track a.id) {
          <div class="card">
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center gap-3">
                <span class="text-2xl">👤</span>
                <div>
                  <p class="font-medium text-gray-900 dark:text-gray-100">{{ a.first_name }} {{ a.last_name }}</p>
                  <p class="text-sm text-gray-500 dark:text-gray-400">{{ a.username }}{{ a.email ? ' · ' + a.email : '' }}</p>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-xs px-2 py-1 rounded-full" [class.bg-green-100]="a.is_active" [class.text-green-700]="a.is_active"
                  [class.bg-gray-100]="!a.is_active" [class.text-gray-500]="!a.is_active">
                  {{ a.is_active ? 'Actif' : 'Inactif' }}
                </span>
                @if (a.is_default_password) {
                  <span class="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">⚠️ Mdp par défaut</span>
                }
              </div>
            </div>
            <!-- Permissions -->
            <div class="flex flex-wrap gap-1 mb-3">
              @for (perm of getPermissionLabels(a.permissions); track perm) {
                <span class="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">{{ perm }}</span>
              }
              @if (!a.permissions.length) {
                <span class="text-xs text-gray-400">Aucune permission accordée</span>
              }
            </div>
            <div class="flex gap-2">
              <a [routerLink]="['/acolytes', a.id, 'edit']" class="btn-secondary text-sm py-1 px-3">Modifier</a>
              <button (click)="confirmDelete(a)" class="btn-danger text-sm py-1 px-3">Supprimer</button>
            </div>
          </div>
        }
        @if (!acolytes().length) {
          <div class="card text-center py-12 text-gray-400">
            <div class="text-4xl mb-3">👤</div>
            <p>Aucun acolyte créé</p>
            <p class="text-sm mt-1">Vous pouvez créer jusqu'à 2 acolytes</p>
          </div>
        }
      </div>
    }
    <app-confirm-dialog [visible]="showConfirm()" title="Désactiver l'acolyte" [message]="'Désactiver ' + (toDelete()?.first_name ?? '') + ' ' + (toDelete()?.last_name ?? '') + ' ?'"
      (confirm)="doDelete()" (cancel)="showConfirm.set(false)" />
  `,
})
export class AcolytesListComponent implements OnInit {
  private api = inject(ApiService);
  acolytes = signal<Acolyte[]>([]);
  loading = signal(true);
  showConfirm = signal(false);
  toDelete = signal<Acolyte | null>(null);

  ngOnInit() { this.load(); }
  load() { this.api.getAcolytes().subscribe({ next: (d) => { this.acolytes.set(d); this.loading.set(false); }, error: () => this.loading.set(false) }); }
  confirmDelete(a: Acolyte) { this.toDelete.set(a); this.showConfirm.set(true); }
  deleteError = signal('');
  doDelete() {
    this.api.deleteAcolyte(this.toDelete()!.id).subscribe({
      next: () => { this.showConfirm.set(false); this.deleteError.set(''); this.load(); },
      error: () => { this.showConfirm.set(false); this.deleteError.set('Impossible de supprimer cet acolyte. Réessayez.'); },
    });
  }

  getPermissionLabels(perms: string[]): string[] {
    return perms.map((p) => AVAILABLE_PERMISSIONS.find((x) => x.key === p)?.label ?? p);
  }
}
