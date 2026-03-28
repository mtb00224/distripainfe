import { Component, Input } from '@angular/core';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [NgClass],
  template: `
    <span [ngClass]="cssClass" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium">
      {{ label }}
    </span>
  `,
})
export class StatusBadgeComponent {
  @Input({ required: true }) status!: string;

  get cssClass(): string {
    const map: Record<string, string> = {
      solde: 'bg-green-100 text-green-800',
      impaye: 'bg-red-100 text-red-800',
      partiel: 'bg-orange-100 text-orange-800',
      en_attente: 'bg-yellow-100 text-yellow-800',
      en_cours: 'bg-blue-100 text-blue-800',
      terminee: 'bg-green-100 text-green-800',
      annulee: 'bg-gray-100 text-gray-600',
      matin: 'bg-amber-100 text-amber-800',
      soir: 'bg-indigo-100 text-indigo-800',
    };
    return map[this.status] ?? 'bg-gray-100 text-gray-700';
  }

  get label(): string {
    const map: Record<string, string> = {
      solde: '✅ Soldé',
      impaye: '🔴 Impayé',
      partiel: '⚠️ Partiel',
      en_attente: '⏳ En attente',
      en_cours: 'En cours',
      terminee: 'Terminée',
      annulee: 'Annulée',
      matin: 'Matin',
      soir: 'Soir',
    };
    return map[this.status] ?? this.status;
  }
}
