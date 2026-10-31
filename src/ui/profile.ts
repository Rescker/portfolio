import { profile } from '../config';

/** Fills the email/social nodes once, instead of duplicating them in markup. */
export function hydrateProfile(document: Document) {
  document.querySelectorAll<HTMLAnchorElement>('[data-email]').forEach((node) => {
    node.href = `mailto:${profile.email}`;
  });

  document.querySelectorAll<HTMLElement>('[data-email-text]').forEach((node) => {
    node.textContent = profile.email;
  });

  document.querySelectorAll<HTMLElement>('[data-year]').forEach((node) => {
    node.textContent = String(new Date().getFullYear());
  });

  document.querySelectorAll<HTMLElement>('[data-coords]').forEach((node) => {
    node.textContent = profile.coords;
  });

  const list = document.querySelector<HTMLUListElement>('[data-socials]');
  if (!list) return;

  list.replaceChildren(
    ...profile.socials.map((social: { label: string; handle: string; href: string }) => {
      const item = document.createElement('li');
      const link = document.createElement('a');
      link.href = social.href;
      link.target = '_blank';
      link.rel = 'noreferrer noopener';

      const label = document.createElement('span');
      label.textContent = social.label;

      const handle = document.createElement('span');
      handle.textContent = `${social.handle} ↗`;

      link.append(label, handle);
      item.append(link);
      return item;
    }),
  );
}
