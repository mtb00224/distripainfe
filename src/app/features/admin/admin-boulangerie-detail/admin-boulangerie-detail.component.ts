import { Component, inject, signal, OnInit } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AdminApiService } from '../../../core/services/admin-api.service';

@Component({
  selector: 'app-admin-boulangerie-detail',
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

        <!-- En-tête boulangerie -->
        <div class="bg-gray-800 rounded-xl border border-gray-700 p-5">
          <div class="flex items-start justify-between">
            <div class="flex items-center gap-4">
              <span class="text-4xl">🥖</span>
              <div>
                <h1 class="text-2xl font-bold text-white">{{ d.nom }}</h1>
                <div class="flex gap-4 text-sm text-gray-400 mt-1">
                  @if (d.contact) { <span>📞 {{ d.contact }}</span> }
                  @if (d.address) { <span>📍 {{ d.address }}</span> }
                  @if (d.admin_nom) { <span>👤 {{ d.admin_nom }}</span> }
                </div>
              </div>
            </div>
            <span class="text-xs px-3 py-1 rounded-full"
              [class.bg-green-900]="d.is_active" [class.text-green-400]="d.is_active"
              [class.bg-gray-700]="!d.is_active" [class.text-gray-400]="!d.is_active">
              {{ d.is_active ? 'Active' : 'Inactive' }}
            </span>
          </div>
        </div>

        <!-- KPIs -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div class="bg-gray-800 rounded-xl border border-gray-700 p-4 text-center">
            <p class="text-3xl font-bold text-white">{{ d.nb_sessions }}</p>
            <p class="text-xs text-gray-400 mt-1">Sessions production</p>
          </div>
          <div class="bg-gray-800 rounded-xl border border-gray-700 p-4 text-center">
            <p class="text-3xl font-bold text-white">{{ d.nb_pains_produits | number:'1.0-0' }}</p>
            <p class="text-xs text-gray-400 mt-1">Pains produits</p>
          </div>
          <div class="bg-gray-800 rounded-xl border border-gray-700 p-4 text-center">
            <p class="text-3xl font-bold text-green-400">{{ d.montant_encaisse | number:'1.0-0' }}</p>
            <p class="text-xs text-gray-400 mt-1">FCFA encaissé</p>
          </div>
          <div class="bg-gray-800 rounded-xl border border-gray-700 p-4 text-center">
            <p class="text-3xl font-bold"
              [class.text-amber-400]="d.benefice_net >= 0"
              [class.text-red-400]="d.benefice_net < 0">
              {{ d.benefice_net | number:'1.0-0' }}
            </p>
            <p class="text-xs text-gray-400 mt-1">FCFA bénéfice net</p>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Staff -->
          <section class="bg-gray-800 rounded-xl border border-gray-700 p-4">
            <h2 class="text-sm font-semibold text-gray-300 mb-3">
              Staff ({{ d.nb_staff }})
            </h2>
            @if (d.staff.length === 0) {
              <p class="text-gray-500 text-sm text-center py-4">Aucun membre de staff</p>
            } @else {
              <div class="space-y-2">
                @for (s of d.staff; track s.id) {
                  <div class="flex items-center justify-between">
                    <span class="text-white text-sm">{{ s.prenom }} {{ s.nom }}</span>
                    <span class="text-xs px-2 py-0.5 rounded-full bg-indigo-900/40 text-indigo-300">{{ s.role }}</span>
                  </div>
                }
              </div>
            }
          </section>

          <!-- Dernières dépenses -->
          <section class="bg-gray-800 rounded-xl border border-gray-700 p-4">
            <h2 class="text-sm font-semibold text-gray-300 mb-1">
              Dépenses
            </h2>
            <p class="text-2xl font-bold text-red-400 mb-3">{{ d.total_depenses | number:'1.0-0' }} <span class="text-sm text-gray-400">FCFA total</span></p>
            @if (d.dernieres_depenses.length === 0) {
              <p class="text-gray-500 text-sm text-center py-2">Aucune dépense enregistrée</p>
            } @else {
              <div class="space-y-1.5">
                @for (dep of d.dernieres_depenses; track dep.motif) {
                  <div class="flex items-center justify-between text-xs">
                    <div>
                      <span class="text-white">{{ dep.motif }}</span>
                      <span class="text-gray-500 ml-2">{{ dep.categorie }}</span>
                    </div>
                    <span class="text-red-400 font-medium">{{ dep.montant | number:'1.0-0' }}</span>
                  </div>
                }
              </div>
              <p class="text-xs text-gray-500 mt-2">10 dernières dépenses</p>
            }
          </section>
        </div>
      }
    </div>
  `,
})
export class AdminBoulangerieDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private adminApi = inject(AdminApiService);

  detail = signal<any>(null);
  loading = signal(true);

  ngOnInit(): void {
    this.adminApi.loadToken();
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.adminApi.getBoulangerieDetail(id).subscribe({
      next: (d) => { this.detail.set(d); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }
}
