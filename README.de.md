# Steam Plus

[![CI](https://github.com/NemoKing1210/steam-plus/actions/workflows/ci.yml/badge.svg)](https://github.com/NemoKing1210/steam-plus/actions/workflows/ci.yml)
[![Userscript installieren](https://img.shields.io/badge/Install-userscript-102436?style=for-the-badge&labelColor=66c0f4)](https://raw.githubusercontent.com/NemoKing1210/steam-plus/main/steam-plus.user.js)
[![Lizenz: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](https://github.com/NemoKing1210/steam-plus/blob/main/LICENSE)

[English](https://github.com/NemoKing1210/steam-plus/blob/main/README.md) · **Deutsch** · [Русский](https://github.com/NemoKing1210/steam-plus/blob/main/README.ru.md) · [Español](https://github.com/NemoKing1210/steam-plus/blob/main/README.es.md) · [Français](https://github.com/NemoKing1210/steam-plus/blob/main/README.fr.md) · [Português (Brasil)](https://github.com/NemoKing1210/steam-plus/blob/main/README.pt-BR.md) · [简体中文](https://github.com/NemoKing1210/steam-plus/blob/main/README.zh-CN.md) · [日本語](https://github.com/NemoKing1210/steam-plus/blob/main/README.ja.md) · [한국어](https://github.com/NemoKing1210/steam-plus/blob/main/README.ko.md) · [Polski](https://github.com/NemoKing1210/steam-plus/blob/main/README.pl.md)

Ein Userscript, das den Steam Store und die Steam Community verbessert – mit
einem vollständigen Einstellungsfenster und Übersetzung von Inhalten
(Spielbeschreibungen, Rezensionen, Profilkommentare, News und Leitfäden)
direkt auf der Seite.

> **Status:** frühe Phase. Einstellungsfenster (Allgemein · Übersetzung ·
> Spielseite · Preise · Externe Links · Zusatzinhalte · Region) +
> Inhaltsübersetzung über den kostenlosen Google-Endpunkt (ohne API-Schlüssel).
> Weitere Steam-Verbesserungen sind geplant. Aktuelle Version und Änderungen
> stehen in der
> [CHANGELOG.md](https://github.com/NemoKing1210/steam-plus/blob/main/CHANGELOG.md).

> Die Metadaten `@updateURL` / `@downloadURL` des Skripts zeigen auf `main`
> bei GitHub – die Raw-Installations-URL unten ist immer der neueste Build.

## Screenshots

Das echte Userscript auf einer Live-Steam-Seite. Als Übersetzungsziel wurde
für die Screenshots Französisch gewählt.

![Steam Plus Einstellungsfenster mit Allgemein, Übersetzung, Spielseite, Preise, Externe Links, Zusatzinhalte, Region, Cache, Backup und Über das Skript](https://raw.githubusercontent.com/NemoKing1210/steam-plus/main/docs/screenshots/settings-panel.png)

| | |
|---|---|
| ![Spielbeschreibung unter dem Original übersetzt](https://raw.githubusercontent.com/NemoKing1210/steam-plus/main/docs/screenshots/translation.png)<br>**Übersetzung** — Beschreibungen, Rezensionen, Kommentare und News: unter dem Original oder als Ersatztext | ![Tabelle mit regionalen Preisvergleich](https://raw.githubusercontent.com/NemoKing1210/steam-plus/main/docs/screenshots/regional-prices.png)<br>**Regionale Preise** — 24 Store-Regionen, günstigste hervorgehoben, Live-Währungsumrechnung |
| ![DLC-Liste](https://raw.githubusercontent.com/NemoKing1210/steam-plus/main/docs/screenshots/add-ons.png)<br>**Zusatzinhalte** — jedes DLC mit Preis und Erscheinungsdatum; Besitz wird nach dem Login angezeigt | ![Chips für externe Links](https://raw.githubusercontent.com/NemoKing1210/steam-plus/main/docs/screenshots/external-links.png)<br>**Externe Links** — Schnellzugriffe auf SteamDB, ProtonDB, HowLongToBeat und eigene Links |
| ![Bildbetrachter für Add-ons](https://raw.githubusercontent.com/NemoKing1210/steam-plus/main/docs/screenshots/viewer.png)<br>**Bildbetrachter** — Zoomen, Verschieben, Drehen und Durchblättern der Add-on-Artworks | ![Overlay der Schnellsuche](https://raw.githubusercontent.com/NemoKing1210/steam-plus/main/docs/screenshots/search.png)<br>**Schnellsuche** — den Store regionsübergreifend von jeder Store-Seite aus durchsuchen |

Außerdem auf Spielseiten: Blöcke ausblenden, die du nie liest, und
regionsgesperrte Store-Seiten über einen anonymen Gast-Abruf laden.

## Schnellinstallation

1. Installiere einen Userscript-Manager ([Tampermonkey](https://www.tampermonkey.net/),
   [Violentmonkey](https://violentmonkey.github.io/) oder
   [ScriptCat](https://scriptcat.org/) empfohlen).
2. Installiere das Skript von GitHub (Raw-URL unten).

**Installations-URL (GitHub – neuester Build):**

```
https://raw.githubusercontent.com/NemoKing1210/steam-plus/main/steam-plus.user.js
```

[![Installieren](https://img.shields.io/badge/Install-GitHub_raw-102436?style=for-the-badge&labelColor=66c0f4)](https://raw.githubusercontent.com/NemoKing1210/steam-plus/main/steam-plus.user.js)

### Installation per URL (Manager-Dashboard)

| Manager | Pfad |
|---------|------|
| Tampermonkey | Dashboard → **Utilities** → **Install from URL** |
| Violentmonkey | Dashboard → **+** → **Install from URL** |
| Greasemonkey | Add-on-Menü → **New User Script** → Raw-URL einfügen |
| ScriptCat | [Erweiterung](https://scriptcat.org/) installieren, dann **Install from URL** mit der GitHub-Raw-URL |

Füge beim Installieren über das Manager-Dashboard die
GitHub-Installations-URL (siehe oben) ein.

### Manuelle Installation

1. Öffne die gebaute [`steam-plus.user.js`](https://github.com/NemoKing1210/steam-plus/blob/main/steam-plus.user.js) in diesem Repository (oder führe nach dem Klonen `npm run build` aus).
2. Kopiere den gesamten Dateiinhalt.
3. Erstelle im Userscript-Manager ein neues Skript und füge den Code ein.
4. Speichere und aktiviere das Skript.

## Updates

Das Skript enthält die Metadaten `@updateURL` und `@downloadURL`, die auf die
Raw-Datei bei GitHub zeigen. Unterstützte Manager prüfen automatisch auf
Updates.

Release-Schritte für Maintainer: siehe [docs/DEVELOPMENT.md § Releasing](https://github.com/NemoKing1210/steam-plus/blob/main/docs/DEVELOPMENT.md#releasing).

## Funktionen

**Einstellungen** (Schaltfläche **Steam Plus** in der Kopfzeile oder Menü des
Userscript-Managers):

- Einstellungsfenster mit Tabs — **Allgemein** · **Übersetzung** ·
  **Spielseite** · **Preise** · **Externe Links** · **Zusatzinhalte** ·
  **Region** (weitere Tabs geplant)
- Steam-native dunkle Oberfläche; jede Änderung bleibt über Neuladen hinweg
  erhalten
- Oberflächensprache: Automatisch (Browser) oder eine von **10 Sprachen** —
  English, Русский, Deutsch, Español, Français, Português (Brasil), 简体中文,
  日本語, 한국어, Polski

**Übersetzung** (Store- und Community-Inhalte):

- **Spielbeschreibungen** — vollständige Beschreibung auf der Spielseite und
  Ausschnitte in Listen
- **Spielrezensionen** — Store-Rezensionen und Rezensionskarten im
  Community-Hub
- **Profilkommentare** — Kommentar-Threads in Profilen, Hubs und geteilten
  Dateien
- **News & Events** — Text von News-/Event-Details und Hub-Zusammenfassungen
- **Leitfäden** — eine Schaltfläche „Übersetzen“ über dem Leitfaden übersetzt
  alles auf einmal: Titel, obere Beschreibung und jeden Abschnitt (Kommentare
  zu Leitfäden decken die Profilkommentare ab)
- Standardmäßig der kostenlose Google-Endpunkt — kein API-Schlüssel,
  erweiterbare Provider-Registry
- Übersetzen **automatisch** beim Erscheinen von Inhalten oder per
  **Übersetzen**-Schaltfläche pro Block
- Übersetzung **unter** dem Original anzeigen oder den Text **ersetzen**, mit
  Schaltfläche zum Zurückschalten
- Zielsprache: Automatisch (Steam-/Browsersprache) oder eine von 14 gängigen
  Sprachen
- Schalter pro Bereich; globaler Hauptschalter

**Spielseite** (Store-Spielseiten):

- Blende Blöcke aus, die du nie liest — Screenshots & Trailer, Kaufoptionen &
  Bundles, „Über dieses Spiel“, DLC-Liste, Systemanforderungen,
  Nutzerrezensionen, Kuratoren, Events & Ankündigungen, Detail-Seitenleiste,
  Franchise & Empfehlungen
- Hauptschalter plus Schalter pro Block; standardmäßig wird nichts ausgeblendet
- Ausblenden per reinem CSS, das Steam-Re-Renders und Seitennavigation
  übersteht

**Regionale Preise** (Store-Spielseiten):

- Vergleiche den Spielpreis direkt auf der Spielseite über 24
  Steam-Store-Regionen — dein eigener Store-Preis ist oben angepinnt, die
  günstigste Region hervorgehoben, die Ersparnis gegenüber deinem Preis
  angezeigt
- Voll konfigurierbar: Haupt- und Auto-Load-Schalter, Regionsauswahl,
  Platzierung (über den Kaufoptionen / Seitenleiste / unter der Beschreibung),
  Standardzeilenreihenfolge mit klickbaren Tabellenköpfen (Klick sortiert,
  erneuter Klick dreht die Richtung) und Anzeigeschalter pro Element
  (Originalpreis, Rabatt-Badge, Ersparnis, Günstigstes-Hervorhebung, eigene
  Preiszeile)
- Steams eigene formatierte Preise, Steam-grüne Rabatt-Badges,
  1-Stunden-Cache mit manueller Aktualisierung; bei kostenlosen Spielen wird
  der Block automatisch ausgeblendet
- Live-Währungsumrechnung (ExchangeRate-API + jsDelivr-Fallback, Cache mit
  konfigurierbarer Laufzeit, Status und manuelles Leeren in den Einstellungen):
  jeder Preis wird automatisch in deine Store-Währung oder eine beliebige
  gewählte Währung umgerechnet, die Quelle der Kurse steht unter dem Block

**Externe Links** (Store-Spielseiten):

- Schnellzugriffe auf andere Stores und Datenbanken auf der Spielseite —
  standardmäßig SteamDB, ProtonDB und HowLongToBeat, platziert über den
  Kaufoptionen, in der Seitenleiste oder unter der Beschreibung
- Vollständig nutzerdefiniert: eigene Links mit browserartigen URL-Vorlagen
  (`{name}` für den Spieltitel, `{appid}` für die Steam-ID), eigene Favicons,
  Schalter pro Link, Reihenfolge ändern und eine Option zum Öffnen in einem
  neuen Tab

**Zusatzinhalte** (Store-Spielseiten):

- Listet **jedes DLC des Spiels** mit Kapselbild, Erscheinungsdatum, Preis und
  ob dein Konto es bereits besitzt — ein Besitz/gesamt-Zähler im Kopf, Links
  zur Store-Seite jedes Add-ons pro Zeile und die Sortierung „nicht besessen
  zuerst“, damit Fehlendes oben bleibt
- Startet eingeklappt, um Platz zu sparen; aufklappen über den Chevron im Kopf
- Klicke auf ein Add-on-Bild, um den **integrierten Bildbetrachter** zu
  öffnen: bildschirmfüllend, Zoom (Mausrad, `+`/`−`, Doppelklick), Ziehen zum
  Verschieben, Drehen, alle Add-ons mit `←`/`→` oder der Miniaturleiste
  durchblättern, `Esc` zum Schließen; der Betrachter ist konfigurierbar
  (Miniaturleiste, Umlauf) und per Tastatur bedienbar
- Liest zuerst die DLC-Liste der Seite (Namen, Preise, gerenderte Bilder) und
  fragt Steam nur nach dem, was die Seite nicht liefert — Erscheinungsdaten
  und Kapseln, die Steam eingeklappt hält, füllen sich schrittweise und werden
  einen Tag lang gecacht, Besitz 30 Minuten; mit deaktivierten
  **Add-on-Bildern** und **Erscheinungsdaten** kostet eine Seite, deren Zeilen
  Steam bereits gerendert hat, gar keine Requests; ein Cache-Reset liegt im
  Tab „Zusatzinhalte“
- Konfigurierbar: Hauptschalter, Platzierung (über den Kaufoptionen /
  Seitenleiste / unter der Beschreibung), Zeilenreihenfolge, Besitz-Zähler,
  besessene Zeilen, Preis-, Bild- und Erscheinungsdatum-Schalter

**Regionsperre umgehen** (gesperrte Store-Seiten):

- Lädt `/app/`, `/bundle/`- und `/sub/`-Seiten, die mit „in deiner Region nicht
  verfügbar“ blockiert sind, über einen anonymen Gast-Abruf neu — ohne
  Account-Cookies, Steam-Sprach- und Alterssperre-Cookies werden automatisch
  gesendet, optional mit Überschreiben des Store-Landes (`cc`)
- Fügt den Gast-Inhalt in das laufende Dokument ein — deine eingeloggte
  Kopfzeile, Styles und Skripte bleiben unangetastet; Gast-Initialisierungen
  (Rezensionen, Systemanforderungs-Tabs, Tags) werden wiederholt, Store-Inseln
  hydratisieren an Ort und Stelle, bei strukturellen Abweichungen greift
  automatisch ein vollständiges Umschreiben des Dokuments; Übersetzung,
  regionale Preise, externe Links, DLC-Inhalte und Ausblenden von Blöcken
  werden auf den eingefügten Inhalt automatisch angewendet; der Auto-Modus
  ersetzt den Fehler sofort, der manuelle Modus zeigt zuerst eine
  Angebotsschaltfläche, bei Fehlern erscheint eine Statuskarte mit „Erneut
  versuchen“
- Ein optionales HTTP-Proxy-Gateway (Host, Port, Basic Auth, drei URL-Modi)
  für IP-Sperren — alles im Tab „Region“

Unter der Haube: ein Übersetzungs-Cache pro Provider mit TTL und LRU-Trim plus
eine Anfragewarteschlange mit begrenzter Parallelität — schnell bei
Wiederbesuchen, schonend für den Übersetzungsdienst.

> Für die Übersetzung ist eine Internetverbindung zum Übersetzungsanbieter
> nötig (`translate.googleapis.com` beim Standard-Provider). Übersetzte
> Inhalte werden lokal im Userscript-Speicher gecacht.

## Unterstützte Seiten

| Website | URL-Muster |
|---------|------------|
| Steam Store | `https://store.steampowered.com/*` |
| Steam Community | `https://steamcommunity.com/*` |

## Entwicklung & Mitmachen

- [docs/DEVELOPMENT.md](https://github.com/NemoKing1210/steam-plus/blob/main/docs/DEVELOPMENT.md) — Build, lokales Testen, Release
- [docs/ARCHITECTURE.md](https://github.com/NemoKing1210/steam-plus/blob/main/docs/ARCHITECTURE.md) — Modulaufbau, Datenfluss, Erweiterungsverträge
- [CONTRIBUTING.md](https://github.com/NemoKing1210/steam-plus/blob/main/CONTRIBUTING.md) — PR-Richtlinien und Konventionen
- [SECURITY.md](https://github.com/NemoKing1210/steam-plus/blob/main/SECURITY.md) — wie du eine Sicherheitslücke meldest
- [AGENTS.md](https://github.com/NemoKing1210/steam-plus/blob/main/AGENTS.md) — Architekturhinweise für KI-Coding-Agenten

```bash
npm install
npm run dev      # Vite-Server — den generierten "dev:"-Userscript installieren
npm run build    # Produktion → dist/ + Kopie ins Repo-Wurzelverzeichnis
npm run ci       # dieselben Prüfungen wie in GitHub Actions
```

Erfordert Node.js 22 (siehe `.nvmrc`).

## Zugehörigkeit

Dieses Projekt ist **nicht mit Valve oder Steam verbunden**. Es ist ein
unabhängiges Community-Userscript.

## Lizenz

[MIT](https://github.com/NemoKing1210/steam-plus/blob/main/LICENSE) — Copyright (c) 2026 NemoKing1210
