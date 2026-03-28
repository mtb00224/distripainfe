import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe, DecimalPipe } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';
import { Client } from '../../../core/models/client.models';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-client-detail',
  standalone: true,
  imports: [RouterLink, DecimalPipe, DatePipe, LoadingSpinnerComponent, StatusBadgeComponent, PageHeaderComponent],
  template: `
    @if (client()) {
      <app-page-header [title]="client()!.nom" [subtitle]="client()!.zone?.nom" />
    } @else {
      <app-page-header title="Client" />
    }

    @if (loading()) {
      <app-loading-spinner />
    } @else if (client()) {
      <!-- Solde card -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div class="card text-center">
          <div class="text-2xl font-bold" [class.text-red-600]="client()!.solde_actuel > 0" [class.text-green-600]="client()!.solde_actuel <= 0">
            {{ client()!.solde_actuel | number:'1.0-0' }} {{ client()!.pays?.devise_code ?? '' }}
          </div>
          <div class="text-xs text-gray-500 mt-1">Solde actuel</div>
        </div>
        <div class="card text-center">
          <div class="text-2xl font-bold text-gray-700">{{ historique()?.total_livraisons ?? 0 }}</div>
          <div class="text-xs text-gray-500 mt-1">Livraisons totales</div>
        </div>
        <div class="card text-center">
          <div class="text-2xl font-bold text-emerald-600">{{ (historique()?.total_encaisse ?? 0) | number:'1.0-0' }} {{ client()!.pays?.devise_code ?? '' }}</div>
          <div class="text-xs text-gray-500 mt-1">Total encaissé</div>
        </div>
      </div>

      <div class="flex gap-3 mb-6">
        <a [routerLink]="['/clients', client()!.id, 'edit']" class="btn-secondary text-sm">✏️ Modifier</a>
        <a routerLink="/encaissements/new" [queryParams]="{ client_id: client()!.id }" class="btn-primary text-sm">💰 Encaisser</a>
      </div>

      <!-- Encaissements -->
      @if (recentEncaissements().length) {
        <div class="card mb-4">
          <h2 class="section-title mb-3">Encaissements récents</h2>
          <div class="space-y-2">
            @for (e of recentEncaissements(); track e.id) {
              <div class="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                <div>
                  <p class="text-sm font-medium">{{ e.date_encaissement | date:'dd/MM/yyyy' }}</p>
                  <p class="text-xs text-gray-500">{{ e.type }}</p>
                </div>
                <span class="font-semibold text-green-600">+ {{ e.montant | number:'1.0-0' }} {{ client()!.pays?.devise_code ?? '' }}</span>
              </div>
            }
          </div>
        </div>
      }

      <!-- Livraisons non payées -->
      @if (unpaidLivraisons().length) {
        <div class="card">
          <h2 class="section-title mb-3">Livraisons non soldées</h2>
          <div class="space-y-2">
            @for (l of unpaidLivraisons(); track l.id) {
              <div class="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                <div>
                  <p class="text-sm font-medium">{{ l.created_at | date:'dd/MM/yyyy' }}</p>
                  <p class="text-xs text-gray-500">{{ l.nb_pains_livres }} pains</p>
                </div>
                <span class="font-semibold text-red-600">{{ l.montant_du | number:'1.0-0' }} {{ client()!.pays?.devise_code ?? '' }}</span>
              </div>
            }
          </div>
        </div>
      }
    }
  `,
})
export class ClientDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private api = inject(ApiService);

  client = signal<Client | null>(null);
  historique = signal<any>(null);
  loading = signal(true);

  recentEncaissements = computed(() => {
    const h = this.historique();
    if (!h?.encaissements) return [];
    return h.encaissements.slice(0, 5);
  });

  unpaidLivraisons = computed(() => {
    const h = this.historique();
    if (!h?.livraisons) return [];
    return h.livraisons.filter((l: any) => !l.is_paid).slice(0, 10);
  });

  ngOnInit(): void {
    const id = +this.route.snapshot.paramMap.get('id')!;
    this.api.getClient(id).subscribe((c) => {
      this.client.set(c);
      this.api.getClientHistorique(id).subscribe((h) => {
        this.historique.set(h);
        this.loading.set(false);
      });
    });
  }
}
