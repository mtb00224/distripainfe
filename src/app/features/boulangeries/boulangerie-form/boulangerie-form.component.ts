import { Component, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-boulangerie-form',
  standalone: true,
  imports: [ReactiveFormsModule, PageHeaderComponent],
  template: `
    <app-page-header [title]="isEdit ? 'Modifier la boulangerie' : 'Nouvelle boulangerie'" />

    @if (error()) {
      <div class="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">{{ error() }}</div>
    }

    <div class="card max-w-lg">
      <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-4">
        <div>
          <label class="label">Nom *</label>
          <input type="text" formControlName="nom" class="input-field" placeholder="Boulangerie du Marché" />
        </div>
        <div>
          <label class="label">Contact</label>
          <input type="text" formControlName="contact" class="input-field" placeholder="+33 6 12 34 56 78" />
        </div>
        <div>
          <label class="label">Prix d'achat du pain{{ devise() ? ' (' + devise() + ')' : '' }}</label>
          <input type="number" formControlName="prix_achat_pain" class="input-field" placeholder="0" min="0" step="0.01" />
        </div>
        <div class="flex gap-3 pt-2">
          <button type="submit" class="btn-primary" [disabled]="loading()">
            @if (loading()) { Enregistrement... } @else { Enregistrer }
          </button>
          <button type="button" class="btn-secondary" (click)="router.navigate(['/boulangeries'])">Annuler</button>
        </div>
      </form>
    </div>
  `,
})
export class BoulangerieFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private api = inject(ApiService);
  router = inject(Router);
  private route = inject(ActivatedRoute);

  devise = signal('FCFA');

  loading = signal(false);
  error = signal('');
  isEdit = false;
  editId: number | null = null;

  form = this.fb.group({
    nom: ['', Validators.required],
    contact: [''],
    prix_achat_pain: [null as number | null],
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isEdit = true;
      this.editId = +id;
      // Load and patch
      this.api.getBoulangeries().subscribe((list) => {
        const b = list.find((x) => x.id === this.editId);
        if (b) this.form.patchValue({ nom: b.nom, contact: b.contact ?? '', prix_achat_pain: b.prix_achat_pain ?? null });
      });
    }
  }

  submit(): void {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.error.set('');
    const payload = {
      nom: this.form.value.nom!,
      contact: this.form.value.contact || undefined,
      prix_achat_pain: this.form.value.prix_achat_pain ?? undefined,
    };
    const action = this.isEdit
      ? this.api.updateBoulangerie(this.editId!, payload)
      : this.api.createBoulangerie(payload);

    action.subscribe({
      next: () => this.router.navigate(['/boulangeries']),
      error: (err) => { this.error.set(err.error?.detail ?? 'Erreur'); this.loading.set(false); },
    });
  }
}
