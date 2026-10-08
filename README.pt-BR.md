<div align="center">

<img src="brand/boink-app-icon.svg" width="96" alt="" />

# boink

**Cola o link, recebe o vídeo.** Um app pequeno para Windows que baixa vídeo e áudio do YouTube e de [mais de mil outros sites](https://github.com/yt-dlp/yt-dlp/blob/master/supportedsites.md).

[**Baixar para Windows**](https://github.com/w-felipe360/boink/releases/latest) · [English](README.md)

<img src="docs/screenshot-home-pt.png" width="720" alt="boink com uma fila de downloads: três arquivos prontos e um baixando" />

</div>

## O que ele faz

- **Cola e pronto.** Um link ou uma lista inteira de uma vez. Eles baixam um depois do outro, numa fila em que dá para cancelar, tentar de novo ou limpar.
- **Três modos:** vídeo com som, só áudio (mp3, m4a ou opus) ou vídeo sem som.
- **Arquivos de tamanho razoável.** 720p por padrão, preferindo 30 fps e H.264/AAC, para os arquivos ficarem leves e tocarem em qualquer lugar. Dá para escolher 480p, 1080p ou máxima nos ajustes.
- **Progresso de verdade** em cada item, e botões para abrir o arquivo, mostrar na pasta ou copiar o caminho.
- **A sua pasta.** Salva em `Downloads\boink` por padrão, ou na pasta que você escolher.
- **Um boink quando termina.** Escolha o bonk do meme, um som clássico mais suave, ou silêncio.
- **Português e inglês**, seguindo o idioma do Windows, com troca nos ajustes.
- Sem conta, sem anúncio, sem rastreamento. Tudo roda no seu computador.

<img src="docs/screenshot-settings-pt.png" width="720" alt="Ajustes do boink: formato de áudio, pasta de destino, som ao terminar e idioma" />

## Instalar

1. Baixe o `boink_x.y.z_x64-setup.exe` da [última release](https://github.com/w-felipe360/boink/releases/latest).
2. Execute. Ele instala só para o seu usuário, sem pedir permissão de administrador.

Precisa de Windows 10 ou 11 (64 bits). O instalador configura o Microsoft Edge WebView2 se ele não estiver instalado.

> **"O Windows protegeu o computador"?** O instalador ainda não tem assinatura digital, então o SmartScreen avisa. Clique em **Mais informações → Executar assim mesmo**. Você também pode compilar o app a partir do código (abaixo).

## Compilar a partir do código

Você vai precisar do [Node.js](https://nodejs.org) 20+, do [Rust](https://rustup.rs) e dos [pré-requisitos do Tauri para Windows](https://v2.tauri.app/start/prerequisites/) (Microsoft C++ Build Tools e WebView2).

```powershell
git clone https://github.com/w-felipe360/boink.git
cd boink
npm install
npm run sidecars      # baixa o yt-dlp e o ffmpeg em src-tauri/bin (não ficam no git, o ffmpeg tem ~160 MB)
npm run tauri dev     # roda em modo de desenvolvimento
npm run tauri build   # gera o instalador em src-tauri/target/release/bundle/nsis
```

Para atualizar o yt-dlp incluído (os sites mudam bastante e o yt-dlp acompanha), rode `npm run sidecars -- -Force` e compile de novo.

### Como funciona

A interface é React + TypeScript (`src/`). O lado em Rust (`src-tauri/src/lib.rs`) executa o [yt-dlp](https://github.com/yt-dlp/yt-dlp) e o [ffmpeg](https://ffmpeg.org) como processos incluídos no app (sidecars), envia o progresso para a interface e cuida de cancelamento, pastas e abertura de arquivos.

Duas escolhas que vale conhecer:

- **O yt-dlp sempre roda com `--force-ipv4`.** Em redes onde o IPv6 está configurado mas não funciona de fato, o yt-dlp trava para sempre em sites que publicam endereços IPv6 (o YouTube incluso). Todo site ainda atende por IPv4, então não se perde nada.
- **Downloads "sem som"** pegam um stream só de vídeo quando o site oferece. Senão, o ffmpeg remove a faixa de áudio depois, sem recodificar.

## Use com responsabilidade

O boink é uma ferramenta para salvar mídia que você tem direito de baixar: seus próprios vídeos, conteúdo Creative Commons ou em domínio público, material cuja licença permite. Respeite os direitos autorais e os termos de uso de cada site.

## Licença

O boink usa a [licença MIT](LICENSE). O instalador também inclui o yt-dlp (Unlicense), o FFmpeg (GPL-3.0) e outros componentes com suas próprias licenças; veja [THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md).
