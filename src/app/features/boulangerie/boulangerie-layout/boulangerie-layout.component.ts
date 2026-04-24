import { Component, inject, signal, effect } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AdminBoulangerieService } from '../../../core/services/admin-boulangerie.service';
import { ThemeService } from '../../../core/services/theme.service';
import { BoulangerieResponse } from '../../../core/models/admin_boulangerie.models';

@Component({
  selector: 'app-boulangerie-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="min-h-screen bg-gray-50 dark:bg-gray-950 flex">
      <!-- Sidebar -->
      <aside
        class="fixed inset-y-0 left-0 z-40 w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transform transition-transform duration-200"
        [class.-translate-x-full]="!sidebarOpen()"
        [class.translate-x-0]="sidebarOpen()">

        <div class="flex flex-col h-full">
          <!-- Header -->
          <div class="p-4 border-b border-gray-200 dark:border-gray-800">
            <div class="flex items-center gap-3">
              <span class="text-2xl">🏪</span>
              <div class="min-w-0">
                <p class="font-bold text-amber-600 truncate">DistriPain</p>
                <p class="text-xs text-gray-500 dark:text-gray-400 truncate">Espace Boulangerie</p>
              </div>
            </div>
          </div>

          <!-- Boulangerie switcher -->
          @if (profile()) {
            <div class="p-3 border-b border-gray-200 dark:border-gray-800">
              <p class="text-xs font-semibold text-gray-400 uppercase mb-2 px-1">Boulangerie active</p>
              @if (boulangerieActive()) {
                <div class="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-2 mb-2">
                  <p class="text-sm font-medium text-amber-700 dark:text-amber-300 truncate">{{ boulangerieActive()!.nom }}</p>
                </div>
              } @else {
                <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-2 mb-2">
                  <p class="text-sm text-gray-400">Aucune sélectionnée</p>
                </div>
              }
              @if (otherBoulangeries().length > 0) {
                <div class="space-y-1">
                  @for (b of otherBoulangeries(); track b.id) {
                    <button
                      (click)="switchBoulangerie(b)"
                      class="w-full text-left text-xs px-2 py-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 truncate">
                      → {{ b.nom }}
                    </button>
                  }
                </div>
              }
            </div>
          }

          <!-- Navigation -->
          <nav class="flex-1 p-3 space-y-1 overflow-y-auto">
            <a routerLink="/boulangerie/dashboard" routerLinkActive="bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300"
              class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <span>🏠</span> Tableau de bord
            </a>
            <a routerLink="/boulangerie/boulangeries" routerLinkActive="bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300"
              class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <span>🥖</span> Mes boulangeries
            </a>
            <a routerLink="/boulangerie/staff" routerLinkActive="bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300"
              class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <span>👥</span> Staff
            </a>
            <a routerLink="/boulangerie/livreurs-internes" routerLinkActive="bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300"
              class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <span>🏃</span> Livreurs internes
            </a>
            <a routerLink="/boulangerie/production" routerLinkActive="bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300"
              class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <span>📋</span> Production
            </a>
            <a routerLink="/boulangerie/depenses" routerLinkActive="bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300"
              class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <span>💸</span> Dépenses
            </a>
            <a routerLink="/boulangerie/dettes" routerLinkActive="bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300"
              class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <span>📒</span> Dettes
            </a>
            <a routerLink="/boulangerie/vente-ambulatoire" routerLinkActive="bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300"
              class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <span>🛒</span> Vente ambulatoire
            </a>
            <a routerLink="/boulangerie/stats" routerLinkActive="bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300"
              class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <span>📊</span> Statistiques
            </a>
            <a routerLink="/boulangerie/parametres" routerLinkActive="bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300"
              class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <span>⚙️</span> Paramètres
            </a>
          </nav>

          <!-- Footer -->
          <div class="p-3 border-t border-gray-200 dark:border-gray-800 space-y-2">
            <button (click)="theme.toggle()"
              class="w-full text-left flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">
              <span>{{ theme.isDark() ? '☀️' : '🌙' }}</span>
              {{ theme.isDark() ? 'Mode clair' : 'Mode sombre' }}
            </button>
            @if (profile()) {
              <div class="px-3 py-2 text-xs text-gray-500 dark:text-gray-400 truncate">
                {{ profile()!.first_name }} {{ profile()!.last_name }}
              </div>
            }
            <button (click)="logout()"
              class="w-full text-left flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
              <span>🚪</span> Déconnexion
            </button>
          </div>
        </div>
      </aside>

      <!-- Overlay sidebar mobile -->
      @if (sidebarOpen()) {
        <div class="fixed inset-0 z-30 bg-black/40 lg:hidden" (click)="sidebarOpen.set(false)"></div>
      }

      <!-- Main content -->
      <div class="flex-1 lg:ml-64 flex flex-col min-h-screen">
        <!-- Top bar -->
        <header class="sticky top-0 z-20 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-3 flex items-center gap-4">
          <button (click)="toggleSidebar()" class="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
            <span class="text-xl">☰</span>
          </button>
          <div class="flex-1"></div>
        </header>

        <!-- Page content -->
        <main class="flex-1 p-4 md:p-6">
          <router-outlet />
        </main>
      </div>
    </div>

    <!-- ── Sélecteur de boulangerie (overlay au login si plusieurs) ── -->
    @if (showBoulangerieSelector()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div class="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md mx-4 p-8">
          <div class="text-center mb-6">
            <div class="text-4xl mb-3">🥖</div>
            <h2 class="text-xl font-bold text-gray-900 dark:text-gray-100">Choisissez une boulangerie</h2>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Sélectionnez la boulangerie sur laquelle vous souhaitez travailler
            </p>
          </div>

          @if (switching()) {
            <div class="text-center text-gray-400 py-4">Connexion en cours...</div>
          } @else {
            <div class="space-y-2">
              @for (b of activeBoulangeries(); track b.id) {
                <button
                  (click)="selectBoulangerie(b)"
                  class="w-full text-left px-4 py-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-amber-400 dark:hover:border-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-all group">
                  <div class="flex items-center gap-3">
                    <span class="text-2xl">🏪</span>
                    <div>
                      <p class="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-amber-700 dark:group-hover:text-amber-300">
                        {{ b.nom }}
                      </p>
                      @if (b.address) {
                        <p class="text-xs text-gray-400 mt-0.5">{{ b.address }}</p>
                      }
                    </div>
                    <span class="ml-auto text-gray-300 group-hover:text-amber-400 text-lg">→</span>
                  </div>
                </button>
              }
            </div>
          }
        </div>
      </div>
    }
  `,
})
export class BoulangerieLayoutComponent {
  service = inject(AdminBoulangerieService);
  theme = inject(ThemeService);
  private router = inject(Router);

  sidebarOpen = signal(true);
  showBoulangerieSelector = signal(false);
  switching = signal(false);

  profile = this.service.profile;
  boulangerieActive = this.service.boulangerieActive;

  activeBoulangeries = () => {
    const p = this.profile();
    if (!p) return [];
    return p.boulangeries.filter((b) => b.is_active);
  };

  get otherBoulangeries(): () => BoulangerieResponse[] {
    return () => {
      const profile = this.profile();
      const active = this.boulangerieActive();
      if (!profile) return [];
      return profile.boulangeries.filter((b) => b.id !== active?.id && b.is_active);
    };
  }

  constructor() {
    // Charger le profil au démarrage si absent
    if (!this.service.profile()) {
      this.service.fetchProfile().subscribe();
    }

    effect(() => {
      const p = this.profile();
      if (!p) return;

      const actives = p.boulangeries.filter((b) => b.is_active);

      if (actives.length === 0) {
        // Aucune boulangerie → page de création
        this.showBoulangerieSelector.set(false);
        this.router.navigate(['/boulangerie/boulangeries']);
        return;
      }

      const activeId = this.service.boulangerieActiveId();

      if (activeId === null) {
        if (actives.length === 1) {
          // Une seule boulangerie → auto-switch
          this.switching.set(true);
          this.service.switchBoulangerie(actives[0].id).subscribe({
            next: () => {
              this.switching.set(false);
              this.showBoulangerieSelector.set(false);
            },
            error: () => this.switching.set(false),
          });
        } else {
          // Plusieurs → afficher le sélecteur
          this.showBoulangerieSelector.set(true);
        }
      } else {
        this.showBoulangerieSelector.set(false);
      }
    });
  }

  selectBoulangerie(b: BoulangerieResponse): void {
    this.switching.set(true);
    this.service.switchBoulangerie(b.id).subscribe({
      next: () => {
        this.switching.set(false);
        this.showBoulangerieSelector.set(false);
      },
      error: () => this.switching.set(false),
    });
  }

  switchBoulangerie(b: BoulangerieResponse): void {
    this.service.switchBoulangerie(b.id).subscribe();
  }

  logout(): void {
    this.service.logout();
  }

  toggleSidebar(): void {
    this.sidebarOpen.update((v) => !v);
  }
}
