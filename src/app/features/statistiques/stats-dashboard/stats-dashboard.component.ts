import { Component, inject, signal, OnInit } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { Boulangerie } from '../../../core/models/boulangerie.models';
import { StatsPeriode, StatsPeriodeType } from '../../../core/models/stats.models';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-stats-dashboard',
  standalone: true,
  imports: [DecimalPipe, ReactiveFormsModule, LoadingSpinnerComponent, PageHeaderComponent],
  templateUrl: './stats-dashboard.component.html',
})
export class StatsDashboardComponent implements OnInit {
  private api = inject(ApiService);

  devise = signal('FCFA');

  boulangeries = signal<Boulangerie[]>([]);
  stats = signal<StatsPeriode | null>(null);
  loading = signal(false);

  periodeCtrl = new FormControl<StatsPeriodeType>('journalier');
  boulangerieCtrl = new FormControl<number | null>(null);
  anneeCtrl = new FormControl(new Date().getFullYear());
  moisCtrl = new FormControl(new Date().getMonth() + 1);
  semaineCtrl = new FormControl(this.currentWeekNumber());
  trimestreCtrl = new FormControl(Math.ceil((new Date().getMonth() + 1) / 3));
  semestreCtrl = new FormControl(new Date().getMonth() < 6 ? 1 : 2);
  dateCtrl = new FormControl(new Date().toISOString().split('T')[0]);

  periodes: { value: StatsPeriodeType; label: string }[] = [
    { value: 'journalier', label: 'Journalier' },
    { value: 'hebdomadaire', label: 'Hebdomadaire' },
    { value: 'mensuel', label: 'Mensuel' },
    { value: 'trimestriel', label: 'Trimestriel' },
    { value: 'semestriel', label: 'Semestriel' },
    { value: 'annuel', label: 'Annuel' },
  ];

  ngOnInit(): void {
    this.api.getBoulangeries().subscribe((b) => this.boulangeries.set(b));
    this.load();
  }

  load(): void {
    const periode = this.periodeCtrl.value!;
    const boulangerieId = this.boulangerieCtrl.value ?? undefined;
    const annee = this.anneeCtrl.value!;
    this.loading.set(true);

    let obs: Observable<StatsPeriode>;
    switch (periode) {
      case 'journalier': obs = this.api.statsJournalier(this.dateCtrl.value!, boulangerieId); break;
      case 'hebdomadaire': obs = this.api.statsHebdomadaire(this.semaineCtrl.value!, annee, boulangerieId); break;
      case 'mensuel': obs = this.api.statsMensuel(this.moisCtrl.value!, annee, boulangerieId); break;
      case 'trimestriel': obs = this.api.statsTrimestriel(this.trimestreCtrl.value!, annee, boulangerieId); break;
      case 'semestriel': obs = this.api.statsSemestriel(this.semestreCtrl.value!, annee, boulangerieId); break;
      case 'annuel': default: obs = this.api.statsAnnuel(annee, boulangerieId); break;
    }

    obs.subscribe({
      next: (s) => { this.stats.set(s); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  prevYear(): void { this.anneeCtrl.setValue(this.anneeCtrl.value! - 1); this.load(); }
  nextYear(): void { this.anneeCtrl.setValue(this.anneeCtrl.value! + 1); this.load(); }

  private currentWeekNumber(): number {
    const now = new Date();
    const jan1 = new Date(now.getFullYear(), 0, 1);
    return Math.ceil(((now.getTime() - jan1.getTime()) / 86400000 + jan1.getDay() + 1) / 7);
  }
}
