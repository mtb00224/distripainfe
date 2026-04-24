import { Component } from '@angular/core';

/** Composant fantôme — jamais rendu car catchAllGuard redirige toujours avant. */
@Component({ selector: 'app-not-found', standalone: true, template: '' })
export class NotFoundComponent {}
