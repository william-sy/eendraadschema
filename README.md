# Eendraadsschema Editor

Een web-gebaseerde editor voor het maken van eendraadsschema's (single-line electrical diagrams).
Use online: [URL](https://william-sy.github.io/eendraadschema/)

## Functionaliteiten

- **Drag & Drop Interface**: Sleep elektrische symbolen van het pallet naar het canvas
- **Uitgebreide Symbolen Bibliotheek**:
  - Verlichting: Lamp, Kroonluchter, Wandlamp, Buitenlamp
  - Schakelaars: Schakelaar, Dubbele Schakelaar, Wisselschakelaar, Dimmer
  - Voorzieningen: Stopcontact, Zekering, Groep, Aardlekschakelaar
  - Apparaten: Kookplaat, Oven, Wasmachine
  - Communicatie: Telefoon, Deurbel
- **Lijn Tekenen**: Teken verbindingslijnen tussen symbolen (klik op "Lijn Tekenen" en klik twee punten)
- **Tekst Labels**: Voeg tekst labels toe aan je schema (klik op "Tekst Toevoegen" en klik op de gewenste locatie)
- **Grid/Snap Functionaliteit**: Schakel een raster in voor nauwkeurige plaatsing (objecten snappen naar het raster)
- **Export/Import**: Sla je schema op als JSON bestand en laad het later weer
- **Export naar afbeelding**: Exporteer je schema als PNG of PDF (grid wordt automatisch verborgen)
- **Bewerken**: Verplaats, kopieer, verwijder, roteer en schaal symbolen
- **Toetsenbord shortcuts**:
  - `Delete` of `Backspace`: Verwijder geselecteerd object
  - `Ctrl+C` / `Cmd+C`: Kopieer geselecteerd object
  - `Ctrl+V` / `Cmd+V`: Plak object

## Gebruik

1. Open `index.html` in een moderne webbrowser
2. Sleep symbolen van de linkerzijde naar het canvas
3. Klik en sleep om symbolen te verplaatsen
4. Gebruik "Lijn Tekenen" om verbindingen te maken tussen symbolen
5. Gebruik "Tekst Toevoegen" om labels toe te voegen
6. Schakel het grid in voor precisie werk
7. Gebruik de knoppen bovenaan om te wissen, exporteren of importeren

## Technologieën

- HTML5 Canvas
- [Fabric.js](http://fabricjs.com/) - Canvas manipulatie en objecten
- [jsPDF](https://github.com/parallax/jsPDF) - PDF export
- Vanilla JavaScript

## Licentie

MIT License
