# Codierleitfaden: Beitrag eines Kurses zu einem Skill

Dieser Leitfaden gilt für alle Codierenden. Er legt fest, wie aus einem
HSG-Merkblatt die drei Codes für jedes Kurs–Skill-Paar bestimmt werden. Aus den
Codes berechnet ein Skript den Beitrag (0–80 Punkte); die Codierenden rechnen
nichts selbst.

## Grundsätze

- **Quelle ist nur das Merkblatt** des Semesters (Link im Codierblatt): Lernziele,
  Inhalte, Kursstruktur, Prüfung. Kein Vorwissen über den Kurs, keine Website,
  keine Erfahrungen von Studierenden.
- **Unabhängig codieren.** Erst nach der Abgabe besprechen die Codierenden
  abweichende Fälle (Liste im Bericht der Auswertung).
- **Im Zweifel tiefer codieren** und den Zweifel im Kommentar festhalten.
- **Belegstelle immer angeben**: das Lernziel, den Inhaltspunkt oder den
  Prüfungsteil, auf den sich die Codes stützen (kurz zitiert).

## Code 1: Zeitanteil (%)

Welcher Anteil des Kurses ist dem Skill gewidmet? Ganze Zahl von 0 bis 100.

1. Gibt das Merkblatt **Sitzungen oder einen Zeitplan** an, zählen die Sitzungen,
   in denen der Skill Thema ist (eine Sitzung mit zwei Themen zählt je halb).
2. Sonst zählen die **Inhaltspunkte**; fehlen sie, die **Lernziele**. Anteil = Punkte
   zum Skill ÷ alle Punkte.
3. Ein Punkt kann mehreren Skills dienen; dann teilt er sich zu gleichen Teilen auf.
4. **0** heisst: Der Skill kommt im Merkblatt nicht vor. Die Zeile bleibt im Blatt;
   der Skill wird aus dem Kurs entfernt.
5. Die Anteile eines Kurses müssen nicht 100 ergeben (Teile des Kurses betreffen
   Skills ausserhalb des Katalogs), dürfen aber zusammen nicht über 100 liegen.

## Code 2: Bloom-Stufe (1–6)

Die **höchste** Stufe, die ein Lernziel des Kurses für diesen Skill verlangt,
bestimmt am Verb des Lernziels (überarbeitete Taxonomie, Anderson & Krathwohl 2001).
Steht der Skill nur in den Inhalten, ohne Lernziel: Stufe 2 (Verstehen), ausser die
Prüfung verlangt erkennbar mehr (dann die Stufe der Prüfungsaufgabe).

| Stufe | Name | Typische Verben (DE · EN) | Höchstwert |
|---|---|---|---|
| 1 | Erinnern | nennen, aufzählen, wiedergeben · list, name, recall | 15 |
| 2 | Verstehen | erklären, beschreiben, einordnen, kennen · explain, describe, classify | 25 |
| 3 | Anwenden | anwenden, durchführen, berechnen, programmieren · apply, use, implement | 40 |
| 4 | Analysieren | analysieren, vergleichen, untersuchen · analyse, compare, examine | 60 |
| 5 | Bewerten | beurteilen, begründen, entscheiden, kritisieren · evaluate, assess, justify | 70 |
| 6 | Erschaffen | entwickeln, gestalten, konzipieren, gründen · design, create, develop | 80 |

Der Höchstwert ist das Niveau (Skala 0–100), das ein Kurs auf dieser Stufe
höchstens erreichen kann. Ein Kurs, der nur Wissen vermittelt, hebt einen Skill
nicht auf das Niveau eines Kurses, in dem man ihn selbst anwendet.

## Code 3: Prüfungsgewicht (%)

Welcher Anteil der Gesamtnote prüft den Skill? Ganze Zahl von 0 bis 100.

1. Prüfungsteile laut Merkblatt mit ihrem Gewicht (z. B. «Gruppenpräsentation 40 %»).
2. Prüft ein Teil mehrere Skills, zählt sein volles Gewicht für jeden davon, der
   darin erkennbar geprüft wird (eine Präsentation prüft Präsentieren *und* das Thema).
3. **0** heisst: Kein Prüfungsteil prüft den Skill erkennbar.

## ECTS (Blatt «Kurse»)

Die ECTS-Punkte laut Merkblatt, einmal je Kurs.

## Wie der Beitrag berechnet wird (zur Information)

```
Stunden = ECTS × 30 × Zeitanteil / 100
Beitrag = Höchstwert(Bloom) × min(1, Stunden / 90) × (geprüft ? 1 : 0.75)
```

gerundet auf 5. Ein Kurs erreicht den Höchstwert seiner Bloom-Stufe also, wenn er
dem Skill mindestens 90 Stunden widmet (ein ganzer 3-ECTS-Kurs); was nicht geprüft
wird, zählt zu drei Vierteln. Die Parameter sind Projektentscheide (README).

## Beispiele

Die Codes sind Beispiele zur Erläuterung, aus den Merkblatt-Auszügen der
Extraktion; massgebend ist beim Codieren das vollständige Merkblatt.

### Grundlagen Business Innovation (7,000, 4 ECTS)

| Skill | Belegstelle | Zeitanteil | Bloom | Prüfung | Beitrag |
|---|---|---|---|---|---|
| Programmierung | Lernziel «logische Denkstrukturierung in einer Programmiersprache»; Inhalt «objektorientierte Programmierung mit Java, Assignments»; Prüfung «zwei Zwischenprüfungen IT/Programmierung (je 20 %)» | 30 | 3 Anwenden | 40 | 15 |
| Innovationsmanagement | Lernziel «Dimensionen der Business Innovation»; Inhalt «Disruptive Innovation, Open Innovation …» | 10 | 2 Verstehen | 0 | 5 |

Programmierung: Der IT-Block ist einer der grossen Teile des Kurses (30 %); das
Verb «Denkstrukturierung in einer Programmiersprache» und die Assignments
verlangen Anwenden; zwei Zwischenprüfungen zählen 40 %. → 4 × 30 × 0.30 = 36 h;
40 × 36/90 = 16 → **15**.

### Decision Making under Risk and Uncertainty (7,235, 4 ECTS)

| Skill | Belegstelle | Zeitanteil | Bloom | Prüfung | Beitrag |
|---|---|---|---|---|---|
| Entscheidungsfindung | Lernziel «bessere Entscheidungen unter Risiko und Unsicherheit … Entscheidungsverfahren anpassen» | 50 | 5 Bewerten | 60 | 45 |
| Präsentieren und Pitchen | Prüfung «Gruppenpräsentation (40 %)» | 15 | 3 Anwenden | 40 | 10 |

Entscheidungsfindung ist das Kernthema (die Hälfte des Kurses); «bessere
Entscheidungen treffen» verlangt Beurteilen (Stufe 5). → 60 h; 70 × 60/90 = 46.7 → **45**.

## Häufige Fälle

- **Methode nur erwähnt** («Einführung in …»): Bloom 2, kleiner Zeitanteil.
- **Gruppenprojekt ohne Lernziel zum Skill** (z. B. Teamarbeit): Zeitanteil nach
  dem Projektanteil am Kurs, Bloom nach der Projektaufgabe, Prüfung nach dem
  Projektgewicht, wenn die Zusammenarbeit bewertet wird; sonst 0.
- **Skill passt nur teilweise** zum Katalog-Skill: so codieren, als gehöre der
  passende Teil dazu, und im Kommentar begründen.
- **Skill fehlt in der Liste**, kommt im Kurs aber deutlich vor: im Kommentar der
  nächsten Zeile desselben Kurses nennen; er wird nach der Codierung ergänzt.
