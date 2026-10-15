# Chrome Web Store listing — Power Slider 2.0.0

Package: `dist/power-slider-2.0.0.zip` (built from the repo files; `dist/` is git-ignored).

The extension's name ("Power Slider") and short description come from `manifest.json` / `_locales`. Everything below is filled in by hand in the developer dashboard.

## Store listing

**Category:** Productivity → Tools

**Images** (all in `img/`):

| Field | File |
|---|---|
| Store icon (128×128) | `icon_enabled_128.png` (also in the package) |
| Screenshots, English (1280×800) | `Screenshot_1_en.png`, `Screenshot_2_en.png` |
| Screenshots, Portuguese (1280×800) | `Screenshot_1_pt.png`, `Screenshot_2_pt.png` |
| Small promo tile (440×280) | `promo_small_440x280.png` |
| Marquee promo tile (1400×560) | `promo_marquee_1400x560.png` |

### Description — English

> Turn your reports into slideshows for TVs, lobby screens and meeting rooms.
>
> Power Slider is the companion extension for the Power Slider web app. Open any report in Microsoft Power BI, click the Power Slider icon and start a presentation that rotates through the report's pages automatically and keeps the data fresh — perfect for dashboards that need to be on display all day.
>
> What the extension does:
> • Detects when you are on a report (Power BI or Microsoft Fabric) and shows a green dot on its icon
> • Starts the presentation with one click, with a keyboard shortcut (Alt+Shift+S) or from the right-click menu
> • Remembers your last presentations so you can reopen them from any tab
> • Links to Compositions, for presentations that combine several reports
>
> In Power Slider you choose which pages to show, how long each one stays on screen and how often the data is refreshed.
>
> Power Slider is an independent product and is not affiliated with, endorsed by or sponsored by Microsoft. Microsoft, Power BI and Fabric are trademarks of the Microsoft group of companies.

### Descrição — Português (Brasil)

> Transforme seus relatórios em apresentações para TVs, recepções e salas de reunião.
>
> O Power Slider é a extensão que acompanha o aplicativo web Power Slider. Abra qualquer relatório no Microsoft Power BI, clique no ícone do Power Slider e inicie uma apresentação que passa pelas páginas do relatório automaticamente e mantém os dados atualizados — ideal para painéis que precisam ficar expostos o dia todo.
>
> O que a extensão faz:
> • Reconhece quando você está em um relatório (Power BI ou Microsoft Fabric) e mostra um ponto verde no ícone
> • Inicia a apresentação com um clique, pelo atalho de teclado (Alt+Shift+S) ou pelo menu do botão direito
> • Guarda suas últimas apresentações para você reabrir de qualquer aba
> • Dá acesso às Composições, para apresentações que juntam vários relatórios
>
> No Power Slider você escolhe quais páginas mostrar, quanto tempo cada uma fica na tela e de quanto em quanto tempo os dados são atualizados.
>
> O Power Slider é um produto independente, sem afiliação, endosso ou patrocínio da Microsoft. Microsoft, Power BI e Fabric são marcas registradas do grupo de empresas Microsoft.

## Privacy practices

**Single purpose:** Open the Power BI report the user is viewing in the Power Slider web app as an auto-rotating presentation.

**Permission justifications:**

| Permission | Justification |
|---|---|
| `tabs` | Read the URL and title of the user's tabs to detect when a Power BI report is open (to light up the toolbar icon and show the report's name) and to open the presentation in a new tab next to it. |
| `activeTab` | Access the current tab when the user clicks the toolbar icon, uses the keyboard shortcut or the context menu. |
| `storage` | Keep the user's last 3 presented reports (report id, workspace id, report name and time) locally so they can be reopened from the popup. Nothing is synced or sent anywhere. |
| `contextMenus` | Add a "Present with Power Slider" item to the right-click menu on Power BI report pages. |

**Remote code:** No. All code is in the package.

**Data usage:** The extension does not collect or transmit user data. When the user starts a presentation, the report's workspace id and report id are sent to powerbislider.com as part of the URL that is opened. Recent presentations stay in the browser's local extension storage.

## Before submitting

- The extension's website, powerbislider.com, still shows the "Power BI Slider" name and logo in its header. Screenshot 2 was edited to show the new brand, so the site should be updated to match.
- The keyboard shortcut was tested only by checking that Chrome registered it (automation can't press browser shortcuts). Press it once on a real report before submitting.
