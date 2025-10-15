# Gebruikershandleiding - Eendraadsschema Editor

## Snel starten

1. Open `index.html` in je webbrowser
2. Je ziet een leeg wit canvas met aan de linkerkant een symbolen pallet
3. Sleep symbolen naar het canvas om te beginnen

## Symbolen toevoegen

### Beschikbare symbolen:

**Verlichting:**
- 💡 Lamp - Standaard lichtpunt
- 🔆 Kroonluchter - Meerdere lampen/hanglamp
- 💡 Wandlamp - Lamp aan de muur
- 🌙 Buitenlamp - Lamp voor buitengebruik

**Schakelaars:**
- 🔘 Schakelaar - Enkele schakelaar
- 🔘🔘 Dubbele Schakelaar - Twee schakelaars naast elkaar
- 🔄 Wisselschakelaar - Voor meerdere schakelpunten
- 🎚️ Dimmer - Dimbare schakelaar

**Voorzieningen:**
- 🔌 Stopcontact - Wandcontactdoos
- ⚡ Zekering - Automatische zekering
- 📦 Groep - Groepenkast element
- 🛡️ Aardlekschakelaar - ALS/RCD

**Apparaten:**
- 🍳 Kookplaat - Elektrische kookplaat
- 🔥 Oven - Elektrische oven
- 🧺 Wasmachine - Wasmachine aansluiting

**Communicatie:**
- 📞 Telefoon - Telefoonaansluiting
- 🔔 Deurbel - Deurbel installatie

## Basis bewerkingen

### Symbolen verplaatsen
1. Klik op een symbool om het te selecteren
2. Sleep het naar de gewenste positie
3. Bij grid-modus snapt het symbool naar het raster

### Symbolen roteren
1. Selecteer een symbool
2. Gebruik de rotatie handvat (cirkel bovenaan)
3. Sleep om te roteren

### Symbolen schalen
1. Selecteer een symbool
2. Gebruik de hoekpunten om te schalen
3. Houd Shift ingedrukt voor proportioneel schalen

### Symbolen verwijderen
- Selecteer het symbool en druk op `Delete` of `Backspace`
- Of klik met rechts en kies verwijderen (indien beschikbaar)

## Geavanceerde functies

### Lijnen tekenen
1. Klik op de knop **"Lijn Tekenen"**
2. De knop wordt blauw/actief
3. Klik op het canvas voor het startpunt
4. Klik opnieuw voor het eindpunt
5. De lijn wordt getekend
6. Herhaal voor meer lijnen
7. Klik nogmaals op "Lijn Tekenen" om de modus uit te schakelen

**Tips:**
- Gebruik lijnen om verbindingen tussen symbolen te tonen
- Met grid aan snappen de lijnen naar het raster voor rechte lijnen

### Tekst toevoegen
1. Klik op de knop **"Tekst Toevoegen"**
2. De knop wordt blauw/actief
3. Klik op de gewenste locatie
4. Voer de tekst in het popup-venster in
5. Klik OK
6. De tekst wordt toegevoegd
7. Dubbelklik op tekst om te bewerken
8. Klik nogmaals op "Tekst Toevoegen" om de modus uit te schakelen

**Tips:**
- Gebruik tekst voor labels zoals "Keuken", "Woonkamer", "16A"
- Tekst kan ook worden verplaatst, geschaald en geroteerd

### Grid/Snap functionaliteit
1. Klik op de knop **"Grid Aan/Uit"**
2. Een raster verschijnt op het canvas
3. Symbolen en lijnen snappen automatisch naar het raster
4. Klik nogmaals om het grid uit te schakelen

**Voordelen:**
- Zorgt voor rechte lijnen
- Maakt uitlijning makkelijk
- Professionele uitstraling

## Opslaan en laden

### Schema opslaan (JSON Export)
1. Klik op **"Export JSON"**
2. Een `.json` bestand wordt gedownload
3. Bewaar dit bestand veilig

**Gebruik JSON voor:**
- Later verder werken aan het schema
- Back-ups maken
- Versies beheren

### Schema laden (JSON Import)
1. Klik op **"Import JSON"**
2. Selecteer een eerder opgeslagen `.json` bestand
3. Het schema wordt geladen op het canvas

**Let op:** Het huidige schema wordt overschreven!

## Exporteren voor gebruik

### Exporteren als PNG afbeelding
1. Klik op **"Export PNG"**
2. Een hoge-resolutie PNG wordt gedownload
3. Het grid wordt automatisch verborgen in de export

**Gebruik PNG voor:**
- Invoegen in Word/PowerPoint
- E-mailen naar klanten
- Printen

### Exporteren als PDF
1. Klik op **"Export PDF"**
2. Een PDF document wordt gedownload
3. Het grid wordt automatisch verborgen in de export

**Gebruik PDF voor:**
- Professionele documentatie
- Archivering
- Officiële offertes

## Toetsenbord shortcuts

| Shortcut | Actie |
|----------|-------|
| `Delete` of `Backspace` | Verwijder geselecteerd object |
| `Ctrl+C` / `⌘+C` | Kopieer geselecteerd object |
| `Ctrl+V` / `⌘+V` | Plak gekopieerd object |

## Tips & Tricks

### Meerdere symbolen selecteren
- Houd `Shift` ingedrukt en klik op meerdere symbolen
- Of sleep een selectiekader (buiten symbolen starten)

### Dupliceren van symbolen
1. Selecteer een symbool
2. Druk `Ctrl+C` (of `⌘+C`)
3. Druk `Ctrl+V` (of `⌘+V`)
4. Het symbool wordt geplakt met een kleine offset

### Professioneel schema maken
1. Begin met het inschakelen van het **Grid**
2. Plaats eerst de groepenkast met groepen
3. Teken lijnen naar de verschillende circuits
4. Plaats symbolen voor verlichting en stopcontacten
5. Voeg tekst labels toe voor ruimtes en specificaties
6. Gebruik consistente afstanden (dankzij grid)

### Canvas wissen
1. Klik op **"Wissen"** (rode knop)
2. Bevestig de actie
3. Het canvas wordt volledig leeg

**Let op:** Deze actie kan niet ongedaan worden gemaakt!

## Problemen oplossen

### Symbool toevoegen werkt niet
- Zorg dat je niet in "Lijn Tekenen" of "Tekst Toevoegen" modus bent
- Klik deze knoppen uit als ze blauw/actief zijn

### Kan geen objecten selecteren
- Schakel "Lijn Tekenen" of "Tekst Toevoegen" modus uit
- Deze modi blokkeren selectie

### Export bevat grid lijnen
- Dit zou niet moeten gebeuren - grid wordt automatisch verborgen
- Probeer de browser te verversen en opnieuw te exporteren

### JSON import werkt niet
- Controleer of het bestand echt een `.json` bestand is
- Controleer of het bestand niet beschadigd is
- Probeer opnieuw te exporteren en importeren

## Browser compatibiliteit

Deze applicatie werkt het beste in moderne browsers:
- ✅ Chrome/Edge (aanbevolen)
- ✅ Firefox
- ✅ Safari
- ⚠️ Oudere browsers kunnen problemen geven

## Vragen of problemen?

Deze applicatie is open source. Voor vragen, suggesties of bug reports, maak een issue aan op GitHub.

---

**Veel succes met het maken van je eendraadsschema's!** 🔌⚡
