import { Component, inject, signal, OnInit } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AdminApiService } from '../../../core/services/admin-api.service';

@Component({
  selector: 'app-admin-gerant-detail',
  standalone: true,
  imports: [DecimalPipe, RouterLink],
  template: `
    <div class="p-6 space-y-6">
      <div class="flex items-center gap-3">
        <a routerLink="/admin/boulangeries" class="text-gray-400 hover:text-white text-sm">← Retour</a>
      </div>

      @if (loading()) {
        <div class="text-gray-400 py-12 text-center">Chargement...</div>
      } @else if (detail()) {
        @let d = detail()!;

        <!-- En-tête gérant -->
        <div class="bg-gray-800 rounded-xl border border-gray-700 p-5">
          <div class="flex items-start justify-between">
            <div class="flex items-center gap-4">
              <span class="text-4xl">🏪</span>
              <div>
                <h1 class="text-2xl font-bold text-white">{{ d.first_name }} {{ d.last_name }}</h1>
                <div class="flex gap-4 text-sm text-gray-400 mt-1">
                  @if (d.email) { <span>✉️ {{ d.email }}</span> }
                  @if (d.phone_number) { <span>📞 {{ d.phone_number }}</span> }
                  <span>{{ d.nb_boulangeries }} boulangerie(s)</span>
                </div>
              </div>
            </div>
            <span class="text-xs px-3 py-1 rounded-full"
              [class.bg-green-900]="d.is_active" [class.text-green-400]="d.is_active"
              [class.bg-gray-700]="!d.is_active" [class.text-gray-400]="!d.is_active">
              {{ d.is_active ? 'Actif' : 'Inactif' }}
            </span>
          </div>
        </div>

        <!-- KPIs globaux -->
        <div class="grid grid-cols-3 gap-3">
          <div class="bg-gray-800 rounded-xl border border-gray-700 p-4 text-center">
            <p class="text-3xl font-bold text-green-400">{{ d.montant_encaisse_global | number:'1.0-0' }}</p>
            <p class="text-xs text-gray-400 mt-1">FCFA encaissé (global)</p>
          </div>
          <div class="bg-gray-800 rounded-xl border border-gray-700 p-4 text-center">
            <p class="text-3xl font-bold text-red-400">{{ d.total_depenses_global | number:'1.0-0' }}</p>
            <p class="text-xs text-gray-400 mt-1">FCFA dépenses (global)</p>
          </div>
          <div class="bg-gray-800 rounded-xl border border-gray-700 p-4 text-center">
            <p class="text-3xl font-bold"
              [class.text-amber-400]="d.benefice_net_global >= 0"
              [class.text-red-400]="d.benefice_net_global < 0">
              {{ d.benefice_net_global | number:'1.0-0' }}
            </p>
            <p class="text-xs text-gray-400 mt-1">FCFA bénéfice net</p>
          </div>
        </div>

        <!-- Boulangeries -->
        <section>
          <h2 class="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Ses boulangeries</h2>
          <div class="space-y-3">
            @for (b of d.boulangeries; track b.id) {
              <div class="bg-gray-800 rounded-xl border border-gray-700 p-4">
                <div class="flex items-start justify-between mb-3">
                  <div>
                    <p class="text-white font-semibold">{{ b.nom }}</p>
                    <div class="flex gap-3 text-xs text-gray-400 mt-0.5">
                      @if (b.contact) { <span>{{ b.contact }}</span> }
                      @if (b.address) { <span>{{ b.address }}</span> }
                    </div>
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="text-xs px-2 py-0.5 rounded-full"
                      [class.bg-green-900]="b.is_active" [class.text-green-400]="b.is_active"
                      [class.bg-gray-700]="!b.is_active" [class.text-gray-400]="!b.is_active">
                      {{ b.is_active ? 'Active' : 'Inactive' }}
                    </span>
                    <a [routerLink]="['/admin/boulangeries/detail', b.id]"
                      class="text-xs text-indigo-400 hover:text-indigo-300">Détail →</a>
                  </div>
                </div>
                <div class="grid grid-cols-4 gap-2 text-center text-xs">
                  <div class="bg-gray-700/50 rounded-lg p-2">
                    <p class="font-bold text-white text-lg">{{ b.nb_sessions }}</p>
                    <p class="text-gray-400">Sessions</p>
                  </div>
                  <div class="bg-gray-700/50 rounded-lg p-2">
                    <p class="font-bold text-white text-lg">{{ b.nb_pains_produits | number:'1.0-0' }}</p>
                    <p class="text-gray-400">Pains produits</p>
                  </div>
                  <div class="bg-gray-700/50 rounded-lg p-2">
                    <p class="font-bold text-green-400 text-lg">{{ b.montant_encaisse | number:'1.0-0' }}</p>
                    <p class="text-gray-400">FCFA encaissé</p>
                  </div>
                  <div class="bg-gray-700/50 rounded-lg p-2">
                    <p class="font-bold text-red-400 text-lg">{{ b.total_depenses | number:'1.0-0' }}</p>
                    <p class="text-gray-400">FCFA dépenses</p>
                  </div>
                </div>
              </div>
            }
          </div>
        </section>
      }
    </div>
  `,
})
export class AdminGerantDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private adminApi = inject(AdminApiService);

  detail = signal<any>(null);
  loading = signal(true);

  ngOnInit(): void {
    this.adminApi.loadToken();
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.adminApi.getAdminBoulangerieDetail(id).subscribe({
      next: (d) => { this.detail.set(d); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }
}
