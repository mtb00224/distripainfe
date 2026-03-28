import { Component, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-zone-form',
  standalone: true,
  imports: [ReactiveFormsModule, PageHeaderComponent],
  template: `
    <app-page-header [title]="isEdit ? 'Modifier la zone' : 'Nouvelle zone'" />
    @if (error()) { <div class="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">{{ error() }}</div> }
    <div class="card max-w-lg">
      <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-4">
        <div>
          <label class="label">Nom *</label>
          <input type="text" formControlName="nom" class="input-field" placeholder="Marché Central" />
        </div>
        <div>
          <label class="label">Description</label>
          <textarea formControlName="description" class="input-field" rows="3" placeholder="Description optionnelle"></textarea>
        </div>
        <div class="flex gap-3 pt-2">
          <button type="submit" class="btn-primary" [disabled]="loading()">
            @if (loading()) { Enregistrement... } @else { Enregistrer }
          </button>
          <button type="button" class="btn-secondary" (click)="router.navigate(['/zones'])">Annuler</button>
        </div>
      </form>
    </div>
  `,
})
export class ZoneFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private api = inject(ApiService);
  router = inject(Router);
  private route = inject(ActivatedRoute);

  loading = signal(false);
  error = signal('');
  isEdit = false;
  editId: number | null = null;

  form = this.fb.group({ nom: ['', Validators.required], description: [''] });

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isEdit = true;
      this.editId = +id;
      this.api.getZones().subscribe((list) => {
        const z = list.find((x) => x.id === this.editId);
        if (z) this.form.patchValue({ nom: z.nom, description: z.description ?? '' });
      });
    }
  }

  submit() {
    if (this.form.invalid) return;
    this.loading.set(true);
    const payload = { nom: this.form.value.nom!, description: this.form.value.description || undefined };
    const action = this.isEdit ? this.api.updateZone(this.editId!, payload) : this.api.createZone(payload);
    action.subscribe({
      next: () => this.router.navigate(['/zones']),
      error: (err) => { this.error.set(err.error?.detail ?? 'Erreur'); this.loading.set(false); },
    });
  }
}
