import { Component, inject, signal, computed, OnInit, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { Boulangerie } from '../../../core/models/boulangerie.models';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-boulangeries-list',
  standalone: true,
  imports: [RouterLink, LoadingSpinnerComponent, ConfirmDialogComponent, PageHeaderComponent],
  template: `
    <app-page-header title="Boulangeries" subtitle="Gérez vos sources d'approvisionnement" />

    <div class="flex justify-end mb-4">
      <a routerLink="/boulangeries/new" class="btn-primary">+ Ajouter</a>
    </div>

    @if (loading()) {
      <app-loading-spinner />
    } @else {
      <div class="space-y-3">
        @for (b of boulangeries(); track b.id) {
          <div class="card flex items-center justify-between">
            <div class="flex items-center gap-3">
              <span class="text-2xl">🥖</span>
              <div>
                <p class="font-medium text-gray-900 dark:text-gray-100">
                  {{ b.nom }}
                  @if (b.is_default) {
                    <span class="ml-2 text-xs bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full">Par défaut</span>
                  }
                </p>
                @if (b.contact) { <p class="text-xs text-gray-500 dark:text-gray-400">📞 {{ b.contact }}</p> }
                @if (b.prix_achat_pain) { <p class="text-xs text-gray-500 dark:text-gray-400">Prix achat: {{ b.prix_achat_pain }} {{ devise() }}</p> }
              </div>
            </div>
            @if (!b.is_default) {
              <div class="flex gap-2">
                <a [routerLink]="['/boulangeries', b.id, 'edit']" class="btn-secondary text-sm py-1 px-3">Modifier</a>
                <button (click)="confirmDelete(b)" class="btn-danger text-sm py-1 px-3">Supprimer</button>
              </div>
            }
          </div>
        }
        @if (boulangeries().length === 0) {
          <div class="card text-center py-12 text-gray-400">
            <div class="text-4xl mb-3">🥖</div>
            <p>Aucune boulangerie ajoutée</p>
          </div>
        }
      </div>
    }

    <app-confirm-dialog
      [visible]="showConfirm()"
      title="Supprimer la boulangerie"
      [message]="'Supprimer ' + (toDelete()?.nom ?? '') + ' ?'"
      (confirm)="doDelete()"
      (cancel)="showConfirm.set(false)"
    />
  `,
})
export class BoulangeriesListComponent implements OnInit {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private destroyRef = inject(DestroyRef);

  devise = computed(() => this.auth.currentUser()?.pays?.devise_code ?? '');
  boulangeries = signal<Boulangerie[]>([]);
  loading = signal(true);
  showConfirm = signal(false);
  toDelete = signal<Boulangerie | null>(null);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.api.getBoulangeries()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => { this.boulangeries.set(data); this.loading.set(false); },
        error: () => this.loading.set(false),
      });
  }

  confirmDelete(b: Boulangerie): void {
    this.toDelete.set(b);
    this.showConfirm.set(true);
  }

  doDelete(): void {
    const b = this.toDelete();
    if (!b) return;
    this.api.deleteBoulangerie(b.id).subscribe({ next: () => { this.showConfirm.set(false); this.load(); } });
  }
}
