# Norges Hangout — Discord Bot (JS)

En enkel bot som sender en velkomstmelding til nye medlemsankomster og tilbyr et ticket-system.

✅ Funksjoner
- Velkommen-melding ved ny bruker (sendes til `WELCOME_CHANNEL_ID`)
- Ticket-system med knapp i `TICKET_CHANNEL_ID` som oppretter private ticket-kanaler
- Knapper for å låse/gjenåpne og slette ticket
- Slash-kommando `/setup` for å rydde opp i gamle bot-meldinger og (re)opprette ticket/velkomst-meldinger

🔧 Oppsett
1. Kopier `.env.example` til `.env` og fyll ut `BOT_TOKEN`, og `GUILD_ID` (og eventuelt `STAFF_ROLE_ID`).
2. Kjør:
   - npm install
   - npm start

Merkninger
- Aktiver "Server Members Intent" i bot-innstillingene i Discord Developer Portal for å få `guildMemberAdd`-event.
- Kanal-IDene er som du oppga; de ligger også i `.env.example`.

Kort og rask oppstart — si til hvis du vil ha tillegg som transcript, logs eller slash-kommandoer for å administrere tickets. 🇳🇴
