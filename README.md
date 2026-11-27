# Coven 1692 — site conceitual

Proposta de redesenho do site da [Coven 1692](https://www.thecoven1692.com/), perfumaria artesanal e apothecary da Galeria do Rock, em São Paulo.

Página estática, sem build: `index.html` + `assets/`. O catálogo (perfumes, linhas do apothecary, obras e fotos das lojas) fica em `assets/js/data.js`.

Navegação em páginas: cada `<section>` de `<main>` é uma página, mostrada conforme o endereço (`#quem-somos`, `#lojas`, `#vendas-online`, `#fragrancias`, `#apothecary`, `#ap-<linha>` (Apothecary filtrado por linha), `#hoodoo`, `#fine-art`, `#frasco/<perfume>`); sem endereço, abre a capa.
