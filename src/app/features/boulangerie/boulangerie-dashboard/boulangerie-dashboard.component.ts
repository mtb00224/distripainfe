import { Component, inject, signal, effect } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AdminBoulangerieService } from '../../../core/services/admin-boulangerie.service';
import { BoulangerieResponse, LivreurLinkResponse, StaffResponse } from '../../../core/models/admin_boulangerie.models';

@Component({
  selector: 'app-boulangerie-dashboard',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="space-y-6">
      <!-- Welcome -->
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Bonjour, {{ profile()?.first_name }} 👋
        </h1>
        @if (boulangerieActive()) {
          <p class="text-gray-500 dark:text-gray-400 mt-1">
            Vous gérez actuellement <strong>{{ boulangerieActive()!.nom }}</strong>
          </p>
        } @else {
          <p class="text-amber-600 mt-1">Aucune boulangerie active — créez-en une ou sélectionnez-en une dans le menu.</p>
        }
      </div>

      <!-- Stats cards -->
      @if (boulangerieActive()) {
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="card text-center">
            <div class="text-3xl font-bold text-amber-600">{{ staff().length }}</div>
            <div class="text-sm text-gray-500 mt-1">Membres du staff</div>
          </div>
          <div class="card text-center">
            <div class="text-3xl font-bold text-amber-600">{{ livreurs().length }}</div>
            <div class="text-sm text-gray-500 mt-1">Livreurs liés</div>
          </div>
          <div class="card text-center">
            <div class="text-3xl font-bold text-amber-600">{{ profile()?.boulangeries?.length ?? 0 }}</div>
            <div class="text-sm text-gray-500 mt-1">Boulangeries</div>
          </div>
          <div class="card text-center">
            <div class="text-3xl font-bold text-amber-600">
              {{ boulangerieActive()!.prix_vente_pain ?? '—' }}
            </div>
            <div class="text-sm text-gray-500 mt-1">Prix vente pain</div>
          </div>
        </div>

        <!-- Quick links -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a routerLink="/boulangerie/staff"
            class="card flex items-center gap-4 hover:border-amber-200 dark:hover:border-amber-700 transition-colors cursor-pointer">
            <span class="text-3xl">👥</span>
            <div>
              <p class="font-medium text-gray-900 dark:text-gray-100">Gérer le staff</p>
              <p class="text-sm text-gray-500">{{ staff().length }} membre(s)</p>
            </div>
          </a>
          <a routerLink="/boulangerie/livreurs"
            class="card flex items-center gap-4 hover:border-amber-200 dark:hover:border-amber-700 transition-colors cursor-pointer">
            <span class="text-3xl">🚚</span>
            <div>
              <p class="font-medium text-gray-900 dark:text-gray-100">Gérer les livreurs</p>
              <p class="text-sm text-gray-500">{{ livreurs().length }} livreur(s) lié(s)</p>
            </div>
          </a>
          <a routerLink="/boulangerie/boulangeries"
            class="card flex items-center gap-4 hover:border-amber-200 dark:hover:border-amber-700 transition-colors cursor-pointer">
            <span class="text-3xl">🥖</span>
            <div>
              <p class="font-medium text-gray-900 dark:text-gray-100">Mes boulangeries</p>
              <p class="text-sm text-gray-500">{{ profile()?.boulangeries?.length ?? 0 }} boulangerie(s)</p>
            </div>
          </a>
        </div>
      } @else {
        <!-- No active boulangerie CTA -->
        <div class="card text-center py-12">
          <div class="text-5xl mb-4">🥖</div>
          <p class="text-gray-600 dark:text-gray-400 mb-4">
            Commencez par créer votre première boulangerie
          </p>
          <a routerLink="/boulangerie/boulangeries" class="btn-primary inline-block">
            Créer une boulangerie
          </a>
        </div>
      }
    </div>
  `,
})
export class BoulangerieDashboardComponent {
  private service = inject(AdminBoulangerieService);

  profile = this.service.profile;
  boulangerieActive = this.service.boulangerieActive;
  staff = signal<StaffResponse[]>([]);
  livreurs = signal<LivreurLinkResponse[]>([]);

  constructor() {
    effect(() => {
      if (this.service.boulangerieActiveId() !== null) {
        this.loadData();
      }
    });
  }

  loadData(): void {
    this.service.getStaff().subscribe({ next: (d) => this.staff.set(d), error: () => {} });
    this.service.getLivreurs().subscribe({ next: (d) => this.livreurs.set(d), error: () => {} });
  }
}
