import { Component, inject, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ThemeService } from '../../../core/services/theme.service';

interface NavItem {
  path: string;
  label: string;
  icon: string;
  permission?: string;
  livreurOnly?: boolean;
}

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './main-layout.component.html',
})
export class MainLayoutComponent {
  auth = inject(AuthService);
  theme = inject(ThemeService);
  sidebarOpen = signal(false);

  navItems: NavItem[] = [
    { path: '/dashboard', label: 'Tableau de bord', icon: '🏠' },
    { path: '/tournees', label: 'Tournées', icon: '🚚', permission: 'read_tournees' },
    { path: '/encaissements', label: 'Encaissements', icon: '💰', permission: 'read_encaissements' },
    { path: '/dettes', label: 'Dettes', icon: '📋', permission: 'read_encaissements' },
    { path: '/clients', label: 'Clients', icon: '👥', permission: 'read_clients' },
    { path: '/zones', label: 'Zones', icon: '🗺️', permission: 'read_zones' },
    { path: '/boulangeries', label: 'Boulangeries', icon: '🥖', permission: 'read_boulangeries' },
    { path: '/portions', label: 'Portions pain', icon: '🍞', permission: 'read_boulangeries' },
    { path: '/statistiques', label: 'Statistiques', icon: '📊', permission: 'read_stats' },
    { path: '/acolytes', label: 'Acolytes', icon: '👤', livreurOnly: true },
    { path: '/abonnement', label: 'Mon abonnement', icon: '💳', livreurOnly: true },
  ];

  get visibleNavItems(): NavItem[] {
    return this.navItems.filter((item) => {
      if (item.livreurOnly && !this.auth.isLivreurPrincipal()) return false;
      if (item.permission && !this.auth.hasPermission(item.permission)) return false;
      return true;
    });
  }

  logout(): void {
    this.auth.logout().subscribe();
  }

  toggleSidebar(): void {
    this.sidebarOpen.update((v) => !v);
  }

  get currentUser() {
    return this.auth.currentUser();
  }
}
