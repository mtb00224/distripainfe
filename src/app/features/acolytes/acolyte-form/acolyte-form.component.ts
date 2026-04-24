import { Component, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { AVAILABLE_PERMISSIONS } from '../../../core/models/acolyte.models';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-acolyte-form',
  standalone: true,
  imports: [ReactiveFormsModule, PageHeaderComponent],
  template: `
    <app-page-header [title]="isEdit ? 'Modifier l\\'acolyte' : 'Nouvel acolyte'" />
    @if (error()) { <div class="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">{{ error() }}</div> }
    <div class="card max-w-lg">
      <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-4">
        @if (!isEdit) {
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="label">Prénom *</label>
              <input type="text" formControlName="first_name" class="input-field" />
            </div>
            <div>
              <label class="label">Nom *</label>
              <input type="text" formControlName="last_name" class="input-field" />
            </div>
          </div>
          <div>
            <label class="label">Nom d'utilisateur *</label>
            <input type="text" formControlName="username" class="input-field" />
          </div>
          <div>
            <label class="label">Email</label>
            <input type="email" formControlName="email" class="input-field" />
          </div>
          <div class="text-sm text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
            ℹ️ Le mot de passe par défaut sera <strong>00000</strong>. L'acolyte devra le changer à la première connexion.
          </div>
        }
        <div>
          <label class="label mb-2">Permissions</label>
          <div class="space-y-2">
            @for (perm of availablePermissions; track perm.key) {
              <label class="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" [checked]="selectedPerms.has(perm.key)" (change)="togglePerm(perm.key)" class="accent-amber-500" />
                <span class="text-sm text-gray-700">{{ perm.label }}</span>
              </label>
            }
          </div>
        </div>
        <div class="flex gap-3 pt-2">
          <button type="submit" class="btn-primary" [disabled]="loading()">
            @if (loading()) { Enregistrement... } @else { Enregistrer }
          </button>
          <button type="button" class="btn-secondary" (click)="router.navigate(['/acolytes'])">Annuler</button>
        </div>
      </form>
    </div>
  `,
})
export class AcolyteFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private api = inject(ApiService);
  router = inject(Router);
  private route = inject(ActivatedRoute);

  availablePermissions = AVAILABLE_PERMISSIONS;
  selectedPerms = new Set<string>();
  loading = signal(false);
  error = signal('');
  isEdit = false;
  editId: number | null = null;

  form = this.fb.group({
    first_name: ['', Validators.required],
    last_name: ['', Validators.required],
    username: ['', Validators.required],
    email: [''],
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isEdit = true;
      this.editId = +id;
      // Remove required validators for fields hidden in edit mode
      this.form.controls['first_name'].clearValidators();
      this.form.controls['last_name'].clearValidators();
      this.form.controls['username'].clearValidators();
      this.form.updateValueAndValidity();
      this.api.getAcolytes().subscribe((list) => {
        const a = list.find((x) => x.id === this.editId);
        if (a) {
          this.selectedPerms = new Set(a.permissions);
        }
      });
    }
  }

  togglePerm(perm: string): void {
    if (this.selectedPerms.has(perm)) this.selectedPerms.delete(perm);
    else this.selectedPerms.add(perm);
  }

  submit(): void {
    if (this.form.invalid) return;
    this.loading.set(true);
    const permissions = Array.from(this.selectedPerms);
    const action = this.isEdit
      ? this.api.updateAcolyte(this.editId!, { permissions })
      : this.api.createAcolyte({
          first_name: this.form.value.first_name!,
          last_name: this.form.value.last_name!,
          username: this.form.value.username!,
          email: this.form.value.email || undefined,
          permissions,
        });
    action.subscribe({
      next: () => this.router.navigate(['/acolytes']),
      error: (err) => { this.error.set(err.error?.detail ?? 'Erreur'); this.loading.set(false); },
    });
  }
}
