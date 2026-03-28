import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AdminApiService } from '../../../core/services/admin-api.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="min-h-screen bg-gray-900 flex">
      <!-- Sidebar -->
      <aside class="w-56 bg-gray-800 border-r border-gray-700 flex flex-col">
        <div class="p-4 border-b border-gray-700">
          <p class="text-xs text-gray-400 uppercase tracking-wider mb-1">DistriPain</p>
          <p class="text-white font-semibold">Administration</p>
        </div>

        <nav class="flex-1 p-3 space-y-1 overflow-y-auto">
          <a routerLink="/admin" routerLinkActive="bg-indigo-700 text-white"
            [routerLinkActiveOptions]="{ exact: true }"
            class="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white transition-colors text-sm">
            📊 Dashboard
          </a>
          <a routerLink="/admin/livreurs" routerLinkActive="bg-indigo-700 text-white"
            class="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white transition-colors text-sm">
            🚚 Livreurs
          </a>
          <a routerLink="/admin/permissions" routerLinkActive="bg-indigo-700 text-white"
            class="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white transition-colors text-sm">
            🔐 Permissions
          </a>
          <a routerLink="/admin/traffic" routerLinkActive="bg-indigo-700 text-white"
            class="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white transition-colors text-sm">
            📡 Trafic
          </a>

          <p class="px-3 pt-3 pb-1 text-xs text-gray-500 uppercase tracking-wider">Abonnements</p>
          <a routerLink="/admin/formules" routerLinkActive="bg-indigo-700 text-white"
            class="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white transition-colors text-sm">
            📋 Formules
          </a>
          <a routerLink="/admin/abonnements" routerLinkActive="bg-indigo-700 text-white"
            class="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white transition-colors text-sm">
            💳 Abonnements
          </a>
          <a routerLink="/admin/moyens-paiement" routerLinkActive="bg-indigo-700 text-white"
            class="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white transition-colors text-sm">
            📱 Moyens paiement
          </a>

          <p class="px-3 pt-3 pb-1 text-xs text-gray-500 uppercase tracking-wider">Configuration</p>
          <a routerLink="/admin/pays" routerLinkActive="bg-indigo-700 text-white"
            class="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white transition-colors text-sm">
            🌍 Pays & Devises
          </a>
        </nav>

        <div class="p-3 border-t border-gray-700">
          <button (click)="logout()"
            class="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-gray-400 hover:bg-gray-700 hover:text-white transition-colors text-sm">
            🚪 Déconnexion
          </button>
        </div>
      </aside>

      <!-- Main content -->
      <main class="flex-1 overflow-auto">
        <router-outlet />
      </main>
    </div>
  `,
})
export class AdminLayoutComponent {
  private adminApi = inject(AdminApiService);
  private router = inject(Router);

  logout(): void {
    this.adminApi.clearToken();
    this.router.navigate(['/admin/login']);
  }
}
