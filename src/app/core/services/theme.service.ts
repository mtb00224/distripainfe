import { Injectable, signal, effect, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private platformId = inject(PLATFORM_ID);
  isDark = signal(false);

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      const saved = localStorage.getItem('theme');
      this.isDark.set(saved === 'dark');
      this.applyTheme(this.isDark());
    }
  }

  toggle(): void {
    this.isDark.update((v) => !v);
    const dark = this.isDark();
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('theme', dark ? 'dark' : 'light');
      this.applyTheme(dark);
    }
  }

  private applyTheme(dark: boolean): void {
    const html = document.documentElement;
    if (dark) {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
  }
}
