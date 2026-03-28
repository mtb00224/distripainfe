import { Component, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { Zone } from '../../../core/models/zone.models';
import { Pays } from '../../../core/models/pays.models';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-client-form',
  standalone: true,
  imports: [ReactiveFormsModule, PageHeaderComponent],
  template: `
    <app-page-header [title]="isEdit ? 'Modifier le client' : 'Nouveau client'" />
    @if (error()) { <div class="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">{{ error() }}</div> }
    <div class="card max-w-lg">
      <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-4">
        <div>
          <label class="label">Nom *</label>
          <input type="text" formControlName="nom" class="input-field" />
        </div>
        <div>
          <label class="label">Zone</label>
          <select formControlName="zone_id" class="input-field">
            <option [ngValue]="null">Sans zone</option>
            @for (z of zones(); track z.id) {
              <option [ngValue]="z.id">{{ z.nom }}</option>
            }
          </select>
        </div>
        <div>
          <label class="label">Pays / Devise</label>
          <select formControlName="pays_id" class="input-field">
            <option [ngValue]="null">Par défaut</option>
            @for (p of pays(); track p.id) {
              <option [ngValue]="p.id">{{ p.nom }} ({{ p.devise_code }})</option>
            }
          </select>
        </div>
        <div>
          <label class="label">Téléphone</label>
          <input type="tel" formControlName="telephone" class="input-field" />
        </div>
        <div>
          <label class="label">Prix de vente du pain{{ getSelectedDevise() ? ' (' + getSelectedDevise() + ')' : '' }}</label>
          <input type="number" formControlName="prix_vente_pain" class="input-field" min="0" step="0.01" />
        </div>
        <div class="flex gap-3 pt-2">
          <button type="submit" class="btn-primary" [disabled]="loading()">
            @if (loading()) { Enregistrement... } @else { Enregistrer }
          </button>
          <button type="button" class="btn-secondary" (click)="router.navigate(['/clients'])">Annuler</button>
        </div>
      </form>
    </div>
  `,
})
export class ClientFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private api = inject(ApiService);
  router = inject(Router);
  private route = inject(ActivatedRoute);

  zones = signal<Zone[]>([]);
  pays = signal<Pays[]>([]);

  getSelectedDevise(): string {
    return this.pays().find((p) => p.id === this.form.value.pays_id)?.devise_code ?? '';
  }
  loading = signal(false);
  error = signal('');
  isEdit = false;
  editId: number | null = null;

  form = this.fb.group({
    nom: ['', Validators.required],
    zone_id: [null as number | null],
    pays_id: [null as number | null],
    telephone: [''],
    prix_vente_pain: [null as number | null],
  });

  ngOnInit(): void {
    this.api.getZones().subscribe((z) => this.zones.set(z));
    this.api.getPaysActifs().subscribe((p) => this.pays.set(p));
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isEdit = true;
      this.editId = +id;
      this.api.getClient(this.editId).subscribe((c) =>
        this.form.patchValue({
          nom: c.nom,
          zone_id: c.zone_id ?? null,
          pays_id: c.pays_id ?? null,
          telephone: c.telephone ?? '',
          prix_vente_pain: c.prix_vente_pain ?? null,
        })
      );
    }
  }

  submit(): void {
    if (this.form.invalid) return;
    this.loading.set(true);
    const v = this.form.value;
    const payload = {
      nom: v.nom!,
      zone_id: v.zone_id ?? undefined,
      pays_id: v.pays_id ?? undefined,
      telephone: v.telephone || undefined,
      prix_vente_pain: v.prix_vente_pain ?? undefined,
    };
    const action = this.isEdit ? this.api.updateClient(this.editId!, payload) : this.api.createClient(payload);
    action.subscribe({
      next: () => this.router.navigate(['/clients']),
      error: (err) => { this.error.set(err.error?.detail ?? 'Erreur'); this.loading.set(false); },
    });
  }
}
