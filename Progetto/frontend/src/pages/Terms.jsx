import React from 'react';

export default function Terms() {
    return (
        <div style={styles.pageContainer}>
            <h1 style={styles.title}>Condizioni d'Uso (Terms of Use)</h1>
            <p style={styles.lastUpdated}>Ultimo aggiornamento: Febbraio 2026</p>

            <div style={styles.content}>
                <p>
                    L'accesso e l'utilizzo del sistema <strong>SpaceHub</strong> implicano l'accettazione integrale e incondizionata delle presenti Condizioni d'Uso. Qualora l'utente non intenda accettarle, è invitato a non utilizzare la piattaforma.
                </p>

                <h2 style={styles.sectionTitle}>1. Usi Autorizzati (Authorized Uses)</h2>
                <p>
                    SpaceHub è un sistema informativo istituzionale. L'accesso è consentito esclusivamente per:
                </p>
                <ul>
                    <li>Consultazione del calendario accademico e della disponibilità delle aule.</li>
                    <li>Prenotazione degli spazi didattici (per gli utenti provvisti di tale privilegio, es. docenti).</li>
                    <li>Sblocco dei varchi fisici in corrispondenza delle proprie prenotazioni attive.</li>
                </ul>

                <h2 style={styles.sectionTitle}>2. Divieti e Comportamenti Non Ammessi</h2>
                <p>
                    In ottemperanza alle policy di sicurezza, è fatto assoluto divieto di:
                </p>
                <ul>
                    <li>Condividere le proprie credenziali di accesso logico con soggetti terzi.</li>
                    <li>Cedere la propria Smart Card / badge RFID a terzi per l'accesso fisico alle aule.</li>
                    <li>Eseguire tentativi di accesso non autorizzato, scansione delle vulnerabilità, o attacchi di tipo Denial of Service (DoS) verso il backend o i terminali hardware.</li>
                    <li>Cercare di eludere i meccanismi di controllo degli accessi (Access Enforcement).</li>
                </ul>

                <h2 style={styles.sectionTitle}>3. Monitoraggio e Sanzioni</h2>
                <p>
                    L'Ateneo si riserva il diritto di monitorare, registrare e analizzare (tramite Audit Log) le attività effettuate sul sistema. 
                    L'uso non autorizzato, l'abuso dei privilegi o la violazione delle presenti regole comporterà il <strong>blocco immediato dell'account</strong> (Session Lock/Lockout) e l'eventuale deferimento agli organi disciplinari dell'Ateneo o alle autorità competenti civili/penali.
                </p>
            </div>
        </div>
    );
}

const styles = {
    pageContainer: { maxWidth: '800px', margin: '40px auto', padding: '0 20px', fontFamily: 'sans-serif', color: '#333' },
    title: { fontSize: '28px', color: '#0056b3', marginBottom: '5px' },
    lastUpdated: { fontSize: '13px', color: '#777', marginBottom: '30px', fontStyle: 'italic' },
    sectionTitle: { fontSize: '20px', color: '#2c3e50', marginTop: '25px', borderBottom: '1px solid #eee', paddingBottom: '5px' },
    content: { lineHeight: '1.6', fontSize: '15px' }
};