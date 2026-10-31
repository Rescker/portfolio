/**
 * Dados pessoais — edite só este arquivo para publicar o portfólio.
 * Nada aqui é lido em tempo de build: tudo é interpolado em runtime.
 */
export const profile = {
  name: 'Joaquim',
  fullName: 'Joaquim José Mendes de Souza',
  role: 'Desenvolvedor & Creative Engineer',
  email: 'joaquim0220@gmail.com',
  location: 'Brasil',
  timeZone: 'America/Sao_Paulo',
  coords: 'GMT−3',

  socials: [
    { label: 'GitHub', handle: '@Rescker', href: 'https://github.com/Rescker/' },
    {
      label: 'LinkedIn',
      handle: '/in/joaquim-mendes',
      href: 'https://www.linkedin.com/in/joaquim-mendes-832610266/',
    },
  ],
} as const;

/** Duração (ms) usada pelo loader; é o mínimo de tempo para o wipe não piscar. */
export const LOADER_MIN_MS = 900;
