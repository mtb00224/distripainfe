import { Component, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { Boulangerie } from '../../../core/models/boulangerie.models';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-tournee-form',
  standalone: true,
  imports: [ReactiveFormsModule, PageHeaderComponent],
  template: `
    <app-page-header title="Nouvelle tournée" />
    @if (error()) { <div class="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">{{ error() }}</div> }
    <div class="card max-w-lg">
      <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-4">
        <div>
          <label class="label">Boulangerie *</label>
          <select formControlName="boulangerie_id" class="input-field">
            <option [ngValue]="null">Sélectionner...</option>
            @for (b of boulangeries(); track b.id) {
              <option [ngValue]="b.id">{{ b.nom }}</option>
            }
          </select>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="label">Date *</label>
            <input type="date" formControlName="date" class="input-field" />
          </div>
          <div>
            <label class="label">Période *</label>
            <select formControlName="periode" class="input-field">
              <option value="matin">🌅 Matin</option>
              <option value="soir">🌙 Soir</option>
            </select>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="label">Pains pris *</label>
            <input type="number" formControlName="nb_pains_pris" class="input-field" min="0" placeholder="1500" />
          </div>
          <div>
            <label class="label">Pains écoulés</label>
            <input type="number" formControlName="nb_pains_ecoules" class="input-field" min="0" placeholder="0" />
          </div>
        </div>
        <div>
          <label class="label">Notes</label>
          <textarea formControlName="notes" class="input-field" rows="2" placeholder="Remarques optionnelles"></textarea>
        </div>
        <div class="flex gap-3 pt-2">
          <button type="submit" class="btn-primary" [disabled]="loading()">
            @if (loading()) { Création... } @else { Créer la tournée }
          </button>
          <button type="button" class="btn-secondary" (click)="router.navigate(['/tournees'])">Annuler</button>
        </div>
      </form>
    </div>
  `,
})
export class TourneeFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private api = inject(ApiService);
  router = inject(Router);

  boulangeries = signal<Boulangerie[]>([]);
  loading = signal(false);
  error = signal('');

  form = this.fb.group({
    boulangerie_id: [null as number | null, Validators.required],
    date: [new Date().toISOString().split('T')[0], Validators.required],
    periode: ['matin', Validators.required],
    nb_pains_pris: [0, [Validators.required, Validators.min(0)]],
    nb_pains_ecoules: [0],
    notes: [''],
  });

  ngOnInit(): void {
    this.api.getBoulangeries().subscribe((b) => {
      this.boulangeries.set(b);
      const def = b.find((x) => x.is_default);
      if (def) this.form.patchValue({ boulangerie_id: def.id });
    });
  }

  submit(): void {
    if (this.form.invalid) return;
    this.loading.set(true);
    const v = this.form.value;
    this.api.createTournee({
      boulangerie_id: v.boulangerie_id!,
      date: v.date!,
      periode: v.periode as any,
      nb_pains_pris: v.nb_pains_pris!,
      nb_pains_ecoules: v.nb_pains_ecoules ?? 0,
      notes: v.notes || undefined,
    }).subscribe({
      next: (t) => this.router.navigate(['/tournees', t.id]),
      error: (err) => { this.error.set(err.error?.detail ?? 'Erreur'); this.loading.set(false); },
    });
  }
}
