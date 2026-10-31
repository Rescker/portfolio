# Portfólio — Joaquim Mendes

Site pessoal em Vite + TypeScript + Three.js r187 + GSAP + Lenis. O hero é um
personagem glTF animado por código, com a cabeça acompanhando o ponteiro.

## Comandos

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # tsc --noEmit + bundle
npm run preview  # serve o dist
```

## Editar conteúdo

| O que | Onde |
| --- | --- |
| Nome, e-mail, redes, fuso | `src/config.ts` |
| Texto do hero, seções, contato | `index.html` |
| Cores, fontes, espaçamento | `src/styles/tokens.css` |
| Cena 3D, luz, enquadramento | `src/gl/stage.ts` |
| Grain, vinheta, aberração | `src/gl/shaders/final.frag.glsl` |

Os blocos da seção **Trabalho** descrevem abordagem, não resultados de clientes.
Quando houver estudos de caso reais, substitua os textos em `index.html` — a
estrutura (título, resumo, painel com três colunas) já está pronta.

## O personagem

`public/assets/emu.glb` é um único mesh estático: **sem esqueleto, sem clipes de
animação**. Todo movimento é procedural, em `src/gl/stage.ts`, e aplicado ao corpo
inteiro:

- **Peso** — oscilação lateral lenta (`0.42 Hz`) que inclina o tronco, como quem
  está parado em pé.
- **Respiração** — `sin` em escala, não em translação: os ombros sobem e o corpo
  assenta, os pés não saem do lugar.
- **Orientação** — giro lento em Y (0.098 rad/s, uma volta a cada ~64 s) e um
  micro-balanceio em X, ambos fora de fase com o balanço para o movimento não
  ficar circular.

O giro também aceita o usuário: arrastar gira o modelo em ±0.62 rad no eixo Y e
±0.30 no X (`pointerdown` no canvas). O ângulo do arraste é somado ao giro
automático, então soltar o mouse não reseta a pose — e os limites existem porque a
malha foi modelada para a frente, e além de ~35° a silhueta do ombro perde
volume.

No desktop o boneco fica à direita, com a coluna de texto livre à esquerda. Em
retrato ele vira plano de fundo: sobe, encosta na borda direita e sai meio quadro,
enquanto o texto ocupa a largura toda por cima. Para o texto continuar legível sem
apagar o personagem, o scrim do mobile é local ao bloco de copy (`.hero__content::before`),
não na tela inteira.

Cada frame escreve em `position`/`rotation`/`scale` — nada de esqueleto, nada de
mistura de animação. Com `prefers-reduced-motion` o loop desenha a pose parada
uma vez e para.

Enquadramento é calculado, não fixado: a altura visível em `d` é
`2·d·tan(fov/2)`, então a distância vem da ocupação desejada e os pés são
ancorados a uma fração do quadro. Por isso o personagem inteiro cabe em retrato,
tablet e desktop sem números mágicos por breakpoint.

Para trocar o modelo, mantenha o nome do arquivo: a escala é normalizada pela
altura da bounding box, então o enquadramento se adapta sozinho.

## Navegação por capítulo

Cada seção ocupa uma tela (`min-height: 100svh`) e o conteúdo é alinhado ao topo,
logo abaixo do nav. Um scroll **forte** — um delta acumulado de 170 px em 130 ms,
que é uma rotação de roda ou um flick de trackpad — desliza para o próximo
capítulo; um scroll leve continua nativo. A medição é de gesto, não de posição
(`src/motion/snap.ts`), com cooldown de 320 ms para um fling não pular dois
capítulos. Em touch e com `prefers-reduced-motion` o snap não é instalado.

## Idioma e tema

- **i18n** — `src/i18n/messages.ts` guarda `pt` e `en`; `en` é tipado contra `pt`,
  então uma chave faltando quebra o build. O HTML declara `data-i18n` (texto) ou
  `data-i18n-html` (markup), e atributos via `data-i18n-attr="aria-label:chave"`.
  A escolha é salva em `localStorage`; sem escolha, vale `navigator.language`.
- **Tema** — `:root[data-theme='light']` em `tokens.css`. Não é inversão: papel
  quente, tinta quente e um azul escurecido até passar 4,5:1 sobre creme. Os
  scrims usam o canal `--scrim` para acompanhar o tema, e a cena 3D troca fundo e
  luz por `setTheme`.
- O título e a descrição da página são atualizados junto com o idioma.

## Navegação por capítulo

- Three.js e o loader glTF carregam por `import()` dinâmico: ~55 kB gzip no
  bundle inicial, ~163 kB no chunk da cena.
- DPR limitado a 2, RAF pausado com `IntersectionObserver` e
  `visibilitychange`.
- `prefers-reduced-motion`: o loop desenha a pose parada e não agenda o próximo
  frame.
- Sem aberração cromática e com bloom quase desligado: os dois pintavam franjas
  coloridas nas bordas e o pedido era limpo.
- Sem WebGL2 — ou se o chunk falhar — o hero usa `emu-poster.jpg`, um frame real
  da cena. Sem JS o conteúdo continua legível: os painéis de trabalho só colapsam
  com a classe `.js`.
- O cursor customizado é desligado em `(pointer: coarse)` e `(hover: none)`.

## Assets

| Arquivo | Papel |
| --- | --- |
| `public/assets/emu.glb` | O personagem (4,5 MB, textura 2048² embutida) |
| `public/assets/emu-poster.jpg` | Fallback estático e primeiro paint |
| `public/assets/og.jpg` | Imagem de compartilhamento (1200×630) |

O poster é um frame da própria cena, capturado do canvas. Se você mudar a
iluminação, vale recapturar.

O GLB fica **sem otimização destrutiva**: textura 2048² e posições float32, que é
onde está o detalhe do rosto. A tentação é rodar
`@gltf-transform/cli optimize --texture-size 1024`, que derruba o arquivo para
1,4 MB — mas quatro vezes menos texels na face aparecem imediatamente. Se um dia
o peso incomodar, o corte seguro é recomprimir a textura em qualidade alta,
nunca reduzir a resolução.
