import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe, DecimalPipe } from '@angular/common';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { Tournee } from '../../core/models/tournee.models';
import { Client } from '../../core/models/client.models';
import { Boulangerie } from '../../core/models/boulangerie.models';
import { StatsPeriode } from '../../core/models/stats.models';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, DecimalPipe, DatePipe, LoadingSpinnerComponent, StatusBadgeComponent],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements OnInit {
  private api = inject(ApiService);
  auth = inject(AuthService);

  loading = signal(true);
  todayStats = signal<StatsPeriode | null>(null);
  todayTournees = signal<Tournee[]>([]);
  clientsWithDebt = signal<Client[]>([]);
  boulangeries = signal<Boulangerie[]>([]);
  today = new Date().toISOString().split('T')[0];
  devise = signal('FCFA');

  ngOnInit(): void {
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.loading.set(true);

    // Load boulangeries (for onboarding check)
    this.api.getBoulangeries().subscribe({
      next: (b) => this.boulangeries.set(b),
      error: () => {},
    });

    // Load today's stats
    this.api.statsJournalier(this.today).subscribe({
      next: (stats) => this.todayStats.set(stats),
      error: () => {},
    });

    // Load today's tournees
    this.api.getTournees({ date: this.today }).subscribe({
      next: (tournees) => this.todayTournees.set(tournees),
      error: () => {},
    });

    // Load clients with debt (solde > 0)
    this.api.getClients().subscribe({
      next: (clients) => {
        const withDebt = clients
          .filter((c) => c.solde_actuel > 0)
          .sort((a, b) => b.solde_actuel - a.solde_actuel)
          .slice(0, 10);
        this.clientsWithDebt.set(withDebt);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  get matinTournee(): Tournee | undefined {
    return this.todayTournees().find((t) => t.periode === 'matin');
  }

  get soirTournee(): Tournee | undefined {
    return this.todayTournees().find((t) => t.periode === 'soir');
  }

  get currentUser() {
    return this.auth.currentUser();
  }

  get firstName(): string {
    return this.auth.currentUser()?.first_name ?? '';
  }
}
