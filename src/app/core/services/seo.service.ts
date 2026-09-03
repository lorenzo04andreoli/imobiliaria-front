import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

interface SeoConfig {
  title: string;
  description: string;
  image?: string | null;
  url?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SeoService {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);

  update(config: SeoConfig): void {
    const url = config.url ?? this.currentUrl();
    const image = config.image ? this.absoluteUrl(config.image) : null;

    this.title.setTitle(config.title);
    this.updateName('description', config.description);
    this.updateName('twitter:card', image ? 'summary_large_image' : 'summary');
    this.updateName('twitter:title', config.title);
    this.updateName('twitter:description', config.description);

    this.updateProperty('og:type', 'website');
    this.updateProperty('og:site_name', 'Eliane Corretora');
    this.updateProperty('og:title', config.title);
    this.updateProperty('og:description', config.description);
    this.updateProperty('og:url', url);
    this.updateProperty('og:locale', 'pt_BR');

    if (image) {
      this.updateProperty('og:image', image);
      this.updateName('twitter:image', image);
      return;
    }

    this.meta.removeTag("property='og:image'");
    this.meta.removeTag("name='twitter:image'");
  }

  private updateName(name: string, content: string): void {
    this.meta.updateTag({ name, content });
  }

  private updateProperty(property: string, content: string): void {
    this.meta.updateTag({ property, content });
  }

  private currentUrl(): string {
    return typeof window === 'undefined' ? '/' : window.location.href;
  }

  private absoluteUrl(url: string): string {
    if (url.startsWith('http') || typeof window === 'undefined') {
      return url;
    }

    return new URL(url, window.location.origin).href;
  }
}
