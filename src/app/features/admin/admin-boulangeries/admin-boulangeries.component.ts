import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AdminApiService } from '../../../core/services/admin-api.service';
import { AdminBoulangerieEntry, BoulangerieEntry } from '../../../core/models/admin.models';

@Component({
  selector: 'app-admin-boulangeries',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="p-6 space-y-8">
      <div>
        <h1 class="text-2xl font-bold text-white">Boulangeries</h1>
        <p class="text-gray-400 text-sm mt-1">Vue d'ensemble des boulangeries et de leurs gérants</p>
      </div>

      <!-- Gérants -->
      <section>
        <h2 class="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Gérants ({{ admins().length }})
        </h2>
        @if (loadingAdmins()) {
          <div class="text-gray-500 py-4">Chargement...</div>
        } @else if (admins().length === 0) {
          <div class="bg-gray-800 rounded-xl p-6 text-gray-500 text-center">Aucun gérant enregistré</div>
        } @else {
          <div class="space-y-2">
            @for (a of admins(); track a.id) {
              <div class="bg-gray-800 rounded-xl px-4 py-3 border border-gray-700 flex items-center justify-between gap-4">
                <div class="flex items-center gap-3 min-w-0">
                  <span class="text-xl flex-shrink-0">🏪</span>
                  <div class="min-w-0">
                    <a [routerLink]="['/admin/boulangeries/gerant', a.id]"
                      class="text-white font-medium hover:text-indigo-300 transition-colors cursor-pointer">
                      {{ a.first_name }} {{ a.last_name }}
                    </a>
                    <div class="flex gap-3 text-xs text-gray-400 mt-0.5 flex-wrap">
                      @if (a.email) { <span>{{ a.email }}</span> }
                      @if (a.phone_number) { <span>{{ a.phone_number }}</span> }
                      <span class="text-amber-400">{{ a.nb_boulangeries }} boulangerie(s)</span>
                    </div>
                  </div>
                </div>
                <div class="flex items-center gap-3 flex-shrink-0">
                  <span class="text-xs px-2 py-0.5 rounded-full"
                    [class.bg-green-900]="a.is_active" [class.text-green-400]="a.is_active"
                    [class.bg-gray-700]="!a.is_active" [class.text-gray-400]="!a.is_active">
                    {{ a.is_active ? 'Actif' : 'Inactif' }}
                  </span>
                  <a [routerLink]="['/admin/boulangeries/gerant', a.id]"
                    class="text-xs text-indigo-400 hover:text-indigo-300">Détail →</a>
                  <button
                    (click)="toggleAdmin(a)"
                    class="text-xs px-3 py-1 rounded-lg"
                    [class.bg-red-900]="a.is_active" [class.text-red-400]="a.is_active"
                    [class.bg-green-900]="!a.is_active" [class.text-green-400]="!a.is_active">
                    {{ a.is_active ? 'Désactiver' : 'Activer' }}
                  </button>
                </div>
              </div>
            }
          </div>
        }
      </section>

      <!-- Boulangeries -->
      <section>
        <h2 class="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Boulangeries enregistrées ({{ boulangeries().length }})
        </h2>
        @if (loadingBoulangeries()) {
          <div class="text-gray-500 py-4">Chargement...</div>
        } @else if (boulangeries().length === 0) {
          <div class="bg-gray-800 rounded-xl p-6 text-gray-500 text-center">Aucune boulangerie</div>
        } @else {
          <div class="space-y-2">
            @for (b of boulangeries(); track b.id) {
              <div class="bg-gray-800 rounded-xl px-4 py-3 border border-gray-700 flex items-center justify-between gap-4">
                <div class="flex items-center gap-3 min-w-0">
                  <span class="text-xl flex-shrink-0">🥖</span>
                  <div class="min-w-0">
                    <a [routerLink]="['/admin/boulangeries/detail', b.id]"
                      class="text-white font-medium hover:text-amber-300 transition-colors cursor-pointer">
                      {{ b.nom }}
                    </a>
                    <div class="flex gap-3 text-xs text-gray-400 mt-0.5 flex-wrap">
                      @if (b.contact) { <span>{{ b.contact }}</span> }
                      @if (b.address) { <span>{{ b.address }}</span> }
                      @if (b.admin_nom) {
                        <span class="text-amber-400">Gérant : {{ b.admin_nom }}</span>
                      } @else {
                        <span class="text-gray-500 italic">Fournisseur sans gérant</span>
                      }
                    </div>
                  </div>
                </div>
                <div class="flex items-center gap-3 flex-shrink-0">
                  <span class="text-xs px-2 py-0.5 rounded-full"
                    [class.bg-green-900]="b.is_active" [class.text-green-400]="b.is_active"
                    [class.bg-gray-700]="!b.is_active" [class.text-gray-400]="!b.is_active">
                    {{ b.is_active ? 'Active' : 'Inactive' }}
                  </span>
                  <a [routerLink]="['/admin/boulangeries/detail', b.id]"
                    class="text-xs text-amber-400 hover:text-amber-300">Détail →</a>
                </div>
              </div>
            }
          </div>
        }
      </section>
    </div>
  `,
})
export class AdminBoulangeriesComponent implements OnInit {
  private adminApi = inject(AdminApiService);

  admins = signal<AdminBoulangerieEntry[]>([]);
  boulangeries = signal<BoulangerieEntry[]>([]);
  loadingAdmins = signal(true);
  loadingBoulangeries = signal(true);

  ngOnInit(): void {
    this.adminApi.loadToken();
    this.adminApi.getAdminsBoulangerie().subscribe({
      next: (d) => { this.admins.set(d); this.loadingAdmins.set(false); },
      error: () => this.loadingAdmins.set(false),
    });
    this.adminApi.getAdminBoulangeries().subscribe({
      next: (d) => { this.boulangeries.set(d); this.loadingBoulangeries.set(false); },
      error: () => this.loadingBoulangeries.set(false),
    });
  }

  toggleAdmin(a: AdminBoulangerieEntry): void {
    this.adminApi.toggleAdminBoulangerie(a.id, !a.is_active).subscribe({
      next: (res) => {
        this.admins.update((list) => list.map((x) => x.id === a.id ? { ...x, is_active: res.is_active } : x));
      },
    });
  }
}
