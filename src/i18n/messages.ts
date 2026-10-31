/**
 * Translations. `pt` is the source of truth for structure: every key must exist in
 * both locales, and `en` is typed against `pt` so a missing key fails the build.
 *
 * Values containing markup (an `<em>`, a `<br>`, an inline `.mono` span) are applied
 * as HTML; plain values as text. The distinction lives in the markup, not here, via
 * `data-i18n` (text) and `data-i18n-html` (markup).
 */
export const pt = {
  'nav.work': 'Trabalho',
  'nav.about': 'Sobre',
  'nav.stack': 'Stack',
  'nav.contact': 'Contato',
  'nav.role': 'Fullstack engineer',
  'nav.status': 'Disponível para projetos',
  'nav.menu': 'Menu',

  'loader.label': 'Montando a cena',
  'loader.engine': 'Three.js / WebGL2',
  'loader.year': 'Portfólio 2026',

  'hero.eyebrow': 'Fullstack · Java & React',
  'hero.title':
    '<span class="line"><span class="word">Interfaces</span></span><span class="line"><span class="word">que parecem</span></span><span class="line"><span class="word"><em>físicas</em>.</span></span>',
  'hero.lede':
    'Sou Joaquim, desenvolvedor fullstack. Java e Spring Boot no servidor, React e TypeScript na interface — com cuidado obsessivo por detalhe, performance e acabamento.',
  'hero.ctaWork': 'Ver trabalho',
  'hero.ctaContact': 'Falar comigo',
  'hero.stackLabel': 'Stack',
  'hero.stackValue': 'Java · Spring <span class="mono">+</span> React · TS',
  'hero.baseLabel': 'Base',
  'hero.baseValue': 'Brasil <span class="mono">GMT−3</span>',
  'hero.statusLabel': 'Status',
  'hero.statusValue': 'Disponível',
  'hero.drag': 'Arraste para girar',
  'hero.foot': 'Portfólio ©',
  'hero.scroll': 'Scroll',

  'about.label': 'Sobre',
  'about.meta': 'Brasil · GMT−3',
  'about.title': 'Software deveria ser <em>sentido</em><br />antes de ser entendido.',
  'about.lead':
    'Gosto de construir software prático e intuitivo, em que a ideia sempre seja sanar o problema — pelo caminho mais curto que a pessoa consegue entender sozinha.',
  'about.p1':
    'No back-end trabalho com Spring Boot, PostgreSQL, MySQL e MongoDB, com Docker no caminho até produção. No front, React com Vite e Tailwind, TypeScript sem atalhos e atenção real a performance e acessibilidade.',
  'about.p2':
    'Gosto de ferramentas que resolvem um problema meu primeiro. O <a class="inline-link" href="https://rescker.github.io/A3L-GUI-editor/" target="_blank" rel="noreferrer noopener">A3L GUI Editor</a> nasceu de editar <span class="mono">config.cpp</span> à mão; o <a class="inline-link" href="https://github.com/Rescker/telegram-coder" target="_blank" rel="noreferrer noopener">telegram-coder</a>, de querer acompanhar um turno de agente sem abrir o terminal.',
  'about.baseLabel': 'Base',
  'about.baseValue': 'Brasil · GMT−3',
  'about.focusLabel': 'Foco',
  'about.focusValue': 'Back-end Java · Front-end React',
  'about.statusLabel': 'Status',
  'about.statusValue': 'Disponível',

  'work.label': 'Trabalho',
  'work.meta': 'Projetos públicos',
  'work.context': 'O problema',
  'work.role': 'O que construí',
  'work.stack': 'Stack',
  'work.a3l.desc': 'Editor visual de interfaces para Arma 3, no navegador',
  'work.a3l.context':
    'Editar <span class="mono">config.cpp</span> para montar diálogos de Arma 3 é escrever à mão coordenadas num sistema de grid que ninguém consegue visualizar.',
  'work.a3l.role':
    'Canvas com arrastar, redimensionar e zoom, guias de alinhamento, seleção múltipla, undo/redo com coalescência de 200 ms e 51 presets de componentes. Suporta os três sistemas de coordenadas — <span class="mono">GUI_GRID</span>, <span class="mono">SafeZone</span> e absoluto — com import/export de config respeitando herança.',
  'work.a3l.demo': 'Abrir o editor',
  'work.a3l.code': 'Código no GitHub',
  'work.telegram.desc': 'Um agente de código no seu PC, operado pelo Telegram',
  'work.telegram.context':
    'Sessões de agente vivem no terminal. Acompanhar um turno longo do celular significa ou perder o progresso, ou abrir um cliente SSH.',
  'work.telegram.role':
    'Ponte por long-polling entre o Telegram e uma sessão local via NDJSON sobre stdin/stdout. Cada turno vira no máximo duas mensagens: a resposta, editada conforme o texto chega, e uma linha de atividade que lista as chamadas de ferramenta. Comandos de shell ficam atrás de botões Aprovar/Negar; mensagens no meio do turno entram como steering.',
  'work.telegram.code': 'Código no GitHub',
  'work.note':
    '<span class="mono">Nota</span> — Estes dois são públicos. Trabalho profissional em produto fica sob conversa.',

  'stack.label': 'Stack',
  'stack.meta': 'Ferramentas do dia a dia',
  'stack.title': 'Ferramentas que uso <em>todo dia</em>.',
  'stack.back': 'Back-end',
  'stack.front': 'Front-end',
  'stack.infra': 'Infra',
  'stack.extras': 'Extras',

  'contact.label': 'Contato',
  'contact.meta': 'Respondo em até 24h',
  'contact.title': 'Vamos construir algo<br />que <em>dure</em>.',
  'contact.email': 'Email',
  'contact.local': 'Hora local',

  'footer.copy': 'Portfólio ©',
  'footer.top': 'Topo',

  'a11y.skip': 'Pular para o conteúdo',
  'a11y.locale': 'Idioma',
  'a11y.theme': 'Alternar tema',
  'theme.toDark': 'Tema escuro',
  'theme.toLight': 'Tema claro',
} as const;

export type MessageKey = keyof typeof pt;

export const en: Record<MessageKey, string> = {
  'nav.work': 'Work',
  'nav.about': 'About',
  'nav.stack': 'Stack',
  'nav.contact': 'Contact',
  'nav.role': 'Fullstack engineer',
  'nav.status': 'Available for work',
  'nav.menu': 'Menu',

  'loader.label': 'Building the scene',
  'loader.engine': 'Three.js / WebGL2',
  'loader.year': 'Portfolio 2026',

  'hero.eyebrow': 'Fullstack · Java & React',
  'hero.title':
    '<span class="line"><span class="word">Interfaces</span></span><span class="line"><span class="word">that feel</span></span><span class="line"><span class="word"><em>physical</em>.</span></span>',
  'hero.lede':
    'I’m Joaquim, a fullstack developer. Java and Spring Boot on the server, React and TypeScript in the interface — with an obsession for detail, performance and finish.',
  'hero.ctaWork': 'See the work',
  'hero.ctaContact': 'Get in touch',
  'hero.stackLabel': 'Stack',
  'hero.stackValue': 'Java · Spring <span class="mono">+</span> React · TS',
  'hero.baseLabel': 'Based in',
  'hero.baseValue': 'Brazil <span class="mono">GMT−3</span>',
  'hero.statusLabel': 'Status',
  'hero.statusValue': 'Available',
  'hero.drag': 'Drag to rotate',
  'hero.foot': 'Portfolio ©',
  'hero.scroll': 'Scroll',

  'about.label': 'About',
  'about.meta': 'Brazil · GMT−3',
  'about.title': 'Software should be <em>felt</em><br />before it is understood.',
  'about.lead':
    'I like building software that is practical and obvious, where the point is always to solve the problem — by the shortest path someone can follow on their own.',
  'about.p1':
    'On the back end I work with Spring Boot, PostgreSQL, MySQL and MongoDB, with Docker on the way to production. On the front end, React with Vite and Tailwind, TypeScript without shortcuts, and real attention to performance and accessibility.',
  'about.p2':
    'I like tools that solve one of my own problems first. The <a class="inline-link" href="https://rescker.github.io/A3L-GUI-editor/" target="_blank" rel="noreferrer noopener">A3L GUI Editor</a> came from editing <span class="mono">config.cpp</span> by hand; <a class="inline-link" href="https://github.com/Rescker/telegram-coder" target="_blank" rel="noreferrer noopener">telegram-coder</a>, from wanting to follow an agent turn without opening a terminal.',
  'about.baseLabel': 'Based in',
  'about.baseValue': 'Brazil · GMT−3',
  'about.focusLabel': 'Focus',
  'about.focusValue': 'Java back end · React front end',
  'about.statusLabel': 'Status',
  'about.statusValue': 'Available',

  'work.label': 'Work',
  'work.meta': 'Public projects',
  'work.context': 'The problem',
  'work.role': 'What I built',
  'work.stack': 'Stack',
  'work.a3l.desc': 'A visual editor for Arma 3 interfaces, in the browser',
  'work.a3l.context':
    'Editing <span class="mono">config.cpp</span> to assemble Arma 3 dialogs means typing coordinates by hand in a grid system nobody can picture.',
  'work.a3l.role':
    'A canvas with drag, resize and zoom, alignment guides, multi-select, undo/redo coalesced at 200 ms and 51 component presets. Supports all three coordinate systems — <span class="mono">GUI_GRID</span>, <span class="mono">SafeZone</span> and absolute — with config import/export that respects inheritance.',
  'work.a3l.demo': 'Open the editor',
  'work.a3l.code': 'Code on GitHub',
  'work.telegram.desc': 'A coding agent on your machine, driven from Telegram',
  'work.telegram.context':
    'Agent sessions live in the terminal. Following a long turn from your phone means either losing the progress or opening an SSH client.',
  'work.telegram.role':
    'A long-polling bridge between Telegram and a local session over NDJSON on stdin/stdout. A turn becomes at most two messages: the reply, edited as the text streams in, and an activity line listing each tool call. Shell commands sit behind Approve/Deny buttons; mid-turn messages arrive as steering.',
  'work.telegram.code': 'Code on GitHub',
  'work.note':
    '<span class="mono">Note</span> — These two are public. Professional product work is available on request.',

  'stack.label': 'Stack',
  'stack.meta': 'Day-to-day tools',
  'stack.title': 'Tools I use <em>every day</em>.',
  'stack.back': 'Back end',
  'stack.front': 'Front end',
  'stack.infra': 'Infra',
  'stack.extras': 'Extras',

  'contact.label': 'Contact',
  'contact.meta': 'I reply within 24h',
  'contact.title': 'Let’s build something<br />that <em>lasts</em>.',
  'contact.email': 'Email',
  'contact.local': 'Local time',

  'footer.copy': 'Portfolio ©',
  'footer.top': 'Top',

  'a11y.skip': 'Skip to content',
  'a11y.locale': 'Language',
  'a11y.theme': 'Toggle theme',
  'theme.toDark': 'Dark theme',
  'theme.toLight': 'Light theme',
};

export const locales = ['pt', 'en'] as const;
export type Locale = (typeof locales)[number];

export const messages: Record<Locale, Record<MessageKey, string>> = { pt, en };

/** Copy used for the document title and share cards, per locale. */
export const meta: Record<Locale, { title: string; description: string }> = {
  pt: {
    title: 'Joaquim Mendes — Desenvolvedor Fullstack',
    description:
      'Portfólio de Joaquim Mendes, desenvolvedor fullstack. Java e Spring Boot no servidor, React e TypeScript na interface.',
  },
  en: {
    title: 'Joaquim Mendes — Fullstack Developer',
    description:
      'Portfolio of Joaquim Mendes, fullstack developer. Java and Spring Boot on the server, React and TypeScript in the interface.',
  },
};
