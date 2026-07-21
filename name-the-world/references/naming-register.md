# Naming Register

## Shared basis

Use a broad Late Antique Christian register built from:

- Hebrew Bible and New Testament personal names;
- Greek names established in early Christian communities;
- attested Late Latin and Roman personal names and cognomina;
- baptismal, monastic, regnal, occupational, patronymic, and place bynames.

The game uses ASCII spellings because its bitmap font cannot display the full
Unicode range. Prefer a familiar English or Latin transliteration over a damaged
on-screen name.

Do not use Adriatic naming as the project's organizing system. Do not invent
pseudo-Latin forms by attaching `-us`, `-ius`, `-a`, or another ending to a
fantasy stem.

## Social strata

### Holy Remnant

Use formal baptismal, monastic, and regnal names. A field sister or brother may
discard a family name after profession. Senior officials may use a single
monastic name, an office title, or a documented Latin cognomen. Regnal names and
ordinals belong only to the Pontifex line.

Examples of source families: Agnes, Augustine, Cassian, Clement, Cyprian,
Felicity, Isidore, Perpetua, Prisca, Sabina, Thecla, Victorinus.

### Road households and settlements

Use common biblical given names, shortened household forms, patronymics, and
work or place bynames. Family names should survive because a water roll, grave
copy, debt bond, or trade route needs to identify a household. Repeating a
common given name in different households is normal.

Examples of given-name families: Anna, Amos, Asa, Baruch, Deborah, Dinah, Ezra,
Hannah, Jael, Joanna, Joel, Jonah, Judith, Leah, Micah, Naomi, Noa, Rhoda, Ruth,
Simeon, Susanna, Tabitha, Tobias, Tirzah.

Examples of attested or transparent byname families: Aquila, Bassus, Carbo,
Celsus, Cotta, Crispus, Faber, Felix, Fullo, Longinus, Nauta, Niger, Pistor,
Porta, Priscus, Rufinus, Sabinus, Sartor, Viator, Vitalis.

### Lumen Compact

Use Greek Christian and Latin scholarly, legal, and civic forms. Compact names
may be more formal on records than in speech. Avoid giving every researcher a
rare classical name or the same two-syllable surname.

Examples: Aurelia, Cassia, Damaris, Diodorus, Irene, Lucian, Paulinus,
Priscian, Theodora, Theophilus.

### Free Cities

Mix the other registers according to household migration and civic history.
Gate ledgers favor stable family or occupational bynames. Public speakers and
councilors may use a civic house name, but a city does not need its own invented
phonetic gimmick.

### Penitent Engines

Use monastic names, ordinals, inherited service names, and machine
designations. Keep the religious name separate from the chassis or office. A
Penitent can be Brother Cassian and also Engine Twelve. Do not turn the chassis
designation into a fantasy surname.

### Choir of the Open Wound

Retain credible birth names. Choir offices such as Cantor, Gate Mother, or First
Icon are titles, not proof that every cultist was born with an ominous name.

## Blocked defaults and collision families

Do not introduce these as player-facing names without recording a specific
canon exemption in the retcon ledger:

- Mara
- Voss
- Kael or Kaelen
- Elara
- Elias
- Silas
- Marcus
- Lyra or close ornamental extensions
- Vey or Veyl
- Veyr
- Hale
- Thorne
- Vance
- Blackwood

The sole protected anchor in the current ledger is Father Marius Vale and the
derived canon term `Vale Imprint`. Do not use Vale for another person, family,
district, item, or institution.

## Collision check

Before accepting a candidate, compare:

1. full spelling and likely spoken shortening;
2. first and final syllables;
3. initials and title plus surname;
4. neighboring cast in the same location;
5. major faction, settlement, district, item, and quest names;
6. legacy names on the blocked-default list.

A collision is useful only when the fiction explains it, such as relatives who
share a byname or two residents with the same common baptismal name. Record that
relationship. Otherwise choose a clearer candidate.

## Ledger fields

Each ledger entry uses:

- `id`: stable compatibility ID, prefixed for non-actor records;
- `kind`: `actor`, `canon`, `dead`, `enemy`, `mention`, or `place`;
- `oldDisplay`: pre-retcon player-facing form;
- `display`: current player-facing form;
- `stratum`: one of the social registers above;
- `household`: family, institution, office, or local origin;
- `sourceBasis`: the linguistic or historical basis for the choice;
- `exemption`: optional reason a blocked form remains canon.

The ledger records a retcon. It is not a pool from which names should be copied
blindly.
