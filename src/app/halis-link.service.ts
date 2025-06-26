import { Injectable } from '@angular/core';

export interface Link {
  name: string;
  url: string;
  description: string;
  type: string;
  keywords: string[];
  userId: string;
}

@Injectable({
  providedIn: 'root'
})
export class HalisLinkService {
  private links: Link[] = [];
  private types: string[] = [];

  constructor() {}

  public parseMarkdown(content: string): void {
    const lines = content.split('\n');
    let section: 'types' | 'links' | null = null;
    const links: Link[] = [];
    const types: string[] = [];

    let currentLink: Partial<Link> = {};

    lines.forEach((line) => {
      if (line.startsWith('## Types')) {
        section = 'types';
      } else if (line.startsWith('## Liens')) {
        section = 'links';
      } else if (section === 'types' && line.startsWith('- ')) {
        types.push(line.substring(2).trim());
      } else if (section === 'links' && line.startsWith('### [')) {
        if (currentLink.name) {
          links.push(currentLink as Link);
          currentLink = {};
        }
        const match = line.match(/\[([^\]]+)\]\(([^)]+)\)/);
        if (match) {
          currentLink.name = match[1];
          currentLink.url = match[2];
        }
      } else if (section === 'links' && line.startsWith('- **Description:**')) {
        currentLink.description = line.replace('- **Description:**', '').trim();
      } else if (section === 'links' && line.startsWith('- **Type:**')) {
        currentLink.type = line.replace('- **Type:**', '').trim();
      } else if (section === 'links' && line.startsWith('- **Mots-clés:**')) {
        currentLink.keywords = line
          .replace('- **Mots-clés:**', '')
          .split(',')
          .map((kw) => kw.trim());
      } else if (section === 'links' && line.startsWith('- **UserId:**')) {
        currentLink.userId = line.replace('- **UserId:**', '').trim();
      }
    });

    if (currentLink.name) {
      links.push(currentLink as Link);
    }

    this.types = types;
    this.links = links;
  }

  getLinks(userId?: string): Link[] {
    if (!userId) {
      return this.links;
    }
    return this.links.filter(link => link.userId === userId);
  }

  getTypes(): string[] {
    return this.types;
  }

  searchLinks(query: string, userId?: string): Link[] {
    return this.getLinks(userId).filter(link =>
      link.name.toLowerCase().includes(query.toLowerCase()) ||
      link.description.toLowerCase().includes(query.toLowerCase())
    );
  }

  filterByType(type: string, userId?: string): Link[] {
    return this.getLinks(userId).filter(link => link.type === type);
  }

  filterByKeyword(keyword: string, userId?: string): Link[] {
    return this.getLinks(userId).filter(link => link.keywords.includes(keyword));
  }
}
